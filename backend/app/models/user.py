import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Enum, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    ANGGOTA = "anggota"
    PENGURUS = "pengurus"
    KASIR = "kasir"
    PEMBELI = "pembeli"
    PEMKAB = "pemkab"


class VerifikasiStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str | None] = mapped_column(String(150), unique=True, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    anggota_profile: Mapped["AnggotaProfile"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="AnggotaProfile.user_id",
    )


class AnggotaProfile(Base):
    """Profil tambahan khusus untuk user berrole ANGGOTA."""

    __tablename__ = "anggota_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    koperasi_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("koperasi.id"))
    nik: Mapped[str] = mapped_column(String(20), unique=True)
    foto_ktp_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    jenis_usaha: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status_verifikasi: Mapped[VerifikasiStatus] = mapped_column(
        Enum(VerifikasiStatus), default=VerifikasiStatus.PENDING
    )
    # Referensi/vouching saat registrasi (cold-start graph di Neo4j pakai id ini
    # sebagai edge awal, tidak perlu integrasi sistem eksternal apa pun)
    direferensikan_oleh_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("anggota_profiles.id"), nullable=True
    )
    verified_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="anggota_profile", foreign_keys=[user_id])
    koperasi: Mapped["Koperasi"] = relationship(back_populates="anggota_profiles")
