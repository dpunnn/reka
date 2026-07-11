from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.koperasi import Koperasi

router = APIRouter(prefix="/koperasi", tags=["koperasi"])


class KoperasiCreateRequest(BaseModel):
    nama: str
    kabupaten: str
    provinsi: str
    alamat: str | None = None
    sektor_usaha: str | None = None


@router.get("")
def list_koperasi(db: Session = Depends(get_db)):
    return db.query(Koperasi).all()


@router.post("", status_code=201)
def create_koperasi(payload: KoperasiCreateRequest, db: Session = Depends(get_db)):
    koperasi = Koperasi(**payload.model_dump())
    db.add(koperasi)
    db.commit()
    db.refresh(koperasi)
    return koperasi
