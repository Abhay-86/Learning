"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createOrder, getUserWallet, getOrderStatus } from "@/services/payments/paymentApi";
import type { CreateOrderResponse, PaymentOrder, UserWallet } from "@/services/payments/paymentApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Coins, CreditCard, QrCode, CheckCircle, XCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentStep = 'amount' | 'payment' | 'processing' | 'success' | 'failed';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Query params
  const feature = searchParams.get("feature");
  const product = searchParams.get("product");

  // State
  const [currentStep, setCurrentStep] = useState<PaymentStep>('amount');
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState<boolean>(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => setError('Failed to load Razorpay. Please refresh the page.');
      document.body.appendChild(script);
    };

    if (!window.Razorpay) {
      loadRazorpay();
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  // Load user wallet
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await getUserWallet();
        setWallet(response.wallet);
      } catch (err) {
        console.error('Failed to load wallet:', err);
      }
    };

    if (user) {
      fetchWallet();
    }
  }, [user]);

  const handleCreateOrder = async () => {
    if (!user) {
      setError('Please login to continue');
      return;
    }

    if (amount < 10) {
      setError('Minimum amount is ₹10');
      return;
    }

    if (amount > 50000) {
      setError('Maximum amount is ₹50,000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response: CreateOrderResponse = await createOrder({ amount });
      setCurrentOrder(response.order);
      setSuccess(`Order created! You will receive ${response.order.coins_to_credit} coins after payment.`);
      setCurrentStep('payment');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!currentOrder || !razorpayLoaded) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', // Your Razorpay key ID
      amount: parseInt(currentOrder.amount) * 100, // Amount in paise
      currency: currentOrder.currency,
      name: 'Coin Purchase',
      description: `Purchase ${currentOrder.coins_to_credit} coins for ₹${currentOrder.amount}`,
      order_id: currentOrder.razorpay_order_id,
      handler: async (response: any) => {
        setCurrentStep('processing');
        await handlePaymentSuccess(response);
      },
      modal: {
        ondismiss: () => {
          setError('Payment cancelled by user');
        }
      },
      prefill: {
        name: `${user?.first_name} ${user?.last_name}`,
        email: user?.email,
        contact: user?.phone_number || ''
      },
      theme: {
        color: '#3b82f6'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      setError(`Payment failed: ${response.error.description}`);
      setCurrentStep('failed');
    });

    rzp.open();
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      // Here you would typically verify the payment with your backend
      // For now, we'll simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check order status
      const statusResponse = await getOrderStatus(currentOrder!.order_id);
      
      if (statusResponse.success) {
        setSuccess(`Payment successful! ${currentOrder!.coins_to_credit} coins have been added to your wallet.`);
        setCurrentStep('success');
        
        // Refresh wallet data
        const walletResponse = await getUserWallet();
        setWallet(walletResponse.wallet);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err) {
      setError('Payment verification failed. Please contact support.');
      setCurrentStep('failed');
    }
  };

  const handleUPIPayment = () => {
    if (currentOrder?.upi_payment_url) {
      window.open(currentOrder.upi_payment_url, '_blank');
      setCurrentStep('processing');
    }
  };

  const resetPayment = () => {
    setCurrentStep('amount');
    setCurrentOrder(null);
    setError('');
    setSuccess('');
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Please login to access the payment page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Purchase Coins</h1>
        <p className="text-muted-foreground">
          Buy coins to unlock premium features. 1 INR = 1 Coin
        </p>
        {(feature || product) && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm">
              {feature && <span><strong>Feature:</strong> {feature}</span>}
              {product && <span><strong>Product:</strong> {product}</span>}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wallet ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-green-600">{wallet.coin_balance} coins</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p>{wallet.total_coins_earned} coins</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Money Spent</p>
                  <p>₹{wallet.total_money_spent}</p>
                </div>
              </div>
            ) : (
              <p>Loading wallet...</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 'amount' && 'Select Amount'}
              {currentStep === 'payment' && 'Choose Payment Method'}
              {currentStep === 'processing' && 'Processing Payment'}
              {currentStep === 'success' && 'Payment Successful'}
              {currentStep === 'failed' && 'Payment Failed'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'amount' && 'Enter the amount you want to spend on coins'}
              {currentStep === 'payment' && 'Complete your payment to receive coins'}
              {currentStep === 'processing' && 'Please wait while we process your payment'}
              {currentStep === 'success' && 'Your coins have been added to your wallet'}
              {currentStep === 'failed' && 'Something went wrong with your payment'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Amount Selection */}
            {currentStep === 'amount' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="10"
                    max="50000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You will receive {amount} coins
                  </p>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[100, 500, 1000, 2000, 5000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(amt)}
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>

                <Button 
                  onClick={handleCreateOrder} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    `Create Order for ₹${amount}`
                  )}
                </Button>
              </div>
            )}

            {/* Payment Methods */}
            {currentStep === 'payment' && currentOrder && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm">
                    <strong>Order Created:</strong> ₹{currentOrder.amount} for {currentOrder.coins_to_credit} coins
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleRazorpayPayment}
                    disabled={!razorpayLoaded}
                    className="w-full"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay with Razorpay
                  </Button>

                  <Button 
                    onClick={handleUPIPayment}
                    variant="outline"
                    className="w-full"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Pay with UPI
                  </Button>
                </div>

                {currentOrder.qr_code && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Or scan QR code:</p>
                    <img 
                      src={currentOrder.qr_code} 
                      alt="Payment QR Code"
                      className="mx-auto max-w-48 h-auto border rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Processing */}
            {currentStep === 'processing' && (
              <div className="text-center space-y-4">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p>Processing your payment...</p>
                <p className="text-sm text-muted-foreground">
                  Please do not close this window
                </p>
              </div>
            )}

            {/* Success */}
            {currentStep === 'success' && (
              <div className="text-center space-y-4">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <p className="text-green-600 font-medium">Payment Successful!</p>
                <div className="space-y-2">
                  <Button onClick={goToDashboard} className="w-full">
                    Go to Dashboard
                  </Button>
                  <Button onClick={resetPayment} variant="outline" className="w-full">
                    Make Another Purchase
                  </Button>
                </div>
              </div>
            )}

            {/* Failed */}
            {currentStep === 'failed' && (
              <div className="text-center space-y-4">
                <XCircle className="mx-auto h-12 w-12 text-red-600" />
                <p className="text-red-600 font-medium">Payment Failed</p>
                <Button onClick={resetPayment} className="w-full">
                  Try Again
                </Button>
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
              <Alert className="mt-4">
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && currentStep !== 'success' && (
              <Alert className="mt-4">
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
