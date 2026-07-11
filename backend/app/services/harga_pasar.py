"""
Rekomendasi Harga — coba tarik data resmi Panel Harga Bapanas dulu kalau API
key dikonfigurasi, kalau tidak/gagal, otomatis fallback ke simulasi lokal.

STATUS INTEGRASI RIIL: API Bapanas (webapi.badanpangan.go.id) butuh registrasi
+ verifikasi manual dari Pusdatin — prosesnya tidak instan, jadi tidak
didapat dalam waktu hackathon. Endpoint spesifik di bawah (BAPANAS_API_BASE_URL
+ path) BELUM divalidasi dengan API key asli karena kami belum dapat approval
— begini strukturnya berdasarkan dokumentasi publik yang tersedia (auth via
header X-Authorization, response JSON), tapi PATH ENDPOINT PASTINYA PERLU
DIKONFIRMASI ULANG begitu API key didapat. Kalau BAPANAS_API_KEY kosong
(default), sistem otomatis pakai fallback tanpa error — jangan disajikan ke
juri seolah ini sudah live-connected ke Bapanas kalau BAPANAS_API_KEY belum
diisi (cek field "sumber" di response untuk tahu mana yang sedang aktif).
"""

import hashlib
from datetime import date

import httpx

from app.core.config import settings

# Harga referensi dasar per komoditas (Rp) — basis simulasi fallback, angka
# representatif dari riset pasar kasar, BUKAN data real-time.
HARGA_DASAR = {
    "cabai merah": 28000,
    "telur ayam kampung": 45000,
    "gula aren": 32000,
    "beras": 13500,
    "bawang merah": 35000,
    "kopi": 60000,
    "madu": 120000,
    "jagung": 8000,
    "singkong": 6000,
}


def _simulasi_variasi_harian(komoditas: str, harga_dasar: float, tanggal: date) -> float:
    """Variasi harga harian deterministik (+/- 5%) berbasis hash tanggal+
    komoditas — supaya angka terasa 'hidup' antar hari saat demo, bukan
    flat statis, TAPI tetap konsisten/reproducible (bukan random tiap
    request). Ini simulasi, bukan fluktuasi pasar riil."""
    seed_str = f"{komoditas}-{tanggal.isoformat()}"
    seed_int = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    variasi_persen = ((seed_int % 1000) / 1000 - 0.5) * 0.10  # -5% s.d. +5%
    return round(harga_dasar * (1 + variasi_persen), -2)  # bulatkan ke ratusan


def _fetch_dari_bapanas(komoditas: str) -> float | None:
    """Coba tarik harga riil dari API Bapanas. Return None kalau gagal
    apapun alasannya (key belum ada, network error, endpoint salah, dst)
    — caller WAJIB fallback, bukan expose error ke user."""
    if not settings.BAPANAS_API_KEY:
        return None
    try:
        resp = httpx.get(
            f"{settings.BAPANAS_API_BASE_URL}/harga-pangan/eceran",
            params={"komoditas": komoditas},
            headers={"X-Authorization": settings.BAPANAS_API_KEY},
            timeout=5.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return float(data["harga"])
    except Exception:
        # Sengaja tangkap semua exception (network/timeout/parsing/key salah/
        # endpoint salah) — kegagalan integrasi eksternal TIDAK BOLEH bikin
        # fitur Rekomendasi Harga down, harus jatuh ke fallback dengan mulus.
        return None


def get_harga_pasar(komoditas: str, tanggal: date | None = None) -> dict | None:
    komoditas_key = komoditas.lower().strip()
    harga_dasar = HARGA_DASAR.get(komoditas_key)
    if harga_dasar is None:
        return None

    harga_riil = _fetch_dari_bapanas(komoditas_key)
    if harga_riil is not None:
        return {"komoditas": komoditas, "harga": harga_riil, "sumber": "bapanas_api"}

    tanggal = tanggal or date.today()
    harga_simulasi = _simulasi_variasi_harian(komoditas_key, harga_dasar, tanggal)
    return {"komoditas": komoditas, "harga": harga_simulasi, "sumber": "fallback_simulasi"}
