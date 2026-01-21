"""
Script para inicializar o banco de dados com dados básicos
"""
from database import SessionLocal, engine, Base
import models
from auth import get_password_hash
from datetime import time

def init_db():
    # Criar todas as tabelas
    print("Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tabelas criadas")
    
    db = SessionLocal()
    
    try:
        # Verificar se já existe usuário admin
        existing_admin = db.query(models.User).filter(models.User.email == 'admin@anadem.com').first()
        
        if not existing_admin:
            print("\nCriando usuário administrador...")
            # Criar usuário admin
            admin_user = models.User(
                email='admin@anadem.com',
                password_hash=get_password_hash('admin123'),
                role='admin'
            )
            db.add(admin_user)
            db.flush()
            
            # Criar perfil do admin
            admin_profile = models.Profile(
                user_id=admin_user.id,
                name='Administrador',
                email='admin@anadem.com',
                setor='Administração'
            )
            db.add(admin_profile)
            print("✓ Usuário admin criado: admin@anadem.com / admin123")
        else:
            print("\n✓ Usuário admin já existe")
        
        # Criar especialidades básicas
        specialties_data = [
            {'name': 'Massoterapia', 'description': 'Terapia através de massagens', 'duration_minutes': 60},
            {'name': 'Psicologia', 'description': 'Atendimento psicológico', 'duration_minutes': 50},
            {'name': 'Nutrição', 'description': 'Consulta nutricional', 'duration_minutes': 45},
        ]
        
        print("\nCriando especialidades...")
        for spec_data in specialties_data:
            existing = db.query(models.Specialty).filter(models.Specialty.name == spec_data['name']).first()
            if not existing:
                specialty = models.Specialty(**spec_data)
                db.add(specialty)
                print(f"✓ Especialidade criada: {spec_data['name']}")
            else:
                print(f"✓ Especialidade já existe: {spec_data['name']}")
        
        db.commit()
        print("\n✅ Banco de dados inicializado com sucesso!")
        print("\nCredenciais de acesso:")
        print("  Email: admin@anadem.com")
        print("  Senha: admin123")
        
    except Exception as e:
        print(f"\n❌ Erro ao inicializar banco: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    init_db()
