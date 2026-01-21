from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
import models
import auth
from database import get_db
import json

router = APIRouter(prefix='/settings', tags=['settings'])

class SettingValue(BaseModel):
    value: Any

@router.get('')
async def get_all_settings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(models.SystemSetting).all()
    
    result = []
    for setting in settings:
        try:
            value = json.loads(setting.value) if setting.value else None
        except:
            value = setting.value
        
        result.append({
            'key': setting.key,
            'value': value,
            'created_at': setting.created_at.isoformat(),
            'updated_at': setting.updated_at.isoformat()
        })
    
    return result

@router.get('/{key}')
async def get_setting(
    key: str,
    db: Session = Depends(get_db)
):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    
    if not setting:
        return {'key': key, 'value': None}
    
    try:
        value = json.loads(setting.value) if setting.value else None
    except:
        value = setting.value
    
    return {
        'key': setting.key,
        'value': value
    }

@router.put('/{key}')
async def set_setting(
    key: str,
    request: SettingValue,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    
    value_str = json.dumps(request.value) if not isinstance(request.value, str) else request.value
    
    if setting:
        setting.value = value_str
    else:
        setting = models.SystemSetting(key=key, value=value_str)
        db.add(setting)
    
    db.commit()
    
    return {'message': 'Configuração atualizada com sucesso'}