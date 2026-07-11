"""
Publisher event-driven notifikasi ke RabbitMQ. Koneksi dibuka-tutup per
publish (bukan connection pool persisten) — cukup untuk skala hackathon,
upgrade ke connection pooling/async kalau volume produksi jauh lebih besar.

CATATAN ARSITEKTUR: REKA memakai pendekatan ganda yang sengaja — event
di-publish ke RabbitMQ (bisa dicek nyata di RabbitMQ Management UI,
localhost:15672) SEKALIGUS notifikasi in-app langsung ditulis ke tabel
notifikasi di request yang sama (lihat app/services/notifikasi.py). Kenapa
tidak murni bergantung ke consumer RabbitMQ terpisah: demo hackathon butuh
notifikasi muncul instan & reliable tanpa tergantung proses worker terpisah
yang bisa lupa dijalankan/mati saat presentasi. RabbitMQ tetap
dipakai untuk membuktikan arsitektur event-driven riil (bukan cuma servis
nyala tanpa dipakai), dan jadi fondasi kalau nanti mau pindah ke consumer
async penuh (mis. push notification, SMS gateway) pasca-hackathon.
"""

import json
import logging

import pika

from app.core.config import settings

logger = logging.getLogger(__name__)

EXCHANGE_NAME = "reka.notifikasi"


def publish_event(routing_key: str, payload: dict) -> None:
    try:
        params = pika.URLParameters(settings.RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type="topic", durable=True)
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=json.dumps(payload, default=str),
            properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
        )
        connection.close()
    except Exception:
        # RabbitMQ down/tidak terjangkau TIDAK BOLEH bikin aksi utama
        # (approval pinjaman, dst) gagal — publish event ini best-effort.
        logger.warning("Gagal publish event ke RabbitMQ (routing_key=%s)", routing_key, exc_info=True)
