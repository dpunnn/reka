"""
Seed data dummy untuk demo — jalankan dengan: python -m app.seed
Berisi data realistis (nama produk lokal, koperasi fiktif, jaringan vouching
dan histori pinjaman bervariasi) sesuai arahan di DESIGN_PROTOTYPE_PROMPT.txt
supaya prototype enak didemokan ke juri — termasuk credit-risk-overview yang
punya sebaran LOW/MED/HIGH nyata, bukan kosong.
"""

from datetime import date, datetime, timedelta, timezone

import numpy as np

from app.api.v1.marketplace import _assign_ke_bundling_batch
from app.api.v1.pinjaman import _hitung_skor_gabungan
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.graph.neo4j_client import upsert_anggota_node, add_vouching_relation
from app.models.koperasi import Koperasi
from app.models.pinjaman import Pinjaman, Angsuran, PinjamanStatus, AngsuranStatus
from app.models.produk import Produk, ProdukStatus
from app.models.transaksi import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole, AnggotaProfile, VerifikasiStatus

# Pola demand sintetis 90 hari terakhir per komoditas, untuk melatih Demand
# Forecast. INI DATA SIMULASI, bukan transaksi riil — REKA belum live jadi
# belum ada histori order asli. Ditandai jelas di sini dan di response API
# (lihat app/api/v1/intelligence.py) supaya tidak disajikan sebagai data
# riil ke juri. Begitu ada transaksi asli pasca-pilot, fungsi ini bisa
# dihapus dan forecast otomatis jalan dari data Order sungguhan.
POLA_DEMAND_SINTETIS = {
    "cabai merah": {"base": 15, "trend_per_hari": 0.15, "noise_std": 3},
    "telur ayam kampung": {"base": 10, "trend_per_hari": 0.05, "noise_std": 2},
    "gula aren": {"base": 5, "trend_per_hari": 0.02, "noise_std": 1},
    "beras": {"base": 20, "trend_per_hari": 0.10, "noise_std": 4},
}

HARGA_MAP = {
    "Cabai Merah": 28000,
    "Telur Ayam Kampung": 45000,
    "Gula Aren": 32000,
    "Beras": 13500,
    "Bawang Merah": 35000,
    "Kopi": 60000,
    "Madu": 120000,
    "Jagung": 8000,
    "Singkong": 6000,
}


def seed_demand_history(db, pembeli: User, produk_by_komoditas: dict[str, Produk], hari: int = 90):
    """Generate histori order sintetis 90 hari (tren + noise) per komoditas
    supaya Demand Forecast punya data buat dilatih. Order dibuat lewat model
    Order/OrderItem yang sama dengan alur checkout asli, cuma created_at
    di-backdate — begitu checkout riil dibangun, data ini nyambung mulus
    tanpa perlu tabel terpisah."""
    rng = np.random.default_rng(seed=42)
    today = datetime.now(timezone.utc)

    for komoditas, produk in produk_by_komoditas.items():
        pola = POLA_DEMAND_SINTETIS.get(komoditas)
        if not pola:
            continue
        for hari_ke in range(hari, 0, -1):
            tanggal = today - timedelta(days=hari_ke)
            weekend_bump = 1.3 if tanggal.weekday() >= 5 else 1.0
            jumlah = max(
                1,
                round(
                    (pola["base"] + pola["trend_per_hari"] * (hari - hari_ke)) * weekend_bump
                    + rng.normal(0, pola["noise_std"])
                ),
            )
            harga_satuan = float(produk.harga)
            order = Order(
                pembeli_id=pembeli.id,
                status=OrderStatus.DITERIMA,
                total=jumlah * harga_satuan,
                alamat_kirim="Jl. Demo Resto No. 1, Jakarta (data sintetis)",
                kurir="JNE",
                created_at=tanggal,
                is_synthetic=True,
            )
            db.add(order)
            db.flush()
            db.add(
                OrderItem(
                    order_id=order.id,
                    produk_id=produk.id,
                    jumlah=jumlah,
                    harga_satuan=harga_satuan,
                )
            )


def buat_pinjaman_lunas(db, anggota_id, nominal, tenor_bulan, mulai_hari_lalu):
    """Histori pinjaman yang sudah lunas semua tepat waktu — bikin
    skor_individual anggota ini tinggi (basis realistis, bukan angka
    hardcode)."""
    pinjaman = Pinjaman(
        anggota_id=anggota_id,
        nominal=nominal,
        tujuan="Modal usaha (histori lunas)",
        tenor_bulan=tenor_bulan,
        status=PinjamanStatus.LUNAS,
    )
    db.add(pinjaman)
    db.flush()
    cicilan = round(nominal / tenor_bulan, 2)
    for i in range(1, tenor_bulan + 1):
        jatuh_tempo = date.today() - timedelta(days=mulai_hari_lalu - i * 30)
        db.add(
            Angsuran(
                pinjaman_id=pinjaman.id,
                cicilan_ke=i,
                nominal=cicilan,
                jatuh_tempo=jatuh_tempo,
                status=AngsuranStatus.LUNAS,
                tanggal_bayar=jatuh_tempo,
            )
        )


def buat_pinjaman_ada_telat(db, anggota_id, nominal, tenor_bulan, jumlah_telat):
    """Histori pinjaman dengan beberapa cicilan telat — demo skor_individual
    yang lebih rendah, realistis (bukan semua anggota sempurna)."""
    pinjaman = Pinjaman(
        anggota_id=anggota_id,
        nominal=nominal,
        tujuan="Modal usaha (ada tunggakan)",
        tenor_bulan=tenor_bulan,
        status=PinjamanStatus.APPROVED,
    )
    db.add(pinjaman)
    db.flush()
    cicilan = round(nominal / tenor_bulan, 2)
    for i in range(1, tenor_bulan + 1):
        jatuh_tempo = date.today() - timedelta(days=(tenor_bulan - i) * 30)
        if i <= jumlah_telat:
            status, tanggal_bayar = AngsuranStatus.TELAT, None
        elif jatuh_tempo < date.today():
            status, tanggal_bayar = AngsuranStatus.LUNAS, jatuh_tempo
        else:
            status, tanggal_bayar = AngsuranStatus.BELUM_BAYAR, None
        db.add(
            Angsuran(
                pinjaman_id=pinjaman.id,
                cicilan_ke=i,
                nominal=cicilan,
                jatuh_tempo=jatuh_tempo,
                status=status,
                tanggal_bayar=tanggal_bayar,
            )
        )


def ajukan_pinjaman_dgn_skor_real(db, anggota_id, nama_tujuan, nominal, tenor_bulan):
    """Bikin pengajuan pinjaman baru pakai FUNGSI SCORING ASLI yang dipakai
    endpoint live (bukan angka hasil tebakan manual) — supaya seed data
    100% konsisten dengan perilaku sistem sungguhan, termasuk bobot dinamis
    individual/graph berdasarkan kelengkapan histori transaksi."""
    hasil = _hitung_skor_gabungan(db, anggota_id)
    db.add(
        Pinjaman(
            anggota_id=anggota_id,
            nominal=nominal,
            tujuan=nama_tujuan,
            tenor_bulan=tenor_bulan,
            skor_individual=hasil["skor_individual"],
            skor_graph=hasil["skor_graph"],
            skor_gabungan=hasil["skor_gabungan"],
            risk_level=hasil["risk_level"],
        )
    )


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Koperasi).first():
        print("Data sudah ada, skip seeding.")
        return

    koperasi_bogor = Koperasi(
        nama="Koperasi Tani Makmur Sejahtera",
        kabupaten="Kabupaten Bogor",
        provinsi="Jawa Barat",
        alamat="Desa Sukamaju, Kec. Ciawi",
        sektor_usaha="Pertanian & Peternakan",
    )
    koperasi_sukabumi = Koperasi(
        nama="Koperasi Tani Sumber Rejeki",
        kabupaten="Kabupaten Sukabumi",
        provinsi="Jawa Barat",
        alamat="Desa Cikembang, Kec. Cibadak",
        sektor_usaha="Pertanian",
    )
    db.add_all([koperasi_bogor, koperasi_sukabumi])
    db.flush()

    pengurus = User(
        full_name="Budi Santoso", phone="081200000001", email="pengurus@reka.test",
        hashed_password=hash_password("password123"), role=UserRole.PENGURUS,
    )
    kasir = User(
        full_name="Siti Aminah", phone="081200000002", email="kasir@reka.test",
        hashed_password=hash_password("password123"), role=UserRole.KASIR,
    )
    pembeli = User(
        full_name="Rina (Resto Kota)", phone="081200000003", email="pembeli@reka.test",
        hashed_password=hash_password("password123"), role=UserRole.PEMBELI,
    )
    pemkab = User(
        full_name="Dinas Koperasi Kab. Bogor", phone="081200000004", email="pemkab@reka.test",
        hashed_password=hash_password("password123"), role=UserRole.PEMKAB,
    )
    # Akun sintetis KHUSUS penampung histori Demand Forecast (90 hari x banyak
    # order) — TIDAK dipakai login demo, biar akun Pembeli asli ("Rina") yang
    # dipegang juri tetap bersih, cuma isi order yang benar-benar mereka buat
    # sendiri saat demo, bukan numpang 360 baris data sintetis.
    pembeli_sistem = User(
        full_name="[Sistem] Histori Demand Sintetis", phone="080000000000",
        hashed_password=hash_password("tidak-dipakai-login"), role=UserRole.PEMBELI,
    )
    db.add_all([pengurus, kasir, pembeli, pemkab, pembeli_sistem])
    db.flush()

    # (nama, phone, nik, komoditas, koperasi)
    anggota_data = [
        ("Pak Slamet", "081300000001", "3201010101010001", "Cabai Merah", koperasi_bogor),
        ("Bu Yuli", "081300000002", "3201010101010002", "Telur Ayam Kampung", koperasi_bogor),
        ("Pak Warto", "081300000003", "3201010101010003", "Gula Aren", koperasi_bogor),
        ("Pak Darto", "081300000004", "3201010101010004", "Cabai Merah", koperasi_bogor),
        ("Bu Ningsih", "081300000005", "3201010101010005", "Beras", koperasi_bogor),
        ("Pak Joko", "081300000006", "3201010101010006", "Bawang Merah", koperasi_bogor),
        ("Bu Rahayu", "081300000007", "3201010101010007", "Kopi", koperasi_bogor),
        ("Pak Untung", "081300000008", "3201010101010008", "Cabai Merah", koperasi_bogor),
        ("Bu Wati", "081300000009", "3201010101010009", "Telur Ayam Kampung", koperasi_bogor),
        ("Pak Karto", "081300000010", "3201010101010010", "Madu", koperasi_bogor),
        ("Pak Herman", "081300000011", "3202010101010011", "Jagung", koperasi_sukabumi),
        ("Bu Yanti", "081300000012", "3202010101010012", "Singkong", koperasi_sukabumi),
        ("Pak Agus", "081300000013", "3202010101010013", "Cabai Merah", koperasi_sukabumi),
        ("Bu Ratna", "081300000014", "3202010101010014", "Telur Ayam Kampung", koperasi_sukabumi),
        ("Pak Bambang", "081300000015", "3202010101010015", "Gula Aren", koperasi_sukabumi),
    ]

    p = {}  # nama -> AnggotaProfile, buat referensi gampang
    for nama, phone, nik, komoditas, kop in anggota_data:
        user = User(
            full_name=nama, phone=phone, hashed_password=hash_password("password123"),
            role=UserRole.ANGGOTA,
        )
        db.add(user)
        db.flush()
        profile = AnggotaProfile(
            user_id=user.id, koperasi_id=kop.id, nik=nik, jenis_usaha=komoditas,
            status_verifikasi=VerifikasiStatus.VERIFIED, verified_by_id=pengurus.id,
        )
        db.add(profile)
        db.flush()
        p[nama] = (profile, komoditas, kop)
        upsert_anggota_node(str(profile.id), nama, str(kop.id))

    # --- Jaringan vouching (cold-start graph) ---
    # Segitiga saling percaya di antara 3 anggota senior — realistis: anggota
    # lama saling kenal & saling jamin, bukan cuma satu arah
    for a, b in [("Pak Slamet", "Bu Yuli"), ("Bu Yuli", "Pak Slamet"),
                 ("Pak Slamet", "Pak Warto"), ("Pak Warto", "Pak Slamet"),
                 ("Bu Yuli", "Pak Warto"), ("Pak Warto", "Bu Yuli")]:
        add_vouching_relation(str(p[a][0].id), str(p[b][0].id))

    # Pak Darto: 2 vouch dari senior (contoh MED risk — sudah divalidasi manual sebelumnya)
    add_vouching_relation(str(p["Pak Slamet"][0].id), str(p["Pak Darto"][0].id))
    add_vouching_relation(str(p["Bu Yuli"][0].id), str(p["Pak Darto"][0].id))

    # Pak Joko: 3 vouch, salah satunya dari Darto (demo grand-voucher/2nd-degree trust)
    add_vouching_relation(str(p["Pak Slamet"][0].id), str(p["Pak Joko"][0].id))
    add_vouching_relation(str(p["Pak Warto"][0].id), str(p["Pak Joko"][0].id))
    add_vouching_relation(str(p["Pak Darto"][0].id), str(p["Pak Joko"][0].id))

    # Pak Untung: cuma 1 vouch (demo HIGH risk — cold-start lemah)
    add_vouching_relation(str(p["Pak Slamet"][0].id), str(p["Pak Untung"][0].id))

    # Bu Wati: 3 vouch dari 3 senior (demo LOW risk meski anggota baru)
    for voucher in ["Pak Slamet", "Bu Yuli", "Pak Warto"]:
        add_vouching_relation(str(p[voucher][0].id), str(p["Bu Wati"][0].id))

    # Pak Karto: TIDAK divouch siapa pun (demo cold-start paling lemah, 0 vouch)

    # Koperasi Sukabumi: pasangan senior saling vouch + 1 anggota baru
    add_vouching_relation(str(p["Pak Herman"][0].id), str(p["Bu Ratna"][0].id))
    add_vouching_relation(str(p["Bu Ratna"][0].id), str(p["Pak Herman"][0].id))
    add_vouching_relation(str(p["Pak Herman"][0].id), str(p["Pak Agus"][0].id))
    add_vouching_relation(str(p["Bu Ratna"][0].id), str(p["Pak Agus"][0].id))
    # Bu Yanti & Pak Bambang: sengaja tidak divouch siapa pun

    # --- Histori pinjaman: basis skor_individual yang realistis, bukan default 50 rata ---
    buat_pinjaman_lunas(db, p["Pak Slamet"][0].id, 3_000_000, 6, mulai_hari_lalu=190)
    buat_pinjaman_lunas(db, p["Bu Yuli"][0].id, 2_500_000, 6, mulai_hari_lalu=190)
    buat_pinjaman_lunas(db, p["Pak Warto"][0].id, 2_000_000, 4, mulai_hari_lalu=130)
    buat_pinjaman_ada_telat(db, p["Bu Ningsih"][0].id, 2_000_000, 4, jumlah_telat=2)
    db.flush()

    # --- Pengajuan pinjaman baru, skor dihitung pakai fungsi ASLI (bukan tebakan) ---
    # supaya credit-risk-overview punya sebaran LOW/MED/HIGH yang nyata & konsisten
    for nama, tujuan, nominal, tenor in [
        ("Pak Slamet", "Perluasan lahan cabai", 4_000_000, 8),
        ("Bu Yuli", "Tambah kandang ayam", 3_500_000, 6),
        ("Pak Warto", "Peralatan penyulingan gula aren", 3_000_000, 6),
        ("Pak Darto", "Modal tanam cabai", 2_000_000, 6),
        ("Pak Joko", "Modal tanam bawang merah", 2_500_000, 6),
        ("Bu Wati", "Tambah kandang ayam kampung", 2_000_000, 6),
        ("Pak Untung", "Modal tanam cabai", 1_500_000, 4),
        ("Pak Karto", "Modal budidaya lebah madu", 1_500_000, 6),
        ("Bu Ningsih", "Modal giling padi", 1_800_000, 4),
        ("Pak Agus", "Modal tanam cabai", 2_000_000, 6),
    ]:
        ajukan_pinjaman_dgn_skor_real(db, p[nama][0].id, tujuan, nominal, tenor)

    # --- Produk & Marketplace ---
    produk_by_komoditas: dict[str, Produk] = {}
    for nama, (profile, komoditas, kop) in p.items():
        expired_soon = komoditas in ("Cabai Merah", "Telur Ayam Kampung")
        produk = Produk(
            anggota_id=profile.id, koperasi_id=kop.id, nama=komoditas,
            kategori="Sayur" if "Cabai" in komoditas or komoditas in ("Bawang Merah",) else "Lainnya",
            harga=HARGA_MAP[komoditas], stok=25,
            tanggal_produksi=date.today() - timedelta(days=2),
            tanggal_kadaluarsa=date.today() + timedelta(days=2 if expired_soon else 20),
            status=ProdukStatus.MENDEKATI_EXPIRED if expired_soon else ProdukStatus.AKTIF,
            harga_rekomendasi_ai=HARGA_MAP[komoditas],
            # QC/Grading (Fase 3F #2): data seed dianggap representasi produk
            # yang SUDAH lolos QC (grade A) — supaya _assign_ke_bundling_batch
            # di bawah tidak jadi no-op gara-gara gate grading pada re-seed
            # dari DB kosong. Produk listing BARU lewat API live tetap wajib
            # digrading dulu lewat POST /produk/{id}/grade, ini cuma demo data.
            grade="A",
        )
        db.add(produk)
        db.flush()
        _assign_ke_bundling_batch(db, produk, profile)
        produk_by_komoditas.setdefault(komoditas.lower(), produk)

    seed_demand_history(db, pembeli_sistem, produk_by_komoditas)

    db.commit()
    print("Seed data selesai:")
    print(f"  Koperasi 1 : {koperasi_bogor.nama}")
    print(f"  Koperasi 2 : {koperasi_sukabumi.nama}")
    print(f"  Pengurus   : {pengurus.phone} / password123")
    print(f"  Kasir      : {kasir.phone} / password123")
    print(f"  Pembeli    : {pembeli.phone} / password123")
    print(f"  Pemkab     : {pemkab.phone} / password123")
    for nama, phone, *_ in anggota_data:
        print(f"  Anggota    : {phone} / password123 ({nama})")
    db.close()


if __name__ == "__main__":
    run()
