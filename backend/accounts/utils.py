# Product and Feature Management Utilities

# Product/Feature bit positions
FEATURES = {
    'AI_CHATBOT': 0,        # 2^0 = 1
    'CRM': 1,               # 2^1 = 2  
    'ANALYTICS': 2,         # 2^2 = 4
    'PROJECT_MGMT': 3,      # 2^3 = 8
    'EMAIL_MARKETING': 4,   # 2^4 = 16
    'FILE_STORAGE': 5,      # 2^5 = 32
    'API_ACCESS': 6,        # 2^6 = 64
    'WHITE_LABEL': 7,       # 2^7 = 128
}

# Available products with metadata
PRODUCTS = [
    {
        'id': 'AI_CHATBOT',
        'name': 'AI Chatbot',
        'description': 'Intelligent conversational AI for customer support',
        'icon': 'MessageCircle',
        'route': '/dashboard/ai-chatbot',
        'color': 'blue',
        'bit_position': FEATURES['AI_CHATBOT'],
        'status': 'beta'
    },
    {
        'id': 'CRM',
        'name': 'CRM System',
        'description': 'Customer relationship management and sales pipeline',
        'icon': 'Users',
        'route': '/dashboard/crm',
        'color': 'green',
        'bit_position': FEATURES['CRM'],
        'status': 'active'
    },
    {
        'id': 'ANALYTICS',
        'name': 'Analytics Dashboard',
        'description': 'Advanced analytics and business intelligence',
        'icon': 'BarChart3',
        'route': '/dashboard/analytics',
        'color': 'purple',
        'bit_position': FEATURES['ANALYTICS'],
        'status': 'active'
    },
    {
        'id': 'PROJECT_MGMT',
        'name': 'Project Management',
        'description': 'Task management and project collaboration tools',
        'icon': 'FolderKanban',
        'route': '/dashboard/projects',
        'color': 'orange',
        'bit_position': FEATURES['PROJECT_MGMT'],
        'status': 'coming_soon'
    },
    {
        'id': 'EMAIL_MARKETING',
        'name': 'Email Marketing',
        'description': 'Email campaigns and marketing automation',
        'icon': 'Mail',
        'route': '/dashboard/email-marketing',
        'color': 'red',
        'bit_position': FEATURES['EMAIL_MARKETING'],
        'status': 'coming_soon'
    },
    {
        'id': 'FILE_STORAGE',
        'name': 'File Storage',
        'description': 'Secure cloud storage and file management',
        'icon': 'HardDrive',
        'route': '/dashboard/storage',
        'color': 'indigo',
        'bit_position': FEATURES['FILE_STORAGE'],
        'status': 'coming_soon'
    }
]

# Feature utility functions
def has_feature(user_features: int, feature_name: str) -> bool:
    """Check if user has a specific feature enabled"""
    if feature_name not in FEATURES:
        return False
    bit_position = FEATURES[feature_name]
    return bool(user_features & (1 << bit_position))

def enable_feature(user_features: int, feature_name: str) -> int:
    """Enable a feature for user"""
    if feature_name not in FEATURES:
        return user_features
    bit_position = FEATURES[feature_name]
    return user_features | (1 << bit_position)

def disable_feature(user_features: int, feature_name: str) -> int:
    """Disable a feature for user"""
    if feature_name not in FEATURES:
        return user_features
    bit_position = FEATURES[feature_name]
    return user_features & ~(1 << bit_position)

def get_enabled_features(user_features: int) -> list:
    """Get list of enabled feature names"""
    enabled = []
    for feature_name, bit_position in FEATURES.items():
        if user_features & (1 << bit_position):
            enabled.append(feature_name)
    return enabled

def get_user_products(user_features: int) -> list:
    """Get products available to user based on enabled features"""
    enabled_features = get_enabled_features(user_features)
    available_products = []
    
    for product in PRODUCTS:
        if product['id'] in enabled_features:
            available_products.append(product)
    
    return available_products

def get_default_features_for_role(role: str) -> int:
    """Get default features for a user role"""
    defaults = {
        'USER': enable_feature(0, 'AI_CHATBOT'),  # Basic users get chatbot only
        'MANAGER': enable_feature(enable_feature(0, 'AI_CHATBOT'), 'CRM'),  # Managers get chatbot + CRM
        'ADMIN': 255  # Admins get all features (first 8 features)
    }
    return defaults.get(role, 0)

def feature_to_decimal(*feature_names) -> int:
    """Convert feature names to decimal representation"""
    result = 0
    for feature_name in feature_names:
        result = enable_feature(result, feature_name)
    return result