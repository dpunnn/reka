# REKA
### Platform Ekosistem Koperasi Desa Terintegrasi

> *"Merancang ulang ekonomi desa — dari simpan pinjam hingga pasar kota."*

REKA adalah super-app ekosistem koperasi desa yang menggabungkan **simpan pinjam digital**, **marketplace desa-kota**, dan **intelligence engine** dalam satu platform terintegrasi. Petani dan peternak anggota koperasi bisa akses modal, jual produk langsung ke konsumen kota, dan mendapat rekomendasi berbasis data — tanpa tengkulak, tanpa buku catatan manual.

---

## Masalah yang Diselesaikan

| Masalah | Dampak | Solusi REKA |
|---|---|---|
| Rantai tengkulak panjang | Petani kehilangan 40-60% nilai produk | Marketplace langsung desa→kota |
| Simpan pinjam manual | Kredit macet tinggi, akses modal sulit | Credit scoring otomatis berbasis data |
| Pengurus buta data | Keputusan berdasarkan intuisi, bukan fakta | Intelligence engine real-time |
| Produk expired tidak terjual | Kerugian stok sia-sia | Smart Expiry Display otomatis |

---

## Alur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        PENGGUNA                             │
│   Anggota Koperasi    Pengurus/Kasir    Pembeli Kota        │
└────────┬──────────────────┬──────────────────┬─────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      REKA PLATFORM                          │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │  SIMPAN PINJAM  │  │   MARKETPLACE    │                 │
│  │                 │  │   DESA - KOTA    │                 │
│  │ • Ajukan pinjam │  │                  │                 │
│  │ • Lacak angsuran│  │ • Listing produk │                 │
│  │ • Kelola simpanan│  │ • Order & bayar  │                 │
│  │ • Notif jatuh   │  │ • Tracking kirim │                 │
│  │   tempo         │  │ • Smart Expiry   │                 │
│  └────────┬────────┘  └────────┬─────────┘                 │
│           │                    │                            │
│           └────────┬───────────┘                           │
│                    ▼                                        │
│  ┌─────────────────────────────────────────┐               │
│  │          INTELLIGENCE ENGINE            │               │
│  │                                         │               │
│  │  Credit    Harga    Demand   Expiry     │               │
│  │  Scoring   Pasar    Forecast Pricing    │               │
│  └─────────────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   PostgreSQL           Redis            Neo4j
   (transaksi,        (cache,          (graph relasi
   simpanan,          session)          anggota &
   produk)                              transaksi)
```

---

## Fitur Utama

### 1. Simpan Pinjam Digital
- Pengajuan pinjaman via aplikasi mobile
- Jadwal angsuran otomatis dengan notifikasi jatuh tempo
- Riwayat simpanan dan mutasi real-time
- Persetujuan pinjaman dibantu credit scoring AI
- Multi-role: Pengurus (approve), Kasir (bayar), Anggota (self-service)

### 2. Marketplace Desa-Kota
- Anggota koperasi listing produk (ternak, pertanian, kerajinan)
- Pembeli dari kota order langsung tanpa perantara tengkulak
- Koperasi sebagai quality assurance dan aggregator logistik
- Integrasi pengiriman (JNE/J&T/SiCepat)
- **Smart Expiry Display**: produk mendekati expired otomatis naik ke posisi teratas dengan diskon optimal

### 3. Intelligence Engine
Empat sistem cerdas terintegrasi:

| Sistem | Fungsi | Input | Output |
|---|---|---|---|
| Credit Scoring | Nilai kelayakan pinjaman | 12 variabel histori transaksi anggota | Skor risiko 0-100 + rekomendasi limit |
| Rekomendasi Harga | Saran harga jual terbaik | Harga pasar regional real-time | Harga optimal per komoditas |
| Demand Forecast | Prediksi permintaan | Histori transaksi marketplace + tren | Proyeksi demand 30 hari ke depan |
| Demand Matching | Cocokkan desa-kota | Stok koperasi + permintaan kota | Rekomendasi komoditas prioritas jual |

---

## Tech Stack

### Backend
| Layer | Teknologi | Fungsi |
|---|---|---|
| API Framework | **FastAPI** (Python) | REST API, async, auto docs |
| Database Utama | **PostgreSQL** | Transaksi, simpanan, produk, user |
| Graph Database | **Neo4j** | Relasi anggota, jaringan transaksi |
| Cache | **Redis** | Session, rate limiting, real-time notif |
| Message Queue | **RabbitMQ** | Event-driven: notif jatuh tempo, stok update |
| Auth | **JWT (HS256)** | Access token 15 menit + refresh token 7 hari |

### Intelligence Engine
| Komponen | Teknologi | Detail |
|---|---|---|
| Credit Scoring | **XGBoost** | Supervised learning, 12 fitur, threshold 0.65 |
| Harga Pasar | **FastAPI + scraping** | Agregasi harga BPS + pasar regional |
| Demand Forecast | **Prophet / ARIMA** | Time series 90 hari lookback |
| Demand Matching | **Cosine similarity** | Vector embedding stok vs demand kota |
| Expiry Pricing | **Rule-based + ML** | Diskon optimal: 7 hari → 10%, 3 hari → 25%, 1 hari → 50% |

### Frontend
| Layer | Teknologi | Fungsi |
|---|---|---|
| Framework | **Next.js 14** (React) | SSR, routing, mobile-first |
| UI Library | **Tailwind CSS + shadcn/ui** | Design system konsisten |
| State Management | **Zustand** | Global state ringan |
| Charts | **Recharts** | Visualisasi data transaksi & forecast |

### Infrastructure
| Komponen | Teknologi |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| Cloud Target | Railway / Fly.io (MVP) |

---

## Arsitektur Intelligence Engine

```
INPUT DATA
├── Histori simpanan anggota (PostgreSQL)
├── Riwayat pembayaran angsuran (PostgreSQL)
├── Aktivitas marketplace (PostgreSQL)
└── Harga pasar regional (external API + scraping)
          │
          ▼
FEATURE ENGINEERING
├── Fan-in/fan-out transaksi
├── Ketepatan bayar (on-time rate)
├── Frekuensi transaksi 30/60/90 hari
├── Rasio simpanan vs pinjaman
└── Rating seller di marketplace
          │
          ▼
MODEL LAYER
├── Credit Scoring → XGBoost Classifier
│   └── Output: skor 0-100, risk_level (LOW/MED/HIGH)
├── Harga Pasar → Moving Average + seasonal adjustment
│   └── Output: harga rekomendasi per komoditas
├── Demand Forecast → Prophet
│   └── Output: demand forecast 30 hari
└── Smart Expiry → Rule engine + margin optimizer
    └── Output: harga diskon optimal
          │
          ▼
OUTPUT
├── Dashboard pengurus: insight anggota & stok
├── Notifikasi anggota: rekomendasi harga & demand
└── Marketplace: produk diurutkan berdasarkan skor relevance
```

---

## Alur Pengguna

### Anggota Koperasi (Penjual)
```
Daftar → Verifikasi oleh Pengurus → Login
→ Ajukan Pinjaman → Sistem scoring otomatis → Approved/Rejected
→ Listing Produk di Marketplace → Dapat rekomendasi harga dari AI
→ Order masuk dari kota → Kemas & kirim via kurir
→ Dana masuk ke saldo → Bayar angsuran pinjaman
```

### Pembeli Kota
```
Browse marketplace → Filter by komoditas/lokasi/harga
→ Lihat produk expired deal (Smart Expiry)
→ Order + pilih kurir → Bayar
→ Tracking pengiriman → Produk diterima → Rating seller
```

### Pengurus Koperasi
```
Monitor semua simpanan & pinjaman → Approve/reject pengajuan
→ Pantau stok & aktivitas marketplace
→ Lihat intelligence dashboard (forecast, top seller, credit risk)
→ Export laporan keuangan
```

---

## Flywheel Effect

```
Pinjam modal dari koperasi
        ↓
Produksi (ternak, pertanian, kerajinan)
        ↓
Jual via REKA marketplace langsung ke kota
        ↓
Dapat harga lebih baik (tanpa tengkulak)
        ↓
Lunasi pinjaman tepat waktu
        ↓
Data makin kaya → AI makin akurat
        ↓
Akses modal berikutnya lebih mudah & limit lebih besar
        ↓
[kembali ke atas — siklus terus berkembang]
```

Semakin banyak koperasi bergabung, semakin kuat jaringan dan semakin akurat intelligence engine-nya.

---

## Target Pengguna

| Peran | Siapa | Kebutuhan Utama |
|---|---|---|
| Anggota | Petani, peternak, pengrajin desa | Modal + channel penjualan |
| Pengurus | Ketua & staf koperasi | Manajemen + insight data |
| Kasir | Bendahara koperasi | Input transaksi + laporan |
| Pembeli | Konsumen, restoran, UMKM kota | Produk segar langsung dari sumber |
| Pemkab | Dinas koperasi kabupaten | Monitoring semua koperasi di wilayah |

---

## MVP Roadmap

```
Bulan 1: Core backend (simpan pinjam + auth + marketplace basic)
Bulan 2: Intelligence engine v1 (credit scoring + harga pasar)
Bulan 3: Frontend mobile-first + integrasi kurir
Bulan 4: Smart Expiry + Demand Forecast + Demand Matching
Bulan 5: Pemkab dashboard + multi-tenant deployment
Bulan 6: Pilot 3 koperasi desa
```

---

## Kontribusi

Dibevelop untuk kompetisi **Kopdes Hackathon 2026**.

