export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
  is_verified: boolean;
  // Wallet information
  coin_balance: number;
  total_coins_earned: number;
  total_coins_spent: number;
  total_money_spent: string;
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
  loginWithGoogle: (credential: string) => Promise<void>;
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

// Referly Types
export interface Template {
  id: number;
  user_id: number;
  name: string;
  html_content: string;
  created_at: string;
  updated_at: string;
  size: number;
}

export interface Resume {
  id: number;
  user_id: number;
  name: string;
  file_extension: string;
  file_size: number;
  display_name: string;
  size_formatted: string;
  created_at: string;
  updated_at: string;
}

export interface UserQuota {
  max_templates: number;
  max_resumes: number;
  current_templates: number;
  current_resumes: number;
  can_create_template: boolean;
  can_create_resume: boolean;
  templates_remaining: number;
  resumes_remaining: number;
}

export interface FolderItem {
  id: string;
  user_id?: number;
  name: string;
  display_name?: string;
  type: 'file' | 'folder';
  extension?: string;
  created_at?: string;
  updated_at?: string;
  size?: number;
  size_formatted?: string;
}

export interface FolderStructure {
  name: string;
  type: 'folder';
  id?: string;
  usage?: string;
  can_create?: boolean;
  children: FolderItem[];
}

export interface TemplateCreatePayload {
  name: string;
  html_content: string;
}

export interface TemplateUpdatePayload {
  html_content: string;
}

export interface ResumeUploadPayload {
  name: string;
  file: File;
}

export interface ResumePreview {
  id: number;
  name: string;
  file_extension: string;
  base64_content: string;
  mime_type: string;
  file_size: number;
}


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
    error?: string;
  };
  payment_link: {
    url: string | null;
    id: string | null;
    available: boolean;
  };
  razorpay_hosted_url?: string;
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