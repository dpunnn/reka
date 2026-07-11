"""
Credit Scoring individual — XGBoost, bagian dari Credit Scoring Hybrid
(skor individual dari model ini + skor graph dari Neo4j digabung terpisah
dengan bobot 60/40, lihat app/api/v1/pinjaman.py — arsitektur ini SENGAJA
dipertahankan sesuai yang sudah didokumentasikan di README/pitch deck,
XGBoost di sini cuma menggantikan formula rule-based lama untuk komponen
individual saja).

STATUS DATA TRAINING: REKA belum live, jadi belum ada data pinjaman/histori
transaksi riil dalam jumlah cukup untuk melatih model sungguhan. Model ini
dilatih dari DATA SINTETIS (generate_synthetic_training_data di bawah) yang
polanya didesain merefleksikan hubungan realistis (ketepatan bayar tinggi +
keanggotaan lama + aktivitas marketplace konsisten → skor lebih baik) —
BUKAN dilatih dari transaksi nyata. Begitu ada data pinjaman riil yang cukup
pasca-pilot (idealnya >100 pinjaman lunas/macet), jalankan ulang training
dengan data asli menggantikan generator sintetis ini.

12 fitur (sesuai yang disebut README): jumlah_pinjaman_lunas,
jumlah_pinjaman_aktif, total_angsuran_tercatat, jumlah_angsuran_telat,
ketepatan_bayar_rate, rata_rata_nominal_pinjaman, saldo_simpanan,
jumlah_transaksi_simpanan, lama_keanggotaan_hari, jumlah_produk_aktif,
jumlah_produk_terjual, total_nilai_penjualan.
"""

import logging
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np
import xgboost as xgb
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parent / "models" / "credit_scoring_xgb.json"

FEATURE_NAMES = [
    "jumlah_pinjaman_lunas",
    "jumlah_pinjaman_aktif",
    "total_angsuran_tercatat",
    "jumlah_angsuran_telat",
    "ketepatan_bayar_rate",
    "rata_rata_nominal_pinjaman",
    "saldo_simpanan",
    "jumlah_transaksi_simpanan",
    "lama_keanggotaan_hari",
    "jumlah_produk_aktif",
    "jumlah_produk_terjual",
    "total_nilai_penjualan",
]

_model_cache: xgb.XGBClassifier | None = None


def extract_features(db: Session, anggota_id: uuid.UUID) -> dict[str, float]:
    """Tarik 12 fitur dari data REAL anggota di database — fungsi ini yang
    tetap dipakai apa adanya begitu training data diganti data riil, cuma
    modelnya yang perlu dilatih ulang."""
    from app.models.pinjaman import Pinjaman, Angsuran, PinjamanStatus, AngsuranStatus, Simpanan, JenisSimpanan
    from app.models.produk import Produk, ProdukStatus
    from app.models.transaksi import Order, OrderItem
    from app.models.user import AnggotaProfile

    pinjaman_list = db.query(Pinjaman).filter(Pinjaman.anggota_id == anggota_id).all()
    jumlah_pinjaman_lunas = sum(1 for p in pinjaman_list if p.status == PinjamanStatus.LUNAS)
    jumlah_pinjaman_aktif = sum(1 for p in pinjaman_list if p.status == PinjamanStatus.APPROVED)
    rata_rata_nominal_pinjaman = (
        float(np.mean([float(p.nominal) for p in pinjaman_list])) if pinjaman_list else 0.0
    )

    pinjaman_ids = [p.id for p in pinjaman_list]
    angsuran_list = (
        db.query(Angsuran).filter(Angsuran.pinjaman_id.in_(pinjaman_ids)).all() if pinjaman_ids else []
    )
    total_angsuran_tercatat = len(angsuran_list)
    jumlah_angsuran_telat = sum(1 for a in angsuran_list if a.status == AngsuranStatus.TELAT)
    ketepatan_bayar_rate = (
        1 - jumlah_angsuran_telat / total_angsuran_tercatat if total_angsuran_tercatat else 0.5
    )

    setor = (
        db.query(func.coalesce(func.sum(Simpanan.nominal), 0))
        .filter(Simpanan.anggota_id == anggota_id, Simpanan.jenis == JenisSimpanan.SETOR)
        .scalar()
    )
    tarik = (
        db.query(func.coalesce(func.sum(Simpanan.nominal), 0))
        .filter(Simpanan.anggota_id == anggota_id, Simpanan.jenis == JenisSimpanan.TARIK)
        .scalar()
    )
    saldo_simpanan = float(setor) - float(tarik)
    jumlah_transaksi_simpanan = db.query(Simpanan).filter(Simpanan.anggota_id == anggota_id).count()

    profile = db.get(AnggotaProfile, anggota_id)
    if profile and profile.created_at:
        created = profile.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        lama_keanggotaan_hari = (datetime.now(timezone.utc) - created).days
    else:
        lama_keanggotaan_hari = 0

    produk_list = db.query(Produk).filter(Produk.anggota_id == anggota_id).all()
    jumlah_produk_aktif = sum(1 for p in produk_list if p.status != ProdukStatus.HABIS)
    produk_ids = [p.id for p in produk_list]

    if produk_ids:
        terjual = (
            db.query(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(OrderItem.produk_id.in_(produk_ids), Order.is_synthetic == False)  # noqa: E712
            .all()
        )
    else:
        terjual = []
    jumlah_produk_terjual = len(terjual)
    total_nilai_penjualan = sum(float(t.jumlah) * float(t.harga_satuan) for t in terjual)

    return {
        "jumlah_pinjaman_lunas": jumlah_pinjaman_lunas,
        "jumlah_pinjaman_aktif": jumlah_pinjaman_aktif,
        "total_angsuran_tercatat": total_angsuran_tercatat,
        "jumlah_angsuran_telat": jumlah_angsuran_telat,
        "ketepatan_bayar_rate": ketepatan_bayar_rate,
        "rata_rata_nominal_pinjaman": rata_rata_nominal_pinjaman,
        "saldo_simpanan": saldo_simpanan,
        "jumlah_transaksi_simpanan": jumlah_transaksi_simpanan,
        "lama_keanggotaan_hari": lama_keanggotaan_hari,
        "jumlah_produk_aktif": jumlah_produk_aktif,
        "jumlah_produk_terjual": jumlah_produk_terjual,
        "total_nilai_penjualan": total_nilai_penjualan,
    }


def generate_synthetic_training_data(n: int = 1500, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """Generate data training sintetis. Desain PENTING (revisi setelah bug
    ditemukan saat testing): hanya fitur PERILAKU PEMBAYARAN (jumlah lunas,
    ketepatan bayar, jumlah telat) yang dikorelasikan kuat ke label kualitas.
    Fitur lain (saldo simpanan, lama keanggotaan, aktivitas jual-beli)
    SENGAJA dibuat independen dari label — supaya model tidak salah belajar
    "anggota baru = otomatis berisiko" (anggota baru yang rajin bayar tetap
    harus dapat skor bagus, dan sebaliknya). Percobaan pertama (versi lama)
    justru mengorelasikan lama_keanggotaan & jumlah_produk_terjual ke
    kualitas, sehingga anggota demo yang baru dibuat (histori pendek karena
    baru di-seed) dapat skor sangat rendah meski ketepatan bayarnya 100% —
    sudah diverifikasi salah lewat testing manual dan diperbaiki di sini."""
    rng = np.random.default_rng(seed)
    X = np.zeros((n, len(FEATURE_NAMES)))
    y = np.zeros(n, dtype=int)

    for i in range(n):
        kualitas = rng.beta(2, 2)  # 0 (buruk) - 1 (baik), variasi realistis
        y[i] = 1 if kualitas > 0.5 else 0

        # --- Sinyal utama: perilaku pembayaran, korelasi kuat ke kualitas ---
        jumlah_lunas = max(0, int(rng.poisson(0.5 + kualitas * 3)))
        jumlah_aktif = max(0, int(rng.poisson(1)))
        total_angsuran = max(1, jumlah_lunas * 6 + int(rng.poisson(2)))
        p_telat = float(np.clip(0.5 * (1 - kualitas) ** 1.5, 0.0, 0.5))
        telat = int(rng.binomial(total_angsuran, p_telat))
        ketepatan = 1 - telat / total_angsuran

        # --- Sinyal sekunder: SENGAJA independen dari kualitas — anggota
        # baru/aktivitas marketplace rendah tidak boleh otomatis dianggap
        # berisiko selama perilaku bayarnya baik ---
        rata_nominal = max(0, rng.normal(2_500_000, 800_000))
        saldo = max(0, rng.exponential(1_000_000))
        transaksi_simpanan = max(0, int(rng.poisson(3)))
        lama_hari = max(0, int(rng.exponential(150)))
        produk_aktif = max(0, int(rng.poisson(2)))
        produk_terjual = max(0, int(rng.poisson(2)))
        nilai_jual = max(0, produk_terjual * rng.normal(30000, 10000))

        X[i] = [
            jumlah_lunas, jumlah_aktif, total_angsuran, telat, ketepatan,
            rata_nominal, saldo, transaksi_simpanan, lama_hari,
            produk_aktif, produk_terjual, nilai_jual,
        ]

    return X, y


def train_and_save_model() -> None:
    X, y = generate_synthetic_training_data()
    model = xgb.XGBClassifier(
        n_estimators=100, max_depth=4, learning_rate=0.1,
        eval_metric="logloss", random_state=42,
    )
    model.fit(X, y)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    model.save_model(str(MODEL_PATH))
    logger.info("Credit scoring XGBoost model trained & saved to %s", MODEL_PATH)


def _get_model() -> xgb.XGBClassifier:
    global _model_cache
    if _model_cache is None:
        if not MODEL_PATH.exists():
            train_and_save_model()
        model = xgb.XGBClassifier()
        model.load_model(str(MODEL_PATH))
        _model_cache = model
    return _model_cache


def predict_skor_individual(features: dict[str, float]) -> float:
    """Return skor 0-100 (probabilitas 'layak' dari model, dikali 100)."""
    model = _get_model()
    x = np.array([[features[name] for name in FEATURE_NAMES]])
    proba = model.predict_proba(x)[0][1]  # probabilitas kelas "layak" (1)
    return round(float(proba) * 100, 2)
