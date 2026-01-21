from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time, timedelta
import models
import auth
from database import get_db

router = APIRouter(prefix='/availability', tags=['availability'])

class AvailableDayCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str

class AvailableDaysSet(BaseModel):
    days: List[AvailableDayCreate]

class BlockedDayCreate(BaseModel):
    professional_id: Optional[int] = None
    specialty_id: Optional[int] = None
    blocked_date: str
    reason: Optional[str] = None

@router.get('/professional/{professional_id}/days')
async def get_available_days(
    professional_id: int,
    db: Session = Depends(get_db)
):
    days = db.query(models.AvailableDay).filter(
        models.AvailableDay.professional_id == professional_id
    ).all()
    
    return [{
        'id': day.id,
        'professional_id': day.professional_id,
        'day_of_week': day.day_of_week,
        'start_time': day.start_time.isoformat()[:5],
        'end_time': day.end_time.isoformat()[:5]
    } for day in days]

@router.get('/professional/{professional_id}')
async def get_professional_availability(
    professional_id: int,
    db: Session = Depends(get_db)
):
    days = db.query(models.AvailableDay).filter(
        models.AvailableDay.professional_id == professional_id
    ).all()
    
    return [{
        'id': day.id,
        'professional_id': day.professional_id,
        'day_of_week': day.day_of_week,
        'start_time': day.start_time.isoformat()[:5],
        'end_time': day.end_time.isoformat()[:5],
        'created_at': day.created_at.isoformat()
    } for day in days]

@router.post('/professional/{professional_id}/days')
async def set_available_days(
    professional_id: int,
    request: AvailableDaysSet,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Remove existing days
    db.query(models.AvailableDay).filter(
        models.AvailableDay.professional_id == professional_id
    ).delete()
    
    # Add new days
    for day_data in request.days:
        start_time = datetime.strptime(day_data.start_time, '%H:%M').time()
        end_time = datetime.strptime(day_data.end_time, '%H:%M').time()
        
        new_day = models.AvailableDay(
            professional_id=professional_id,
            day_of_week=day_data.day_of_week,
            start_time=start_time,
            end_time=end_time
        )
        db.add(new_day)
    
    db.commit()
    
    return {'message': 'Dias disponíveis atualizados com sucesso'}

@router.get('/blocked')
async def get_blocked_days(
    professional_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.BlockedDay)
    
    if professional_id:
        query = query.filter(models.BlockedDay.professional_id == professional_id)
    if start_date:
        query = query.filter(models.BlockedDay.blocked_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(models.BlockedDay.blocked_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    blocked = query.all()
    
    result = []
    for block in blocked:
        prof_name = None
        if block.professional_id:
            prof = db.query(models.Professional).filter(models.Professional.id == block.professional_id).first()
            prof_name = prof.name if prof else None
        
        result.append({
            'id': block.id,
            'professional_id': block.professional_id,
            'specialty_id': block.specialty_id,
            'blocked_date': block.blocked_date.isoformat(),
            'reason': block.reason,
            'professional_name': prof_name,
            'created_at': block.created_at.isoformat()
        })
    
    return result

@router.post('/blocked')
async def block_day(
    request: BlockedDayCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    blocked_date = datetime.strptime(request.blocked_date, '%Y-%m-%d').date()
    
    new_block = models.BlockedDay(
        professional_id=request.professional_id,
        specialty_id=request.specialty_id,
        blocked_date=blocked_date,
        reason=request.reason
    )
    
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    
    return {'id': new_block.id, 'message': 'Dia bloqueado com sucesso'}

@router.delete('/blocked/{block_id}')
async def unblock_day(
    block_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    block = db.query(models.BlockedDay).filter(models.BlockedDay.id == block_id).first()
    
    if not block:
        raise HTTPException(status_code=404, detail='Bloqueio não encontrado')
    
    db.delete(block)
    db.commit()
    
    return {'message': 'Dia desbloqueado com sucesso'}

@router.get('/booked-slots')
async def get_booked_slots(
    professional_id: int = Query(...),
    date: str = Query(...),
    db: Session = Depends(get_db)
):
    appointment_date = datetime.strptime(date, '%Y-%m-%d').date()
    
    appointments = db.query(models.Appointment).filter(
        and_(
            models.Appointment.professional_id == professional_id,
            models.Appointment.appointment_date == appointment_date,
            models.Appointment.status != 'cancelled'
        )
    ).all()
    
    booked_slots = [apt.appointment_time.isoformat()[:5] for apt in appointments]
    
    return {'bookedSlots': booked_slots}

@router.get('/slots')
async def get_available_slots(
    professional_id: int = Query(...),
    date: str = Query(...),
    duration: int = Query(60),
    db: Session = Depends(get_db)
):
    appointment_date = datetime.strptime(date, '%Y-%m-%d')
    day_of_week = appointment_date.weekday()
    
    # Get available day config
    available_day = db.query(models.AvailableDay).filter(
        and_(
            models.AvailableDay.professional_id == professional_id,
            models.AvailableDay.day_of_week == day_of_week
        )
    ).first()
    
    if not available_day:
        return []
    
    # Get booked appointments
    appointments = db.query(models.Appointment).filter(
        and_(
            models.Appointment.professional_id == professional_id,
            models.Appointment.appointment_date == appointment_date.date(),
            models.Appointment.status != 'cancelled'
        )
    ).all()
    
    booked_times = [apt.appointment_time for apt in appointments]
    
    # Generate time slots
    slots = []
    current_time = datetime.combine(appointment_date.date(), available_day.start_time)
    end_time = datetime.combine(appointment_date.date(), available_day.end_time)
    
    while current_time < end_time:
        if current_time.time() not in booked_times:
            slots.append(current_time.strftime('%H:%M'))
        current_time += timedelta(minutes=duration)
    
    return slots