from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import models
import auth
from database import get_db

router = APIRouter(prefix='/professionals', tags=['professionals'])

class ProfessionalCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialties: Optional[List[int]] = None

class ProfessionalUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None
    specialties: Optional[List[int]] = None

@router.get('')
async def list_professionals(
    active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Professional)
    
    if active is not None:
        query = query.filter(models.Professional.active == active)
    
    professionals = query.all()
    
    result = []
    for prof in professionals:
        specialty_ids = [spec.id for spec in prof.specialties]
        result.append({
            'id': prof.id,
            'user_id': prof.user_id,
            'name': prof.name,
            'email': prof.email,
            'phone': prof.phone,
            'active': prof.active,
            'specialties': specialty_ids,
            'created_at': prof.created_at.isoformat(),
            'updated_at': prof.updated_at.isoformat()
        })
    
    return result

@router.get('/{professional_id}')
async def get_professional(
    professional_id: int,
    db: Session = Depends(get_db)
):
    prof = db.query(models.Professional).filter(models.Professional.id == professional_id).first()
    
    if not prof:
        raise HTTPException(status_code=404, detail='Profissional não encontrado')
    
    specialty_ids = [spec.id for spec in prof.specialties]
    
    return {
        'id': prof.id,
        'user_id': prof.user_id,
        'name': prof.name,
        'email': prof.email,
        'phone': prof.phone,
        'active': prof.active,
        'specialties': specialty_ids,
        'created_at': prof.created_at.isoformat(),
        'updated_at': prof.updated_at.isoformat()
    }

@router.get('/user/{user_id}')
async def get_professional_by_user(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    prof = db.query(models.Professional).filter(models.Professional.user_id == user_id).first()
    
    if not prof:
        raise HTTPException(status_code=404, detail='Profissional não encontrado')
    
    specialty_ids = [spec.id for spec in prof.specialties]
    
    return {
        'id': prof.id,
        'user_id': prof.user_id,
        'name': prof.name,
        'email': prof.email,
        'phone': prof.phone,
        'active': prof.active,
        'specialties': specialty_ids
    }

@router.post('')
async def create_professional(
    request: ProfessionalCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_prof = models.Professional(
        name=request.name,
        email=request.email,
        phone=request.phone
    )
    
    db.add(new_prof)
    db.flush()
    
    if request.specialties:
        for spec_id in request.specialties:
            specialty = db.query(models.Specialty).filter(models.Specialty.id == spec_id).first()
            if specialty:
                new_prof.specialties.append(specialty)
    
    db.commit()
    db.refresh(new_prof)
    
    return {'id': new_prof.id, 'message': 'Profissional criado com sucesso'}

@router.put('/{professional_id}')
async def update_professional(
    professional_id: int,
    request: ProfessionalUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    prof = db.query(models.Professional).filter(models.Professional.id == professional_id).first()
    
    if not prof:
        raise HTTPException(status_code=404, detail='Profissional não encontrado')
    
    if request.name is not None:
        prof.name = request.name
    if request.email is not None:
        prof.email = request.email
    if request.phone is not None:
        prof.phone = request.phone
    if request.active is not None:
        prof.active = request.active
    
    if request.specialties is not None:
        prof.specialties.clear()
        for spec_id in request.specialties:
            specialty = db.query(models.Specialty).filter(models.Specialty.id == spec_id).first()
            if specialty:
                prof.specialties.append(specialty)
    
    db.commit()
    
    return {'message': 'Profissional atualizado com sucesso'}

@router.delete('/{professional_id}')
async def delete_professional(
    professional_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    prof = db.query(models.Professional).filter(models.Professional.id == professional_id).first()
    
    if not prof:
        raise HTTPException(status_code=404, detail='Profissional não encontrado')
    
    db.delete(prof)
    db.commit()
    
    return {'message': 'Profissional deletado com sucesso'}

@router.get('/by-specialty/{specialty_id}')
async def get_professionals_by_specialty(
    specialty_id: int,
    db: Session = Depends(get_db)
):
    specialty = db.query(models.Specialty).filter(models.Specialty.id == specialty_id).first()
    
    if not specialty:
        raise HTTPException(status_code=404, detail='Especialidade não encontrada')
    
    result = []
    for prof in specialty.professionals:
        if prof.active:
            result.append({
                'id': prof.id,
                'name': prof.name,
                'email': prof.email,
                'phone': prof.phone,
                'active': prof.active
            })
    
    return result