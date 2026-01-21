from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import models
import auth
from database import get_db

router = APIRouter(prefix='/specialty-blocks', tags=['specialty-blocks'])

class SpecialtyBlockCreate(BaseModel):
    user_id: int
    specialty_id: int
    blocked_until: Optional[str] = None
    reason: Optional[str] = None

@router.get('/user/{user_id}')
async def get_user_specialty_blocks(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    blocks = db.query(models.SpecialtyBlock).filter(
        models.SpecialtyBlock.user_id == user_id
    ).all()
    
    result = []
    for block in blocks:
        specialty = db.query(models.Specialty).filter(models.Specialty.id == block.specialty_id).first()
        result.append({
            'id': block.id,
            'user_id': block.user_id,
            'specialty_id': block.specialty_id,
            'specialty_name': specialty.name if specialty else '',
            'blocked_until': block.blocked_until.isoformat() if block.blocked_until else None,
            'reason': block.reason,
            'created_at': block.created_at.isoformat()
        })
    
    return result

@router.post('')
async def create_specialty_block(
    request: SpecialtyBlockCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    blocked_until = None
    if request.blocked_until:
        blocked_until = datetime.fromisoformat(request.blocked_until)
    
    new_block = models.SpecialtyBlock(
        user_id=request.user_id,
        specialty_id=request.specialty_id,
        blocked_until=blocked_until,
        reason=request.reason
    )
    
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    
    return {'id': new_block.id, 'message': 'Bloqueio de especialidade criado com sucesso'}

@router.delete('/{block_id}')
async def delete_specialty_block(
    block_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    block = db.query(models.SpecialtyBlock).filter(models.SpecialtyBlock.id == block_id).first()
    
    if not block:
        raise HTTPException(status_code=404, detail='Bloqueio não encontrado')
    
    db.delete(block)
    db.commit()
    
    return {'message': 'Bloqueio de especialidade removido com sucesso'}