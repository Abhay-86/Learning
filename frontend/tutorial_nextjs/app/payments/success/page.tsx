"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get payment details from URL parameters
        const paymentId = searchParams.get('razorpay_payment_id');
        const paymentLinkId = searchParams.get('razorpay_payment_link_id');
        const signature = searchParams.get('razorpay_signature');

        if (paymentId) {
          // Payment was successful - payment link payments are auto-captured
          setStatus('success');
          setMessage('Payment successful! Your wallet has been updated with the purchased coins.');
        } else {
          // No payment ID found, might be cancelled or failed
          setStatus('failed');
          setMessage('Payment was not completed. Please try again.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('failed');
        setMessage('Unable to verify payment status. Please contact support if money was deducted.');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'checking' && <Loader2 className="h-16 w-16 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-16 w-16 text-green-600" />}
            {status === 'failed' && <AlertCircle className="h-16 w-16 text-red-600" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'checking' && 'Checking Payment Status...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
          {status !== 'checking' && (
            <CardDescription className="text-lg mt-2">
              {message}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your coins have been added to your wallet successfully!
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'failed' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            {status === 'success' && (
              <>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
                <Button 
                  onClick={() => router.push('/payments')}
                  variant="outline"
                  className="flex-1"
                >
                  Buy More Coins
                </Button>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <Button 
                  onClick={() => router.push('/payments')}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="flex-1"
                >
                  Dashboard
                </Button>
              </>
            )}
            
            {status === 'checking' && (
              <Button 
                disabled
                className="w-full"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}