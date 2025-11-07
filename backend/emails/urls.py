from django.urls import path
from .views import SendTemplateEmailView, BulkSendEmailView

urlpatterns = [
    path('send/', SendTemplateEmailView.as_view(), name='send-template-email'),
    path('send-bulk/', BulkSendEmailView.as_view(), name='bulk-send-email'),
]
