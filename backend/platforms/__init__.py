"""
Platform integration package for automation tools
Supports n8n, Zapier, Make.com and future platforms
"""

from .base_platform import BasePlatform, PlatformFactory, PlatformManager
from .n8n_client import N8nClient

__all__ = [
    'BasePlatform',
    'PlatformFactory', 
    'PlatformManager',
    'N8nClient'
]

