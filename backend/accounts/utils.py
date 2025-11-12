# Utility functions for user accounts


def get_user_phone_number(user):
    """Get user's phone number from CustomUser model if available"""
    try:
        if hasattr(user, 'custom_user') and user.custom_user:
            phone = user.custom_user.phone_number
            return phone if phone else ''
        return ''
    except Exception:
        return ''


def get_user_full_name(user):
    """Get user's full name or fallback to username"""
    full_name = f'{user.first_name} {user.last_name}'.strip()
    return full_name if full_name else user.username