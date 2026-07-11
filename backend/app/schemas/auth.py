import uuid

from pydantic import BaseModel, Field

from app.models.user import UserRole


class RegisterAnggotaRequest(BaseModel):
    full_name: str
    phone: str
    email: str | None = None
    password: str = Field(min_length=6)
    nik: str
    koperasi_id: uuid.UUID
    jenis_usaha: str | None = None
    # Cold-start via vouching/referral — bukan integrasi SIMKOPDES.
    # Anggota baru wajib direferensikan minimal 1 anggota aktif yang sudah ada.
    direferensikan_oleh_id: uuid.UUID | None = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole


class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    email: str | None
    role: UserRole

    class Config:
        from_attributes = True
