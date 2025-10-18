# Quick Start Guide - n8n Integration

This guide will get you up and running with the n8n integration in 5 minutes!

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Run Setup Script

```bash
# This will create your .env file and initialize the database
python setup_database.py
```

### Step 3: Configure Environment (Optional)

```bash
# If you want to customize the configuration
python setup_env.py
```

### Step 4: Start the Application

```bash
# Terminal 1: Start backend
cd backend
python app.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 5: Test the Integration

1. Open http://localhost:3000
2. Click on "n8n Workflows" tab
3. Click "Connect to n8n"
4. Complete OAuth flow
5. Select workflows to analyze
6. Run security analysis

## 🔧 Manual Setup (If you prefer)

### 1. Create .env File

Create `backend/.env` with:

```env
# Database (SQLite - no setup needed)
DATABASE_URL=sqlite:///./platform_connections.db

# Generate encryption key
ENCRYPTION_KEY=your_encryption_key_here

# n8n OAuth (get from n8n Cloud settings)
N8N_CLIENT_ID=your_client_id
N8N_CLIENT_SECRET=your_client_secret
N8N_REDIRECT_URI=http://localhost:3000/api/n8n/callback
N8N_AUTH_URL=https://app.n8n.cloud/oauth/authorize
N8N_TOKEN_URL=https://app.n8n.cloud/oauth/token

# Google API (required for AI analysis)
GOOGLE_API_KEY=your_gemini_api_key
```

### 2. Set Up n8n OAuth Application

1. Go to https://app.n8n.cloud/settings
2. Navigate to "OAuth Applications"
3. Create new OAuth application:
   - **Name**: AutoHardener Security Scanner
   - **Redirect URI**: `http://localhost:3000/api/n8n/callback`
   - **Scopes**: `workflow:read`, `workflow:write`
4. Copy Client ID and Client Secret to .env file

### 3. Initialize Database

```bash
cd backend
python -c "from database import DatabaseManager, Base; DatabaseManager(); Base.metadata.create_all(bind=DatabaseManager().engine); print('Database initialized!')"
```

## 🎯 What You Get

### Features Available

- ✅ **Connect to n8n**: OAuth2 authentication
- ✅ **Browse Workflows**: See all your n8n workflows
- ✅ **Security Analysis**: Comprehensive security scanning
- ✅ **Detailed Reports**: Same reporting format as Python files
- ✅ **Multiple Workflows**: Analyze multiple workflows at once
- ✅ **Secure Storage**: Encrypted credential storage

### Security Analysis Coverage

- 🔐 **Credential Exposure**: Hardcoded passwords, API keys
- 🔒 **Insecure Connections**: HTTP vs HTTPS detection
- 📊 **Data Exposure**: Sensitive data in node names
- ⚠️ **Error Handling**: Missing error handling detection
- 🚨 **Dangerous Code**: eval(), exec(), system() functions
- 🔄 **Workflow Complexity**: Circular dependencies, orphaned nodes

## 🐛 Troubleshooting

### Common Issues

**"Database connection failed"**

- Run: `python setup_database.py`
- Check if .env file exists

**"n8n OAuth error"**

- Verify redirect URI matches exactly
- Check client ID and secret in .env

**"Google API error"**

- Verify GOOGLE_API_KEY in .env
- Check API key permissions

**"Module not found"**

- Run: `pip install -r requirements.txt`
- Check Python path

### Debug Mode

Add to .env:

```env
LOG_LEVEL=DEBUG
```

## 📊 Database Options

### SQLite (Default - No Setup)

- ✅ Perfect for development
- ✅ No external dependencies
- ✅ Automatic setup

### PostgreSQL (Production)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### MySQL

```env
DATABASE_URL=mysql://user:password@localhost:3306/dbname
```

## 🔮 Next Steps

1. **Test with Real Workflows**: Connect your n8n account and analyze workflows
2. **Review Security Reports**: Check the detailed security analysis
3. **Set Up Production**: Use PostgreSQL for production deployment
4. **Add More Platforms**: The architecture supports Zapier, Make.com (coming soon)

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review the detailed setup guides:
   - `DATABASE_SETUP_GUIDE.md`
   - `N8N_INTEGRATION_GUIDE.md`
3. Check application logs
4. Verify all environment variables

## 🎉 You're Ready!

Your n8n integration is now ready to use! The system will:

- Securely store your n8n credentials
- Analyze your workflows for security issues
- Generate comprehensive security reports
- Work alongside your existing Python file analysis

Happy scanning! 🔍


