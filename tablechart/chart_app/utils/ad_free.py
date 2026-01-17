"""
Ad-free session management utilities for donor verification.

This module provides functions for:
- Loading and caching the donor list from JSON file
- Validating email addresses
- Verifying donor emails against the list
"""

import json
import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Optional

from django.conf import settings

# Configure logging
logger = logging.getLogger(__name__)

# Email validation regex (RFC 5322 simplified)
EMAIL_REGEX = re.compile(r'^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$', re.IGNORECASE)


@lru_cache(maxsize=1)
def load_donor_list(file_mtime: float) -> dict:
    """
    Load and cache donor list from JSON file.
    
    Cache key is file modification time, so cache automatically
    invalidates when file changes.
    
    Args:
        file_mtime: File modification timestamp (used as cache key)
        
    Returns:
        Dictionary with 'donors' list and optional 'godmode_email'
        
    Raises:
        FileNotFoundError: If donor list file doesn't exist
        json.JSONDecodeError: If file contains invalid JSON
    """
    donor_list_path = Path(settings.DONATION_LIST_PATH)
    
    if not donor_list_path.is_absolute():
        # Make path relative to Django project root
        donor_list_path = Path(settings.BASE_DIR).parent / settings.DONATION_LIST_PATH
    
    logger.info(f"Loading donor list from {donor_list_path}")
    
    with open(donor_list_path, 'r') as f:
        data = json.load(f)
    
    logger.info(f"Loaded {len(data.get('donors', []))} donors from file")
    return data


def get_donor_list() -> dict:
    """
    Get donor list with automatic cache invalidation on file change.
    
    Returns:
        Dictionary with 'donors' list and optional 'godmode_email'
        Empty dict with empty donors list if file missing/corrupted
    """
    try:
        donor_list_path = Path(settings.DONATION_LIST_PATH)
        
        if not donor_list_path.is_absolute():
            donor_list_path = Path(settings.BASE_DIR).parent / settings.DONATION_LIST_PATH
        
        # Get file modification time as cache key
        mtime = donor_list_path.stat().st_mtime
        return load_donor_list(mtime)
        
    except FileNotFoundError:
        logger.error(f"Donor list file not found: {settings.DONATION_LIST_PATH}")
        return {"donors": [], "godmode_email": settings.GODMODE_EMAIL}
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in donor list: {e}")
        return {"donors": [], "godmode_email": settings.GODMODE_EMAIL}
        
    except Exception as e:
        logger.error(f"Unexpected error loading donor list: {e}")
        return {"donors": [], "godmode_email": settings.GODMODE_EMAIL}


def validate_email(email: str) -> Optional[str]:
    """
    Validate and normalize email address.
    
    Args:
        email: Email address to validate
        
    Returns:
        Normalized email (lowercase, trimmed) if valid, None if invalid
    """
    if not email:
        return None
    
    # Normalize: trim whitespace and convert to lowercase
    email = email.strip().lower()
    
    # Validate format
    if not EMAIL_REGEX.match(email):
        return None
    
    return email


def verify_donor_email(email: str) -> bool:
    """
    Check if email exists in donor list or matches godmode email.
    
    Args:
        email: Email address to verify
        
    Returns:
        True if email is verified donor or godmode, False otherwise
    """
    # Validate and normalize email
    email_normalized = validate_email(email)
    
    if not email_normalized:
        logger.warning(f"Email verification failed: invalid format - {email}")
        return False
    
    # Check godmode email first
    godmode = settings.GODMODE_EMAIL.strip().lower()
    if email_normalized == godmode:
        logger.info(f"Email verification success (godmode): {email_normalized}")
        return True
    
    # Load donor list (cached)
    donor_list = get_donor_list()
    
    # Check if email exists in donor list
    for donor in donor_list.get('donors', []):
        if donor.get('email', '').strip().lower() == email_normalized:
            logger.info(f"Email verification success: {email_normalized}")
            return True
    
    logger.info(f"Email verification failed: email not found - {email_normalized}")
    return False
