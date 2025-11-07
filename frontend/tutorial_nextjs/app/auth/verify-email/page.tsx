"use client";

import { EmailVerificationForm } from "@/components/email-verification-form";
import { Suspense } from "react";

function VerifyEmailContent() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 lg:p-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <EmailVerificationForm />
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading verification form...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}