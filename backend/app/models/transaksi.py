import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Enum, DateTime, Numeric, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    DIKEMAS = "dikemas"
    DIKIRIM = "dikirim"
    DITERIMA = "diterima"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pembeli_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total: Mapped[float] = mapped_column(Numeric(14, 2))
    alamat_kirim: Mapped[str] = mapped_column(String(300))
    kurir: Mapped[str | None] = mapped_column(String(50), nullable=True)
    resi: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_synthetic: Mapped[bool] = mapped_column(default=False)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"))
    produk_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("produk.id"))
    jumlah: Mapped[float] = mapped_column(Numeric(10, 2))
    harga_satuan: Mapped[float] = mapped_column(Numeric(12, 2))

    order: Mapped["Order"] = relationship(back_populates="items")


class BundlingStatus(str, enum.Enum):
    COLLECTING = "collecting"
    READY = "ready"
    SHIPPED = "shipped"


class BundlingBatch(Base):
    """Dynamic Bundling: gabungan order kecil dari banyak anggota/koperasi
    jadi satu batch yang memenuhi minimum order quantity (MOQ) buyer."""

    __tablename__ = "bundling_batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    komoditas: Mapped[str] = mapped_column(String(100))
    target_volume: Mapped[float] = mapped_column(Numeric(10, 2))
    current_volume: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    buyer_nama: Mapped[str | None] = mapped_column(String(150), nullable=True)
    status: Mapped[BundlingStatus] = mapped_column(Enum(BundlingStatus), default=BundlingStatus.COLLECTING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["BundlingBatchItem"]] = relationship(back_populates="batch", cascade="all, delete-orphan")


class BundlingBatchItem(Base):
    __tablename__ = "bundling_batch_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bundling_batches.id"))
    anggota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("anggota_profiles.id"))
    produk_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("produk.id"))
    jumlah: Mapped[float] = mapped_column(Numeric(10, 2))

    batch: Mapped["BundlingBatch"] = relationship(back_populates="items")


class RevenueSplit(Base):
    """Fase 3F #8 — bagi hasil per anggota kontributor BundlingBatch,
    dihitung PROPORSIONAL dari kuantitas kontribusi DIKALI bobot grade
    (A/B/C dari QC checkpoint, Fase 3F #2). Dipersist (bukan cuma dihitung
    sesaat) supaya jadi catatan transparan yang bisa dilihat ulang anggota
    & diaudit Pemkab — mencegah konflik "kenapa bagian saya segini" antar
    anggota dalam satu batch gabungan."""

    __tablename__ = "revenue_splits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bundling_batches.id"))
    anggota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("anggota_profiles.id"))
    produk_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("produk.id"))
    jumlah_kontribusi: Mapped[float] = mapped_column(Numeric(10, 2))
    grade: Mapped[str | None] = mapped_column(String(1), nullable=True)
    bobot_grade: Mapped[float] = mapped_column(Numeric(3, 2))
    persentase_share: Mapped[float] = mapped_column(Numeric(6, 3))
    nominal_share: Mapped[float] = mapped_column(Numeric(14, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PermintaanBeliStatus(str, enum.Enum):
    OPEN = "open"
    MENUNGGU_BUNDLING = "menunggu_bundling"
    TERPENUHI = "terpenuhi"


class PermintaanBeli(Base):
    """Demand Matching — buyer ajukan permintaan terstruktur (komoditas +
    volume, bukan forum bebas), sistem cocokkan otomatis ke stok Produk yang
    sudah lolos QC (skor: fit volume + grade + urgensi expiry, lihat
    app/api/v1/marketplace.py _proses_permintaan_beli). Kalau supply belum
    cukup, dorong target Dynamic Bundling naik sesuai kekurangan riil
    (gantikan target statis TARGET_VOLUME_BUNDLING) dan notifikasi anggota
    terkait — menutup loop demand-supply dua arah, bukan cuma matching pasif."""

    __tablename__ = "permintaan_beli"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pembeli_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    komoditas: Mapped[str] = mapped_column(String(100))
    jumlah_dibutuhkan: Mapped[float] = mapped_column(Numeric(10, 2))
    harga_maks: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[PermintaanBeliStatus] = mapped_column(
        Enum(PermintaanBeliStatus), default=PermintaanBeliStatus.OPEN
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
