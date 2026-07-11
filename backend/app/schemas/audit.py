import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: uuid.UUID
    aktor_user_id: uuid.UUID
    aksi: str
    entitas_tipe: str
    entitas_id: uuid.UUID
    nilai_sebelum: str | None
    nilai_sesudah: str | None
    created_at: datetime

    class Config:
        from_attributes = True
