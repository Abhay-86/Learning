import axiosInstance from "@/utils/axiosInstance";

export interface CreateOrderPayload {
  amount: number;
}

export interface PaymentOrder {
  order_id: string;
  razorpay_order_id: string;
  amount: string;
  coins_to_credit: number;
  currency: string;
  status: string;
  payment_method: string;
  razorpay_qr_code_id?: string;
  qr_code_image_url?: string;
  qr_code_status?: string;
  created_at: string;
  expires_at: string;
}

export interface PaymentOptions {
  razorpay_checkout: {
    order_id: string;
    amount: number;
    currency: string;
    description: string;
  };
  qr_code: {
    qr_code_id: string | null;
    qr_image_url: string | null;
    status: string | null;
    available: boolean;
  };
  payment_link?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: PaymentOrder;
  razorpay_key_id: string;
  exchange_rate: string;
  payment_options: PaymentOptions;
}

export interface VerifyPaymentPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface UserWallet {
  coin_balance: number;
  total_coins_earned: number;
  total_coins_spent: number;
  total_money_spent: string;
  created_at: string;
  updated_at: string;
}

export async function createOrder(orderPayload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const response = await axiosInstance.post("/payments/create-order/", orderPayload);
  return response.data;
}

export async function getUserWallet(): Promise<{ success: boolean; wallet: UserWallet }> {
  const response = await axiosInstance.get("/payments/wallet/");
  return response.data;
}

export async function verifyPayment(verifyPayload: VerifyPaymentPayload): Promise<any> {
  const response = await axiosInstance.post("/payments/verify-payment/", verifyPayload);
  return response.data;
}

export async function getOrderStatus(orderId: string): Promise<any> {
  const response = await axiosInstance.get(`/payments/order-status/${orderId}/`);
  return response.data;
}