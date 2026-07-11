import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models.pinjaman import Simpanan, JenisSimpanan
from app.models.user import User, UserRole, AnggotaProfile
from app.schemas.simpanan import SimpananCreateRequest, SimpananOut, SaldoSimpananOut

router = APIRouter(prefix="/simpanan", tags=["simpanan"])


def _hitung_saldo(db: Session, anggota_id: uuid.UUID) -> float:
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
    return float(setor) - float(tarik)


@router.post("", response_model=SimpananOut, status_code=201)
def catat_simpanan(
    payload: SimpananCreateRequest,
    db: Session = Depends(get_db),
    kasir: User = Depends(require_role(UserRole.KASIR, UserRole.PENGURUS)),
):
    profile = db.get(AnggotaProfile, payload.anggota_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")

    if payload.jenis == JenisSimpanan.TARIK:
        saldo = _hitung_saldo(db, payload.anggota_id)
        if payload.nominal > saldo:
            raise HTTPException(status_code=400, detail=f"Saldo tidak cukup (saldo saat ini: Rp {saldo:,.0f})")

    simpanan = Simpanan(
        anggota_id=payload.anggota_id,
        jenis=payload.jenis,
        nominal=payload.nominal,
        dicatat_oleh_kasir_id=kasir.id,
    )
    db.add(simpanan)
    db.commit()
    db.refresh(simpanan)
    return simpanan


@router.get("/saya", response_model=list[SimpananOut])
def riwayat_simpanan_saya(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")
    return db.query(Simpanan).filter(Simpanan.anggota_id == profile.id).order_by(Simpanan.created_at.desc()).all()


@router.get("/anggota/{anggota_id}", response_model=list[SimpananOut])
def riwayat_simpanan_anggota(
    anggota_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.KASIR, UserRole.PENGURUS)),
):
    return db.query(Simpanan).filter(Simpanan.anggota_id == anggota_id).order_by(Simpanan.created_at.desc()).all()


@router.get("/saldo/saya", response_model=SaldoSimpananOut)
def saldo_saya(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")
    return SaldoSimpananOut(anggota_id=profile.id, saldo=_hitung_saldo(db, profile.id))


@router.get("/saldo/{anggota_id}", response_model=SaldoSimpananOut)
def saldo_anggota(
    anggota_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.KASIR, UserRole.PENGURUS)),
):
    return SaldoSimpananOut(anggota_id=anggota_id, saldo=_hitung_saldo(db, anggota_id))
