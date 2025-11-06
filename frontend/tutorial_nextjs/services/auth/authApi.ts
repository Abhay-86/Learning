import axiosInstance from "@/utils/axiosInstance";
import { User, LoginPayload, RegisterPayload } from "@/types/types";

export async function login(loginPayload: LoginPayload): Promise<User> {
    const response = await axiosInstance.post("accounts/login/", loginPayload);
    return response.data;
}

export async function userProfile(): Promise<User> {
    const response = await axiosInstance.get("/accounts/profile/");
    return response.data;
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

