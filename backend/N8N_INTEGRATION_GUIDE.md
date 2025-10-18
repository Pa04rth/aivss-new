# n8n Integration Setup Guide

This guide will help you set up the n8n integration for the AutoHardener security scanner.

## Prerequisites

1. **n8n Account**: You need an n8n Cloud account or self-hosted n8n instance
2. **OAuth Application**: Create an OAuth application in your n8n instance
3. **Environment Variables**: Configure the required environment variables

## Step 1: Create n8n OAuth Application

### For n8n Cloud:

1. Go to [n8n Cloud Settings](https://app.n8n.cloud/settings)
2. Navigate to "OAuth Applications"
3. Click "Create OAuth Application"
4. Fill in the details:
   - **Name**: AutoHardener Security Scanner
   - **Redirect URI**: `http://localhost:3000/api/n8n/callback` (for development)
   - **Scopes**: Select `workflow:read` and `workflow:write`
5. Save the **Client ID** and **Client Secret**

### For Self-hosted n8n:

1. Go to your n8n instance settings
2. Navigate to "OAuth Applications"
3. Create a new OAuth application with the same settings as above

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# n8n OAuth Configuration
N8N_CLIENT_ID=your_client_id_from_step_1
N8N_CLIENT_SECRET=your_client_secret_from_step_1
N8N_REDIRECT_URI=http://localhost:3000/api/n8n/callback
N8N_AUTH_URL=https://app.n8n.cloud/oauth/authorize
N8N_TOKEN_URL=https://app.n8n.cloud/oauth/token

# Database Configuration (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./platform_connections.db

# Encryption Key for credentials (generate a new one for production)
ENCRYPTION_KEY=your_encryption_key_here

# Existing configuration
GOOGLE_API_KEY=your_gemini_api_key_here
```

## Step 3: Install Dependencies

Install the new Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

## Step 4: Initialize Database

The database will be automatically created when you first run the application. The SQLite database file will be created at `backend/platform_connections.db`.

## Step 5: Start the Application

1. **Start the Backend**:

   ```bash
   cd backend
   python app.py
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

## Step 6: Test the Integration

1. Open your browser to `http://localhost:3000`
2. Click on the "n8n Workflows" tab
3. Click "Connect to n8n"
4. Complete the OAuth flow
5. Select workflows to analyze
6. Run security analysis

## Features

### Security Analysis

The n8n integration provides comprehensive security analysis including:

- **Credential Exposure Detection**: Identifies hardcoded credentials and passwords
- **Insecure Connection Detection**: Flags HTTP connections that should use HTTPS
- **Data Exposure Analysis**: Detects potential data leaks and sensitive information
- **Error Handling Assessment**: Checks for missing error handling in critical nodes
- **Dangerous Code Detection**: Identifies potentially harmful code functions
- **Workflow Complexity Analysis**: Assesses workflow complexity and potential issues

### Supported n8n Features

- ✅ n8n Cloud integration
- ✅ Self-hosted n8n instances
- ✅ OAuth2 authentication
- ✅ Workflow discovery and analysis
- ✅ Multiple workflow analysis
- ✅ Secure credential storage
- ✅ Real-time connection testing

### Future Integrations

The architecture is designed to easily support additional platforms:

- 🔄 Zapier (planned)
- 🔄 Make.com (planned)
- 🔄 Microsoft Power Automate (planned)

## Troubleshooting

### Common Issues

1. **OAuth Error**: Make sure the redirect URI matches exactly in your n8n OAuth application
2. **Connection Failed**: Check that your n8n instance is accessible and the OAuth application is properly configured
3. **Database Error**: Ensure the backend directory has write permissions for the SQLite database
4. **Analysis Failed**: Verify that the Google API key is properly configured

### Debug Mode

Enable debug logging by setting the log level in your environment:

```env
LOG_LEVEL=DEBUG
```

## Security Considerations

1. **Credential Storage**: All OAuth tokens are encrypted before storage
2. **Database Security**: Use a secure database in production (PostgreSQL recommended)
3. **HTTPS**: Always use HTTPS in production environments
4. **API Keys**: Keep your OAuth client secrets secure and never commit them to version control

## Production Deployment

For production deployment:

1. **Use PostgreSQL**: Replace SQLite with PostgreSQL for better performance and security
2. **Environment Variables**: Set all environment variables securely
3. **HTTPS**: Configure HTTPS for both frontend and backend
4. **Database Migrations**: Run database migrations before deployment
5. **Monitoring**: Set up logging and monitoring for the application

## API Endpoints

The n8n integration provides the following API endpoints:

- `GET /api/n8n/auth-url` - Get OAuth authorization URL
- `GET /api/n8n/callback` - Handle OAuth callback
- `GET /api/n8n/connections` - Get user connections
- `GET /api/n8n/workflows` - Get workflows from connection
- `GET /api/n8n/workflow/<id>` - Get specific workflow details
- `POST /api/n8n/analyze` - Analyze workflow for security issues
- `POST /api/n8n/disconnect` - Disconnect n8n connection
- `POST /api/n8n/test-connection` - Test connection status
- `GET /api/n8n/statistics` - Get workflow statistics

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the application logs
3. Ensure all environment variables are properly set
4. Verify n8n OAuth application configuration


