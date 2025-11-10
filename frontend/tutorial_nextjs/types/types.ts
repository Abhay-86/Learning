export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  features: any[];
  // featuresLoading: boolean;
  loading: boolean;
  loginUser: (loginPayload: LoginPayload) => Promise<void>;
  logoutUser: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface SendOTPPayload {
  email: string;
}

export interface VerifyOTPPayload {
  email: string;
  otp: string;
}

export interface OTPResponse {
  message: string;
}

export interface Feature {
  id: number;
  name: string;
  code: string;
  description: string;
  status: string; 
}

export interface UserFeature {
  id: number;
  feature: Feature;
  is_active: boolean;
  activated_on: string; // ISO date string
  expires_on: string | null; // ISO date string or null
}

export interface ToggleFeaturePayload {
  user_id: number;
  feature_id: number;
  is_active: boolean;
}