import axiosInstance from "@/utils/axiosInstance";

export interface GmailAuthURLResponse {
    success: boolean;
    auth_url: string;
    message: string;
}

export interface GmailPermissionStatus {
    success: boolean;
    has_permission: boolean;
    privacy_accepted: boolean;
    granted_at: string | null;
    user_email: string;
}

/**
 * Get Gmail OAuth authorization URL
 */
export async function getGmailAuthURL(): Promise<GmailAuthURLResponse> {
    const response = await axiosInstance.get("accounts/gmail/auth-url/");
    return response.data;
}

/**
 * Check if user has granted Gmail permission
 */
export async function getGmailPermissionStatus(): Promise<GmailPermissionStatus> {
    const response = await axiosInstance.get("accounts/gmail/status/");
    return response.data;
}

/**
 * Accept Gmail privacy policy
 */
export async function acceptGmailPrivacy(): Promise<{ success: boolean; message: string; privacy_accepted: boolean }> {
    const response = await axiosInstance.post("accounts/gmail/accept-privacy/");
    return response.data;
}

/**
 * Revoke Gmail permission
 */
export async function revokeGmailPermission(): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete("accounts/gmail/status/");
    return response.data;
}
