#!/usr/bin/env python3
"""
Database initialization script for AutoHardener
Run this script to set up your database
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import DatabaseManager, Base
from database.models import User, PlatformConnection, ScanResult, WorkflowCache
from cryptography.fernet import Fernet

def generate_encryption_key():
    """Generate a new encryption key"""
    return Fernet.generate_key().decode()

def check_env_file():
    """Check if .env file exists and create template if not"""
    env_file = backend_dir / '.env'
    
    if not env_file.exists():
        print("📝 Creating .env template file...")
        
        encryption_key = generate_encryption_key()
        
        env_content = f"""# AutoHardener Environment Configuration
# Generated on {os.popen('date').read().strip()}

# Database Configuration (SQLite by default)
DATABASE_URL=sqlite:///./platform_connections.db

# Encryption Key for OAuth tokens (KEEP THIS SECURE!)
ENCRYPTION_KEY={encryption_key}

# n8n OAuth Configuration (Get these from n8n Cloud settings)
N8N_CLIENT_ID=your_n8n_client_id_here
N8N_CLIENT_SECRET=your_n8n_client_secret_here
N8N_REDIRECT_URI=http://localhost:3000/api/n8n/callback
N8N_AUTH_URL=https://app.n8n.cloud/oauth/authorize
N8N_TOKEN_URL=https://app.n8n.cloud/oauth/token

# Google Gemini API Key (Required for AI analysis)
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional: Logging level
LOG_LEVEL=INFO
"""
        
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        print(f"✅ Created .env file at {env_file}")
        print("🔧 Please edit the .env file with your actual API keys and credentials")
        return False
    else:
        print("✅ .env file already exists")
        return True

def init_database():
    """Initialize database tables"""
    print("🗄️ Initializing database...")
    
    try:
        db_manager = DatabaseManager()
        
        # Create all tables
        Base.metadata.create_all(bind=db_manager.engine)
        
        print("✅ Database tables created successfully!")
        
        # Test connection
        session = db_manager.get_session()
        try:
            result = session.execute("SELECT 1").fetchone()
            if result:
                print("✅ Database connection test successful!")
            else:
                print("❌ Database connection test failed!")
        finally:
            db_manager.close_session(session)
            
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    print("📦 Checking dependencies...")
    
    required_packages = [
        'sqlalchemy',
        'cryptography',
        'flask',
        'requests',
        'google-generativeai'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} (missing)")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n📥 Install missing packages with:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ All dependencies are installed!")
    return True

def main():
    """Main setup function"""
    print("🚀 AutoHardener Database Setup")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Please install missing dependencies first")
        return
    
    print()
    
    # Check/create .env file
    env_exists = check_env_file()
    
    print()
    
    # Initialize database
    if init_database():
        print("\n🎉 Setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Edit the .env file with your API keys")
        print("2. Set up n8n OAuth application")
        print("3. Run: python app.py")
        print("4. Open: http://localhost:3000")
    else:
        print("\n❌ Setup failed. Please check the errors above.")

if __name__ == "__main__":
    main()


