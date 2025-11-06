from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that checks HttpOnly cookies for JWT tokens.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            # Try to get the token from the cookie instead of the header
            raw_token = request.COOKIES.get("access")
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
