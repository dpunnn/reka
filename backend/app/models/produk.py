import enum
import uuid
from datetime import date, datetime

from sqlalchemy import String, Enum, DateTime, Date, Numeric, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProdukStatus(str, enum.Enum):
    AKTIF = "aktif"
    MENDEKATI_EXPIRED = "mendekati_expired"
    HABIS = "habis"


class Produk(Base):
    __tablename__ = "produk"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anggota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("anggota_profiles.id"))
    koperasi_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("koperasi.id"))
    nama: Mapped[str] = mapped_column(String(150))
    kategori: Mapped[str] = mapped_column(String(50))
    harga: Mapped[float] = mapped_column(Numeric(12, 2))
    satuan: Mapped[str] = mapped_column(String(20), default="kg")
    stok: Mapped[float] = mapped_column(Numeric(10, 2))
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tanggal_produksi: Mapped[date | None] = mapped_column(Date, nullable=True)
    tanggal_kadaluarsa: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[ProdukStatus] = mapped_column(Enum(ProdukStatus), default=ProdukStatus.AKTIF)
    harga_rekomendasi_ai: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    grade: Mapped[str | None] = mapped_column(String(1), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
