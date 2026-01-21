from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
import models
import auth
from database import get_db

router = APIRouter(prefix='/appointments', tags=['appointments'])

class AppointmentCreate(BaseModel):
    user_id: int
    professional_id: int
    specialty_id: int
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    professional_confirmed: Optional[bool] = None
    user_confirmed: Optional[bool] = None

@router.get('')
async def list_appointments(
    status: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    professional_id: Optional[int] = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Appointment)
    
    if status:
        query = query.filter(models.Appointment.status == status)
    if date:
        query = query.filter(models.Appointment.appointment_date == datetime.strptime(date, '%Y-%m-%d').date())
    if professional_id:
        query = query.filter(models.Appointment.professional_id == professional_id)
    
    appointments = query.all()
    
    result = []
    for apt in appointments:
        user = db.query(models.User).filter(models.User.id == apt.user_id).first()
        profile = db.query(models.Profile).filter(models.Profile.user_id == apt.user_id).first()
        professional = db.query(models.Professional).filter(models.Professional.id == apt.professional_id).first()
        specialty = db.query(models.Specialty).filter(models.Specialty.id == apt.specialty_id).first()
        
        result.append({
            'id': apt.id,
            'user_id': apt.user_id,
            'professional_id': apt.professional_id,
            'specialty_id': apt.specialty_id,
            'appointment_date': apt.appointment_date.isoformat(),
            'appointment_time': apt.appointment_time.isoformat(),
            'status': apt.status,
            'notes': apt.notes,
            'professional_confirmed': apt.professional_confirmed,
            'user_confirmed': apt.user_confirmed,
            'created_at': apt.created_at.isoformat(),
            'user_name': profile.name if profile else user.email,
            'professional_name': professional.name if professional else '',
            'specialty_name': specialty.name if specialty else ''
        })
    
    return result

@router.get('/user/{user_id}')
async def get_user_appointments(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointments = db.query(models.Appointment).filter(models.Appointment.user_id == user_id).all()
    
    result = []
    for apt in appointments:
        professional = db.query(models.Professional).filter(models.Professional.id == apt.professional_id).first()
        specialty = db.query(models.Specialty).filter(models.Specialty.id == apt.specialty_id).first()
        
        result.append({
            'id': apt.id,
            'user_id': apt.user_id,
            'professional_id': apt.professional_id,
            'specialty_id': apt.specialty_id,
            'appointment_date': apt.appointment_date.isoformat(),
            'appointment_time': apt.appointment_time.isoformat(),
            'status': apt.status,
            'notes': apt.notes,
            'professional_confirmed': apt.professional_confirmed,
            'user_confirmed': apt.user_confirmed,
            'created_at': apt.created_at.isoformat(),
            'professional_name': professional.name if professional else '',
            'specialty_name': specialty.name if specialty else ''
        })
    
    return result

@router.get('/professional/{professional_id}')
async def get_professional_appointments(
    professional_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointments = db.query(models.Appointment).filter(models.Appointment.professional_id == professional_id).all()
    
    result = []
    for apt in appointments:
        user = db.query(models.User).filter(models.User.id == apt.user_id).first()
        profile = db.query(models.Profile).filter(models.Profile.user_id == apt.user_id).first()
        specialty = db.query(models.Specialty).filter(models.Specialty.id == apt.specialty_id).first()
        
        result.append({
            'id': apt.id,
            'user_id': apt.user_id,
            'professional_id': apt.professional_id,
            'specialty_id': apt.specialty_id,
            'appointment_date': apt.appointment_date.isoformat(),
            'appointment_time': apt.appointment_time.isoformat(),
            'status': apt.status,
            'notes': apt.notes,
            'professional_confirmed': apt.professional_confirmed,
            'user_confirmed': apt.user_confirmed,
            'created_at': apt.created_at.isoformat(),
            'user_name': profile.name if profile else user.email,
            'specialty_name': specialty.name if specialty else ''
        })
    
    return result

@router.get('/check-existing')
async def check_existing_appointments(
    user_id: int = Query(...),
    specialty_id: int = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    start = datetime.strptime(start_date, '%Y-%m-%d').date()
    end = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    appointments = db.query(models.Appointment).filter(
        and_(
            models.Appointment.user_id == user_id,
            models.Appointment.specialty_id == specialty_id,
            models.Appointment.appointment_date >= start,
            models.Appointment.appointment_date <= end,
            models.Appointment.status != 'cancelled'
        )
    ).all()
    
    return [{
        'id': apt.id,
        'appointment_date': apt.appointment_date.isoformat(),
        'appointment_time': apt.appointment_time.isoformat(),
        'status': apt.status
    } for apt in appointments]

@router.post('')
async def create_appointment(
    request: AppointmentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointment_date = datetime.strptime(request.appointment_date, '%Y-%m-%d').date()
    appointment_time = datetime.strptime(request.appointment_time, '%H:%M').time()
    
    new_appointment = models.Appointment(
        user_id=request.user_id,
        professional_id=request.professional_id,
        specialty_id=request.specialty_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        notes=request.notes,
        status='scheduled'
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    return {
        'id': new_appointment.id,
        'message': 'Agendamento criado com sucesso'
    }

@router.put('/{appointment_id}')
async def update_appointment(
    appointment_id: int,
    request: AppointmentUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail='Agendamento não encontrado')
    
    if request.status is not None:
        appointment.status = request.status
    if request.notes is not None:
        appointment.notes = request.notes
    if request.professional_confirmed is not None:
        appointment.professional_confirmed = request.professional_confirmed
        if request.professional_confirmed:
            appointment.professional_confirmed_at = datetime.utcnow()
    if request.user_confirmed is not None:
        appointment.user_confirmed = request.user_confirmed
        if request.user_confirmed:
            appointment.user_confirmed_at = datetime.utcnow()
    
    db.commit()
    
    return {'message': 'Agendamento atualizado com sucesso'}

@router.post('/{appointment_id}/cancel')
async def cancel_appointment(
    appointment_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail='Agendamento não encontrado')
    
    appointment.status = 'cancelled'
    db.commit()
    
    return {'message': 'Agendamento cancelado com sucesso'}

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