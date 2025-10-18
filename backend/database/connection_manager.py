"""
Database connection and credential management
Handles secure storage and retrieval of platform credentials
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from cryptography.fernet import Fernet
import base64
import logging

from .models import Base, User, PlatformConnection, ScanResult, WorkflowCache

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self, database_url: str = None):
        """Initialize database manager"""
        if database_url is None:
            # Get from environment variable or default to SQLite
            database_url = os.getenv('DATABASE_URL', "sqlite:///./platform_connections.db")
        
        # Handle PostgreSQL SSL requirements
        if database_url.startswith('postgresql://'):
            self.engine = create_engine(database_url, echo=False, pool_pre_ping=True)
        else:
            self.engine = create_engine(database_url, echo=False)
            
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Create tables
        Base.metadata.create_all(bind=self.engine)
        
        logger.info(f"Database initialized: {database_url}")
    
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    def close_session(self, session: Session):
        """Close database session"""
        session.close()

class CredentialManager:
    """Manages secure storage and retrieval of platform credentials"""
    
    def __init__(self, encryption_key: str = None):
        """Initialize credential manager with encryption key"""
        if encryption_key is None:
            # Generate a new key if none provided (for development)
            encryption_key = Fernet.generate_key()
            logger.warning("No encryption key provided, generated new key. Store this key securely!")
        
        if isinstance(encryption_key, str):
            encryption_key = encryption_key.encode()
        
        self.cipher = Fernet(encryption_key)
        self.db_manager = DatabaseManager()
    
    def encrypt_credentials(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        """Encrypt credentials for storage"""
        encrypted = {}
        for key, value in credentials.items():
            if value is not None:
                encrypted_value = self.cipher.encrypt(str(value).encode())
                encrypted[key] = base64.b64encode(encrypted_value).decode()
        return encrypted
    
    def decrypt_credentials(self, encrypted_credentials: Dict[str, str]) -> Dict[str, Any]:
        """Decrypt credentials from storage"""
        decrypted = {}
        for key, encrypted_value in encrypted_credentials.items():
            if encrypted_value:
                try:
                    encrypted_bytes = base64.b64decode(encrypted_value.encode())
                    decrypted_value = self.cipher.decrypt(encrypted_bytes).decode()
                    decrypted[key] = decrypted_value
                except Exception as e:
                    logger.error(f"Failed to decrypt {key}: {e}")
                    decrypted[key] = None
        return decrypted
    
    def store_connection(self, user_id: int, platform_type: str, credentials: Dict[str, Any], 
                        instance_url: str = None, instance_name: str = None) -> int:
        """Store platform connection credentials"""
        session = self.db_manager.get_session()
        try:
            # Encrypt credentials
            encrypted_creds = self.encrypt_credentials(credentials)
            
            # Calculate token expiry
            expires_at = None
            if 'expires_in' in credentials:
                expires_at = datetime.utcnow() + timedelta(seconds=credentials['expires_in'])
            
            # Create connection record
            connection = PlatformConnection(
                user_id=user_id,
                platform_type=platform_type,
                platform_instance_url=instance_url,
                platform_instance_name=instance_name,
                encrypted_access_token=encrypted_creds.get('access_token', ''),
                encrypted_refresh_token=encrypted_creds.get('refresh_token', ''),
                token_expires_at=expires_at,
                connection_status='active',
                last_sync_at=datetime.utcnow()
            )
            
            session.add(connection)
            session.commit()
            connection_id = connection.id
            
            logger.info(f"Stored connection for user {user_id}, platform {platform_type}")
            return connection_id
            
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Failed to store connection: {e}")
            raise
        finally:
            self.db_manager.close_session(session)
    
    def get_connection(self, connection_id: int) -> Optional[Dict[str, Any]]:
        """Get platform connection by ID"""
        session = self.db_manager.get_session()
        try:
            connection = session.query(PlatformConnection).filter(
                PlatformConnection.id == connection_id
            ).first()
            
            if not connection:
                return None
            
            # Decrypt credentials
            encrypted_creds = {
                'access_token': connection.encrypted_access_token,
                'refresh_token': connection.encrypted_refresh_token
            }
            credentials = self.decrypt_credentials(encrypted_creds)
            
            return {
                'id': connection.id,
                'user_id': connection.user_id,
                'platform_type': connection.platform_type,
                'platform_instance_url': connection.platform_instance_url,
                'platform_instance_name': connection.platform_instance_name,
                'credentials': credentials,
                'token_expires_at': connection.token_expires_at,
                'connection_status': connection.connection_status,
                'last_sync_at': connection.last_sync_at,
                'created_at': connection.created_at
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Failed to get connection {connection_id}: {e}")
            return None
        finally:
            self.db_manager.close_session(session)
    
    def get_user_connections(self, user_id: int, platform_type: str = None) -> List[Dict[str, Any]]:
        """Get all connections for a user, optionally filtered by platform"""
        session = self.db_manager.get_session()
        try:
            query = session.query(PlatformConnection).filter(
                PlatformConnection.user_id == user_id
            )
            
            if platform_type:
                query = query.filter(PlatformConnection.platform_type == platform_type)
            
            connections = query.all()
            
            result = []
            for connection in connections:
                encrypted_creds = {
                    'access_token': connection.encrypted_access_token,
                    'refresh_token': connection.encrypted_refresh_token
                }
                credentials = self.decrypt_credentials(encrypted_creds)
                
                result.append({
                    'id': connection.id,
                    'platform_type': connection.platform_type,
                    'platform_instance_url': connection.platform_instance_url,
                    'platform_instance_name': connection.platform_instance_name,
                    'credentials': credentials,
                    'token_expires_at': connection.token_expires_at,
                    'connection_status': connection.connection_status,
                    'last_sync_at': connection.last_sync_at,
                    'created_at': connection.created_at
                })
            
            return result
            
        except SQLAlchemyError as e:
            logger.error(f"Failed to get connections for user {user_id}: {e}")
            return []
        finally:
            self.db_manager.close_session(session)
    
    def update_connection_tokens(self, connection_id: int, new_credentials: Dict[str, Any]) -> bool:
        """Update connection tokens (for refresh)"""
        session = self.db_manager.get_session()
        try:
            connection = session.query(PlatformConnection).filter(
                PlatformConnection.id == connection_id
            ).first()
            
            if not connection:
                return False
            
            # Encrypt new credentials
            encrypted_creds = self.encrypt_credentials(new_credentials)
            
            # Update tokens
            connection.encrypted_access_token = encrypted_creds.get('access_token', '')
            if 'refresh_token' in encrypted_creds:
                connection.encrypted_refresh_token = encrypted_creds['refresh_token']
            
            # Update expiry
            if 'expires_in' in new_credentials:
                connection.token_expires_at = datetime.utcnow() + timedelta(
                    seconds=new_credentials['expires_in']
                )
            
            connection.updated_at = datetime.utcnow()
            session.commit()
            
            logger.info(f"Updated tokens for connection {connection_id}")
            return True
            
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Failed to update tokens for connection {connection_id}: {e}")
            return False
        finally:
            self.db_manager.close_session(session)
    
    def delete_connection(self, connection_id: int) -> bool:
        """Delete platform connection"""
        session = self.db_manager.get_session()
        try:
            connection = session.query(PlatformConnection).filter(
                PlatformConnection.id == connection_id
            ).first()
            
            if not connection:
                return False
            
            session.delete(connection)
            session.commit()
            
            logger.info(f"Deleted connection {connection_id}")
            return True
            
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Failed to delete connection {connection_id}: {e}")
            return False
        finally:
            self.db_manager.close_session(session)
    
    def is_token_expired(self, connection_id: int) -> bool:
        """Check if connection token is expired"""
        session = self.db_manager.get_session()
        try:
            connection = session.query(PlatformConnection).filter(
                PlatformConnection.id == connection_id
            ).first()
            
            if not connection or not connection.token_expires_at:
                return True
            
            return datetime.utcnow() > connection.token_expires_at
            
        except SQLAlchemyError as e:
            logger.error(f"Failed to check token expiry for connection {connection_id}: {e}")
            return True
        finally:
            self.db_manager.close_session(session)

class ScanResultManager:
    """Manages scan result storage and retrieval"""
    
    def __init__(self):
        self.db_manager = DatabaseManager()
    
    def store_scan_result(self, user_id: int, scan_data: Dict[str, Any], 
                         connection_id: int = None) -> int:
        """Store scan result in database"""
        session = self.db_manager.get_session()
        try:
            # Extract metrics from scan data
            total_risks = len(scan_data.get('risks', []))
            critical_risks = len([r for r in scan_data.get('risks', []) if r.get('severity') == 'critical'])
            high_risks = len([r for r in scan_data.get('risks', []) if r.get('severity') == 'high'])
            medium_risks = len([r for r in scan_data.get('risks', []) if r.get('severity') == 'medium'])
            low_risks = len([r for r in scan_data.get('risks', []) if r.get('severity') == 'low'])
            
            # Determine scan type
            scan_type = 'python_file'
            if connection_id:
                connection = session.query(PlatformConnection).filter(
                    PlatformConnection.id == connection_id
                ).first()
                if connection:
                    scan_type = f"{connection.platform_type}_workflow"
            
            # Create scan result
            scan_result = ScanResult(
                user_id=user_id,
                connection_id=connection_id,
                scan_type=scan_type,
                scan_name=scan_data.get('scanName', 'Unknown Scan'),
                source_file_path=scan_data.get('file_path'),
                workflow_id=scan_data.get('workflow_id'),
                workflow_name=scan_data.get('workflow_name'),
                scan_data=json.dumps(scan_data),
                total_files=scan_data.get('totalFiles', 1),
                lines_of_code=scan_data.get('linesOfCode', 0),
                total_risks=total_risks,
                critical_risks=critical_risks,
                high_risks=high_risks,
                medium_risks=medium_risks,
                low_risks=low_risks,
                scan_started_at=datetime.fromisoformat(scan_data.get('scanCreated', datetime.utcnow().isoformat())),
                scan_completed_at=datetime.fromisoformat(scan_data.get('scanCompleted', datetime.utcnow().isoformat()))
            )
            
            session.add(scan_result)
            session.commit()
            scan_id = scan_result.id
            
            logger.info(f"Stored scan result {scan_id} for user {user_id}")
            return scan_id
            
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Failed to store scan result: {e}")
            raise
        finally:
            self.db_manager.close_session(session)
    
    def get_user_scan_results(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get scan results for a user"""
        session = self.db_manager.get_session()
        try:
            scan_results = session.query(ScanResult).filter(
                ScanResult.user_id == user_id
            ).order_by(ScanResult.created_at.desc()).limit(limit).all()
            
            return [scan.to_dict() for scan in scan_results]
            
        except SQLAlchemyError as e:
            logger.error(f"Failed to get scan results for user {user_id}: {e}")
            return []
        finally:
            self.db_manager.close_session(session)
    
    def get_scan_by_id(self, scan_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get specific scan result by ID for a specific user"""
        session = self.db_manager.get_session()
        try:
            scan_result = session.query(ScanResult).filter(
                ScanResult.id == scan_id,
                ScanResult.user_id == user_id
            ).first()
            
            if not scan_result:
                return None
            
            return scan_result.to_dict()
            
        except SQLAlchemyError as e:
            logger.error(f"Failed to get scan result {scan_id} for user {user_id}: {e}")
            return None
        finally:
            self.db_manager.close_session(session)


