import  axiosInstance  from "@/utils/axiosInstance"; 
import { Feature, UserFeature } from "@/types/types";

// Get all features (admin/global view)
export async function getAllFeatures(): Promise<Feature[]> {
  const response = await axiosInstance.get("/features/");
  return response.data;
}

// Get current user's features
export async function getUserFeatures(): Promise<UserFeature[]> {
  const response = await axiosInstance.get("/user/features/");
  return response.data;
}

// Admin: toggle user feature (activate/deactivate)
export async function toggleUserFeature(data: { user_id: number; feature_id: number; is_active: boolean }) {
  const response = await axiosInstance.post("/features/toggle/", data);
  return response.data;
}
