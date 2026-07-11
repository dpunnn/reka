import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    """Audit Trail / Governance Transparency (Fase 3F #9, TEMUAN RISET
    2026-07-09) — dua startup agritech besar Indonesia (eFishery, TaniHub)
    kena skandal fraud 2024-2025: laporan keuangan ganda, korupsi dana.
    Masalahnya bukan teknologi jelek — tidak ada audit trail transparan di
    level transaksi. REKA rawan risiko serupa di level koperasi individual
    (pengurus KSP juga rentan gelapkan dana anggota).

    Log tiap aksi finansial pengurus/kasir: approval pinjaman, pencairan
    dana talangan, distribusi hasil bundling, verifikasi grade. INI YANG
    MENJADIKAN klaim governance di pitch deck bisa diverifikasi pihak
    luar (Pemkab, lewat endpoint read-only), bukan cuma diklaim di slide.

    Sengaja TIDAK ada endpoint UPDATE/DELETE — tabel ini append-only by
    design (immutability by omission, bukan trigger DB tingkat lanjut,
    tapi cukup untuk MVP: tidak ada satu pun endpoint API yang mengubah
    baris AuditLog setelah dibuat)."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aktor_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    aksi: Mapped[str] = mapped_column(String(50))
    entitas_tipe: Mapped[str] = mapped_column(String(50))
    entitas_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    nilai_sebelum: Mapped[str | None] = mapped_column(Text, nullable=True)
    nilai_sesudah: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
