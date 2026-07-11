import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.transaksi import PermintaanBeliStatus


class PermintaanBeliCreateRequest(BaseModel):
    komoditas: str
    jumlah_dibutuhkan: float
    harga_maks: float | None = None


class PermintaanBeliOut(BaseModel):
    id: uuid.UUID
    komoditas: str
    jumlah_dibutuhkan: float
    harga_maks: float | None
    status: PermintaanBeliStatus
    created_at: datetime

    class Config:
        from_attributes = True


class KandidatMatchOut(BaseModel):
    produk_id: str
    nama: str
    koperasi_id: str
    stok: float
    harga: float
    grade: str | None
    skor_match: float


class HasilMatchOut(BaseModel):
    permintaan_id: str | None = None
    status: str
    total_tersedia: float
    kekurangan: float
    kandidat: list[KandidatMatchOut]
