import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.graph.neo4j_client import get_network_for_visualization
from app.ml.demand_forecast import forecast_demand
from app.models.koperasi import Koperasi
from app.models.pinjaman import Pinjaman
from app.models.produk import Produk, ProdukStatus
from app.models.transaksi import BundlingBatch, BundlingBatchItem
from app.models.user import User, UserRole, AnggotaProfile

router = APIRouter(prefix="/intelligence", tags=["intelligence"])

KOMODITAS_TERDAFTAR = ["cabai merah", "telur ayam kampung", "gula aren", "beras"]


def _segmen_buyer_disarankan(gap: float | None, pct_mendekati_expired: float) -> str:
    """Rule-based, bukan CRM/matchmaking penuh (butuh histori transaksi riil
    dulu — lihat keterbatasan yang disadari di PIPELINE_KERJA.txt Fase 3F
    item #10). Targeting dasar berbasis 2 sinyal yang SUDAH ada di REKA:
    urgensi expiry produk aktif + gap demand-supply dari Demand Forecast."""
    if pct_mendekati_expired >= 0.3:
        return "UMKM Pengolah — banyak stok mendekati kadaluarsa, arahkan ke nilai tambah (bukan retail)"
    if gap is not None and gap > 0:
        return "Buyer Kota / Resto (reguler) — demand belum terpenuhi, prioritaskan ekspansi ke sini"
    return "Konsumen Retail — supply relatif seimbang, marketplace umum sudah cukup"


@router.get("/credit-risk-overview")
def credit_risk_overview(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS, UserRole.PEMKAB)),
):
    """Distribusi risiko kredit anggota (untuk dashboard Pengurus/Pemkab)."""
    pinjaman_list = db.query(Pinjaman).all()
    distribusi = {"LOW": 0, "MED": 0, "HIGH": 0}
    for p in pinjaman_list:
        if p.risk_level in distribusi:
            distribusi[p.risk_level] += 1
    return distribusi


@router.get("/graph-network/{anggota_id}")
def graph_network(
    anggota_id: uuid.UUID,
    _: User = Depends(require_role(UserRole.PENGURUS)),
):
    """Visualisasi jaringan vouching/tanggung renteng anggota — dipakai
    Pengurus saat review pengajuan pinjaman (lihat siapa vouch siapa)."""
    return get_network_for_visualization(str(anggota_id))


@router.get("/bundling-status")
def bundling_status(db: Session = Depends(get_db)):
    """Status semua batch Dynamic Bundling yang sedang berjalan."""
    return db.query(BundlingBatch).all()


@router.get("/demand-forecast/{komoditas}")
def demand_forecast(
    komoditas: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS, UserRole.PEMKAB)),
):
    """Prediksi demand 30 hari ke depan (Prophet), dilatih dari histori
    Order/OrderItem REKA sendiri. CATATAN: saat ini histori masih data
    sintetis dari seed script karena REKA belum live — lihat komentar di
    app/seed.py dan app/ml/demand_forecast.py."""
    return forecast_demand(db, komoditas)


@router.get("/demand-forecast")
def demand_forecast_semua_komoditas(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS, UserRole.PEMKAB)),
):
    """Forecast semua komoditas terdaftar sekaligus, untuk dashboard."""
    return [forecast_demand(db, k) for k in KOMODITAS_TERDAFTAR]


@router.get("/village-potential-mapping")
def village_potential_mapping(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS, UserRole.PEMKAB)),
):
    """
    Village Potential Mapping + Buyer Segment Suggestion (Fase 3F #7) —
    jawab TOR challenge question #1 (potensi ekonomi belum dimanfaatkan),
    #2 (mencocokkan potensi-demand), dan sebagian #3 (segmen buyer relevan).

    SENGAJA reuse Demand Forecast (histori Order/OrderItem) + Produk yang
    sudah ada, TIDAK bikin dataset/tabel "potensi desa" baru — gap dihitung
    murni dari data transaksi & listing internal REKA sendiri.

    gap > 0  → demand proyeksi 30 hari MELEBIHI supply aktif koperasi =
               potensi ekonomi yang belum digarap optimal (anggota bisa
               didorong produksi/listing lebih banyak komoditas ini).
    gap <= 0 → supply sudah mencukupi/lebih dari demand proyeksi.
    """
    hasil = []
    for komoditas in KOMODITAS_TERDAFTAR:
        forecast = forecast_demand(db, komoditas, periods=30)
        demand_proyeksi = (
            round(sum(p["prediksi"] for p in forecast["forecast"]), 1)
            if forecast["cukup_data"]
            else None
        )

        produk_aktif = (
            db.query(Produk)
            .filter(func.lower(Produk.nama) == komoditas.lower(), Produk.status != ProdukStatus.HABIS)
            .all()
        )
        supply_aktif = float(sum(float(p.stok) for p in produk_aktif))
        jumlah_mendekati_expired = sum(1 for p in produk_aktif if p.status == ProdukStatus.MENDEKATI_EXPIRED)
        pct_mendekati_expired = (jumlah_mendekati_expired / len(produk_aktif)) if produk_aktif else 0.0

        gap = round(demand_proyeksi - supply_aktif, 1) if demand_proyeksi is not None else None
        status_potensi = (
            "data_belum_cukup" if demand_proyeksi is None
            else "peluang_belum_digarap" if gap > 0
            else "supply_mencukupi"
        )

        hasil.append({
            "komoditas": komoditas,
            "demand_proyeksi_30_hari": demand_proyeksi,
            "supply_aktif": supply_aktif,
            "gap": gap,
            "status_potensi": status_potensi,
            "segmen_buyer_disarankan": _segmen_buyer_disarankan(gap, pct_mendekati_expired),
        })

    hasil.sort(key=lambda x: (x["gap"] is None, -(x["gap"] or 0)))
    return hasil


@router.get("/bundling-lintas-koperasi")
def bundling_lintas_koperasi(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PEMKAB)),
):
    """Batch Dynamic Bundling yang melibatkan LEBIH DARI SATU koperasi —
    cuma Pemkab yang punya visibilitas ini karena mengawasi banyak koperasi
    sekaligus di satu wilayah (lihat README bagian Village Potential Mapping
    & fitur pembeda REKA)."""
    hasil = []
    for batch in db.query(BundlingBatch).all():
        items = db.query(BundlingBatchItem).filter(BundlingBatchItem.batch_id == batch.id).all()
        koperasi_ids: set = set()
        for item in items:
            profile = db.get(AnggotaProfile, item.anggota_id)
            if profile:
                koperasi_ids.add(profile.koperasi_id)

        koperasi_list = [
            {"id": str(kid), "nama": db.get(Koperasi, kid).nama} for kid in koperasi_ids
        ]
        hasil.append({
            "batch_id": str(batch.id),
            "komoditas": batch.komoditas,
            "current_volume": float(batch.current_volume),
            "target_volume": float(batch.target_volume),
            "status": batch.status.value,
            "jumlah_koperasi": len(koperasi_ids),
            "koperasi": koperasi_list,
            "lintas_koperasi": len(koperasi_ids) > 1,
        })

    hasil.sort(key=lambda x: (-x["jumlah_koperasi"], x["komoditas"]))
    return hasil
