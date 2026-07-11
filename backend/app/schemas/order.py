import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.transaksi import OrderStatus


class OrderItemRequest(BaseModel):
    produk_id: uuid.UUID
    jumlah: float


class CreateOrderRequest(BaseModel):
    items: list[OrderItemRequest]
    alamat_kirim: str
    kurir: str | None = None


class OrderItemOut(BaseModel):
    produk_id: uuid.UUID
    jumlah: float
    harga_satuan: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: uuid.UUID
    status: OrderStatus
    total: float
    alamat_kirim: str
    kurir: str | None
    resi: str | None
    created_at: datetime
    items: list[OrderItemOut]

    class Config:
        from_attributes = True


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus


class TandaiTerjualRequest(BaseModel):
    # Opsional — Pengurus isi nilai jual RIIL yang disepakati buyer kalau
    # beda dari estimasi (jumlah x harga listing tiap kontributor). Kalau
    # dikosongkan, sistem pakai estimasi otomatis dari harga listing.
    total_revenue: float | None = None


class RevenueSplitOut(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    anggota_id: uuid.UUID
    produk_id: uuid.UUID
    jumlah_kontribusi: float
    grade: str | None
    bobot_grade: float
    persentase_share: float
    nominal_share: float
    created_at: datetime

    class Config:
        from_attributes = True
