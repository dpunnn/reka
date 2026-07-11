import enum
import uuid
from datetime import date, datetime

from sqlalchemy import String, Enum, DateTime, Date, Numeric, Integer, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class JenisSimpanan(str, enum.Enum):
    SETOR = "setor"
    TARIK = "tarik"


class Simpanan(Base):
    __tablename__ = "simpanan"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anggota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("anggota_profiles.id"))
    jenis: Mapped[JenisSimpanan] = mapped_column(Enum(JenisSimpanan))
    nominal: Mapped[float] = mapped_column(Numeric(14, 2))
    dicatat_oleh_kasir_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PinjamanStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    LUNAS = "lunas"


class JenisPinjaman(str, enum.Enum):
    MODAL_USAHA = "modal_usaha"  # default — pinjaman umum, flow existing tidak berubah
    MODAL_PRA_TANAM = "modal_pra_tanam"  # Fase 3F #4 — jawab masalah ijon
    TALANGAN_PANEN = "talangan_panen"  # Fase 3F #3 — Dana Talangan Panen Instant


class Pinjaman(Base):
    __tablename__ = "pinjaman"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anggota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("anggota_profiles.id"))
    nominal: Mapped[float] = mapped_column(Numeric(14, 2))
    tujuan: Mapped[str] = mapped_column(String(200))
    tenor_bulan: Mapped[int] = mapped_column(Integer)
    status: Mapped[PinjamanStatus] = mapped_column(Enum(PinjamanStatus), default=PinjamanStatus.PENDING)

    jenis_pinjaman: Mapped[JenisPinjaman] = mapped_column(Enum(JenisPinjaman), default=JenisPinjaman.MODAL_USAHA)

    produk_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("produk.id"), nullable=True)

    persen_cair: Mapped[int] = mapped_column(Integer, default=100)

    # Credit Scoring Hybrid: individual (histori transaksi) + graph (tanggung renteng)
    skor_individual: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    skor_graph: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    skor_gabungan: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(10), nullable=True)  # LOW/MED/HIGH
    catatan_keputusan: Mapped[str | None] = mapped_column(Text, nullable=True)

    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    angsuran: Mapped[list["Angsuran"]] = relationship(back_populates="pinjaman")


class AngsuranStatus(str, enum.Enum):
    BELUM_BAYAR = "belum_bayar"
    LUNAS = "lunas"
    TELAT = "telat"


class Angsuran(Base):
    __tablename__ = "angsuran"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pinjaman_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pinjaman.id"))
    cicilan_ke: Mapped[int] = mapped_column(Integer)
    nominal: Mapped[float] = mapped_column(Numeric(14, 2))
    jatuh_tempo: Mapped[date] = mapped_column(Date)
    status: Mapped[AngsuranStatus] = mapped_column(Enum(AngsuranStatus), default=AngsuranStatus.BELUM_BAYAR)
    tanggal_bayar: Mapped[date | None] = mapped_column(Date, nullable=True)

    pinjaman: Mapped["Pinjaman"] = relationship(back_populates="angsuran")
