"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserWallet } from "@/services/payments/paymentApi";
import { UserWallet } from "@/types/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Coins, CreditCard, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderResponse {
  success: boolean;
  message: string;
  order: {
    order_id: string;
    razorpay_order_id: string;
    amount: string;
    coins_to_credit: number;
  };
  razorpay_key_id: string;
}

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showDashboardOption, setShowDashboardOption] = useState(false);

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
      if (!user) return;
      try {
        const response = await getUserWallet();
        setWallet(response.wallet);
      } catch (err) {
        console.error('Failed to load wallet:', err);
      }
    };
    fetchWallet();
  }, [user]);

  const handlePayment = async () => {
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

    if (!razorpayLoaded) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create order
      const response = await axiosInstance.post<OrderResponse>('/payments/create-order/', { amount });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create order');
      }

      const { order, razorpay_key_id } = response.data;

      // Open Razorpay Checkout
      const options = {
        key: razorpay_key_id,
        amount: parseInt(order.amount) * 100, // Convert to paise
        currency: 'INR',
        name: 'Coin Purchase',
        description: `Purchase ${order.coins_to_credit} coins`,
        order_id: order.razorpay_order_id,
        handler: async function (razorpayResponse: any) {
          try {
            // Verify payment
            const verifyResponse = await axiosInstance.post('/payments/verify-payment/', {
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });
            
            if (verifyResponse.data.success) {
              setSuccess(`Payment successful! ${order.coins_to_credit} coins added to your wallet.`);
              setShowDashboardOption(true);
              
              // Refresh wallet
              const walletResponse = await getUserWallet();
              setWallet(walletResponse.wallet);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
            
          } catch (err: any) {
            setError('Payment verification failed. Please contact support.');
            console.error('Verification error:', err);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.first_name ? `${user.first_name} ${user.last_name}` : user.username,
          email: user.email,
        },
        notes: {
          order_id: order.order_id
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Please login to access payments.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Coins className="h-8 w-8 text-yellow-500" />
              Buy Coins
            </CardTitle>
            <CardDescription className="text-lg">
              Purchase coins securely with Razorpay • 1 INR = 1 Coin
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Wallet Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <span className="text-sm font-medium">Current Balance</span>
                <span className="text-2xl font-bold text-blue-600">
                  {wallet?.coin_balance || 0} coins
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="font-medium">{wallet?.total_coins_earned || 0} coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Money Spent</span>
                  <span className="font-medium">₹{wallet?.total_money_spent || '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Coins</CardTitle>
              <CardDescription>
                Complete your payment to receive coins instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="space-y-3">
                      <p>{success}</p>
                      {showDashboardOption && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push('/dashboard')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Go to Dashboard
                          </Button>
                          <Button
                            onClick={() => {
                              setSuccess('');
                              setShowDashboardOption(false);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Buy More Coins
                          </Button>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={10}
                  max={50000}
                  step={10}
                  className="text-lg"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Minimum: ₹10</span>
                  <span>You'll receive: {amount} coins</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Amount to Pay:</span>
                  <span className="text-xl font-bold">₹{amount}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Coins to receive:</span>
                  <span>{amount} coins</span>
                </div>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={loading || !razorpayLoaded || amount < 10}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : !razorpayLoaded ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading Payment System...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay ₹{amount} with Razorpay
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Razorpay • All major payment methods accepted
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Why Choose Our Payment System?</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Instant Credit</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>Secure Payment</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <Coins className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span>Best Exchange Rate</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}