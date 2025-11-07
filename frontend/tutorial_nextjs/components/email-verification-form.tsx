"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendOTP, verifyOTP } from "@/services/auth/authApi";
import { useRouter } from "next/navigation";

interface EmailVerificationFormProps extends React.ComponentProps<typeof Card> {
  initialEmail?: string;
  onSuccess?: () => void;
  redirectPath?: string;
}

export function EmailVerificationForm({ 
  initialEmail = "", 
  onSuccess,
  redirectPath = "/auth/login",
  ...props 
}: EmailVerificationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if email is provided via URL params (from signup flow)
  const urlEmail = searchParams.get('email');
  const emailFromUrl = urlEmail || initialEmail;
  
  // If email is provided via URL, start directly at OTP step
  const [step, setStep] = useState<"email" | "otp">(emailFromUrl ? "otp" : "email");
  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    emailFromUrl ? `✅ Verification code sent to ${emailFromUrl}` : ""
  );
  const [countdown, setCountdown] = useState(emailFromUrl ? 60 : 0);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await sendOTP({ email });
      setMessage(`✅ ${response.message}`);
      setStep("otp");
      setCountdown(60); // 60 seconds cooldown for resend
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.error || err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await verifyOTP({ email, otp });
      setMessage(`🎉 ${response.message}`);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior: redirect after 1.5 seconds
        setTimeout(() => router.push(redirectPath), 1500);
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          "Invalid OTP. Please try again.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setMessage("");

    try {
      const response = await sendOTP({ email });
      setMessage(`✅ OTP resent successfully!`);
      setCountdown(60);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setMessage("");
    setCountdown(0);
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>
          {step === "email" ? "Verify Your Email" : "Enter Verification Code"}
        </CardTitle>
        <CardDescription>
          {step === "email" 
            ? "Enter your email address to receive a verification code"
            : `We've sent a 6-digit verification code to ${email}`
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "email" ? (
          <form onSubmit={handleSendOTP}>
            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </Field>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
              
              <FieldDescription className="text-center">
                Already verified?{" "}
                <a href="/auth/login" className="underline hover:text-primary">
                  Sign in
                </a>
              </FieldDescription>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="otp">Verification Code</FieldLabel>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
                <FieldDescription>
                  Enter the 6-digit code sent to your email
                </FieldDescription>
              </Field>

              <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
                {loading ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="flex flex-col space-y-2 text-sm text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className="text-primary underline hover:no-underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                </button>
                
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-muted-foreground underline hover:text-primary hover:no-underline"
                >
                  Change email address
                </button>
              </div>
            </div>
          </form>
        )}

        {message && (
          <div className={`text-center mt-4 text-sm ${
            message.includes('✅') || message.includes('🎉') 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}