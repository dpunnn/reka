import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Enum, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TipeNotifikasi(str, enum.Enum):
    PINJAMAN_DISETUJUI = "pinjaman_disetujui"
    PINJAMAN_DITOLAK = "pinjaman_ditolak"
    ANGSURAN_JATUH_TEMPO = "angsuran_jatuh_tempo"
    ORDER_BARU = "order_baru"
    ORDER_STATUS_BERUBAH = "order_status_berubah"
    STOK_MENIPIS = "stok_menipis"
    PRODUK_MENDEKATI_EXPIRED = "produk_mendekati_expired"
    PERMINTAAN_BUYER_BARU = "permintaan_buyer_baru"


class Notifikasi(Base):
    __tablename__ = "notifikasi"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    tipe: Mapped[TipeNotifikasi] = mapped_column(Enum(TipeNotifikasi))
    judul: Mapped[str] = mapped_column(String(150))
    pesan: Mapped[str] = mapped_column(Text)
    dibaca: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
