"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOTP, verifyOTP } from "@/services/auth/authApi";

interface QuickEmailVerificationProps {
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function QuickEmailVerification({ 
  email, 
  onSuccess, 
  onError,
  className = ""
}: QuickEmailVerificationProps) {
  const [step, setStep] = useState<"send" | "verify">("send");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await sendOTP({ email });
      setStep("verify");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to send OTP";
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      await verifyOTP({ email, otp });
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Invalid OTP";
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (step === "send") {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-sm text-muted-foreground">
          Verify your email address: <span className="font-medium">{email}</span>
        </p>
        <Button 
          onClick={handleSendOTP} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {loading ? "Sending..." : "Send Verification Code"}
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to: <span className="font-medium">{email}</span>
      </p>
      <div className="flex space-x-2">
        <Input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter code"
          maxLength={6}
          className="flex-1"
        />
        <Button 
          onClick={handleVerifyOTP} 
          disabled={loading || otp.length !== 6}
          size="sm"
        >
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </div>
      <Button 
        onClick={() => setStep("send")} 
        variant="ghost" 
        size="sm"
        className="w-full text-xs"
      >
        Change email or resend code
      </Button>
    </div>
  );
}