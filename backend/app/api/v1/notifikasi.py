import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.notifikasi import Notifikasi
from app.models.user import User
from app.schemas.notifikasi import NotifikasiOut

router = APIRouter(prefix="/notifikasi", tags=["notifikasi"])


@router.get("/saya", response_model=list[NotifikasiOut])
def list_notifikasi_saya(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Notifikasi)
        .filter(Notifikasi.user_id == user.id)
        .order_by(Notifikasi.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/saya/jumlah-belum-dibaca")
def jumlah_belum_dibaca(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    jumlah = (
        db.query(Notifikasi)
        .filter(Notifikasi.user_id == user.id, Notifikasi.dibaca == False)  # noqa: E712
        .count()
    )
    return {"jumlah": jumlah}


@router.post("/{notifikasi_id}/baca", response_model=NotifikasiOut)
def tandai_dibaca(
    notifikasi_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    notif = db.get(Notifikasi, notifikasi_id)
    if not notif or notif.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    notif.dibaca = True
    db.commit()
    db.refresh(notif)
    return notif
