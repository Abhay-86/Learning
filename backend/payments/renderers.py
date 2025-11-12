from rest_framework.renderers import JSONRenderer
from decimal import Decimal
import json


class DecimalSafeJSONRenderer(JSONRenderer):
    """Custom JSON renderer that handles Decimal objects"""
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render `data` into JSON, handling Decimal objects by converting them to float.
        """
        if data is None:
            return b''

        # Convert data to handle Decimal objects
        data = self._convert_decimals(data)
        
        return super().render(data, accepted_media_type, renderer_context)
    
    def _convert_decimals(self, obj):
        """Recursively convert Decimal objects to float"""
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {key: self._convert_decimals(value) for key, value in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._convert_decimals(item) for item in obj]
        else:
            return obj