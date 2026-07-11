import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.notifikasi import TipeNotifikasi


class NotifikasiOut(BaseModel):
    id: uuid.UUID
    tipe: TipeNotifikasi
    judul: str
    pesan: str
    dibaca: bool
    created_at: datetime

    class Config:
        from_attributes = True
