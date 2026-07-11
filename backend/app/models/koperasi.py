import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Koperasi(Base):
    __tablename__ = "koperasi"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama: Mapped[str] = mapped_column(String(200))
    kabupaten: Mapped[str] = mapped_column(String(100))
    provinsi: Mapped[str] = mapped_column(String(100))
    alamat: Mapped[str | None] = mapped_column(String(300), nullable=True)
    sektor_usaha: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    anggota_profiles: Mapped[list["AnggotaProfile"]] = relationship(back_populates="koperasi")
