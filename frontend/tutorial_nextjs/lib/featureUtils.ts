import { UserFeature } from '@/types/types';

export class FeatureUtils {
  /**
   * Check if user has access to a specific feature by code
   * @param userFeatures Array of UserFeature objects from API
   * @param featureCode Feature code to check (e.g., 'crm', 'ai_bot')
   * @returns boolean indicating access
   */
  hasFeatureAccess(userFeatures: UserFeature[], featureCode: string): boolean {
    if (!userFeatures || userFeatures.length === 0) return false;
    
    // Find the user feature by the nested feature.code
    const userFeature = userFeatures.find(uf => 
      uf.feature.code === featureCode && uf.is_active
    );
    
    if (!userFeature) return false;
    
    // Check if feature is not expired
    if (userFeature.expires_on) {
      const expiryDate = new Date(userFeature.expires_on);
      const now = new Date();
      if (now > expiryDate) return false;
    }
    
    return true;
  }

  /**
   * Get user's active and valid features only
   * @return array of active UserFeature objects
   */
  getActiveFeatures(userFeatures: UserFeature[]): UserFeature[] {
    return userFeatures.filter(uf => {
      if (!uf.is_active) return false;
      
      // Check expiry
      if (uf.expires_on) {
        const expiryDate = new Date(uf.expires_on);
        const now = new Date();
        return now <= expiryDate;
      }
      
      return true;
    });
  }

  /**
   * Get feature codes that user has access to
   * @return array of feature codes
   */
  getAccessibleFeatureCodes(userFeatures: UserFeature[]): string[] {
    return this.getActiveFeatures(userFeatures).map(uf => uf.feature.code);
  }

  /**
   * Check multiple feature access at once
   * @return true if user has access to any of the features
   */
  hasAnyFeatureAccess(userFeatures: UserFeature[], featureCodes: string[]): boolean {
    return featureCodes.some(code => this.hasFeatureAccess(userFeatures, code));
  }

  /**
   * Get UserFeature object by feature code
   * @return UserFeature or null if not found
   */
  getUserFeatureByCode(userFeatures: UserFeature[], featureCode: string): UserFeature | null {
    return userFeatures.find(uf => uf.feature.code === featureCode) || null;
  }

  /**
   * Check if user should be redirected to payments for a feature
   * @return true if user lacks access to the feature
   */
  shouldRedirectToPayments(userFeatures: UserFeature[], featureCode: string): boolean {
    return !this.hasFeatureAccess(userFeatures, featureCode);
  }

  /**
   * Get feature display name by code
   * @return friendly name for the feature
   */
  getFeatureDisplayName(featureCode: string): string {
    const featureNames: Record<string, string> = {
      'crm': 'CRM System',
      'ai_bot': 'AI Bot Assistant',
      'email_service': 'Email Marketing',
      'time_travel': 'Time Travel Analytics',
      // 'test': 'Test Environment'
    };
    return featureNames[featureCode] || featureCode.replace('_', ' ').toUpperCase();
  }

  /**
   * Get feature expiry info
   * @return object with hasFeature, isExpired, expiresOn, daysUntilExpiry
   */
  getFeatureExpiryInfo(userFeatures: UserFeature[], featureCode: string): {
    hasFeature: boolean;
    isExpired: boolean;
    expiresOn: string | null;
    daysUntilExpiry: number | null;
  } {
    const userFeature = this.getUserFeatureByCode(userFeatures, featureCode);
    
    if (!userFeature || !userFeature.is_active) {
      return {
        hasFeature: false,
        isExpired: false,
        expiresOn: null,
        daysUntilExpiry: null
      };
    }

    if (!userFeature.expires_on) {
      // Permanent feature
      return {
        hasFeature: true,
        isExpired: false,
        expiresOn: null,
        daysUntilExpiry: null
      };
    }

    const expiryDate = new Date(userFeature.expires_on);
    const now = new Date();
    const isExpired = now > expiryDate;
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      hasFeature: true,
      isExpired,
      expiresOn: userFeature.expires_on,
      daysUntilExpiry: isExpired ? 0 : daysUntilExpiry
    };
  }
}

export const featureUtils = new FeatureUtils();