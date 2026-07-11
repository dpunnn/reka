from fastapi import APIRouter

from app.api.v1 import (
    auth, anggota, koperasi, marketplace, pinjaman, intelligence,
    simpanan, uploads, notifikasi, laporan, audit,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(anggota.router)
api_router.include_router(koperasi.router)
api_router.include_router(marketplace.router)
api_router.include_router(pinjaman.router)
api_router.include_router(intelligence.router)
api_router.include_router(simpanan.router)
api_router.include_router(uploads.router)
api_router.include_router(notifikasi.router)
api_router.include_router(laporan.router)
api_router.include_router(audit.router)
