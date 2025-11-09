from django.contrib import admin
from .models import Feature, UserFeature

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(UserFeature)
class UserFeatureAdmin(admin.ModelAdmin):
    list_display = ('user', 'feature', 'is_active', 'expires_on')
