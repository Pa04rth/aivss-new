# Database Setup Guide

This guide explains how to configure the database for the AutoHardener platform.

## Database Options

### Option 1: SQLite (Default - Easy Setup)

**Best for**: Development, testing, small deployments

**Setup**:

1. No additional setup required
2. Database file will be created automatically at `backend/platform_connections.db`
3. No external dependencies

**Environment Variables**:

```env
# Optional - defaults to SQLite
DATABASE_URL=sqlite:///./platform_connections.db
```

### Option 2: PostgreSQL (Recommended for Production)

**Best for**: Production, multiple users, scalability

**Setup Steps**:

#### Step 1: Install PostgreSQL

**Windows**:

```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql
```

**macOS**:

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian)**:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Step 2: Create Database and User

```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE autohardener_db;

-- Create user
CREATE USER autohardener_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE autohardener_db TO autohardener_user;

-- Exit
\q
```

#### Step 3: Configure Environment Variables

```env
# PostgreSQL configuration
DATABASE_URL=postgresql://autohardener_user:your_secure_password@localhost:5432/autohardener_db
```

### Option 3: MySQL/MariaDB

**Best for**: Existing MySQL infrastructure

**Setup Steps**:

#### Step 1: Install MySQL

**Windows**:

```bash
# Download from https://dev.mysql.com/downloads/mysql/
# Or use Chocolatey
choco install mysql
```

**macOS**:

```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian)**:

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Step 2: Create Database and User

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE autohardener_db;

-- Create user
CREATE USER 'autohardener_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON autohardener_db.* TO 'autohardener_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

#### Step 3: Configure Environment Variables

```env
# MySQL configuration
DATABASE_URL=mysql://autohardener_user:your_secure_password@localhost:3306/autohardener_db
```

## Environment Configuration

### Complete .env File Example

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///./platform_connections.db
# For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# For MySQL: DATABASE_URL=mysql://user:password@localhost:3306/dbname

# Encryption Key (generate a secure key for production)
ENCRYPTION_KEY=your_encryption_key_here

# n8n OAuth Configuration
N8N_CLIENT_ID=your_n8n_client_id
N8N_CLIENT_SECRET=your_n8n_client_secret
N8N_REDIRECT_URI=http://localhost:3000/api/n8n/callback
N8N_AUTH_URL=https://app.n8n.cloud/oauth/authorize
N8N_TOKEN_URL=https://app.n8n.cloud/oauth/token

# Existing configuration
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional: Logging level
LOG_LEVEL=INFO
```

## Database Initialization

### Automatic Initialization

The database tables will be created automatically when you first run the application:

```bash
cd backend
python app.py
```

### Manual Database Initialization

If you want to initialize the database manually:

```python
# Create init_db.py in backend directory
from database import DatabaseManager, Base
from database.models import User, PlatformConnection, ScanResult, WorkflowCache

def init_database():
    """Initialize database tables"""
    db_manager = DatabaseManager()

    # Create all tables
    Base.metadata.create_all(bind=db_manager.engine)

    print("✅ Database tables created successfully!")

    # Optional: Create a default user
    session = db_manager.get_session()
    try:
        # Check if users exist
        existing_users = session.query(User).count()
        if existing_users == 0:
            # Create a default user (you'll implement proper user creation later)
            print("ℹ️ No users found. You can create users through the web interface.")
        else:
            print(f"ℹ️ Found {existing_users} existing users.")
    finally:
        db_manager.close_session(session)

if __name__ == "__main__":
    init_database()
```

Run it:

```bash
cd backend
python init_db.py
```

## Database Management Commands

### Reset Database (Development Only)

```python
# Create reset_db.py in backend directory
from database import DatabaseManager, Base

def reset_database():
    """Reset database (WARNING: This will delete all data!)"""
    db_manager = DatabaseManager()

    # Drop all tables
    Base.metadata.drop_all(bind=db_manager.engine)

    # Create all tables
    Base.metadata.create_all(bind=db_manager.engine)

    print("✅ Database reset successfully!")

if __name__ == "__main__":
    reset_database()
```

### Backup Database

**SQLite**:

```bash
# Copy the database file
cp backend/platform_connections.db backend/platform_connections_backup.db
```

**PostgreSQL**:

```bash
# Create backup
pg_dump -h localhost -U autohardener_user -d autohardener_db > backup.sql

# Restore backup
psql -h localhost -U autohardener_user -d autohardener_db < backup.sql
```

**MySQL**:

```bash
# Create backup
mysqldump -u autohardener_user -p autohardener_db > backup.sql

# Restore backup
mysql -u autohardener_user -p autohardener_db < backup.sql
```

## Production Considerations

### Security

1. **Use strong passwords** for database users
2. **Enable SSL** for database connections in production
3. **Restrict database access** to application servers only
4. **Regular backups** of your database
5. **Encrypt sensitive data** (OAuth tokens are already encrypted)

### Performance

1. **Use connection pooling** (already implemented)
2. **Index frequently queried columns**
3. **Regular database maintenance**
4. **Monitor database performance**

### Environment Variables for Production

```env
# Production database (example)
DATABASE_URL=postgresql://prod_user:very_secure_password@db-server:5432/autohardener_prod

# Production encryption key (generate a new one)
ENCRYPTION_KEY=your_production_encryption_key_here

# Production n8n configuration
N8N_CLIENT_ID=your_production_client_id
N8N_CLIENT_SECRET=your_production_client_secret
N8N_REDIRECT_URI=https://yourdomain.com/api/n8n/callback

# Production Google API key
GOOGLE_API_KEY=your_production_gemini_api_key

# Production logging
LOG_LEVEL=WARNING
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:

   - Check if database server is running
   - Verify connection string format
   - Check firewall settings

2. **Permission Denied**:

   - Ensure database user has proper privileges
   - Check database user permissions

3. **Table Already Exists**:

   - This is normal on subsequent runs
   - Tables are created only if they don't exist

4. **SQLite Database Locked**:
   - Ensure no other processes are using the database
   - Check file permissions

### Testing Database Connection

```python
# Create test_db.py in backend directory
from database import DatabaseManager

def test_connection():
    """Test database connection"""
    try:
        db_manager = DatabaseManager()
        session = db_manager.get_session()

        # Test query
        result = session.execute("SELECT 1").fetchone()

        if result:
            print("✅ Database connection successful!")
        else:
            print("❌ Database connection failed!")

    except Exception as e:
        print(f"❌ Database connection error: {e}")
    finally:
        db_manager.close_session(session)

if __name__ == "__main__":
    test_connection()
```

## Next Steps

1. **Choose your database** (SQLite for development, PostgreSQL for production)
2. **Set up environment variables** in `.env` file
3. **Run the application** to auto-create tables
4. **Test the n8n integration** with your database

The database will automatically handle:

- ✅ OAuth token storage and encryption
- ✅ Platform connection management
- ✅ Scan result persistence
- ✅ Workflow caching
- ✅ User management (when implemented)
