import uuid

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def catat_audit_log(
    db: Session,
    aktor_user_id: uuid.UUID,
    aksi: str,
    entitas_tipe: str,
    entitas_id: uuid.UUID,
    nilai_sebelum: str | None = None,
    nilai_sesudah: str | None = None,
) -> AuditLog:
    """Fase 3F #9 — dipanggil dari tiap aksi finansial pengurus/kasir
    (approval pinjaman, pencairan dana talangan, distribusi hasil
    bundling, verifikasi grade). db.flush() bukan db.commit() — biar
    tetap 1 transaksi atomik dengan aksi utamanya di endpoint pemanggil
    (kalau aksi utama gagal & rollback, log-nya ikut rollback juga,
    tidak ada log "hantu" untuk aksi yang sebenarnya gagal)."""
    log = AuditLog(
        aktor_user_id=aktor_user_id,
        aksi=aksi,
        entitas_tipe=entitas_tipe,
        entitas_id=entitas_id,
        nilai_sebelum=nilai_sebelum,
        nilai_sesudah=nilai_sesudah,
    )
    db.add(log)
    db.flush()
    return log
