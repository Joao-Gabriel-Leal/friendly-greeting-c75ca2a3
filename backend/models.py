from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Table, Time, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Tabela de associação para professionals e specialties
professional_specialties = Table(
    'professional_specialties',
    Base.metadata,
    Column('professional_id', Integer, ForeignKey('professionals.id', ondelete='CASCADE'), primary_key=True),
    Column('specialty_id', Integer, ForeignKey('specialties.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default='user')  # user, professional, admin, developer
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    profile = relationship('Profile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    appointments = relationship('Appointment', back_populates='user', cascade='all, delete-orphan')

class Profile(Base):
    __tablename__ = 'profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    cpf = Column(String(14))
    setor = Column(String(100))
    suspended_until = Column(DateTime, nullable=True)
    blocked = Column(Boolean, default=False)
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship('User', back_populates='profile')

class Specialty(Base):
    __tablename__ = 'specialties'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    duration_minutes = Column(Integer, default=60)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    professionals = relationship('Professional', secondary=professional_specialties, back_populates='specialties')
    appointments = relationship('Appointment', back_populates='specialty')

class Professional(Base):
    __tablename__ = 'professionals'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    specialties = relationship('Specialty', secondary=professional_specialties, back_populates='professionals')
    appointments = relationship('Appointment', back_populates='professional')
    available_days = relationship('AvailableDay', back_populates='professional', cascade='all, delete-orphan')

class Appointment(Base):
    __tablename__ = 'appointments'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    professional_id = Column(Integer, ForeignKey('professionals.id', ondelete='CASCADE'), nullable=False)
    specialty_id = Column(Integer, ForeignKey('specialties.id', ondelete='CASCADE'), nullable=False)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    status = Column(String(50), default='scheduled')  # scheduled, confirmed, cancelled, completed
    notes = Column(Text)
    professional_confirmed = Column(Boolean, default=False)
    professional_confirmed_at = Column(DateTime)
    user_confirmed = Column(Boolean, default=False)
    user_confirmed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship('User', back_populates='appointments')
    professional = relationship('Professional', back_populates='appointments')
    specialty = relationship('Specialty', back_populates='appointments')

class AvailableDay(Base):
    __tablename__ = 'available_days'
    
    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey('professionals.id', ondelete='CASCADE'), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    professional = relationship('Professional', back_populates='available_days')

class BlockedDay(Base):
    __tablename__ = 'blocked_days'
    
    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey('professionals.id', ondelete='CASCADE'), nullable=True)
    specialty_id = Column(Integer, ForeignKey('specialties.id', ondelete='CASCADE'), nullable=True)
    blocked_date = Column(Date, nullable=False)
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class SpecialtyBlock(Base):
    __tablename__ = 'specialty_blocks'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    specialty_id = Column(Integer, ForeignKey('specialties.id', ondelete='CASCADE'), nullable=False)
    blocked_until = Column(DateTime, nullable=True)
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = 'system_settings'
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False)
    value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)