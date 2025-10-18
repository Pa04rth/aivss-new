"""
Authentication middleware for JWT token validation and user session management
"""

import os
import jwt
from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AuthMiddleware:
    """Handles JWT token validation and user authentication"""
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or os.getenv('JWT_SECRET_KEY', 'default-secret-key')
        self.algorithm = 'HS256'
    
    def generate_token(self, user_id: int, email: str) -> str:
        """Generate JWT token for user"""
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def validate_token(self, token: str) -> dict:
        """Validate JWT token and return payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    def get_user_from_token(self, token: str) -> dict:
        """Extract user info from token"""
        payload = self.validate_token(token)
        return {
            'user_id': payload['user_id'],
            'email': payload['email']
        }

# Global auth middleware instance
auth_middleware = AuthMiddleware()

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Debug: Print request headers
        print(f"DEBUG: Request headers: {dict(request.headers)}")
        print(f"DEBUG: Request cookies: {dict(request.cookies)}")
        
        # Try to get token from Authorization header first
        auth_header = request.headers.get('Authorization')
        token = None
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            print(f"DEBUG: Found Bearer token: {token[:20]}...")
        else:
            # Try to get token from cookies
            token = request.cookies.get('auth_token')
            print(f"DEBUG: Found cookie token: {token[:20] if token else 'None'}...")
        
        if not token:
            print("DEBUG: No token found in request")
            return jsonify({'error': 'Authentication required'}), 401
        
        try:
            # Validate token and get user info
            user_info = auth_middleware.get_user_from_token(token)
            print(f"DEBUG: Token validation successful: {user_info}")
            
            # Add user info to Flask's g object for use in route handlers
            g.current_user = user_info
            
            return f(*args, **kwargs)
            
        except ValueError as e:
            print(f"DEBUG: Token validation failed: {e}")
            return jsonify({'error': str(e)}), 401
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            print(f"DEBUG: Authentication error: {e}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

def get_current_user():
    """Get current authenticated user from Flask's g object"""
    return getattr(g, 'current_user', None)
