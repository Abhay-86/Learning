import axiosInstance from "@/utils/axiosInstance";
import { UserQuota } from "@/types/types";

export async function getUserQuota(): Promise<UserQuota> {
    const response = await axiosInstance.get("referly/quota/");
    return response.data;
}