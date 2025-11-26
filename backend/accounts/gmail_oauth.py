"""
Gmail OAuth Service
Handles Gmail-specific OAuth flow for requesting and storing refresh tokens
"""
from urllib.parse import urlencode
from django.conf import settings
import requests


class GmailOAuthService:
    """Service for Gmail OAuth operations"""
    
    GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send"
    TOKEN_URI = "https://oauth2.googleapis.com/token"
    AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth"
    
    @classmethod
    def generate_auth_url(cls, user_id: int, redirect_uri: str) -> str:
        """
        Generate Gmail OAuth authorization URL
        
        Args:
            user_id: User ID to track in state parameter
            redirect_uri: Callback URL for OAuth flow
            
        Returns:
            str: Google OAuth authorization URL
        """
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": cls.GMAIL_SCOPE,
            "access_type": "offline",  # Required for refresh token
            "prompt": "consent",       # Force consent screen to get refresh token
            "state": str(user_id),     # Track which user is authorizing
        }
        return f"{cls.AUTH_URI}?{urlencode(params)}"
    
    @classmethod
    def exchange_code_for_token(cls, code: str, redirect_uri: str) -> dict:
        """
        Exchange authorization code for access and refresh tokens
        
        Args:
            code: Authorization code from Google
            redirect_uri: Same redirect URI used in auth request
            
        Returns:
            dict: Token data including refresh_token
            
        Raises:
            Exception: If token exchange fails
        """
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        
        response = requests.post(cls.TOKEN_URI, data=data)
        response.raise_for_status()
        return response.json()
