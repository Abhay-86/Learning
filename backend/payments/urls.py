from django.urls import path
from .views import (
    CreateOrderView, 
    UserWalletView, 
    VerifyPaymentView, 
    OrderStatusView, 
    PaymentWebhookView
)

app_name = 'payments'

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('wallet/', UserWalletView.as_view(), name='user-wallet'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('order-status/<str:order_id>/', OrderStatusView.as_view(), name='order-status'),
    path('webhook/', PaymentWebhookView.as_view(), name='webhook'),
]