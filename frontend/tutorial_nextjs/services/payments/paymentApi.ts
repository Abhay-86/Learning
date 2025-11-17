import axiosInstance from "@/utils/axiosInstance";
import { CreateOrderPayload, CreateOrderResponse, UserWallet, VerifyPaymentPayload } from "@/types/types";


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