from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.db.session import get_db
from app.graph.neo4j_client import upsert_anggota_node, add_vouching_relation
from app.models.user import User, UserRole, AnggotaProfile, VerifikasiStatus
from app.schemas.auth import RegisterAnggotaRequest, LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/anggota", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_anggota(payload: RegisterAnggotaRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    # Fix Sybil/collusion risk (Fase 3F #1): voucher WAJIB anggota yang
    # benar-benar ada DAN sudah VERIFIED oleh Pengurus — bukan sekadar UUID
    # apapun. Tanpa ini, 2+ anggota cold-start (sama-sama belum diverifikasi)
    # bisa saling vouch berantai bikin cluster kepercayaan palsu yang
    # menaikkan skor_graph secara artifisial, padahal belum ada satu pun
    # manusia (Pengurus) yang benar-benar memverifikasi identitas mereka.
    if payload.direferensikan_oleh_id:
        voucher_profile = db.get(AnggotaProfile, payload.direferensikan_oleh_id)
        if voucher_profile is None:
            raise HTTPException(status_code=400, detail="Anggota referensi (voucher) tidak ditemukan")
        if voucher_profile.status_verifikasi != VerifikasiStatus.VERIFIED:
            raise HTTPException(
                status_code=400,
                detail="Anggota referensi (voucher) belum terverifikasi Pengurus — hanya anggota "
                "terverifikasi yang bisa mereferensikan/vouch anggota baru",
            )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=UserRole.ANGGOTA,
    )
    db.add(user)
    db.flush()

    profile = AnggotaProfile(
        user_id=user.id,
        koperasi_id=payload.koperasi_id,
        nik=payload.nik,
        jenis_usaha=payload.jenis_usaha,
        direferensikan_oleh_id=payload.direferensikan_oleh_id,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    # Cold-start graph: bikin node anggota baru + edge vouching kalau ada referensi.
    # Ini yang menggantikan "integrasi SIMKOPDES" — murni data internal.
    upsert_anggota_node(str(profile.id), user.full_name, str(profile.koperasi_id))
    if payload.direferensikan_oleh_id:
        add_vouching_relation(str(payload.direferensikan_oleh_id), str(profile.id))

    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, role=user.role)
