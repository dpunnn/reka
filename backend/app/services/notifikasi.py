import uuid

from sqlalchemy.orm import Session

from app.core.rabbitmq import publish_event
from app.models.notifikasi import Notifikasi, TipeNotifikasi


def kirim_notifikasi(
    db: Session,
    user_id: uuid.UUID,
    tipe: TipeNotifikasi,
    judul: str,
    pesan: str,
) -> Notifikasi:
    notif = Notifikasi(user_id=user_id, tipe=tipe, judul=judul, pesan=pesan)
    db.add(notif)
    db.flush()

    publish_event(
        routing_key=f"notifikasi.{tipe.value}",
        payload={
            "notifikasi_id": str(notif.id),
            "user_id": str(user_id),
            "tipe": tipe.value,
            "judul": judul,
            "pesan": pesan,
        },
    )
    return notif
