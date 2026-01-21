from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# Import database and models
from database import engine, Base
import models

# Import routers
from routers import (
    auth_router,
    appointments_router,
    professionals_router,
    specialties_router,
    availability_router,
    profiles_router,
    settings_router,
    specialty_blocks_router
)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="Agendamento API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth_router.router, prefix="/api")
app.include_router(appointments_router.router, prefix="/api")
app.include_router(professionals_router.router, prefix="/api")
app.include_router(specialties_router.router, prefix="/api")
app.include_router(availability_router.router, prefix="/api")
app.include_router(profiles_router.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(specialty_blocks_router.router, prefix="/api")

# Root endpoint
@app.get("/api")
async def root():
    return {"message": "Agendamento API - Sistema de Agendamentos", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
