import uuid
from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.graph.neo4j_client import get_graph_score
from app.ml.credit_scoring import extract_features, predict_skor_individual
from app.models.notifikasi import TipeNotifikasi
from app.models.pinjaman import Pinjaman, Angsuran, PinjamanStatus, AngsuranStatus, JenisPinjaman
from app.models.produk import Produk
from app.models.user import User, UserRole, AnggotaProfile
from app.schemas.pinjaman import (
    PengajuanPinjamanRequest,
    PinjamanOut,
    AngsuranOut,
    ApprovalRequest,
    SkorPreview,
    TalanganPanenRequest,
    ModalPraTanamRequest,
)
from app.services.audit import catat_audit_log
from app.services.notifikasi import kirim_notifikasi

router = APIRouter(prefix="/pinjaman", tags=["pinjaman"])


def _risk_level(skor_gabungan: float) -> str:
    if skor_gabungan >= 70:
        return "LOW"
    if skor_gabungan >= 45:
        return "MED"
    return "HIGH"


def _hitung_skor_gabungan(db: Session, anggota_id: uuid.UUID) -> dict:
    """Skor individual (XGBoost, app/ml/credit_scoring.py) digabung dengan
    skor graph (Neo4j) pakai BOBOT DINAMIS berdasarkan seberapa banyak
    histori transaksi yang dimiliki anggota:

    - Belum ada histori transaksi sama sekali (total_angsuran=0): individual
      20% / graph 80% — satu-satunya sinyal yang tersedia untuk anggota
      benar-benar baru adalah jaringan vouching-nya, jadi itu yang paling
      dipercaya.
    - Histori tipis (1-5 angsuran, belum genap 1 siklus pinjaman): individual
      40% / graph 60%.
    - Histori mapan (6+ angsuran): individual 60% / graph 40% — bobot normal.

    Ini BUKAN angka sembarangan — desain ini sengaja supaya cold-start
    scoring via vouching (lihat README) benar-benar berfungsi: model
    individual XGBoost dilatih murni dari perilaku bayar, jadi anggota tanpa
    histori otomatis dapat skor individual rendah/tidak informatif — kalau
    bobotnya tetap fixed 60/40, vouching jadi tidak cukup kuat mengangkat
    anggota baru keluar dari kategori HIGH risk, padahal itu justru inti
    fitur pembeda REKA."""
    features = extract_features(db, anggota_id)
    skor_individual = predict_skor_individual(features)

    graph_result = get_graph_score(str(anggota_id))
    skor_graph = graph_result["skor_graph"]

    total_angsuran = features["total_angsuran_tercatat"]
    if total_angsuran == 0:
        bobot_individual, bobot_graph = 0.2, 0.8
    elif total_angsuran < 6:
        bobot_individual, bobot_graph = 0.4, 0.6
    else:
        bobot_individual, bobot_graph = 0.6, 0.4

    skor_gabungan = round(skor_individual * bobot_individual + skor_graph * bobot_graph, 2)
    return {
        "skor_individual": skor_individual,
        "skor_graph": skor_graph,
        "skor_gabungan": skor_gabungan,
        "risk_level": _risk_level(skor_gabungan),
        "jumlah_vouch": graph_result["jumlah_vouch"],
        "bobot_individual": bobot_individual,
        "bobot_graph": bobot_graph,
    }


@router.get("/skor-preview", response_model=SkorPreview)
def preview_skor(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")

    hasil = _hitung_skor_gabungan(db, profile.id)
    kemungkinan = {"LOW": "Tinggi", "MED": "Sedang", "HIGH": "Rendah"}[hasil["risk_level"]]

    return SkorPreview(
        skor_individual=hasil["skor_individual"],
        skor_graph=hasil["skor_graph"],
        skor_gabungan=hasil["skor_gabungan"],
        risk_level=hasil["risk_level"],
        jumlah_vouch=hasil["jumlah_vouch"],
        kemungkinan_disetujui=kemungkinan,
        bobot_individual=hasil["bobot_individual"],
        bobot_graph=hasil["bobot_graph"],
    )


@router.post("", response_model=PinjamanOut, status_code=201)
def ajukan_pinjaman(
    payload: PengajuanPinjamanRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")

    hasil = _hitung_skor_gabungan(db, profile.id)

    pinjaman = Pinjaman(
        anggota_id=profile.id,
        nominal=payload.nominal,
        tujuan=payload.tujuan,
        tenor_bulan=payload.tenor_bulan,
        skor_individual=hasil["skor_individual"],
        skor_graph=hasil["skor_graph"],
        skor_gabungan=hasil["skor_gabungan"],
        risk_level=hasil["risk_level"],
    )
    db.add(pinjaman)
    db.commit()
    db.refresh(pinjaman)
    return pinjaman


@router.post("/talangan-panen", response_model=PinjamanOut, status_code=201)
def ajukan_talangan_panen(
    payload: TalanganPanenRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    """Dana Talangan Panen Instant (Fase 3F #3, "paling kritis dari semua
    temuan") — jawab cashflow chasm: tengkulak menang karena bayar tunai
    di tempat, alur digital biasa (bundling -> kirim -> approval buyer ->
    pencairan) makan waktu beberapa hari. Di sini: begitu produk LOLOS QC
    (grade sudah diisi Kasir/Pengurus, lihat Fase 3F #2), anggota bisa
    cairkan 70% dari estimasi nilai jual SAAT ITU JUGA (auto-approved,
    tanpa proses approval manual/skor kredit — kolateralnya produk fisik
    yang sudah diverifikasi kualitasnya). Sisa 30% cair otomatis saat
    batch bundling yang memuat produk ini ditandai terjual (lihat
    POST /marketplace/bundling/{batch_id}/tandai-terjual). Mirip invoice
    factoring — bukan pinjaman berbunga+angsuran seperti MODAL_USAHA,
    makanya TIDAK melalui approval_pinjaman/buat jadwal Angsuran."""
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")

    produk = db.get(Produk, payload.produk_id)
    if not produk or produk.anggota_id != profile.id:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan atau bukan milik Anda")
    if produk.grade is None:
        raise HTTPException(
            status_code=400,
            detail="Produk belum lolos QC/Grading — Dana Talangan Panen cuma untuk produk yang "
            "sudah digrading Kasir/Pengurus",
        )

    existing = (
        db.query(Pinjaman)
        .filter(Pinjaman.produk_id == produk.id, Pinjaman.jenis_pinjaman == JenisPinjaman.TALANGAN_PANEN)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Produk ini sudah punya pengajuan Dana Talangan Panen")

    estimasi_nilai = float(produk.harga) * float(produk.stok)
    pinjaman = Pinjaman(
        anggota_id=profile.id,
        nominal=estimasi_nilai,
        tujuan=f"Dana Talangan Panen Instant — {produk.nama}",
        tenor_bulan=0,
        status=PinjamanStatus.APPROVED,
        jenis_pinjaman=JenisPinjaman.TALANGAN_PANEN,
        produk_id=produk.id,
        persen_cair=70,
        catatan_keputusan="Auto-approved: produk sudah lolos QC/Grading, dana talangan instant tanpa proses approval manual.",
    )
    db.add(pinjaman)
    db.commit()
    db.refresh(pinjaman)

    kirim_notifikasi(
        db, user.id, TipeNotifikasi.PINJAMAN_DISETUJUI,
        "Dana Talangan Panen Cair",
        f"70% dari estimasi Rp {estimasi_nilai:,.0f} untuk '{produk.nama}' cair instan. "
        "Sisa 30% cair otomatis saat batch bundling produk ini terjual.",
    )

    return pinjaman


@router.post("/modal-pra-tanam", response_model=PinjamanOut, status_code=201)
def ajukan_modal_pra_tanam(
    payload: ModalPraTanamRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    """Modal Pra-Tanam (Fase 3F #4, jawab masalah ijon — TEMUAN RISET
    2026-07-09): tengkulak bukan cuma penyerap margin distribusi, tapi
    sumber modal PRA-PANEN via ijon (petani pinjam sebelum tanam, terikat
    kontrak jual ke tengkulak yang sama). Dana Talangan Panen (Fase 3F #3)
    cuma sediakan modal PASCA-listing — petani yang sudah terjerat ijon
    tidak bisa pindah berapapun harga REKA lebih baik. Endpoint ini
    sediakan modal SEBELUM tanam.

    Underwriting REUSE _hitung_skor_gabungan yang SAMA dengan MODAL_USAHA
    (cold-start via graph vouching) — anggota belum panen diperlakukan
    sama seperti anggota baru tanpa histori transaksi, konteksnya beda
    ("belum panen" bukan "belum pernah transaksi") tapi mekanisme
    kepercayaannya identik. Data intake (luas lahan, komoditas, estimasi
    hasil) disimpan terstruktur di `tujuan` — SENGAJA tidak nambah kolom
    baru ke Pinjaman, numpang infrastruktur existing (murah teknis, tinggi
    dampak narasi). Lewat flow approval_pinjaman existing yang SAMA
    (status PENDING, Pengurus review manual via /pinjaman/pending) —
    BEDA dari Dana Talangan yang auto-approved, karena Modal Pra-Tanam
    genuinely underwritten by risk score, bukan dikolateralkan produk
    fisik yang sudah lolos QC."""
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")

    hasil = _hitung_skor_gabungan(db, profile.id)

    tujuan = (
        f"Modal Pra-Tanam — {payload.komoditas_rencana} "
        f"({payload.luas_lahan_hektar} ha, estimasi hasil {payload.estimasi_hasil_panen_kg} kg)"
    )

    pinjaman = Pinjaman(
        anggota_id=profile.id,
        nominal=payload.nominal,
        tujuan=tujuan,
        tenor_bulan=payload.tenor_bulan,
        jenis_pinjaman=JenisPinjaman.MODAL_PRA_TANAM,
        skor_individual=hasil["skor_individual"],
        skor_graph=hasil["skor_graph"],
        skor_gabungan=hasil["skor_gabungan"],
        risk_level=hasil["risk_level"],
    )
    db.add(pinjaman)
    db.commit()
    db.refresh(pinjaman)
    return pinjaman


@router.get("/saya", response_model=list[PinjamanOut])
def list_pinjaman_saya(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    return db.query(Pinjaman).filter(Pinjaman.anggota_id == profile.id).all()


@router.get("/pending", response_model=list[PinjamanOut])
def list_pinjaman_pending(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS)),
):
    return db.query(Pinjaman).filter(Pinjaman.status == PinjamanStatus.PENDING).all()


@router.post("/{pinjaman_id}/approval", response_model=PinjamanOut)
def approval_pinjaman(
    pinjaman_id: uuid.UUID,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    pengurus: User = Depends(require_role(UserRole.PENGURUS)),
):
    pinjaman = db.get(Pinjaman, pinjaman_id)
    if not pinjaman:
        raise HTTPException(status_code=404, detail="Pinjaman tidak ditemukan")

    status_lama = pinjaman.status
    pinjaman.status = PinjamanStatus.APPROVED if payload.disetujui else PinjamanStatus.REJECTED
    pinjaman.approved_by_id = pengurus.id
    pinjaman.catatan_keputusan = payload.catatan

    catat_audit_log(
        db, pengurus.id, "approval_pinjaman", "Pinjaman", pinjaman.id,
        nilai_sebelum=f"status={status_lama.value}",
        nilai_sesudah=f"status={pinjaman.status.value}, catatan={payload.catatan}",
    )

    db.flush()

    if payload.disetujui:
        cicilan_bulanan = round(float(pinjaman.nominal) / pinjaman.tenor_bulan, 2)
        for i in range(1, pinjaman.tenor_bulan + 1):
            db.add(
                Angsuran(
                    pinjaman_id=pinjaman.id,
                    cicilan_ke=i,
                    nominal=cicilan_bulanan,
                    jatuh_tempo=date.today() + relativedelta(months=i),
                )
            )

    profile = db.get(AnggotaProfile, pinjaman.anggota_id)
    if profile:
        if payload.disetujui:
            kirim_notifikasi(
                db, profile.user_id, TipeNotifikasi.PINJAMAN_DISETUJUI,
                "Pinjaman Disetujui",
                f"Pengajuan pinjaman Rp {float(pinjaman.nominal):,.0f} untuk '{pinjaman.tujuan}' telah disetujui.",
            )
        else:
            kirim_notifikasi(
                db, profile.user_id, TipeNotifikasi.PINJAMAN_DITOLAK,
                "Pinjaman Ditolak",
                f"Pengajuan pinjaman Rp {float(pinjaman.nominal):,.0f} untuk '{pinjaman.tujuan}' ditolak."
                + (f" Catatan: {payload.catatan}" if payload.catatan else ""),
            )

    db.commit()
    db.refresh(pinjaman)
    return pinjaman


@router.get("/{pinjaman_id}/angsuran", response_model=list[AngsuranOut])
def list_angsuran(pinjaman_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(Angsuran).filter(Angsuran.pinjaman_id == pinjaman_id).order_by(Angsuran.cicilan_ke).all()


@router.post("/angsuran/{angsuran_id}/bayar", response_model=AngsuranOut)
def bayar_angsuran(angsuran_id: uuid.UUID, db: Session = Depends(get_db)):
    angsuran = db.get(Angsuran, angsuran_id)
    if not angsuran:
        raise HTTPException(status_code=404, detail="Angsuran tidak ditemukan")
    angsuran.status = AngsuranStatus.LUNAS
    angsuran.tanggal_bayar = date.today()
    db.commit()
    db.refresh(angsuran)
    return angsuran
