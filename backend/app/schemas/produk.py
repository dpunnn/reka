import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, computed_field

from app.models.produk import ProdukStatus

GRADE_VALID = ("A", "B", "C")

# Kategori yang dianggap "perishable" untuk Rute Nilai Tambah (Fase 3F #6) —
# konsisten dengan kategori kasar yang sudah dipakai di app/seed.py
# (kategori="Sayur" untuk komoditas cepat busuk seperti cabai)
KATEGORI_PERISHABLE = {"sayur"}

OPSI_NILAI_TAMBAH_PERISHABLE = [
    "UMKM Pengolah Saus/Sambal",
    "Pakan Ternak",
    "Kompos/Pupuk Organik",
]


def hitung_opsi_nilai_tambah(kategori: str, tanggal_kadaluarsa: date | None) -> list[str] | None:
    """Rute Nilai Tambah — produk perishable yang mendekati expired KRITIS
    (H-1 atau sudah lewat) diarahkan ke opsi B2B pengolahan, bukan cuma
    didiskon ke konsumen retail yang gak akan beli sayur nyaris busuk.
    Jawab TOR challenge question #4 "meningkatkan nilai tambah produk desa"
    — dihitung dinamis dari tanggal_kadaluarsa saat response dibentuk (BUKAN
    disimpan statis di DB), supaya selalu akurat terhadap tanggal hari ini."""
    if not tanggal_kadaluarsa or kategori.lower().strip() not in KATEGORI_PERISHABLE:
        return None
    sisa_hari = (tanggal_kadaluarsa - date.today()).days
    if sisa_hari > 1:
        return None
    return OPSI_NILAI_TAMBAH_PERISHABLE


class ProdukCreateRequest(BaseModel):
    nama: str
    kategori: str
    harga: float
    satuan: str = "kg"
    stok: float
    tanggal_produksi: date | None = None
    tanggal_kadaluarsa: date | None = None
    foto_url: str | None = None


class ProdukOut(BaseModel):
    id: uuid.UUID
    nama: str
    kategori: str
    harga: float
    satuan: str
    stok: float
    status: ProdukStatus
    harga_rekomendasi_ai: float | None
    tanggal_kadaluarsa: date | None
    foto_url: str | None
    grade: str | None

    class Config:
        from_attributes = True

    @computed_field
    @property
    def opsi_nilai_tambah(self) -> list[str] | None:
        return hitung_opsi_nilai_tambah(self.kategori, self.tanggal_kadaluarsa)

    @computed_field
    @property
    def lolos_qc(self) -> bool:
        """grade is not None == sudah digrading Kasir/Pengurus == boleh
        masuk pool Dynamic Bundling (Fase 3F #2)."""
        return self.grade is not None


class GradeProdukRequest(BaseModel):
    grade: Literal["A", "B", "C"]


class RekomendasiHargaOut(BaseModel):
    komoditas: str
    harga_rekomendasi: float
    sumber: str  # "bapanas_api" (data riil) atau "fallback_simulasi"
