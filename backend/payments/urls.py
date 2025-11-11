from django.urls import path
from .views import CreateOrderView, UserWalletView

app_name = 'payments'

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='create-order'),
    path('wallet/', UserWalletView.as_view(), name='user-wallet'),
]