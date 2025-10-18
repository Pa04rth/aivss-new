"""
Authentication routes for OAuth (Google, GitHub) and user management
"""

import os
import requests
from flask import Blueprint, request, jsonify, redirect, url_for
from datetime import datetime
import logging
from urllib.parse import urlencode, parse_qs, urlparse
import ssl
import urllib3
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from database.connection_manager import DatabaseManager, CredentialManager
from database.models import User
from middleware.auth import auth_middleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import bcrypt

logger = logging.getLogger(__name__)

# Create Blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize managers
db_manager = DatabaseManager()
credential_manager = CredentialManager()

# OAuth configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')

# OAuth URLs
GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_USER_INFO_URL = 'https://api.github.com/user'

# Frontend URL for redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5001')

# Configure requests session with SSL and retry settings
def create_robust_session():
    """Create a requests session with SSL and retry configuration"""
    session = requests.Session()
    
    # Configure retry strategy
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    
    # Mount adapter with retry strategy
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Configure SSL context
    try:
        # Create SSL context that's more permissive
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Disable SSL warnings
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Set verify=False for requests
        session.verify = False
        
    except Exception as e:
        logger.warning(f"SSL configuration warning: {e}")
    
    return session

# Global session for OAuth requests
oauth_session = create_robust_session()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def get_or_create_user(email: str, name: str = None, provider: str = None) -> User:
    """Get existing user or create new one"""
    session = db_manager.get_session()
    try:
        # Try to find existing user
        user = session.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user
            user = User(
                email=email,
                password_hash='',  # OAuth users don't need password
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            logger.info(f"Created new user: {email}")
        else:
            logger.info(f"Found existing user: {email}")
        
        return user
        
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        db_manager.close_session(session)

@auth_bp.route('/google', methods=['GET'])
def google_auth():
    """Initiate Google OAuth flow"""
    try:
        params = {
            'client_id': GOOGLE_CLIENT_ID,
            'redirect_uri': f'{BACKEND_URL}/api/auth/google/callback',
            'scope': 'openid email profile',
            'response_type': 'code',
            'access_type': 'offline'
        }
        
        auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
        
        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'message': 'Redirect user to this URL for Google authentication'
        })
        
    except Exception as e:
        logger.error(f"Error generating Google auth URL: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        code = request.args.get('code')
        error = request.args.get('error')
        
        if error:
            return redirect(f"{FRONTEND_URL}/auth/error?error={error}")
        
        if not code:
            return redirect(f"{FRONTEND_URL}/auth/error?error=no_code")
        
        # Exchange code for tokens
        token_data = {
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'redirect_uri': f'{BACKEND_URL}/api/auth/google/callback',
            'grant_type': 'authorization_code',
            'code': code
        }
        
        response = oauth_session.post(GOOGLE_TOKEN_URL, data=token_data, timeout=30)
        
        if response.status_code != 200:
            return redirect(f"{FRONTEND_URL}/auth/error?error=token_exchange_failed")
        
        tokens = response.json()
        access_token = tokens['access_token']
        
        # Get user info
        user_response = oauth_session.get(
            GOOGLE_USER_INFO_URL,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=30
        )
        
        if user_response.status_code != 200:
            return redirect(f"{FRONTEND_URL}/auth/error?error=user_info_failed")
        
        user_info = user_response.json()
        
        # Get or create user
        user = get_or_create_user(
            email=user_info['email'],
            name=user_info.get('name'),
            provider='google'
        )
        
        # Generate JWT token
        jwt_token = auth_middleware.generate_token(user.id, user.email)
        print(f"DEBUG: Generated JWT token: {jwt_token[:20]}...")
        
        # Redirect to frontend with token
        redirect_url = f"{FRONTEND_URL}/auth/success?token={jwt_token}"
        print(f"DEBUG: Redirecting to: {redirect_url}")
        return redirect(redirect_url)
        
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        return redirect(f"{FRONTEND_URL}/auth/error?error=callback_error")

@auth_bp.route('/github', methods=['GET'])
def github_auth():
    """Initiate GitHub OAuth flow"""
    try:
        params = {
            'client_id': GITHUB_CLIENT_ID,
            'redirect_uri': f'{BACKEND_URL}/api/auth/github/callback',
            'scope': 'user:email',
            'state': 'github_auth_state'  # Add CSRF protection
        }
        
        auth_url = f"{GITHUB_AUTH_URL}?{urlencode(params)}"
        
        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'message': 'Redirect user to this URL for GitHub authentication'
        })
        
    except Exception as e:
        logger.error(f"Error generating GitHub auth URL: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/github/callback', methods=['GET'])
def github_callback():
    """Handle GitHub OAuth callback"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        if error:
            return redirect(f"{FRONTEND_URL}/auth/error?error={error}")
        
        if not code:
            return redirect(f"{FRONTEND_URL}/auth/error?error=no_code")
        
        # Verify state parameter for CSRF protection
        if state != 'github_auth_state':
            return redirect(f"{FRONTEND_URL}/auth/error?error=invalid_state")
        
        # Exchange code for tokens
        token_data = {
            'client_id': GITHUB_CLIENT_ID,
            'client_secret': GITHUB_CLIENT_SECRET,
            'code': code
        }
        
        response = oauth_session.post(
            GITHUB_TOKEN_URL,
            data=token_data,
            headers={'Accept': 'application/json'},
            timeout=30
        )
        
        if response.status_code != 200:
            return redirect(f"{FRONTEND_URL}/auth/error?error=token_exchange_failed")
        
        tokens = response.json()
        access_token = tokens['access_token']
        
        # Get user info
        user_response = oauth_session.get(
            GITHUB_USER_INFO_URL,
            headers={'Authorization': f'token {access_token}'},
            timeout=30
        )
        
        if user_response.status_code != 200:
            return redirect(f"{FRONTEND_URL}/auth/error?error=user_info_failed")
        
        user_info = user_response.json()
        
        # Get user email (GitHub might not return email in user info)
        email = user_info.get('email')
        if not email:
            # Try to get email from GitHub's email API
            email_response = requests.get(
                'https://api.github.com/user/emails',
                headers={'Authorization': f'token {access_token}'}
            )
            if email_response.status_code == 200:
                emails = email_response.json()
                primary_email = next((e for e in emails if e.get('primary')), emails[0] if emails else None)
                email = primary_email.get('email') if primary_email else None
        
        if not email:
            return redirect(f"{FRONTEND_URL}/auth/error?error=no_email")
        
        # Get or create user
        user = get_or_create_user(
            email=email,
            name=user_info.get('name') or user_info.get('login'),
            provider='github'
        )
        
        # Generate JWT token
        jwt_token = auth_middleware.generate_token(user.id, user.email)
        
        # Redirect to frontend with token
        return redirect(f"{FRONTEND_URL}/auth/success?token={jwt_token}")
        
    except Exception as e:
        logger.error(f"GitHub OAuth callback error: {e}")
        return redirect(f"{FRONTEND_URL}/auth/error?error=callback_error")

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user information"""
    from middleware.auth import require_auth, get_current_user
    
    @require_auth
    def _get_user():
        user_info = get_current_user()
        if not user_info:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_info['user_id'],
                'email': user_info['email']
            }
        })
    
    return _get_user()

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })
