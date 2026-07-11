"""
Demand Forecast — Holt-Winters Exponential Smoothing (statsmodels), dilatih
dari histori Order/OrderItem di REKA sendiri (bukan dataset eksternal).

Kenapa bukan Prophet: Prophet butuh Stan backend yang di-compile pakai C++
toolchain (cmdstan) — di banyak laptop Windows tim (termasuk yang dites di
sini) itu gagal install karena tidak ada mingw32-make/Visual Studio Build
Tools terpasang. Untuk sprint hacking yang time-boxed, dependency serapuh
itu terlalu berisiko. Holt-Winters di statsmodels menangkap pola yang sama
(tren + musiman mingguan) tanpa butuh compiler apa pun — dan README kita
sendiri sudah menyebut "Prophet / ARIMA" sebagai opsi, jadi ini tetap
konsisten dengan spek awal, bukan penyimpangan.

CATATAN DATA: saat ini histori masih data sintetis dari app/seed.py karena
REKA belum live — begitu ada order sungguhan, fungsi ini otomatis fit ke
data riil tanpa perubahan kode, karena sumbernya sama-sama tabel Order/OrderItem.
"""

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from app.models.produk import Produk
from app.models.transaksi import Order, OrderItem


def get_historical_demand(db: Session, komoditas: str) -> pd.Series:
    rows = (
        db.query(
            func.date(Order.created_at).label("tanggal"),
            func.sum(OrderItem.jumlah).label("jumlah"),
        )
        .join(OrderItem, OrderItem.order_id == Order.id)
        .join(Produk, Produk.id == OrderItem.produk_id)
        .filter(func.lower(Produk.nama) == komoditas.lower())
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )
    if not rows:
        return pd.Series(dtype=float)
    df = pd.DataFrame([{"tanggal": r.tanggal, "jumlah": float(r.jumlah)} for r in rows])
    df["tanggal"] = pd.to_datetime(df["tanggal"])
    series = df.set_index("tanggal")["jumlah"].asfreq("D").interpolate()
    return series


def forecast_demand(db: Session, komoditas: str, periods: int = 30) -> dict:
    history = get_historical_demand(db, komoditas)
    if len(history) < 14:
        return {
            "komoditas": komoditas,
            "cukup_data": False,
            "pesan": "Belum cukup histori transaksi untuk forecast (butuh minimal ~14 hari data).",
            "forecast": [],
        }

    model = ExponentialSmoothing(
        history,
        trend="add",
        seasonal="add",
        seasonal_periods=7,
        initialization_method="estimated",
    ).fit()

    prediction = model.forecast(periods)
    last_date = history.index[-1]
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=periods)

    return {
        "komoditas": komoditas,
        "cukup_data": True,
        "forecast": [
            {
                "tanggal": tanggal.strftime("%Y-%m-%d"),
                "prediksi": max(0, round(float(nilai), 1)),
            }
            for tanggal, nilai in zip(future_dates, prediction)
        ],
    }
