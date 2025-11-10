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
  features: UserFeature[];             // ✅ Correct type: UserFeature[]
  loading: boolean;
  loginUser: (loginPayload: LoginPayload) => Promise<void>;
  logoutUser: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
  // Feature-based methods
  hasFeature: (featureCode: string) => boolean;
  hasAnyFeature: (featureCodes: string[]) => boolean;
  getActiveFeatures: () => UserFeature[];
  getAccessibleFeatureCodes: () => string[];
  shouldRedirectToPayments: (featureCode: string) => boolean;
  getFeatureExpiryInfo: (featureCode: string) => any;
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
  status: string; // 'active', 'inactive', 'upcoming', 'deprecated'
}

export interface UserFeature {
  id: number;
  feature: Feature;                    // ✅ Nested Feature object
  is_active: boolean;                  // ✅ Boolean active status  
  activated_on: string;                // ✅ ISO date string
  expires_on: string | null;           // ✅ ISO date string or null
}

export interface ToggleFeaturePayload {
  user_id: number;
  feature_id: number;
  is_active: boolean;
}