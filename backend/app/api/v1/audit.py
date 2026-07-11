from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogOut

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/trail", response_model=list[AuditLogOut])
def list_audit_trail(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS, UserRole.PEMKAB)),
):
    """Audit Trail / Governance Transparency (Fase 3F #9) — read-only,
    Pengurus & Pemkab. Ini yang menjadikan klaim governance REKA (vs kasus
    fraud eFishery/TaniHub 2024-2025 yang dikutip di pitch deck) BISA
    DIVERIFIKASI pihak luar, bukan cuma diklaim di slide. Tidak ada
    endpoint UPDATE/DELETE untuk tabel ini di seluruh API — append-only
    by omission."""
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
