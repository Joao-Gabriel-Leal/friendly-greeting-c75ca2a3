from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import models
import auth
from database import get_db

router = APIRouter(prefix='/specialties', tags=['specialties'])

class SpecialtyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = 60

class SpecialtyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    active: Optional[bool] = None

@router.get('')
async def list_specialties(
    active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Specialty)
    
    if active is not None:
        query = query.filter(models.Specialty.active == active)
    
    specialties = query.all()
    
    return [{
        'id': spec.id,
        'name': spec.name,
        'description': spec.description,
        'duration_minutes': spec.duration_minutes,
        'active': spec.active,
        'created_at': spec.created_at.isoformat(),
        'updated_at': spec.updated_at.isoformat()
    } for spec in specialties]

@router.get('/{specialty_id}')
async def get_specialty(
    specialty_id: int,
    db: Session = Depends(get_db)
):
    spec = db.query(models.Specialty).filter(models.Specialty.id == specialty_id).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail='Especialidade não encontrada')
    
    return {
        'id': spec.id,
        'name': spec.name,
        'description': spec.description,
        'duration_minutes': spec.duration_minutes,
        'active': spec.active,
        'created_at': spec.created_at.isoformat(),
        'updated_at': spec.updated_at.isoformat()
    }

@router.post('')
async def create_specialty(
    request: SpecialtyCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Specialty).filter(models.Specialty.name == request.name).first()
    if existing:
        raise HTTPException(status_code=400, detail='Especialidade já existe')
    
    new_spec = models.Specialty(
        name=request.name,
        description=request.description,
        duration_minutes=request.duration_minutes
    )
    
    db.add(new_spec)
    db.commit()
    db.refresh(new_spec)
    
    return {'id': new_spec.id, 'message': 'Especialidade criada com sucesso'}

@router.put('/{specialty_id}')
async def update_specialty(
    specialty_id: int,
    request: SpecialtyUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    spec = db.query(models.Specialty).filter(models.Specialty.id == specialty_id).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail='Especialidade não encontrada')
    
    if request.name is not None:
        spec.name = request.name
    if request.description is not None:
        spec.description = request.description
    if request.duration_minutes is not None:
        spec.duration_minutes = request.duration_minutes
    if request.active is not None:
        spec.active = request.active
    
    db.commit()
    
    return {'message': 'Especialidade atualizada com sucesso'}

@router.delete('/{specialty_id}')
async def delete_specialty(
    specialty_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    spec = db.query(models.Specialty).filter(models.Specialty.id == specialty_id).first()
    
    if not spec:
        raise HTTPException(status_code=404, detail='Especialidade não encontrada')
    
    db.delete(spec)
    db.commit()
    
    return {'message': 'Especialidade deletada com sucesso'}