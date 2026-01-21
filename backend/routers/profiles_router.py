from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import models
import auth
from database import get_db

router = APIRouter(prefix='/profiles', tags=['profiles'])

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    cpf: Optional[str] = None
    setor: Optional[str] = None
    blocked: Optional[bool] = None
    suspended_until: Optional[str] = None
    must_change_password: Optional[bool] = None

class BlockUserRequest(BaseModel):
    blocked: bool

class SuspendUserRequest(BaseModel):
    suspended_until: Optional[str] = None

@router.get('')
async def list_profiles(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profiles = db.query(models.Profile).all()
    
    result = []
    for profile in profiles:
        user = db.query(models.User).filter(models.User.id == profile.user_id).first()
        result.append({
            'id': profile.id,
            'user_id': profile.user_id,
            'name': profile.name,
            'email': profile.email,
            'phone': profile.phone,
            'cpf': profile.cpf,
            'setor': profile.setor,
            'suspended_until': profile.suspended_until.isoformat() if profile.suspended_until else None,
            'blocked': profile.blocked,
            'must_change_password': profile.must_change_password,
            'role': user.role if user else 'user',
            'created_at': profile.created_at.isoformat(),
            'updated_at': profile.updated_at.isoformat()
        })
    
    return result

@router.get('/{profile_id}')
async def get_profile(
    profile_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail='Perfil não encontrado')
    
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()
    
    return {
        'id': profile.id,
        'user_id': profile.user_id,
        'name': profile.name,
        'email': profile.email,
        'phone': profile.phone,
        'cpf': profile.cpf,
        'setor': profile.setor,
        'suspended_until': profile.suspended_until.isoformat() if profile.suspended_until else None,
        'blocked': profile.blocked,
        'must_change_password': profile.must_change_password,
        'role': user.role if user else 'user',
        'created_at': profile.created_at.isoformat(),
        'updated_at': profile.updated_at.isoformat()
    }

@router.get('/user/{user_id}')
async def get_profile_by_user(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail='Perfil não encontrado')
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    return {
        'id': profile.id,
        'user_id': profile.user_id,
        'name': profile.name,
        'email': profile.email,
        'phone': profile.phone,
        'cpf': profile.cpf,
        'setor': profile.setor,
        'suspended_until': profile.suspended_until.isoformat() if profile.suspended_until else None,
        'blocked': profile.blocked,
        'must_change_password': profile.must_change_password,
        'role': user.role if user else 'user'
    }

@router.put('/{profile_id}')
async def update_profile(
    profile_id: int,
    request: ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail='Perfil não encontrado')
    
    if request.name is not None:
        profile.name = request.name
    if request.phone is not None:
        profile.phone = request.phone
    if request.cpf is not None:
        profile.cpf = request.cpf
    if request.setor is not None:
        profile.setor = request.setor
    if request.blocked is not None:
        profile.blocked = request.blocked
    if request.suspended_until is not None:
        if request.suspended_until:
            profile.suspended_until = datetime.fromisoformat(request.suspended_until)
        else:
            profile.suspended_until = None
    if request.must_change_password is not None:
        profile.must_change_password = request.must_change_password
    
    db.commit()
    
    return {'message': 'Perfil atualizado com sucesso'}

@router.post('/{user_id}/block')
async def block_user(
    user_id: int,
    request: BlockUserRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail='Perfil não encontrado')
    
    profile.blocked = request.blocked
    db.commit()
    
    return {'message': 'Status de bloqueio atualizado com sucesso'}

@router.post('/{user_id}/suspend')
async def suspend_user(
    user_id: int,
    request: SuspendUserRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail='Perfil não encontrado')
    
    if request.suspended_until:
        profile.suspended_until = datetime.fromisoformat(request.suspended_until)
    else:
        profile.suspended_until = None
    
    db.commit()
    
    return {'message': 'Status de suspensão atualizado com sucesso'}