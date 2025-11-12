import axiosInstance from "@/utils/axiosInstance";
import { User, LoginPayload, RegisterPayload, SendOTPPayload, VerifyOTPPayload, OTPResponse } from "@/types/types";

export async function login(loginPayload: LoginPayload): Promise<User> {
    const response = await axiosInstance.post("accounts/login/", loginPayload);
    return response.data.user; // Extract the user object from the login response
}

export async function userProfile(): Promise<User> {
    const response = await axiosInstance.get("/accounts/profile/");
    return response.data.user; // Extract the user object from the response
}

export async function refreshToken(): Promise<void> {
    await axiosInstance.post("accounts/refresh/");
}

export async function registerUser(registerPayload: RegisterPayload): Promise<User> {
    const response = await axiosInstance.post("accounts/register/", registerPayload);
    return response.data;
}

export async function logout(): Promise<void> {
    await axiosInstance.post("accounts/logout/");
}

export async function sendOTP(sendOTPPayload: SendOTPPayload): Promise<OTPResponse> {
    const response = await axiosInstance.post("accounts/send-email/", sendOTPPayload);
    return response.data;
}

export async function verifyOTP(verifyOTPPayload: VerifyOTPPayload): Promise<OTPResponse> {
    const response = await axiosInstance.post("accounts/verify-email/", verifyOTPPayload);
    return response.data;
}

export async function getDashboardData(): Promise<any> {
    const response = await axiosInstance.get("/accounts/dashboard/");
    return response.data.dashboard;
}

