# REKA

### Platform Ekosistem Koperasi Desa Terintegrasi

> *"Merancang ulang ekonomi desa — dari simpan pinjam hingga pasar kota."*

REKA adalah super-app ekosistem koperasi desa yang menggabungkan **simpan pinjam digital**, **marketplace desa-kota**, dan **intelligence engine** dalam satu platform terintegrasi. Petani dan peternak anggota koperasi bisa akses modal, jual produk langsung ke konsumen kota, dan mendapat rekomendasi berbasis data — tanpa tengkulak, tanpa buku catatan manual.

---

## Masalah yang Diselesaikan

| Masalah                                         | Dampak                                                                              | Solusi REKA                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Rantai tengkulak panjang                        | Petani kehilangan 40-60% nilai produk                                               | Marketplace langsung desa→kota                                |
| Petani kecil tak capai minimum order buyer kota | Individu tak sanggup penuhi volume, tetap bergantung ke tengkulak sebagai pengumpul | Dynamic Bundling — agregasi otomatis lintas anggota/koperasi  |
| Simpan pinjam manual                            | Kredit macet tinggi, akses modal sulit                                              | Credit scoring hybrid (individual + jaringan tanggung renteng) |
| Anggota baru tanpa histori transaksi            | Tidak bisa dinilai kelayakan pinjamannya                                            | Cold-start scoring via integrasi SIMKOPDES                     |
| Pengurus buta data                              | Keputusan berdasarkan intuisi, bukan fakta                                          | Intelligence engine real-time                                  |
| Produk expired tidak terjual                    | Kerugian stok sia-sia                                                               | Smart Expiry Display otomatis                                  |

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
- **Credit scoring hybrid**: skor individual (XGBoost, 12 variabel transaksi) dikombinasikan dengan **skor jaringan tanggung renteng** — anggota yang divouch/terhubung erat dengan anggota lain yang kredibel (dihitung via graph centrality di Neo4j) mendapat penyesuaian skor, meniru mekanisme tanggung renteng koperasi konvensional tapi terukur secara digital
- Anggota baru tanpa histori transaksi tetap bisa dinilai lewat cold-start scoring (lihat Integrasi SIMKOPDES di bawah)
- Multi-role: Pengurus (approve), Kasir (bayar), Anggota (self-service)

### 2. Marketplace Desa-Kota

- Anggota koperasi listing produk (ternak, pertanian, kerajinan)
- Pembeli dari kota order langsung tanpa perantara tengkulak
- Koperasi sebagai quality assurance dan aggregator logistik
- Integrasi pengiriman (JNE/J&T/SiCepat)
- **Smart Expiry Display**: produk mendekati expired otomatis naik ke posisi teratas dengan diskon optimal
- **Dynamic Bundling**: order kecil dari banyak anggota — bahkan lintas koperasi dalam satu kabupaten — digabung otomatis oleh sistem menjadi satu batch yang memenuhi minimum order quantity buyer kota/restoran/UMKM, menyelesaikan bottleneck agregasi yang selama ini jadi alasan petani kecil bergantung ke tengkulak

### 3. Intelligence Engine

Empat sistem cerdas terintegrasi:

| Sistem                     | Fungsi                              | Input                                                                                                                                       | Output                                                                       |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Credit Scoring             | Nilai kelayakan pinjaman            | 12 variabel histori transaksi anggota + graph centrality jaringan tanggung renteng (Neo4j) + baseline SIMKOPDES untuk anggota/koperasi baru | Skor risiko 0-100 + rekomendasi limit                                        |
| Rekomendasi Harga          | Saran harga jual terbaik            | Harga pasar regional real-time                                                                                                              | Harga optimal per komoditas                                                  |
| Demand Forecast            | Prediksi permintaan                 | Histori transaksi marketplace + tren                                                                                                        | Proyeksi demand 30 hari ke depan                                             |
| Demand Matching & Bundling | Cocokkan desa-kota + agregasi order | Stok koperasi + permintaan kota + kuantitas order per anggota/koperasi                                                                      | Rekomendasi komoditas prioritas jual + batch order gabungan penuhi MOQ buyer |

### 4. Integrasi Ekosistem SIMKOPDES

- REKA menarik data resmi dari endpoint publik SIMKOPDES (dashboard, RAT, transaksi bisnis, EWS kesehatan keuangan, kelembagaan) untuk membangun **profil awal (cold-start)** koperasi/anggota baru yang belum punya histori transaksi di REKA
- Data ini jadi baseline feature tambahan untuk Credit Scoring dan Demand Forecast sejak hari pertama koperasi onboard
- Menjadikan REKA siap terintegrasi langsung dengan ekosistem digital Kementerian Koperasi, bukan platform yang berdiri sendiri

---

## Tech Stack

### Backend

| Layer               | Teknologi                  | Fungsi                                                                                                                          |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| API Framework       | **FastAPI** (Python) | REST API, async, auto docs                                                                                                      |
| Database Utama      | **PostgreSQL**       | Transaksi, simpanan, produk, user                                                                                               |
| Graph Database      | **Neo4j**            | Relasi anggota, jaringan transaksi                                                                                              |
| Cache               | **Redis**            | Session, rate limiting, real-time notif                                                                                         |
| Message Queue       | **RabbitMQ**         | Event-driven: notif jatuh tempo, stok update                                                                                    |
| Auth                | **JWT (HS256)**      | Access token 15 menit + refresh token 7 hari                                                                                    |
| Integrasi Eksternal | **SIMKOPDES API**    | Tarik data dashboard, RAT, transaksi bisnis, EWS kesehatan keuangan, kelembagaan untuk cold-start scoring koperasi/anggota baru |

### Intelligence Engine

| Komponen                   | Teknologi                                        | Detail                                                                                                                                            |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credit Scoring             | **XGBoost + Graph Centrality (Neo4j)**     | Supervised learning 12 fitur individual, threshold 0.65, dikombinasikan dengan skor jaringan tanggung renteng (PageRank/centrality antar anggota) |
| Harga Pasar                | **FastAPI + scraping**                     | Agregasi harga BPS + pasar regional                                                                                                               |
| Demand Forecast            | **Prophet / ARIMA**                        | Time series 90 hari lookback                                                                                                                      |
| Demand Matching & Bundling | **Cosine similarity + Bundling Optimizer** | Vector embedding stok vs demand kota + algoritma agregasi order lintas anggota/koperasi untuk penuhi minimum order quantity buyer                 |
| Expiry Pricing             | **Rule-based + ML**                        | Diskon optimal: 7 hari → 10%, 3 hari → 25%, 1 hari → 50%                                                                                       |

### Frontend

| Layer            | Teknologi                          | Fungsi                                |
| ---------------- | ---------------------------------- | ------------------------------------- |
| Framework        | **Next.js 14** (React)       | SSR, routing, mobile-first            |
| UI Library       | **Tailwind CSS + shadcn/ui** | Design system konsisten               |
| State Management | **Zustand**                  | Global state ringan                   |
| Charts           | **Recharts**                 | Visualisasi data transaksi & forecast |

### Infrastructure

| Komponen         | Teknologi               |
| ---------------- | ----------------------- |
| Containerization | Docker + Docker Compose |
| Reverse Proxy    | Nginx                   |
| CI/CD            | GitHub Actions          |
| Cloud Target     | Railway / Fly.io (MVP)  |

---

## Arsitektur Intelligence Engine

```
INPUT DATA
├── Histori simpanan anggota (PostgreSQL)
├── Riwayat pembayaran angsuran (PostgreSQL)
├── Aktivitas marketplace (PostgreSQL)
├── Harga pasar regional (external API + scraping)
├── Jaringan relasi & vouching antar anggota (Neo4j)
└── Data kelembagaan, RAT, EWS kesehatan keuangan (SIMKOPDES API — cold-start koperasi/anggota baru)
          │
          ▼
FEATURE ENGINEERING
├── Fan-in/fan-out transaksi
├── Ketepatan bayar (on-time rate)
├── Frekuensi transaksi 30/60/90 hari
├── Rasio simpanan vs pinjaman
├── Rating seller di marketplace
├── Graph centrality / skor tanggung renteng (Neo4j)
└── Baseline profil dari SIMKOPDES (untuk entitas baru)
          │
          ▼
MODEL LAYER
├── Credit Scoring → XGBoost Classifier + Graph Centrality
│   └── Output: skor 0-100, risk_level (LOW/MED/HIGH)
├── Harga Pasar → Moving Average + seasonal adjustment
│   └── Output: harga rekomendasi per komoditas
├── Demand Forecast → Prophet
│   └── Output: demand forecast 30 hari
├── Demand Matching & Bundling → Cosine similarity + Bundling Optimizer
│   └── Output: batch order gabungan lintas anggota/koperasi penuhi MOQ buyer
└── Smart Expiry → Rule engine + margin optimizer
    └── Output: harga diskon optimal
          │
          ▼
OUTPUT
├── Dashboard pengurus: insight anggota & stok
├── Notifikasi anggota: rekomendasi harga & demand
├── Marketplace: produk diurutkan berdasarkan skor relevance
└── Batch order siap kirim: hasil bundling lintas anggota/koperasi
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

## Dampak & Model Bisnis Terukur

Proyeksi dampak untuk pilot 3 koperasi desa (mengacu skala di MVP Roadmap):

| Metrik                                            | Baseline (kondisi saat ini)                             | Target Pilot (12 bulan)                                             |
| ------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| Margin yang hilang ke tengkulak                   | 40-60% dari nilai jual                                  | Turun 15-25 poin — margin kembali ke petani                        |
| Anggota unbanked/belum pernah akses kredit formal | Mayoritas anggota di koperasi desa                      | 100-150 anggota per koperasi ter-onboard credit scoring             |
| Kredit macet (NPL)                                | Umumnya tinggi karena keputusan manual/intuisi pengurus | Turun berkat skor hybrid individual + tanggung renteng              |
| Produk terbuang karena kadaluarsa                 | Kerugian stok tak tercatat                              | Berkurang lewat Smart Expiry Display                                |
| Order tak terpenuhi karena volume kecil           | Petani individu ditolak buyer kota/resto/UMKM           | Tertutupi lewat Dynamic Bundling lintas anggota/koperasi            |
| Skalabilitas                                      | 3 koperasi pilot                                        | Target 50+ koperasi onboard tahun pertama sebagai multi-tenant SaaS |

*Catatan: angka baseline dan target adalah estimasi awal untuk kerangka proyeksi pitch deck — perlu divalidasi dengan data riil koperasi mitra pilot dan data SIMKOPDES saat implementasi.*

---

## Target Pengguna

| Peran    | Siapa                            | Kebutuhan Utama                      |
| -------- | -------------------------------- | ------------------------------------ |
| Anggota  | Petani, peternak, pengrajin desa | Modal + channel penjualan            |
| Pengurus | Ketua & staf koperasi            | Manajemen + insight data             |
| Kasir    | Bendahara koperasi               | Input transaksi + laporan            |
| Pembeli  | Konsumen, restoran, UMKM kota    | Produk segar langsung dari sumber    |
| Pemkab   | Dinas koperasi kabupaten         | Monitoring semua koperasi di wilayah |

---

## MVP Roadmap

```
Bulan 1: Core backend (simpan pinjam + auth + marketplace basic) + integrasi awal SIMKOPDES API
Bulan 2: Intelligence engine v1 (credit scoring hybrid individual+graph + harga pasar)
Bulan 3: Frontend mobile-first + integrasi kurir
Bulan 4: Smart Expiry + Demand Forecast + Demand Matching & Dynamic Bundling
Bulan 5: Pemkab dashboard + multi-tenant deployment
Bulan 6: Pilot 3 koperasi desa
```

---

## Kontribusi

Dibevelop untuk kompetisi **Kopdes Hackathon 2026**.
