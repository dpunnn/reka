import uuid
from datetime import date

from pydantic import BaseModel

from app.models.pinjaman import PinjamanStatus, AngsuranStatus, JenisPinjaman


class PengajuanPinjamanRequest(BaseModel):
    nominal: float
    tujuan: str
    tenor_bulan: int


class TalanganPanenRequest(BaseModel):
    produk_id: uuid.UUID


class ModalPraTanamRequest(BaseModel):
    nominal: float
    luas_lahan_hektar: float
    komoditas_rencana: str
    estimasi_hasil_panen_kg: float
    tenor_bulan: int


class SkorPreview(BaseModel):
    skor_individual: float
    skor_graph: float
    skor_gabungan: float
    risk_level: str
    jumlah_vouch: int
    kemungkinan_disetujui: str
    bobot_individual: float
    bobot_graph: float


class PinjamanOut(BaseModel):
    id: uuid.UUID
    anggota_id: uuid.UUID
    nominal: float
    tujuan: str
    tenor_bulan: int
    status: PinjamanStatus
    skor_individual: float | None
    skor_graph: float | None
    skor_gabungan: float | None
    risk_level: str | None
    jenis_pinjaman: JenisPinjaman
    produk_id: uuid.UUID | None
    persen_cair: int

    class Config:
        from_attributes = True


class AngsuranOut(BaseModel):
    id: uuid.UUID
    cicilan_ke: int
    nominal: float
    jatuh_tempo: date
    status: AngsuranStatus
    tanggal_bayar: date | None

    class Config:
        from_attributes = True


class ApprovalRequest(BaseModel):
    disetujui: bool
    catatan: str | None = None
