# REKA

### Platform Ekosistem Koperasi Desa Terintegrasi

> *"Merancang ulang ekonomi desa — dari simpan pinjam hingga pasar kota."*

REKA adalah super-app ekosistem koperasi desa yang menggabungkan **simpan pinjam digital**, **marketplace desa-kota**, dan **intelligence engine** dalam satu platform terintegrasi. Petani dan peternak anggota koperasi bisa akses modal, jual produk langsung ke konsumen kota, dan mendapat rekomendasi berbasis data — tanpa tengkulak, tanpa buku catatan manual.

---

## Masalah yang Diselesaikan

| Masalah                                                         | Dampak                                                                                 | Solusi REKA                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Rantai tengkulak panjang                                        | Petani kehilangan 40-60% nilai produk                                                  | Marketplace langsung desa→kota                                             |
| Petani kecil tak capai minimum order buyer kota                 | Individu tak sanggup penuhi volume, tetap bergantung ke tengkulak sebagai pengumpul    | Dynamic Bundling — agregasi otomatis lintas anggota/koperasi               |
| Simpan pinjam manual                                            | Kredit macet tinggi, akses modal sulit                                                 | Credit scoring hybrid (individual + jaringan tanggung renteng)              |
| Anggota baru tanpa histori transaksi                            | Tidak bisa dinilai kelayakan pinjamannya                                               | Cold-start scoring via jaringan vouching/referral antar anggota             |
| Pengurus buta data                                              | Keputusan berdasarkan intuisi, bukan fakta                                             | Intelligence engine real-time                                               |
| Produk expired tidak terjual                                    | Kerugian stok sia-sia                                                                  | Smart Expiry Display otomatis                                               |
| Petani butuh uang tunai instan, tidak bisa menunggu proses jual | Petani balik ke tengkulak meski harga REKA lebih baik, karena butuh cash HARI ITU JUGA | Dana Talangan Panen Instant — 70% cair begitu produk lolos QC              |
| Kualitas produk antar anggota tidak seragam saat digabung batch | Satu kontributor kualitas jelek bisa bikin buyer retur seluruh batch bundling          | QC/Grading checkpoint sebelum produk masuk pool bundling                    |
| Sayur/produk sangat perishable tidak laku meski didiskon        | Smart Expiry gagal untuk produk yang sudah tidak layak saji, tetap terbuang            | Rute Nilai Tambah — redirect ke B2B pengolahan, bukan cuma diskon konsumen |
| Potensi ekonomi desa belum teridentifikasi                      | Koperasi tidak tahu komoditas apa yang sebenarnya dibutuhkan pasar                     | Village Potential Mapping — analisis gap supply vs demand                  |
| Anggota tidak punya/tidak bisa pakai smartphone                 | Tereksklusi dari akses platform digital                                                | Ajudan Digital — Kasir/Pengurus input listing atas nama anggota            |

---

## Alur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        PENGGUNA                             │
│   Anggota Koperasi    Pengurus/Kasir    Pembeli Kota        │
└────────┬──────────────────┬──────────────────┬──────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────────────────────────────────────────────────┐
│                      REKA PLATFORM                         │
│                                                            │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │  SIMPAN PINJAM  │  │   MARKETPLACE    │                 │
│  │                 │  │   DESA - KOTA    │                 │
│  │ • Ajukan pinjam │  │                  │                 │
│  │ • Lacak angsuran│  │ • Listing produk │                 │
│  │ • Kelola simpanan│ │ • Order & bayar  │                 │
│  │ • Notif jatuh   │  │ • Tracking kirim │                 │
│  │   tempo         │  │ • Smart Expiry   │                 │
│  └────────┬────────┘  └────────┬─────────┘                 │
│           │                    │                           │
│           └────────┬───────────┘                           │
│                    ▼                                       │
│  ┌─────────────────────────────────────────┐               │
│  │          INTELLIGENCE ENGINE            │               │
│  │                                         │               │
│  │  Credit    Harga    Demand   Expiry     │               │
│  │  Scoring   Pasar    Forecast Pricing    │               │
│  └─────────────────────────────────────────┘               │
└──────────────────────────┬─────────────────────────────────┘
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
- Anggota baru tanpa histori transaksi tetap bisa dinilai lewat cold-start scoring (lihat Cold-Start via Vouching/Referral di bawah)
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

| Sistem                     | Fungsi                              | Input                                                                                                                                                  | Output                                                                       |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Credit Scoring             | Nilai kelayakan pinjaman            | 12 variabel histori transaksi anggota + graph centrality jaringan tanggung renteng (Neo4j), termasuk untuk anggota baru lewat vouching saat registrasi | Skor risiko 0-100 + rekomendasi limit                                        |
| Rekomendasi Harga          | Saran harga jual terbaik            | Harga pasar regional real-time                                                                                                                         | Harga optimal per komoditas                                                  |
| Demand Forecast            | Prediksi permintaan                 | Histori transaksi marketplace + tren                                                                                                                   | Proyeksi demand 30 hari ke depan                                             |
| Demand Matching & Bundling | Cocokkan desa-kota + agregasi order | Stok koperasi + permintaan kota + kuantitas order per anggota/koperasi                                                                                 | Rekomendasi komoditas prioritas jual + batch order gabungan penuhi MOQ buyer |

> **Transparansi data Demand Forecast**: model di-fit dari tabel Order/OrderItem REKA sendiri (bukan dataset eksternal/Kaggle) — tapi karena REKA belum live, histori 90 hari yang ada saat ini masih **data simulasi** (`app/seed.py`, fungsi `seed_demand_history`, pola tren + musiman mingguan + noise, ditandai jelas di kode). Begitu ada transaksi riil pasca-pilot, forecast otomatis fit ke data sungguhan tanpa perubahan kode, karena sumbernya tabel yang sama.

### 4. Cold-Start Scoring via Vouching/Referral

- Anggota baru **wajib direferensikan/divouch oleh minimal 1 anggota aktif** saat mendaftar — ini langsung membuat edge di graph Neo4j sejak hari pertama, jadi anggota baru punya skor jaringan awal walau belum punya histori transaksi sama sekali
- Ditambah form intake (jenis usaha, dsb) yang direview manual oleh Pengurus saat tahap verifikasi anggota
- Skor awal = kombinasi siapa yang vouch + kredibilitas pemvouch (graph centrality) + penilaian pengurus — semuanya data internal REKA, **tidak bergantung pada integrasi sistem eksternal apa pun**
- Mendigitalkan mekanisme tanggung renteng koperasi konvensional, sekaligus bisa langsung didemo end-to-end tanpa dependency ke pihak ketiga
- **Ketahanan terhadap kolusi (Sybil-resistance)**: hanya anggota berstatus VERIFIED yang bisa jadi voucher — mencegah 2 anggota cold-start saling vouch satu sama lain untuk mendongkrak skor secara artifisial (dicek server-side saat registrasi, bukan cuma dibatasi di dropdown frontend)

### 5. Dana Talangan Panen Instant

- Menjawab kesenjangan cashflow yang jadi keunggulan utama tengkulak: tengkulak menang karena bayar tunai di tempat, sementara alur digital (bundling → kirim → approval buyer → pencairan) makan waktu beberapa hari — petani butuh uang **hari itu juga** untuk kebutuhan sehari-hari
- Begitu produk anggota lolos QC/Grading (lihat poin 7), anggota bisa ajukan pencairan **70% dari estimasi nilai jual** (harga × stok) — dicairkan hari itu juga dari kas Simpan Pinjam koperasi
- Sisa **30%** otomatis cair begitu batch bundling yang memuat produknya berhasil terjual ke buyer kota
- Secara fungsi mirip *invoice factoring* — koperasi menjembatani gap waktu antara "produk siap jual" dan "uang benar-benar masuk dari buyer", tanpa perlu sistem keuangan terpisah karena memanfaatkan modul Simpan Pinjam yang sudah ada

### 6. Modal Pra-Tanam (Jawab Masalah Ijon)

- Tengkulak bukan cuma penyerap margin distribusi — di banyak desa, tengkulak juga jadi **sumber modal PRA-PANEN via sistem ijon**: petani pinjam sebelum tanam, terikat kontrak jual hasil ke tengkulak yang sama. Dana Talangan Panen (poin 5) cuma sediakan modal PASCA-listing, jadi petani yang sudah terjerat ijon tidak bisa pindah berapapun harga REKA lebih baik
- Anggota bisa ajukan pinjaman **sebelum masa tanam** dengan intake data proyeksi (luas lahan, komoditas rencana, estimasi hasil panen)
- Underwriting-nya **reuse Credit Scoring Hybrid** yang sama dengan pinjaman modal usaha biasa (cold-start via graph vouching) — anggota yang belum panen diperlakukan setara anggota baru tanpa histori transaksi, konteksnya beda ("belum panen" bukan "belum pernah transaksi") tapi mekanisme kepercayaannya identik
- Melalui alur approval Pengurus yang sama seperti pinjaman modal usaha (bukan auto-approved seperti Dana Talangan, karena benar-benar diunderwrite berdasarkan skor risiko, bukan dikolateralkan produk fisik yang sudah lolos QC)

### 7. QC/Grading & Revenue Split

- Produk yang baru dilisting anggota **tidak langsung masuk pool Dynamic Bundling** — harus lolos verifikasi kualitas dulu
- Kasir/Pengurus memberi **Grade A/B/C** setelah cek fisik di gudang koperasi; produk baru otomatis masuk batch bundling setelah lolos tahap ini
- Mencegah masalah klasik agregasi hasil bumi: satu kontributor kualitas jelek bisa bikin buyer retur seluruh batch, padahal kontributor lain kualitasnya bagus
- Saat batch terjual, pendapatan dibagi ke tiap anggota kontributor **proporsional terhadap kuantitas DAN grade** (bobot A=1,0 / B=0,9 / C=0,8) — bukan flat rate, jadi anggota dengan produk kualitas lebih baik dapat porsi lebih adil, sekaligus mengurangi potensi konflik antar anggota dalam satu batch. Pembagian dijamin selalu pas sampai ke rupiah terakhir (metode largest-remainder), tidak ada nominal yang "hilang" ke pembulatan

### 8. Rute Nilai Tambah (B2B Redirect untuk Produk Mendekati Expired)

- Smart Expiry Display (diskon bertingkat) efektif untuk barang yang relatif tahan lama (gula aren, telur), tapi **tidak realistis untuk sayur/produk sangat perishable** — diskon 90% pun percuma kalau sayur sudah layu, restoran kota tidak akan beli bahan yang sudah tidak layak saji
- Untuk produk perishable yang mendekati expired kritis (1 hari), sistem otomatis mengalihkan rute penjualan dari "diskon ke konsumen" menjadi **rekomendasi ke UMKM pengolah** (mis. tomat/cabai layu → bahan baku saus, sisa produk → pakan ternak/kompos lewat jaringan koperasi)
- Bukan cuma penyelamatan kerugian — ini jawaban langsung atas tantangan **"meningkatkan nilai tambah produk desa"**: transformasi produk, bukan sekadar optimasi harga jual komoditas mentah

### 9. Village Potential Mapping & Buyer Segment Suggestion

- Menganalisis gap antara **supply riil** (data listing produk anggota) dan **demand hasil forecast** (Intelligence Engine) per komoditas — menunjukkan komoditas mana yang permintaannya tinggi tapi belum banyak digarap anggota koperasi
- Dipakai Pengurus dan Pemkab untuk mengidentifikasi **potensi ekonomi desa yang belum optimal dimanfaatkan** — bukan menunggu anggota tahu sendiri mau jual apa
- Saat ada gap/batch yang teridentifikasi, sistem menyarankan **segmen buyer yang relevan** (mis. produk mendekati expired diarahkan ke UMKM pengolah, bukan konsumen retail) — bentuk awal "mempertemukan koperasi dengan buyer/offtaker yang tepat", meski belum berupa CRM/matchmaking penuh (lihat bagian Keterbatasan & Roadmap)

### 10. Ajudan Digital (Proxy Input untuk Anggota Tanpa Smartphone)

- Banyak petani senior tidak punya smartphone berspesifikasi tinggi atau masih pakai ponsel fitur — REKA tidak mengharuskan mereka install/pakai aplikasi sendiri
- Kasir/Pengurus koperasi bisa **input listing produk atas nama anggota** langsung dari akun mereka — perluasan alami dari kemampuan role ini yang sudah ada (mencatat pembayaran angsuran, memverifikasi anggota)
- Anggota cukup datang bawa hasil panen ke koperasi; sisanya diinput oleh Kasir/Pengurus, anggota menerima konfirmasi lewat SMS/struk fisik, bukan wajib buka aplikasi sendiri

### 11. Audit Trail / Governance Transparency

- Dua startup agritech besar Indonesia (eFishery, TaniHub) kena skandal fraud besar 2024-2025 — laporan keuangan ganda, korupsi dana. Masalahnya bukan teknologi jelek, tapi **tidak ada audit trail transparan di level transaksi**. Koperasi individual rawan risiko serupa (pengurus KSP rentan menyalahgunakan dana anggota)
- REKA mencatat **log immutable** (append-only, tidak ada endpoint update/hapus) untuk tiap aksi finansial pengurus/kasir: verifikasi grade QC, approval pinjaman, pencairan dana talangan, distribusi hasil bundling — lengkap dengan nilai sebelum/sesudah dan siapa aktor yang melakukannya
- Pemkab punya akses **read-only** untuk memeriksa log ini kapan saja — good governance yang bisa diverifikasi pihak luar, bukan cuma diklaim di pitch deck

---

## Tech Stack

### Backend

| Layer          | Teknologi                  | Fungsi                                       |
| -------------- | -------------------------- | -------------------------------------------- |
| API Framework  | **FastAPI** (Python) | REST API, async, auto docs                   |
| Database Utama | **PostgreSQL**       | Transaksi, simpanan, produk, user            |
| Graph Database | **Neo4j**            | Relasi anggota, jaringan transaksi           |
| Cache          | **Redis**            | Session, rate limiting, real-time notif      |
| Message Queue  | **RabbitMQ**         | Event-driven: notif jatuh tempo, stok update |
| Auth           | **JWT (HS256)**      | Access token 15 menit + refresh token 7 hari |

### Intelligence Engine

| Komponen                   | Teknologi                                        | Detail                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credit Scoring             | **XGBoost + Graph Centrality (Neo4j)**     | Supervised learning 12 fitur individual, threshold 0.65, dikombinasikan dengan skor jaringan tanggung renteng (PageRank/centrality antar anggota)                                                                                        |
| Harga Pasar                | **FastAPI + scraping**                     | Agregasi harga BPS + pasar regional                                                                                                                                                                                                      |
| Demand Forecast            | **Holt-Winters (statsmodels)**             | Time series 90 hari lookback, tren + musiman mingguan.*(Prophet dicoba lebih dulu, tapi butuh compiler C++/cmdstan yang rapuh dijalankan lintas laptop tim saat sprint — statsmodels pure-Python, hasil setara untuk pola data ini.)* |
| Demand Matching & Bundling | **Skor kecocokan multi-kriteria (rule-based) + Bundling Optimizer** | Buyer ajukan permintaan terstruktur (komoditas+volume+harga maks), dicocokkan ke produk lolos QC pakai skor tertimbang (fit volume 50% + grade QC 30% + urgensi expiry 20%). Gap volume otomatis dorong target Dynamic Bundling naik + notifikasi anggota terkait. *(Bukan cosine similarity/vector embedding — data komoditas terstruktur & kategorinya segelintir, jadi rule-based lebih efisien & lebih mudah dijelaskan.)* |
| Expiry Pricing             | **Rule-based + ML**                        | Diskon optimal: 7 hari → 10%, 3 hari → 25%, 1 hari → 50%                                                                                                                                                                              |

### Frontend

| Layer            | Teknologi                          | Fungsi                                |
| ---------------- | ---------------------------------- | ------------------------------------- |
| Framework        | **Next.js 14** (React)       | SSR, routing, web desktop-first       |
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

## Instalasi & Menjalankan Aplikasi

### Prasyarat

- Python 3.11+
- Node.js 18+ dan npm
- Docker Desktop (untuk PostgreSQL, Redis, RabbitMQ, Neo4j)

### 1. Jalankan services lokal

```bash
docker compose up -d
```

Ini menyalakan PostgreSQL (port 5434), Redis (6379), RabbitMQ (5672/15672), dan Neo4j (7474/7687) — lihat `docker-compose.yml` di root repo.

### 2. Setup & jalankan Backend (FastAPI)

```bash
cd backend
python -m venv venv
./venv/Scripts/activate        # Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # sesuaikan kalau port berbeda
python -m app.seed             # isi data demo (koperasi, anggota, produk)
uvicorn app.main:app --reload --port 8000
```

Backend berjalan di `http://127.0.0.1:8000`, dokumentasi API otomatis di `/docs`.

### 3. Setup & jalankan Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # sesuaikan NEXT_PUBLIC_API_URL ke port backend
npm run dev
```

Frontend berjalan di `http://localhost:3000`.

### Akun Demo (dari seed data)

| Role                                           | No. HP       | Password    |
| ---------------------------------------------- | ------------ | ----------- |
| Pengurus                                       | 081200000001 | password123 |
| Kasir                                          | 081200000002 | password123 |
| Pembeli                                        | 081200000003 | password123 |
| Pemkab                                         | 081200000004 | password123 |
| Anggota (Pak Darto — sudah divouch 2 anggota) | 081300000004 | password123 |

---

## Arsitektur Intelligence Engine

```
INPUT DATA
├── Histori simpanan anggota (PostgreSQL)
├── Riwayat pembayaran angsuran (PostgreSQL)
├── Aktivitas marketplace (PostgreSQL)
├── Harga pasar regional (external API + scraping)
└── Jaringan relasi & vouching antar anggota (Neo4j) — cold-start anggota baru
          │
          ▼
FEATURE ENGINEERING
├── Fan-in/fan-out transaksi
├── Ketepatan bayar (on-time rate)
├── Frekuensi transaksi 30/60/90 hari
├── Rasio simpanan vs pinjaman
├── Rating seller di marketplace
└── Graph centrality / skor tanggung renteng (Neo4j) — termasuk baseline anggota baru dari vouching
          │
          ▼
MODEL LAYER
├── Credit Scoring → XGBoost Classifier + Graph Centrality
│   └── Output: skor 0-100, risk_level (LOW/MED/HIGH)
├── Harga Pasar → Moving Average + seasonal adjustment
│   └── Output: harga rekomendasi per komoditas
├── Demand Forecast → Holt-Winters Exponential Smoothing (statsmodels)
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
Daftar (+ vouching anggota lain) → Verifikasi oleh Pengurus → Login
→ Ajukan Pinjaman → Sistem scoring otomatis → Approved/Rejected
→ Listing Produk di Marketplace → Dapat rekomendasi harga dari AI
→ Kasir/Pengurus verifikasi Grade A/B/C (QC) → Ajukan Dana Talangan (70% cair instan)
→ Produk masuk pool Dynamic Bundling → Order masuk dari kota → Kemas & kirim via kurir
→ Batch terjual → Sisa 30% + bagi hasil proporsional cair → Bayar angsuran pinjaman
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
Dana Talangan cair 70% instan (gak perlu balik ke tengkulak demi uang cepat)
        ↓
Dapat harga lebih baik (tanpa tengkulak) + sisa 30% cair saat batch terjual
        ↓
Lunasi pinjaman tepat waktu
        ↓
Data makin kaya → AI makin akurat (skor, forecast, potensi wilayah)
        ↓
Akses modal berikutnya lebih mudah & limit lebih besar
        ↓
[kembali ke atas — siklus terus berkembang]
```

Semakin banyak koperasi bergabung, semakin kuat jaringan dan semakin akurat intelligence engine-nya. Dana Talangan Panen Instant memutus alasan utama petani balik ke tengkulak (butuh uang instan), jadi flywheel ini gak gampang bocor di titik kritis itu.

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

## Keterbatasan & Roadmap yang Disadari

Beberapa gap ditemukan lewat review kritis terhadap REKA, tapi genuinely di luar scope yang bisa "dikodekan" saat ini — dicatat transparan di sini daripada berpura-pura sudah selesai:

- **Buyer trust/rating untuk koperasi baru** — sistem rating/reputasi **penuh** masih butuh alur Order/Checkout selesai transaksi dulu (rating baru bermakna kalau nempel ke transaksi yang benar-benar selesai). Untuk koperasi/anggota, cold-start trust sudah diselesaikan lewat vouching graph (lihat poin 4) — gap ini spesifik di sisi kepercayaan **buyer kota terhadap koperasi baru** yang belum punya riwayat transaksi sama sekali. **Mitigasi parsial sudah ada**: badge Transparansi Harga Pasar di halaman produk (bukan rating reputasi koperasi, tapi bukti obyektif kewajaran harga yang buyer bisa verifikasi sendiri tanpa perlu histori transaksi apa pun). Nama/identitas koperasi asal produk juga belum ditampilkan ke buyer — perbaikan murah kalau ada waktu lanjutan.
- **Last-mile logistik dari desa ke titik kurir** — kurir nasional (JNE/J&T/SiCepat) umumnya cuma menjangkau titik pickup di kecamatan/kota kabupaten, bukan sampai pelosok desa. Ini persoalan kemitraan operasional (mis. kerja sama dengan ojek desa/agen lokal), bukan sesuatu yang diselesaikan lewat kode aplikasi.
- **Kepatuhan regulasi pangan (PIRT/BPOM)** — klaim "koperasi sebagai quality assurance" (lihat fitur QC/Grading checkpoint) perlu legitimasi lebih dari fitur grading di aplikasi. Roadmap ke depan: dorong koperasi pilot mengurus sertifikasi dasar higienitas/PIRT untuk produk olahan, bukan diklaim sudah terpenuhi dari awal.
- **Cold chain/penyimpanan dingin tingkat desa** — Demand Forecast dan marketplace digital tidak bisa efektif kalau produk segar (sayur/telur) busuk sebelum sempat terjual ke buyer kota, apalagi dengan alur Dynamic Bundling yang butuh waktu kumpulkan volume dari beberapa anggota. Ini infrastruktur fisik (cold storage, kemasan berpendingin) yang di luar scope aplikasi software — diakui sebagai roadmap fase 2 (kemitraan penyedia cold chain), bukan sesuatu yang REKA klaim sudah selesaikan.
- **Regulasi credit scoring non-bank** — KSP baru lepas dari pengawasan OJK ke Kemenkop (POJK 47/2024), dan belum ada standar baku credit scoring non-bank secara nasional. Ini regulatory gray area yang disadari sebagai risiko, bukan sesuatu yang diklaim sudah "settled". Mitigasi: keputusan approval akhir pinjaman tetap di tangan Pengurus (human-in-the-loop) — skor Credit Scoring Hybrid REKA adalah alat bantu keputusan, bukan pengambil keputusan otomatis penuh.

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
Bulan 1: Core backend (simpan pinjam + auth + marketplace basic)
Bulan 2: Intelligence engine v1 (credit scoring hybrid individual+graph + harga pasar)
Bulan 3: Frontend mobile-first + integrasi kurir
Bulan 4: Smart Expiry + Demand Forecast + Demand Matching & Dynamic Bundling
Bulan 5: Pemkab dashboard + multi-tenant deployment
Bulan 6: Pilot 3 koperasi desa
```

---

## Kontribusi

Dibevelop untuk kompetisi **Kopdes Hackathon 2026**.
