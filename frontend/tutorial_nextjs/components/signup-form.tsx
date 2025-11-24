"use client";

import { useState } from "react";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerUser, sendOTP } from "@/services/auth/authApi";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {

  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Step 1: Register the user
      await registerUser(formData);
      setMessage("🎉 Account created successfully! Sending verification email...");

      // Step 2: Automatically send OTP to the registered email
      await sendOTP({ email: formData.email });
      setMessage("📧 Verification code sent! Redirecting to verification page...");

      // Step 3: Clear form data
      const userEmail = formData.email;
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
        confirm_password: "",
      });

      // Step 4: Redirect to verification page with email pre-filled
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(userEmail)}`);
      }, 150);
    } catch (err: any) {
      console.error(err);
      // Check if registration succeeded but OTP sending failed
      if (err.response?.status === 400 && err.response?.data?.email) {
        // Registration failed
        setMessage(err.response?.data?.message || "Registration failed!");
      } else if (formData.email && err.response?.data?.error) {
        // Registration succeeded but OTP sending failed
        setMessage("⚠️ Account created but failed to send verification email. You can verify manually.");
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        setMessage("Something went wrong! Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="first_name">First Name</FieldLabel>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="m@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone_number">Phone Number</FieldLabel>
              <Input
                id="phone_number"
                type="text"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+91 9876543210"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
              <FieldDescription className="px-6 text-center mt-2">
                Already have an account?{" "}
                <a href="/auth/login" className="underline">
                  Sign in
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>

          {message && (
            <div className={`text-center mt-4 text-sm ${message.includes('🎉') || message.includes('📧')
                ? 'text-green-600'
                : message.includes('⚠️')
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
              {message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
