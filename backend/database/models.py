"""
Database models for platform connections and scan results
Supports multiple automation platforms (n8n, Zapier, Make.com)
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class User(Base):
    """User model for authentication (future implementation)"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    platform_connections = relationship("PlatformConnection", back_populates="user", cascade="all, delete-orphan")
    scan_results = relationship("ScanResult", back_populates="user", cascade="all, delete-orphan")

class PlatformConnection(Base):
    """Platform connection model for storing OAuth credentials"""
    __tablename__ = 'platform_connections'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    platform_type = Column(String(50), nullable=False)  # n8n, zapier, make
    platform_instance_url = Column(String(500))  # For self-hosted instances
    platform_instance_name = Column(String(255))  # User-friendly name
    
    # OAuth credentials (encrypted)
    encrypted_access_token = Column(Text, nullable=False)
    encrypted_refresh_token = Column(Text)
    token_expires_at = Column(DateTime)
    
    # Connection metadata
    connection_status = Column(String(20), default='active')  # active, expired, revoked, error
    last_sync_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="platform_connections")
    scan_results = relationship("ScanResult", back_populates="connection", cascade="all, delete-orphan")

class ScanResult(Base):
    """Scan result model for storing analysis results"""
    __tablename__ = 'scan_results'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    connection_id = Column(Integer, ForeignKey('platform_connections.id'), nullable=True)  # Null for Python file scans
    
    # Scan metadata
    scan_type = Column(String(50), nullable=False)  # python_file, n8n_workflow, zapier_workflow, make_workflow
    scan_name = Column(String(500), nullable=False)
    
    # Source information
    source_file_path = Column(String(500))  # For Python files
    workflow_id = Column(String(255))  # For workflow platforms
    workflow_name = Column(String(500))  # For workflow platforms
    
    # Analysis results (JSON)
    scan_data = Column(Text, nullable=False)  # JSON string of complete scan results
    
    # Scan metrics
    total_files = Column(Integer, default=1)
    lines_of_code = Column(Integer, default=0)
    total_risks = Column(Integer, default=0)
    critical_risks = Column(Integer, default=0)
    high_risks = Column(Integer, default=0)
    medium_risks = Column(Integer, default=0)
    low_risks = Column(Integer, default=0)
    
    # Timestamps
    scan_started_at = Column(DateTime, default=datetime.utcnow)
    scan_completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="scan_results")
    connection = relationship("PlatformConnection", back_populates="scan_results")
    
    def to_dict(self):
        """Convert scan result to dictionary"""
        return {
            'scan_id': self.id,
            'scanName': self.scan_name,
            'scanCreated': self.scan_started_at.isoformat(),
            'scanCompleted': self.scan_completed_at.isoformat(),
            'totalFiles': self.total_files,
            'linesOfCode': self.lines_of_code,
            'scanType': self.scan_type,
            'platform': self.connection.platform_type if self.connection else None,
            'workflowId': self.workflow_id,
            'workflowName': self.workflow_name,
            'totalRisks': self.total_risks,
            'criticalRisks': self.critical_risks,
            'highRisks': self.high_risks,
            'mediumRisks': self.medium_risks,
            'lowRisks': self.low_risks,
            'scanData': json.loads(self.scan_data) if self.scan_data else {}
        }

class WorkflowCache(Base):
    """Cache for workflow data to avoid repeated API calls"""
    __tablename__ = 'workflow_cache'
    
    id = Column(Integer, primary_key=True)
    connection_id = Column(Integer, ForeignKey('platform_connections.id'), nullable=False)
    workflow_id = Column(String(255), nullable=False)
    workflow_name = Column(String(500), nullable=False)
    workflow_data = Column(Text, nullable=False)  # JSON string of workflow
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    connection = relationship("PlatformConnection")
    
    # Unique constraint
    __table_args__ = (
        {'extend_existing': True}
    )


