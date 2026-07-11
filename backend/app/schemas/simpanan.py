import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.pinjaman import JenisSimpanan


class SimpananCreateRequest(BaseModel):
    anggota_id: uuid.UUID
    jenis: JenisSimpanan
    nominal: float


class SimpananOut(BaseModel):
    id: uuid.UUID
    anggota_id: uuid.UUID
    jenis: JenisSimpanan
    nominal: float
    created_at: datetime

    class Config:
        from_attributes = True


class SaldoSimpananOut(BaseModel):
    anggota_id: uuid.UUID
    saldo: float
