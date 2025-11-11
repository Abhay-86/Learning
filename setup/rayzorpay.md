# Razorpay Integration Documentation

## Overview
This implementation provides a complete Razorpay integration with both hosted checkout and QR code payments.

## Features Implemented

### 1. **Razorpay Native QR Codes**
- Uses `razorpay_client.qrcode.create()` API
- QR codes are tracked by Razorpay with proper merchant details
- No more dummy "merchant@upi" details
- Real-time QR status tracking

### 2. **Razorpay Hosted Checkout**
- Official Razorpay payment UI
- Secure payment processing
- Multiple payment methods (UPI, Cards, Net Banking, etc.)

### 3. **Webhook Integration**
- Automatic payment verification via webhooks
- Real-time payment status updates
- Handles both checkout and QR payments

### 4. **Enhanced Security**
- Proper webhook signature verification
- HMAC-based payment verification
- Secure coin crediting process

## Backend Changes

### Models (`payments/models.py`)
```python
# New fields added to PaymentOrder:
razorpay_qr_code_id = models.CharField(max_length=100, blank=True, null=True)
qr_code_image_url = models.URLField(blank=True, null=True)
qr_code_status = models.CharField(max_length=20, blank=True, null=True)
payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CHECKOUT')
webhook_data = models.JSONField(default=dict, blank=True)
```

### Payment Helpers (`payments/utils/payment_helpers.py`)
- `create_razorpay_qr_code()` - Creates official Razorpay QR codes
- `get_qr_code_status()` - Checks QR payment status
- `close_qr_code()` - Deactivates QR codes

### Views (`payments/views.py`)
- **CreateOrderView**: Creates both Razorpay order and QR code
- **OrderStatusView**: Enhanced with QR status polling
- **PaymentWebhookView**: Handles all Razorpay webhooks
- **VerifyPaymentView**: Manual payment verification

## Frontend Changes

### Payment API (`services/payments/paymentApi.ts`)
```typescript
interface PaymentOptions {
  razorpay_checkout: {
    order_id: string;
    amount: number;
    currency: string;
  };
  qr_code?: {
    qr_code_id: string;
    qr_image_url: string;
    status: string;
  };
}
```

### Payment Page (`app/payments/page.tsx`)
- Uses Razorpay's hosted checkout UI
- Displays official QR codes from Razorpay
- Real-time QR payment status polling
- Improved error handling and user feedback

## Required Environment Variables

### Backend (`settings.py`)
```python
RAZORPAY_KEY_ID = config("RAZORPAY_KEY_ID", default="")
RAZORPAY_KEY_SECRET = config("RAZORPAY_KEY_SECRET", default="")
RAZORPAY_WEBHOOK_SECRET = config("RAZORPAY_WEBHOOK_SECRET", default="")
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
```

## API Endpoints

### Create Order
```
POST /api/payments/create-order/
```
**Response:**
```json
{
  "success": true,
  "order": {...},
  "razorpay_key_id": "rzp_test_xxx",
  "payment_options": {
    "razorpay_checkout": {
      "order_id": "order_xxx",
      "amount": 10000,
      "currency": "INR"
    },
    "qr_code": {
      "qr_code_id": "qr_xxx",
      "qr_image_url": "https://api.razorpay.com/v1/qr_codes/qr_xxx/qr.png",
      "status": "active"
    }
  }
}
```

### Order Status (with QR polling)
```
GET /api/payments/order-status/{order_id}/
```

### Webhook Handler
```
POST /api/payments/webhook/
```
Handles events: `payment.captured`, `qr_code.credited`, `order.paid`

## Webhook Setup in Razorpay Dashboard

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook/`
3. Select events:
   - `payment.captured`
   - `qr_code.credited` 
   - `order.paid`
4. Add webhook secret to environment variables

## Payment Flow

### Razorpay Checkout Flow:
1. User selects amount → Create order
2. Frontend opens Razorpay hosted checkout
3. User completes payment on Razorpay's UI
4. Webhook automatically updates payment status
5. Coins are credited to user wallet

### QR Code Flow:
1. User selects amount → Create order with QR code
2. Frontend displays official Razorpay QR code
3. User scans QR with any UPI app
4. Payment goes through Razorpay's system
5. Webhook or polling detects payment
6. Coins are credited to user wallet

## Migration Required

Run migrations to add new fields:
```bash
cd backend
python manage.py makemigrations payments
python manage.py migrate
```

## Security Benefits

✅ **Official Razorpay QR codes** - No dummy merchant details  
✅ **Webhook verification** - HMAC signature validation  
✅ **Real-time updates** - Automatic payment detection  
✅ **Proper merchant branding** - Shows actual business details  
✅ **Payment tracking** - All payments visible in Razorpay dashboard  
✅ **Multi-method support** - Cards, UPI, Net Banking via Razorpay UI  

## Testing

1. Set up Razorpay test credentials
2. Create test orders
3. Test both checkout and QR flows
4. Verify webhook delivery
5. Check coin crediting process

This implementation ensures all payments are properly tracked, verified, and processed through Razorpay's official systems.