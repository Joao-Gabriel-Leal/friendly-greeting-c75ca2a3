from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import models
import auth
from database import get_db

router = APIRouter(prefix='/auth', tags=['auth'])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    setor: str

class UpdatePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

@router.post('/login')
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user or not auth.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Email ou senha incorretos'
        )
    
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    
    if profile and profile.blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Conta bloqueada. Contate os administradores.'
        )
    
    access_token = auth.create_access_token(
        data={'sub': user.id, 'email': user.email, 'role': user.role}
    )
    
    return {
        'token': access_token,
        'user': {'id': user.id, 'email': user.email},
        'profile': {
            'id': profile.id if profile else None,
            'user_id': user.id,
            'name': profile.name if profile else '',
            'email': profile.email if profile else user.email,
            'phone': profile.phone if profile else None,
            'cpf': profile.cpf if profile else None,
            'setor': profile.setor if profile else None,
            'suspended_until': profile.suspended_until.isoformat() if profile and profile.suspended_until else None,
            'blocked': profile.blocked if profile else False,
            'must_change_password': profile.must_change_password if profile else False,
            'created_at': profile.created_at.isoformat() if profile else None,
            'updated_at': profile.updated_at.isoformat() if profile else None,
        },
        'role': user.role
    }

@router.post('/register')
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Este email já está cadastrado'
        )
    
    hashed_password = auth.get_password_hash(request.password)
    
    new_user = models.User(
        email=request.email,
        password_hash=hashed_password,
        role='user'
    )
    db.add(new_user)
    db.flush()
    
    new_profile = models.Profile(
        user_id=new_user.id,
        name=request.name,
        email=request.email,
        setor=request.setor
    )
    db.add(new_profile)
    db.commit()
    
    return {'message': 'Usuário cadastrado com sucesso'}

@router.get('/me')
async def get_current_user_info(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    
    return {
        'user': {'id': current_user.id, 'email': current_user.email},
        'profile': {
            'id': profile.id if profile else None,
            'user_id': current_user.id,
            'name': profile.name if profile else '',
            'email': profile.email if profile else current_user.email,
            'phone': profile.phone if profile else None,
            'cpf': profile.cpf if profile else None,
            'setor': profile.setor if profile else None,
            'suspended_until': profile.suspended_until.isoformat() if profile and profile.suspended_until else None,
            'blocked': profile.blocked if profile else False,
            'must_change_password': profile.must_change_password if profile else False,
            'created_at': profile.created_at.isoformat() if profile else None,
            'updated_at': profile.updated_at.isoformat() if profile else None,
        },
        'role': current_user.role
    }

@router.post('/update-password')
async def update_password(
    request: UpdatePasswordRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not auth.verify_password(request.currentPassword, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Senha atual incorreta'
        )
    
    current_user.password_hash = auth.get_password_hash(request.newPassword)
    
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if profile:
        profile.must_change_password = False
    
    db.commit()
    
    return {'message': 'Senha atualizada com sucesso'}