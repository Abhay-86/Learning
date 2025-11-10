"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { featureUtils } from "@/lib/featureUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Zap, Clock } from "lucide-react";
import Link from "next/link";

interface ProductRouteGuardProps {
  children: React.ReactNode;
  requiredFeature: string;
  productName?: string;
  redirectOnNoAccess?: boolean;
  fallbackComponent?: React.ReactNode;
}

export function ProductRouteGuard({ 
  children, 
  requiredFeature, 
  productName,
  redirectOnNoAccess = false,
  fallbackComponent 
}: ProductRouteGuardProps) {
  const { features, loading, user, getFeatureExpiryInfo } = useAuth();
  const router = useRouter();

  const displayName = productName || featureUtils.getFeatureDisplayName(requiredFeature);

  useEffect(() => {
    if (loading) return; // Wait for loading to complete

    // If user not logged in, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check feature access
    const hasAccess = featureUtils.hasFeatureAccess(features, requiredFeature);
    
    if (!hasAccess && redirectOnNoAccess) {
      // Redirect to payments with feature context
      router.push(`/payments?feature=${requiredFeature}&product=${encodeURIComponent(displayName)}`);
      return;
    }
  }, [user, features, loading, requiredFeature, redirectOnNoAccess, router, displayName]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Checking access to {displayName}...</p>
        </div>
      </div>
    );
  }

  // If no user, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  // Check feature access and expiry info
  const hasAccess = featureUtils.hasFeatureAccess(features, requiredFeature);
  const expiryInfo = getFeatureExpiryInfo(requiredFeature);

  // If has access, show expiry warning if needed, then render content
  if (hasAccess) {
    return (
      <>
        {/* Show expiry warning if feature expires soon */}
        {expiryInfo.daysUntilExpiry !== null && expiryInfo.daysUntilExpiry <= 7 && (
          <div className="bg-yellow-50 border-yellow-200 border px-4 py-3 rounded-md mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>{displayName}</strong> expires in {expiryInfo.daysUntilExpiry} day{expiryInfo.daysUntilExpiry !== 1 ? 's' : ''}.
                <Link href="/payments" className="underline ml-1">Renew now</Link>
              </p>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // If custom fallback provided
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Default: Show upgrade prompt with expiry info
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20">
                <Lock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-2xl mb-2">
                🔒 {displayName} Access Required
              </CardTitle>
              <CardDescription className="text-base">
                {expiryInfo.hasFeature && expiryInfo.isExpired ? (
                  <>Your <strong>{displayName}</strong> subscription has expired. Renew to continue using this feature.</>
                ) : (
                  <>You need access to <strong>{displayName}</strong> to view this content. Upgrade your plan to unlock this powerful feature!</>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              {/* Expiry info */}
              {expiryInfo.hasFeature && expiryInfo.isExpired && (
                <div className="bg-red-50 border-red-200 border px-4 py-3 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Expired:</strong> {new Date(expiryInfo.expiresOn!).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Feature benefits */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  What you'll get with {displayName}:
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {getFeatureBenefits(requiredFeature).map((benefit, index) => (
                    <div key={index} className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="group">
                  <Link href={`/payments?feature=${requiredFeature}&product=${encodeURIComponent(displayName)}`}>
                    {expiryInfo.hasFeature && expiryInfo.isExpired ? 'Renew Now' : 'Upgrade Now'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/dashboard">
                    Back to Dashboard
                  </Link>
                </Button>
              </div>

              {/* Additional info */}
              <p className="text-xs text-muted-foreground">
                Questions? <Link href="/contact" className="underline hover:text-foreground">Contact our team</Link> for help choosing the right plan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to get feature benefits
function getFeatureBenefits(featureCode: string): string[] {
  const benefits: Record<string, string[]> = {
    'crm': [
      'Manage unlimited customers and contacts',
      'Track deals and sales pipeline', 
      'Activity logging and follow-ups',
      'Sales reports and analytics'
    ],
    'ai_bot': [
      'Chat with advanced AI models (GPT-4, Claude, Gemini)',
      'Multiple conversation sessions',
      'Custom AI preferences and settings',
      'Conversation history and export'
    ],
    'email_service': [
      'Send unlimited marketing emails',
      'Professional email templates',
      'Automated email campaigns',
      'Detailed analytics and tracking'
    ],
    'time_travel': [
      'Access historical data snapshots',
      'Time-based analytics and insights', 
      'Data recovery and restoration',
      'Temporal workflow management'
    ],
    'test': [
      'Full testing suite access',
      'Advanced testing tools',
      'Performance monitoring',
      'Test automation features'
    ]
  };

  return benefits[featureCode] || ['Premium feature access', 'Advanced functionality', 'Priority support'];
}

// Convenience components for specific products
export function CRMRouteGuard({ children, ...props }: Omit<ProductRouteGuardProps, 'requiredFeature'>) {
  return (
    <ProductRouteGuard requiredFeature="crm" productName="CRM System" {...props}>
      {children}
    </ProductRouteGuard>
  );
}

export function AIBotRouteGuard({ children, ...props }: Omit<ProductRouteGuardProps, 'requiredFeature'>) {
  return (
    <ProductRouteGuard requiredFeature="ai_bot" productName="AI Bot Assistant" {...props}>
      {children}
    </ProductRouteGuard>
  );
}