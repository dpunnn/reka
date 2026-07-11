import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.notifikasi import TipeNotifikasi
from app.models.pinjaman import Pinjaman, JenisPinjaman
from app.models.produk import Produk, ProdukStatus
from app.models.transaksi import (
    BundlingBatch,
    BundlingBatchItem,
    BundlingStatus,
    Order,
    OrderItem,
    OrderStatus,
    RevenueSplit,
    PermintaanBeli,
    PermintaanBeliStatus,
)
from app.models.user import User, UserRole, AnggotaProfile
from app.schemas.order import (
    CreateOrderRequest,
    OrderOut,
    RevenueSplitOut,
    TandaiTerjualRequest,
    UpdateOrderStatusRequest,
)
from app.schemas.permintaan import (
    HasilMatchOut,
    PermintaanBeliCreateRequest,
    PermintaanBeliOut,
)
from app.schemas.produk import (
    GradeProdukRequest,
    ProdukCreateRequest,
    ProdukOut,
    RekomendasiHargaOut,
    hitung_opsi_nilai_tambah,
)
from app.services.audit import catat_audit_log
from app.services.harga_pasar import get_harga_pasar
from app.services.notifikasi import kirim_notifikasi

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

# Target volume default per komoditas untuk Dynamic Bundling (kg) — MVP
# rule-based, upgrade ke bundling optimizer berbasis demand kota riil.
TARGET_VOLUME_BUNDLING = {
    "cabai merah": 100,
    "telur ayam kampung": 150,
    "gula aren": 80,
    "beras": 200,
}

# Revenue split proporsional (Fase 3F #8) — bobot kualitas dari grade QC
# checkpoint (Fase 3F #2). Keputusan desain eksplisit, bukan hasil hitungan
# empiris: A=1.0 (kualitas penuh), B=0.9 (-10%), C=0.8 (-20%). Grade None
# (belum digrading) dianggap paling konservatif (setara C) — seharusnya
# tidak pernah terjadi karena produk ungraded tidak bisa masuk batch sama
# sekali (gate di _assign_ke_bundling_batch).
BOBOT_GRADE = {"A": 1.0, "B": 0.9, "C": 0.8}


def _bobot_grade(grade: str | None) -> float:
    return BOBOT_GRADE.get(grade, 0.8)


def _hitung_status_expiry(tanggal_kadaluarsa: date | None) -> ProdukStatus:
    if not tanggal_kadaluarsa:
        return ProdukStatus.AKTIF
    sisa_hari = (tanggal_kadaluarsa - date.today()).days
    if sisa_hari <= 7:
        return ProdukStatus.MENDEKATI_EXPIRED
    return ProdukStatus.AKTIF


def _hitung_diskon_expiry(tanggal_kadaluarsa: date | None) -> float:
    if not tanggal_kadaluarsa:
        return 0
    sisa_hari = (tanggal_kadaluarsa - date.today()).days
    if sisa_hari <= 1:
        return 0.5
    if sisa_hari <= 3:
        return 0.25
    if sisa_hari <= 7:
        return 0.10
    return 0


def _assign_ke_bundling_batch(db: Session, produk: Produk, anggota: AnggotaProfile) -> None:
    """Dynamic Bundling MVP: cari batch 'collecting' untuk komoditas yang sama,
    gabungkan produk ke situ. Kalau belum ada/sudah penuh, buka batch baru.

    GATE QC/Grading (Fase 3F #2): produk baru cuma boleh masuk pool
    bundling setelah lolos grading Kasir/Pengurus (grade tidak None) —
    cegah satu kontributor kualitas jelek bikin buyer retur seluruh batch.
    Data seed/demo lama sudah di-backfill grade='A' langsung di DB (bukan
    lewat endpoint ini) supaya Dynamic Bundling yang sudah didemo tetap
    utuh — gate ini murni untuk listing BARU lewat endpoint live."""
    if produk.grade is None:
        return
    komoditas = produk.nama.lower().strip()
    target = TARGET_VOLUME_BUNDLING.get(komoditas, 100)

    batch = (
        db.query(BundlingBatch)
        .filter(BundlingBatch.komoditas == komoditas, BundlingBatch.status == BundlingStatus.COLLECTING)
        .first()
    )
    if not batch:
        batch = BundlingBatch(komoditas=komoditas, target_volume=target, current_volume=0)
        db.add(batch)
        db.flush()

    item = BundlingBatchItem(
        batch_id=batch.id, anggota_id=anggota.id, produk_id=produk.id, jumlah=produk.stok
    )
    db.add(item)
    batch.current_volume = float(batch.current_volume) + float(produk.stok)
    if batch.current_volume >= float(batch.target_volume):
        batch.status = BundlingStatus.READY
    db.commit()


# Demand Matching — skor kecocokan multi-kriteria (BUKAN cosine similarity/
# embedding, sengaja: data komoditas kita terstruktur & kategorinya
# segelintir, jadi rule-based tertimbang lebih efisien & lebih gampang
# dijelaskan daripada vector similarity yang butuh data teks bebas).
# fit_volume (maks 50) + grade_poin (maks 30, reuse hasil QC checkpoint
# Fase 3F #2) + urgensi_poin (maks 20, reuse status Smart Expiry) = 100.
GRADE_POIN_MATCH = {"A": 30, "B": 20, "C": 10}


def _skor_match_produk(produk: Produk, jumlah_dibutuhkan: float) -> float:
    fit_volume = min(1.0, float(produk.stok) / jumlah_dibutuhkan) * 50
    grade_poin = GRADE_POIN_MATCH.get(produk.grade, 10)
    urgensi_poin = 20 if produk.status == ProdukStatus.MENDEKATI_EXPIRED else 0
    return round(fit_volume + grade_poin + urgensi_poin, 1)


def _cari_kandidat_produk(
    db: Session, komoditas: str, harga_maks: float | None
) -> list[Produk]:
    """Kandidat match cuma produk yang SUDAH lolos QC (grade tidak None) —
    gate yang sama dengan Dynamic Bundling (Fase 3F #2), supaya buyer tidak
    di-match ke produk yang belum diverifikasi kualitasnya."""
    query = db.query(Produk).filter(
        func.lower(Produk.nama) == komoditas,
        Produk.status != ProdukStatus.HABIS,
        Produk.grade.isnot(None),
        Produk.stok > 0,
    )
    if harga_maks is not None:
        query = query.filter(Produk.harga <= harga_maks)
    return query.all()


def _dorong_bundling_dari_demand(db: Session, komoditas: str, kekurangan: float) -> None:
    """Kalau supply yang lolos QC belum cukup penuhi permintaan buyer,
    dorong target Dynamic Bundling naik ke level demand RIIL (gantikan
    target statis TARGET_VOLUME_BUNDLING yang cuma tebakan MVP) + kirim
    notifikasi ke anggota yang punya listing komoditas sama supaya nambah
    stok/gabung batch. Ini yang bikin sistem dua arah — bukan cuma matching
    pasif dari supply yang sudah ada."""
    batch = (
        db.query(BundlingBatch)
        .filter(BundlingBatch.komoditas == komoditas, BundlingBatch.status == BundlingStatus.COLLECTING)
        .first()
    )
    target_baru = max(TARGET_VOLUME_BUNDLING.get(komoditas, 100), kekurangan)
    if not batch:
        batch = BundlingBatch(komoditas=komoditas, target_volume=target_baru, current_volume=0)
        db.add(batch)
        db.flush()
    elif float(batch.target_volume) < target_baru:
        batch.target_volume = target_baru

    anggota_ids = (
        db.query(Produk.anggota_id)
        .filter(func.lower(Produk.nama) == komoditas, Produk.status != ProdukStatus.HABIS)
        .distinct()
        .all()
    )
    for (anggota_id,) in anggota_ids:
        profile = db.get(AnggotaProfile, anggota_id)
        if profile:
            kirim_notifikasi(
                db, profile.user_id, TipeNotifikasi.PERMINTAAN_BUYER_BARU,
                "Ada Permintaan Buyer Butuh Supply",
                f"Buyer butuh {komoditas} sekitar {kekurangan:.0f} kg lagi — "
                "tambah stok/listing Anda untuk penuhi batch bundling.",
            )


def _proses_permintaan_beli(db: Session, permintaan: PermintaanBeli) -> dict:
    """Inti Demand Matching: cari kandidat produk lolos QC, ranking pakai
    skor multi-kriteria, tentukan status permintaan. Dipanggil baik saat
    buyer submit permintaan baru MAUPUN saat re-check backlog (lihat
    _cek_permintaan_terbuka) — satu sumber logic, supaya hasilnya konsisten
    di kedua entry point."""
    jumlah_dibutuhkan = float(permintaan.jumlah_dibutuhkan)
    harga_maks = float(permintaan.harga_maks) if permintaan.harga_maks is not None else None
    kandidat = _cari_kandidat_produk(db, permintaan.komoditas, harga_maks)

    skor_list = sorted(
        ((p, _skor_match_produk(p, jumlah_dibutuhkan)) for p in kandidat),
        key=lambda pair: -pair[1],
    )
    total_tersedia = sum(float(p.stok) for p, _ in skor_list)
    kekurangan = max(0.0, jumlah_dibutuhkan - total_tersedia)

    if kekurangan <= 0:
        permintaan.status = PermintaanBeliStatus.TERPENUHI
    else:
        permintaan.status = PermintaanBeliStatus.MENUNGGU_BUNDLING
        _dorong_bundling_dari_demand(db, permintaan.komoditas, kekurangan)

    db.commit()

    return {
        "status": permintaan.status.value,
        "total_tersedia": total_tersedia,
        "kekurangan": kekurangan,
        "kandidat": [
            {
                "produk_id": str(p.id),
                "nama": p.nama,
                "koperasi_id": str(p.koperasi_id),
                "stok": float(p.stok),
                "harga": float(p.harga),
                "grade": p.grade,
                "skor_match": skor,
            }
            for p, skor in skor_list[:10]
        ],
    }


def _cek_permintaan_terbuka(db: Session, komoditas: str) -> None:
    """Dipanggil setelah produk baru lolos QC (grade_produk) — supply baru
    otomatis di-recheck ke permintaan buyer yang masih menunggu, supaya
    buyer tidak perlu submit ulang permintaannya begitu stok tersedia."""
    permintaan_list = (
        db.query(PermintaanBeli)
        .filter(
            func.lower(PermintaanBeli.komoditas) == komoditas,
            PermintaanBeli.status != PermintaanBeliStatus.TERPENUHI,
        )
        .all()
    )
    for permintaan in permintaan_list:
        hasil = _proses_permintaan_beli(db, permintaan)
        if hasil["status"] == PermintaanBeliStatus.TERPENUHI.value:
            kirim_notifikasi(
                db, permintaan.pembeli_id, TipeNotifikasi.PERMINTAAN_BUYER_BARU,
                "Permintaan Anda Sudah Terpenuhi",
                f"Stok {permintaan.komoditas} yang Anda butuhkan "
                f"({float(permintaan.jumlah_dibutuhkan):.0f} kg) sekarang tersedia — "
                "cek marketplace untuk checkout.",
            )
            # kirim_notifikasi cuma db.flush(), BUKAN commit — tanpa commit di
            # sini, insert notifikasi ini rollback diam-diam saat session
            # ditutup di akhir request (get_db() cuma db.close(), tidak
            # auto-commit). Wajib commit eksplisit tiap kali kirim notifikasi
            # di luar request handler utama.
            db.commit()


def _buat_produk(db: Session, profile: AnggotaProfile, payload: ProdukCreateRequest) -> Produk:
    """Logic inti listing produk — dipakai baik oleh Anggota sendiri
    (create_produk) MAUPUN Ajudan Digital (Kasir/Pengurus input atas nama
    anggota, Fase 3F #5). Extract jadi fungsi bersama supaya dua entry
    point tidak duplikat logic (satu sumber kebenaran untuk perhitungan
    status expiry, diskon, harga rekomendasi)."""
    status_produk = _hitung_status_expiry(payload.tanggal_kadaluarsa)
    diskon = _hitung_diskon_expiry(payload.tanggal_kadaluarsa)
    harga_pasar = get_harga_pasar(payload.nama)
    harga_rekomendasi = harga_pasar["harga"] if harga_pasar else None
    harga_final = payload.harga * (1 - diskon) if diskon else payload.harga

    produk = Produk(
        anggota_id=profile.id,
        koperasi_id=profile.koperasi_id,
        nama=payload.nama,
        kategori=payload.kategori,
        harga=harga_final,
        satuan=payload.satuan,
        stok=payload.stok,
        tanggal_produksi=payload.tanggal_produksi,
        tanggal_kadaluarsa=payload.tanggal_kadaluarsa,
        status=status_produk,
        harga_rekomendasi_ai=harga_rekomendasi,
        foto_url=payload.foto_url,
    )
    db.add(produk)
    db.commit()
    db.refresh(produk)

    _assign_ke_bundling_batch(db, produk, profile)
    return produk


@router.post("/produk", response_model=ProdukOut, status_code=201)
def create_produk(
    payload: ProdukCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")
    return _buat_produk(db, profile, payload)


@router.post("/produk/ajudan/{anggota_id}", response_model=ProdukOut, status_code=201)
def create_produk_ajudan_digital(
    anggota_id: uuid.UUID,
    payload: ProdukCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.KASIR, UserRole.PENGURUS)),
):
    """Ajudan Digital (Fase 3F #5) — Kasir/Pengurus input listing produk
    ATAS NAMA anggota yang tidak punya/tidak bisa pakai smartphone. Extend
    role Kasir/Pengurus yang sudah ada, BUKAN fitur baru dari nol — reuse
    _buat_produk yang SAMA persis dengan listing mandiri Anggota, cuma
    beda siapa yang jadi caller & anggota mana yang jadi pemilik produk.
    Divalidasi kuat oleh temuan riset: SDM jadi alasan #1 target Kopdes
    Merah Putih dipangkas dari 80.000 ke 40.000 (Menteri Koperasi, 2026) —
    REKA tidak bergantung 100% pada literasi digital tiap anggota individu."""
    profile = db.get(AnggotaProfile, anggota_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")
    return _buat_produk(db, profile, payload)


@router.post("/produk/{produk_id}/grade", response_model=ProdukOut)
def grade_produk(
    produk_id: uuid.UUID,
    payload: GradeProdukRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.KASIR, UserRole.PENGURUS)),
):
    """QC/Grading checkpoint (Fase 3F #2) — Kasir/Pengurus verifikasi
    kualitas produk (grade A/B/C) SEBELUM produk boleh masuk pool Dynamic
    Bundling. Idempotent: boleh re-grade, tapi _assign_ke_bundling_batch
    cuma dipanggil sekali (saat transisi pertama None -> ada grade) supaya
    volume batch tidak double-counted kalau di-regrade berkali-kali."""
    produk = db.get(Produk, produk_id)
    if not produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    grade_lama = produk.grade
    sudah_lolos_qc_sebelumnya = produk.grade is not None
    produk.grade = payload.grade

    catat_audit_log(
        db, user.id, "verifikasi_grade", "Produk", produk.id,
        nilai_sebelum=f"grade={grade_lama}",
        nilai_sesudah=f"grade={payload.grade}",
    )

    db.commit()
    db.refresh(produk)

    if not sudah_lolos_qc_sebelumnya:
        profile = db.get(AnggotaProfile, produk.anggota_id)
        _assign_ke_bundling_batch(db, produk, profile)
        _cek_permintaan_terbuka(db, produk.nama.lower().strip())

    return produk


@router.get("/produk/belum-digrading", response_model=list[ProdukOut])
def list_produk_belum_digrading(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.KASIR, UserRole.PENGURUS)),
):
    """Antrean QC — produk yang sudah dilisting anggota tapi belum
    digrading, jadi belum masuk pool Dynamic Bundling."""
    return (
        db.query(Produk)
        .filter(Produk.grade.is_(None), Produk.status != ProdukStatus.HABIS)
        .order_by(Produk.created_at.asc())
        .all()
    )


@router.get("/produk/saya", response_model=list[ProdukOut])
def list_produk_saya(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")
    return db.query(Produk).filter(Produk.anggota_id == profile.id).order_by(Produk.created_at.desc()).all()


@router.get("/produk", response_model=list[ProdukOut])
def browse_produk(
    kategori: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Produk).filter(Produk.status != ProdukStatus.HABIS)
    if kategori:
        query = query.filter(Produk.kategori == kategori)
    # Smart Expiry Display: produk mendekati expired naik ke atas — eksplisit
    # pakai CASE, jangan andalkan urutan alfabetis enum (kebetulan cocok tapi rapuh)
    expiry_priority = case((Produk.status == ProdukStatus.MENDEKATI_EXPIRED, 0), else_=1)
    return query.order_by(expiry_priority, Produk.tanggal_kadaluarsa.asc().nulls_last()).all()


@router.get("/produk/rute-nilai-tambah", response_model=list[ProdukOut])
def list_rute_nilai_tambah(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS)),
):
    """Rute Nilai Tambah (Fase 3F #6, jawab TOR question #4) — daftar
    produk perishable yang kritis mendekati expired (H-1 atau lewat),
    supaya Pengurus bisa arahkan ke opsi B2B pengolahan (UMKM saus/pakan
    ternak/kompos) alih-alih cuma didiskon ke konsumen retail yang gak
    akan beli sayur nyaris busuk. Filter Python-side pakai helper yang
    SAMA dengan computed_field ProdukOut.opsi_nilai_tambah — hindari
    duplikasi logic kategori-perishable + ambang H-1 di dua tempat."""
    kandidat = (
        db.query(Produk)
        .filter(Produk.status != ProdukStatus.HABIS, Produk.tanggal_kadaluarsa.isnot(None))
        .all()
    )
    return [p for p in kandidat if hitung_opsi_nilai_tambah(p.kategori, p.tanggal_kadaluarsa) is not None]


@router.get("/produk/{produk_id}", response_model=ProdukOut)
def detail_produk(produk_id: uuid.UUID, db: Session = Depends(get_db)):
    produk = db.get(Produk, produk_id)
    if not produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return produk


@router.get("/rekomendasi-harga/{komoditas}", response_model=RekomendasiHargaOut)
def rekomendasi_harga(komoditas: str):
    hasil = get_harga_pasar(komoditas)
    if hasil is None:
        raise HTTPException(status_code=404, detail="Belum ada data harga referensi untuk komoditas ini")
    return RekomendasiHargaOut(komoditas=komoditas, harga_rekomendasi=hasil["harga"], sumber=hasil["sumber"])


@router.get("/bundling")
def list_bundling_batches(db: Session = Depends(get_db)):
    return db.query(BundlingBatch).all()


@router.post("/bundling/{batch_id}/tandai-terjual")
def tandai_batch_terjual(
    batch_id: uuid.UUID,
    payload: TandaiTerjualRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PENGURUS)),
):
    """Tandai batch Dynamic Bundling sudah terjual ke buyer. Trigger 2 hal
    otomatis:
    1. Pencairan sisa 30% Dana Talangan Panen Instant (Fase 3F #3) untuk
       kontributor yang masih di tahap 70% cair.
    2. Revenue split proporsional (Fase 3F #8) — bagi hasil per anggota
       kontributor berdasarkan kuantitas x bobot grade (nyambung ke QC
       checkpoint Fase 3F #2), dipersist ke tabel RevenueSplit supaya
       transparan & bisa diaudit, bukan cuma dihitung sesaat lalu hilang."""
    batch = db.get(BundlingBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch tidak ditemukan")
    if batch.status == BundlingStatus.SHIPPED:
        raise HTTPException(status_code=400, detail="Batch ini sudah ditandai terjual sebelumnya")

    batch.status = BundlingStatus.SHIPPED

    items = db.query(BundlingBatchItem).filter(BundlingBatchItem.batch_id == batch.id).all()
    produk_ids = [item.produk_id for item in items]

    # --- 1. Pencairan sisa Dana Talangan Panen ---
    talangan_list = (
        db.query(Pinjaman)
        .filter(
            Pinjaman.produk_id.in_(produk_ids) if produk_ids else False,
            Pinjaman.jenis_pinjaman == JenisPinjaman.TALANGAN_PANEN,
            Pinjaman.persen_cair == 70,
        )
        .all()
    )
    for talangan in talangan_list:
        talangan.persen_cair = 100
        catat_audit_log(
            db, user.id, "pencairan_dana_talangan", "Pinjaman", talangan.id,
            nilai_sebelum="persen_cair=70",
            nilai_sesudah=f"persen_cair=100 (batch={batch.id} terjual)",
        )
        profile = db.get(AnggotaProfile, talangan.anggota_id)
        if profile:
            sisa = float(talangan.nominal) * 0.3
            kirim_notifikasi(
                db, profile.user_id, TipeNotifikasi.PINJAMAN_DISETUJUI,
                "Sisa Dana Talangan Panen Cair",
                f"Batch bundling '{batch.komoditas}' terjual — sisa 30% (Rp {sisa:,.0f}) dari "
                "Dana Talangan Panen sudah cair.",
            )

    # --- 2. Revenue split proporsional (kuantitas x bobot grade) ---
    kontribusi = []
    total_bobot_kuantitas = 0.0
    for item in items:
        produk = db.get(Produk, item.produk_id)
        bobot = _bobot_grade(produk.grade if produk else None)
        bobot_kuantitas = float(item.jumlah) * bobot
        kontribusi.append((item, produk, bobot, bobot_kuantitas))
        total_bobot_kuantitas += bobot_kuantitas

    if payload.total_revenue is not None:
        total_revenue = payload.total_revenue
    else:
        total_revenue = sum(float(item.jumlah) * float(produk.harga) for item, produk, _, _ in kontribusi if produk)

    # PENTING: pembulatan independen tiap kontributor bisa bikin total
    # terdistribusi < total_revenue (uang "hilang" ke pembulatan, mis. 3
    # kontributor bobot sama dari Rp 100 -> 33.33+33.33+33.33 = 99.99,
    # bukan 100). Fix: bulatkan normal untuk SEMUA kontributor KECUALI
    # yang terakhir — kontributor terakhir dapat SISA eksak
    # (total_revenue dikurangi semua yang sudah dialokasikan), supaya
    # SUM(nominal_share) selalu PERSIS sama dengan total_revenue, tidak
    # pernah bocor sepeser pun.
    nominal_per_kontributor: list[float] = []
    if total_bobot_kuantitas > 0:
        for _, _, _, bobot_kuantitas in kontribusi[:-1]:
            nominal_per_kontributor.append(round(total_revenue * (bobot_kuantitas / total_bobot_kuantitas), 2))
        nominal_per_kontributor.append(round(total_revenue - sum(nominal_per_kontributor), 2))
    else:
        nominal_per_kontributor = [0.0] * len(kontribusi)

    splits_out = []
    for (item, produk, bobot, bobot_kuantitas), nominal in zip(kontribusi, nominal_per_kontributor):
        persentase = (bobot_kuantitas / total_bobot_kuantitas * 100) if total_bobot_kuantitas > 0 else 0.0

        split = RevenueSplit(
            batch_id=batch.id,
            anggota_id=item.anggota_id,
            produk_id=item.produk_id,
            jumlah_kontribusi=item.jumlah,
            grade=produk.grade if produk else None,
            bobot_grade=bobot,
            persentase_share=round(persentase, 3),
            nominal_share=nominal,
        )
        db.add(split)
        db.flush()
        splits_out.append(split)

        catat_audit_log(
            db, user.id, "distribusi_revenue_split", "RevenueSplit", split.id,
            nilai_sebelum=None,
            nilai_sesudah=(
                f"anggota={item.anggota_id}, jumlah={item.jumlah}, grade={produk.grade if produk else None}, "
                f"nominal_share={nominal}"
            ),
        )

        profile = db.get(AnggotaProfile, item.anggota_id)
        if profile:
            kirim_notifikasi(
                db, profile.user_id, TipeNotifikasi.ORDER_STATUS_BERUBAH,
                "Bagian Hasil Bundling Cair",
                f"Batch '{batch.komoditas}' terjual — bagian Anda Rp {nominal:,.0f} "
                f"({persentase:.1f}% dari total, grade {produk.grade if produk else '-'}).",
            )

    db.commit()
    return {
        "batch_id": str(batch.id),
        "status": batch.status.value,
        "jumlah_talangan_dilunasi": len(talangan_list),
        "total_revenue": total_revenue,
        "jumlah_kontributor": len(splits_out),
        "revenue_split": [
            {
                "anggota_id": str(s.anggota_id),
                "jumlah_kontribusi": float(s.jumlah_kontribusi),
                "grade": s.grade,
                "persentase_share": float(s.persentase_share),
                "nominal_share": float(s.nominal_share),
            }
            for s in splits_out
        ],
    }


@router.get("/revenue-split/saya", response_model=list[RevenueSplitOut])
def list_revenue_split_saya(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    """Riwayat bagi hasil bundling milik anggota yang login — transparansi
    supaya anggota bisa lihat sendiri kenapa bagiannya segini (kuantitas x
    grade), bukan cuma percaya angka dari Pengurus."""
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")
    return (
        db.query(RevenueSplit)
        .filter(RevenueSplit.anggota_id == profile.id)
        .order_by(RevenueSplit.created_at.desc())
        .all()
    )


@router.post("/permintaan-beli", response_model=HasilMatchOut, status_code=201)
def buat_permintaan_beli(
    payload: PermintaanBeliCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PEMBELI)),
):
    """Demand Matching — buyer ajukan permintaan terstruktur (komoditas +
    volume dibutuhkan), sistem langsung cocokkan ke stok Produk yang lolos
    QC. Kalau supply belum cukup, gap-nya otomatis dorong target Dynamic
    Bundling (lihat _dorong_bundling_dari_demand) — bukan cuma "matching
    pasif" dari listing yang kebetulan sudah ada."""
    permintaan = PermintaanBeli(
        pembeli_id=user.id,
        komoditas=payload.komoditas.lower().strip(),
        jumlah_dibutuhkan=payload.jumlah_dibutuhkan,
        harga_maks=payload.harga_maks,
        status=PermintaanBeliStatus.OPEN,
    )
    db.add(permintaan)
    db.flush()
    hasil = _proses_permintaan_beli(db, permintaan)
    hasil["permintaan_id"] = str(permintaan.id)
    return hasil


@router.get("/permintaan-beli/saya", response_model=list[PermintaanBeliOut])
def list_permintaan_beli_saya(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PEMBELI)),
):
    return (
        db.query(PermintaanBeli)
        .filter(PermintaanBeli.pembeli_id == user.id)
        .order_by(PermintaanBeli.created_at.desc())
        .all()
    )


@router.get("/permintaan-beli/terbuka", response_model=list[PermintaanBeliOut])
def list_permintaan_beli_terbuka(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.KASIR, UserRole.PENGURUS)),
):
    """Permintaan buyer yang belum sepenuhnya terpenuhi supply-nya —
    Kasir/Pengurus bisa lihat komoditas apa yang lagi dicari buyer supaya
    bisa dorong anggota tambah listing/gabung batch bundling."""
    return (
        db.query(PermintaanBeli)
        .filter(PermintaanBeli.status != PermintaanBeliStatus.TERPENUHI)
        .order_by(PermintaanBeli.created_at.desc())
        .all()
    )


@router.get("/permintaan-beli/{permintaan_id}/match", response_model=HasilMatchOut)
def cek_ulang_match_permintaan(
    permintaan_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PEMBELI)),
):
    """Re-match on-demand — supply bisa berubah kapan saja (produk baru
    lolos QC, stok terjual), jadi hasil match dihitung ULANG tiap dipanggil
    (bukan cache statis dari saat submit) supaya buyer selalu lihat kondisi
    stok terkini."""
    permintaan = db.get(PermintaanBeli, permintaan_id)
    if not permintaan or permintaan.pembeli_id != user.id:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    hasil = _proses_permintaan_beli(db, permintaan)
    hasil["permintaan_id"] = str(permintaan.id)
    return hasil


@router.post("/orders", response_model=OrderOut, status_code=201)
def buat_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PEMBELI)),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Keranjang kosong")

    total = 0.0
    order_items = []
    for item in payload.items:
        produk = db.get(Produk, item.produk_id)
        if not produk:
            raise HTTPException(status_code=404, detail=f"Produk {item.produk_id} tidak ditemukan")
        if float(produk.stok) < item.jumlah:
            raise HTTPException(status_code=400, detail=f"Stok {produk.nama} tidak cukup")
        harga_satuan = float(produk.harga)
        total += harga_satuan * item.jumlah
        produk.stok = float(produk.stok) - item.jumlah
        if produk.stok <= 0:
            produk.status = ProdukStatus.HABIS
        order_items.append((produk, item.jumlah, harga_satuan))

    order = Order(
        pembeli_id=user.id,
        status=OrderStatus.PENDING,
        total=total,
        alamat_kirim=payload.alamat_kirim,
        kurir=payload.kurir,
    )
    db.add(order)
    db.flush()

    for produk, jumlah, harga_satuan in order_items:
        db.add(OrderItem(order_id=order.id, produk_id=produk.id, jumlah=jumlah, harga_satuan=harga_satuan))

    # Notifikasi ke tiap anggota pemilik produk yang keorder + cek stok menipis
    anggota_diberi_notif: set[uuid.UUID] = set()
    for produk, jumlah, _harga in order_items:
        pemilik = db.get(AnggotaProfile, produk.anggota_id)
        if pemilik and pemilik.id not in anggota_diberi_notif:
            kirim_notifikasi(
                db, pemilik.user_id, TipeNotifikasi.ORDER_BARU,
                "Order Baru Masuk",
                f"Ada order baru untuk produk Anda. Cek menu Order Masuk untuk detail.",
            )
            anggota_diberi_notif.add(pemilik.id)
        if pemilik and float(produk.stok) <= 5 and produk.status != ProdukStatus.HABIS:
            kirim_notifikasi(
                db, pemilik.user_id, TipeNotifikasi.STOK_MENIPIS,
                "Stok Menipis",
                f"Stok {produk.nama} tersisa {produk.stok} {produk.satuan} — pertimbangkan tambah listing.",
            )

    db.commit()
    db.refresh(order)
    return order


@router.get("/orders/saya", response_model=list[OrderOut])
def list_order_saya(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PEMBELI)),
):
    return (
        db.query(Order)
        .filter(Order.pembeli_id == user.id, Order.is_synthetic == False)  # noqa: E712
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/orders/masuk", response_model=list[OrderOut])
def list_order_masuk(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    """Order yang berisi produk milik anggota yang sedang login."""
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")

    order_ids = (
        db.query(OrderItem.order_id)
        .join(Produk, Produk.id == OrderItem.produk_id)
        .filter(Produk.anggota_id == profile.id)
        .distinct()
        .all()
    )
    ids = [oid for (oid,) in order_ids]
    return (
        db.query(Order)
        .filter(Order.id.in_(ids), Order.is_synthetic == False)  # noqa: E712
        .order_by(Order.created_at.desc())
        .all()
    )


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_status_order(
    order_id: uuid.UUID,
    payload: UpdateOrderStatusRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ANGGOTA, UserRole.PENGURUS)),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    order.status = payload.status
    kirim_notifikasi(
        db, order.pembeli_id, TipeNotifikasi.ORDER_STATUS_BERUBAH,
        "Status Pesanan Diperbarui",
        f"Pesanan Anda (Rp {float(order.total):,.0f}) sekarang berstatus: {payload.status.value}.",
    )
    db.commit()
    db.refresh(order)
    return order
