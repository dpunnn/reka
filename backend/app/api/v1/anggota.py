import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole, AnggotaProfile, VerifikasiStatus

router = APIRouter(prefix="/anggota", tags=["anggota"])


@router.get("/direktori")
def direktori_anggota_terverifikasi(db: Session = Depends(get_db)):
    """Daftar anggota terverifikasi untuk dipilih sebagai referral/voucher
    saat pendaftaran anggota baru (cold-start via vouching, bukan SIMKOPDES)."""
    profiles = (
        db.query(AnggotaProfile)
        .join(User, AnggotaProfile.user_id == User.id)
        .filter(AnggotaProfile.status_verifikasi == VerifikasiStatus.VERIFIED)
        .all()
    )
    return [{"id": p.id, "nama": p.user.full_name, "koperasi_id": p.koperasi_id} for p in profiles]


@router.get("/pending-verifikasi")
def list_pending_verifikasi(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.PENGURUS)),
):
    profiles = (
        db.query(AnggotaProfile).filter(AnggotaProfile.status_verifikasi == VerifikasiStatus.PENDING).all()
    )
    return profiles


@router.post("/{anggota_id}/verifikasi")
def verifikasi_anggota(
    anggota_id: uuid.UUID,
    disetujui: bool,
    db: Session = Depends(get_db),
    pengurus: User = Depends(require_role(UserRole.PENGURUS)),
):
    profile = db.get(AnggotaProfile, anggota_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")

    profile.status_verifikasi = VerifikasiStatus.VERIFIED if disetujui else VerifikasiStatus.REJECTED
    profile.verified_by_id = pengurus.id
    db.commit()
    return {"status": profile.status_verifikasi}


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.ANGGOTA)),
):
    profile = db.query(AnggotaProfile).filter(AnggotaProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil anggota tidak ditemukan")
    return profile
