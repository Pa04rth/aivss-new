#!/usr/bin/env python3
"""
Quick setup script for AutoHardener
Creates .env file and initializes database
"""

import os
from pathlib import Path
from cryptography.fernet import Fernet

def create_env_file():
    """Create .env file with default values"""
    backend_dir = Path(__file__).parent
    env_file = backend_dir / '.env'
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    # Generate encryption key
    encryption_key = Fernet.generate_key().decode()
    
    env_content = f"""# AutoHardener Environment Configuration
# Generated automatically

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
    print("🔧 Please edit the .env file with your actual API keys")
    return True

def init_database():
    """Initialize database tables"""
    print("🗄️ Initializing database...")
    
    try:
        from database import DatabaseManager, Base
        from database.models import User, PlatformConnection, ScanResult, WorkflowCache
        
        db_manager = DatabaseManager()
        Base.metadata.create_all(bind=db_manager.engine)
        
        print("✅ Database tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 AutoHardener Quick Setup")
    print("=" * 30)
    
    # Create .env file
    create_env_file()
    print()
    
    # Initialize database
    init_database()
    
    print("\n🎉 Setup completed!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your API keys")
    print("2. Run: python app.py")
    print("3. Open: http://localhost:3000")

if __name__ == "__main__":
    main()
