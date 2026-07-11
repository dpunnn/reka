# Panduan Menjalankan REKA (untuk Juri)

Dokumen ini menjelaskan cara menjalankan REKA. Ada **2 opsi** — silakan pilih:

| Opsi | Untuk siapa | Waktu | Perlu install? |
|------|-------------|-------|----------------|
| **A. Demo online** (rekomendasi) | Ingin langsung menilai tanpa ribet | ± 1 menit | Tidak — cukup browser |
| **B. Jalankan lokal** | Ingin cek kode berjalan di mesin sendiri | ± 15 menit | Ya (Docker, Python, Node) |

---

## OPSI A — Demo Online (Paling Mudah, Tanpa Install)

Aplikasi sudah kami deploy. Cukup buka browser:

- **Aplikasi (Frontend):** https://reka-frontend.vercel.app
- **API (Backend):** https://backend-production-a0f1.up.railway.app/health → harus menampilkan `{"status":"ok","project":"REKA"}`

Login pakai salah satu **akun demo** di bawah (tabel di [bagian Akun Demo](#akun-demo)).

> Catatan: server demo memakai paket gratis, jadi request pertama setelah idle bisa lambat 5–15 detik (server "bangun" dulu). Setelah itu normal.

---

## OPSI B — Menjalankan di Komputer Sendiri

REKA butuh 4 layanan pendukung (PostgreSQL, Neo4j, Redis, RabbitMQ). Semuanya sudah
dibungkus dengan **Docker** supaya juri **tidak perlu install satu per satu** — cukup
satu perintah. Backend (Python) dan Frontend (Next.js) dijalankan terpisah.

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────────────┐
│  Frontend   │ →   │   Backend    │ →   │  Docker (4 layanan):       │
│  Next.js    │     │   FastAPI    │     │  PostgreSQL · Neo4j ·       │
│  :3000      │     │   :8010      │     │  Redis · RabbitMQ          │
└─────────────┘     └──────────────┘     └────────────────────────────┘
```

### 1. Prasyarat (install dulu sekali)

| Software | Versi | Link |
|----------|-------|------|
| **Docker Desktop** | terbaru | https://www.docker.com/products/docker-desktop/ |
| **Python** | 3.11 | https://www.python.org/downloads/ |
| **Node.js** | 18 atau 20 (LTS) | https://nodejs.org/ |

> **Windows:** pastikan Docker Desktop sudah **jalan** (ikon paus di taskbar hijau) sebelum lanjut.
> Semua perintah di bawah diketik di **PowerShell** (Windows) atau **Terminal** (Mac/Linux).

---

### 2. Nyalakan 4 layanan pendukung (Docker)

Dari folder utama proyek (`reka/`):

```powershell
docker compose up -d
```

Perintah ini mengunduh & menyalakan PostgreSQL, Neo4j, Redis, dan RabbitMQ sekaligus.
**Tunggu ± 30 detik** (Neo4j butuh waktu memuat plugin). Cek semua sudah `Up`:

```powershell
docker compose ps
```

Semua baris statusnya harus `Up` / `running`.

---

### 3. Jalankan Backend (FastAPI)

Buka **terminal baru**, masuk ke folder `backend/`:

```powershell
cd backend
```

**a. Buat & aktifkan virtual environment Python:**

```powershell
# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1
```
```bash
# Mac / Linux
python3 -m venv venv
source venv/bin/activate
```

> Kalau Windows menolak menjalankan script (`Activate.ps1`), jalankan sekali:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` lalu ulangi.

**b. Install dependencies:**

```powershell
pip install -r requirements.txt
```

**c. Siapkan file konfigurasi `.env`:**

```powershell
# Windows
copy .env.example .env
```
```bash
# Mac / Linux
cp .env.example .env
```
File `.env` bawaan sudah cocok dengan konfigurasi Docker di atas — **tidak perlu diubah**.

**d. Isi data contoh (seed):** — ini membuat akun demo, koperasi, produk, dan histori.

```powershell
python -m app.seed
```
Kalau berhasil, akan tampil daftar akun demo di terminal. (Jalankan **sekali saja**.)

**e. Nyalakan server backend di port 8010:**

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

Biarkan terminal ini terbuka. Cek berhasil: buka http://127.0.0.1:8010/health →
harus muncul `{"status":"ok","project":"REKA"}`.
Dokumentasi API interaktif tersedia di http://127.0.0.1:8010/docs.

---

### 4. Jalankan Frontend (Next.js)

Buka **terminal baru lagi**, masuk ke folder `frontend/`:

```powershell
cd frontend
```

**a. Siapkan konfigurasi:**

```powershell
# Windows
copy .env.local.example .env.local
```
```bash
# Mac / Linux
cp .env.local.example .env.local
```
Isinya sudah menunjuk ke backend lokal (`http://127.0.0.1:8010/api/v1`) — tidak perlu diubah.

**b. Install & jalankan:**

```powershell
npm install
npm run dev
```

Buka browser ke **http://localhost:3000** — aplikasi REKA siap dipakai.

---

## Akun Demo

Semua akun memakai password yang sama: **`password123`**.
Login memakai **nomor HP** (bukan email).

| Peran | Nomor HP (username) | Password | Untuk melihat |
|-------|---------------------|----------|---------------|
| **Pengurus Koperasi** | `081200000001` | `password123` | Approval pinjaman + graph tanggung renteng, QC/Grading, kelola bundling, laporan |
| **Kasir** | `081200000002` | `password123` | Catat angsuran & simpanan, QC/Grading, Ajudan Digital |
| **Pembeli Kota** | `081200000003` | `password123` | Marketplace, checkout, **Ajukan Permintaan Beli (Demand Matching)** |
| **Pemkab** | `081200000004` | `password123` | Dashboard monitoring wilayah, bundling lintas koperasi, audit trail |
| **Anggota (petani)** | `081300000001` | `password123` | Toko Saya, ajukan pinjaman + skor, dana talangan panen |

> Ada 15 akun anggota: `081300000001` sampai `081300000015` (semua `password123`).
> Untuk mencoba **daftar anggota baru**, gunakan menu "Daftar" di halaman login —
> pendaftaran akan menunggu verifikasi Pengurus (login sebagai Pengurus untuk menyetujui).

---

## Alur Demo yang Disarankan (5 menit)

1. **Login Anggota** (`081300000001`) → menu *Simpan Pinjam* → lihat **skor kelayakan hybrid** (individual + jaringan) → ajukan pinjaman.
2. **Login Pengurus** (`081200000001`) → menu *Pinjaman* → lihat **visualisasi graph tanggung renteng** → setujui/tolak.
3. **Login Kasir** (`081200000002`) → menu *QC / Grading* → beri grade produk (A/B/C) supaya masuk pool bundling.
4. **Login Pembeli** (`081200000003`) → menu *Ajukan Permintaan* → ketik komoditas (mis. `cabai merah`, jumlah 50) → lihat **Demand Matching** mencocokkan otomatis ke stok koperasi.
5. **Login Pemkab** (`081200000004`) → dashboard monitoring + **audit trail** lintas koperasi.

---

## Menghentikan / Membersihkan

```powershell
# Hentikan backend & frontend: tekan Ctrl + C di masing-masing terminal.

# Matikan layanan Docker (data tetap tersimpan):
docker compose down

# Matikan + HAPUS semua data (kalau ingin mulai bersih dari nol):
docker compose down -v
```

Kalau habis `down -v`, ulangi langkah **seed** (`python -m app.seed`) saat menyalakan lagi.

---

## Peta Port (kalau perlu cek/terjadi bentrok)

| Layanan | Alamat lokal |
|---------|--------------|
| Frontend (aplikasi) | http://localhost:3000 |
| Backend API | http://127.0.0.1:8010 (dokumentasi: `/docs`) |
| PostgreSQL | `localhost:5434` |
| Neo4j Browser | http://localhost:7474 (user `neo4j`, pass `reka_dev_password`) |
| Neo4j Bolt | `localhost:7687` |
| Redis | `localhost:6379` |
| RabbitMQ | `localhost:5672` |
| RabbitMQ Dashboard | http://localhost:15672 (user `reka`, pass `reka_dev_password`) |

---

## Troubleshooting

**"docker: command not found" / perintah docker gagal**
Docker Desktop belum terinstall atau belum jalan. Buka Docker Desktop dulu, tunggu
sampai statusnya "Running", baru ulangi `docker compose up -d`.

**Port sudah dipakai (`address already in use` / `port is already allocated`)**
Ada aplikasi lain memakai port yang sama. Tutup aplikasi itu, atau matikan proses:
```powershell
# Windows — cari & matikan proses di port tertentu (contoh port 8010)
netstat -ano | findstr :8010
taskkill /F /PID <nomor_PID_dari_baris_di_atas>
```

**Backend error saat `python -m app.seed` — tidak bisa konek database / Neo4j**
Layanan Docker belum siap. Pastikan `docker compose ps` semuanya `Up`, tunggu
± 30 detik (khususnya Neo4j), lalu ulangi seed.

**Frontend tampil tapi login/menu gagal (data tidak muncul / error jaringan)**
Backend belum jalan atau di port yang salah. Pastikan backend hidup di **port 8010**
(cek http://127.0.0.1:8010/health) dan file `frontend/.env.local` berisi
`NEXT_PUBLIC_API_URL=http://127.0.0.1:8010/api/v1`. Setelah mengubah `.env.local`,
hentikan lalu jalankan ulang `npm run dev`.

**Windows menolak `Activate.ps1` (execution policy)**
Jalankan di terminal yang sama: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`,
lalu ulangi aktivasi venv.

**`pip install` gagal di baris tertentu**
Pastikan memakai Python **3.11** (`python --version`). Versi lain bisa bikin sebagian
paket ML gagal build.

**Ingin mulai benar-benar dari nol**
`docker compose down -v` → `docker compose up -d` → tunggu 30 detik → seed ulang.

---

## Ringkasan Teknologi

- **Backend:** FastAPI (Python 3.11), SQLAlchemy, XGBoost + scikit-learn (credit scoring),
  Holt-Winters/statsmodels (demand forecast), Neo4j (graph tanggung renteng).
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, liquid-glass UI.
- **Infra:** PostgreSQL, Neo4j, Redis, RabbitMQ (semua via Docker Compose).

Detail arsitektur & fitur lengkap ada di [`README.md`](./README.md).
