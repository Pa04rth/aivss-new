#!/usr/bin/env python3
"""
Database initialization script for HIVE platform
Creates all necessary tables and verifies connection
"""

import os
import sys
from dotenv import load_dotenv

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection_manager import DatabaseManager
from database.models import Base, User, PlatformConnection, ScanResult, WorkflowCache
from sqlalchemy import text

def init_database():
    """Initialize the database and create all tables"""
    print("🚀 Initializing HIVE Database...")
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        print("Please set DATABASE_URL in your .env file")
        return False
    
    try:
        # Initialize database manager
        print(f"📡 Connecting to database: {database_url.split('@')[1] if '@' in database_url else 'local'}")
        db_manager = DatabaseManager(database_url)
        
        # Test connection
        session = db_manager.get_session()
        try:
            # Execute a simple query to test connection
            result = session.execute(text("SELECT 1")).fetchone()
            print("✅ Database connection successful")
            
            # Check if tables exist
            tables = session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)).fetchall()
            
            existing_tables = [table[0] for table in tables]
            expected_tables = ['users', 'platform_connections', 'scan_results', 'workflow_cache']
            
            print(f"📊 Found {len(existing_tables)} existing tables: {existing_tables}")
            
            # Create tables if they don't exist
            Base.metadata.create_all(bind=db_manager.engine)
            print("✅ All tables created/verified")
            
            # Verify tables were created
            tables_after = session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)).fetchall()
            
            tables_after_names = [table[0] for table in tables_after]
            print(f"📊 Tables after creation: {tables_after_names}")
            
            # Check if all expected tables exist
            missing_tables = set(expected_tables) - set(tables_after_names)
            if missing_tables:
                print(f"⚠️ Missing tables: {missing_tables}")
                return False
            
            print("✅ All required tables exist")
            
            # Test inserting a test user (optional)
            test_user = User(
                email="test@example.com",
                password_hash="test_hash",
            )
            session.add(test_user)
            session.commit()
            session.delete(test_user)
            session.commit()
            print("✅ Database write/delete operations working")
            
        finally:
            db_manager.close_session(session)
        
        print("🎉 Database initialization completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def check_environment():
    """Check if all required environment variables are set"""
    print("🔍 Checking environment configuration...")
    
    required_vars = [
        'DATABASE_URL',
        'JWT_SECRET_KEY',
        'ENCRYPTION_KEY',
    ]
    
    optional_vars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'GOOGLE_API_KEY',
    ]
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
    
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
    
    if missing_required:
        print(f"❌ Missing required environment variables: {missing_required}")
        print("Please set these in your .env file")
        return False
    
    if missing_optional:
        print(f"⚠️ Missing optional environment variables: {missing_optional}")
        print("These are needed for OAuth authentication")
    
    print("✅ Environment configuration check completed")
    return True

if __name__ == "__main__":
    print("=" * 50)
    print("HIVE Database Initialization")
    print("=" * 50)
    
    # Check environment first
    if not check_environment():
        sys.exit(1)
    
    # Initialize database
    if not init_database():
        sys.exit(1)
    
    print("=" * 50)
    print("✅ HIVE Database is ready!")
    print("=" * 50)
