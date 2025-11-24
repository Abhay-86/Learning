"""
Google OAuth Authentication Utilities

This module provides utilities for verifying Google OAuth tokens
and extracting user information from Google's authentication service.
"""

from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed


def verify_google_token(token: str) -> dict:
    """
    Verify a Google ID token and return the payload.
    
    Args:
        token (str): The Google ID token to verify
        
    Returns:
        dict: The decoded token payload containing user information
        
    Raises:
        AuthenticationFailed: If the token is invalid or expired
    """
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        # Verify the token is issued for our app
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise AuthenticationFailed('Invalid token issuer')
        
        return idinfo
        
    except ValueError as e:
        # Invalid token
        raise AuthenticationFailed(f'Invalid Google token: {str(e)}')
    except Exception as e:
        raise AuthenticationFailed(f'Error verifying token: {str(e)}')


def get_user_info_from_google(token: str) -> dict:
    """
    Extract user information from a verified Google token.
    
    Args:
        token (str): The Google ID token
        
    Returns:
        dict: User information containing email, name, etc.
    """
    idinfo = verify_google_token(token)
    
    return {
        'email': idinfo.get('email'),
        'first_name': idinfo.get('given_name', ''),
        'last_name': idinfo.get('family_name', ''),
        'google_id': idinfo.get('sub'),  # Google's unique user ID
        'email_verified': idinfo.get('email_verified', False),
        'picture': idinfo.get('picture', ''),
    }
