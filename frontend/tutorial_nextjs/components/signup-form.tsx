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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerUser, sendOTP } from "@/services/auth/authApi";
import { useRouter } from "next/navigation";
import type { RegisterPayload, UserRole } from "@/types/types";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterPayload>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "STUDENT",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Client-side validation
    if (formData.password !== formData.confirm_password) {
      setMessage("❌ Passwords do not match!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setMessage("❌ Password must be at least 8 characters long!");
      setLoading(false);
      return;
    }

    if (!formData.phone_number.match(/^\+?[\d\s\-\(\)]{10,}$/)) {
      setMessage("❌ Please enter a valid phone number!");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Register the user with role-specific profile creation
      await registerUser(formData);
      const roleLabel = formData.role.charAt(0) + formData.role.slice(1).toLowerCase();
      setMessage(`🎉 ${roleLabel} account created successfully! Setting up your profile...`);
      
      // Step 2: Automatically send OTP to the registered email
      await sendOTP({ email: formData.email });
      setMessage("📧 Verification code sent! Redirecting to verification page...");
      
      // Step 3: Clear form data
      const userEmail = formData.email;
      const userRole = formData.role;
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
        confirm_password: "",
        role: "STUDENT" as UserRole,
      });
      
      // Step 4: Redirect to verification page with email pre-filled
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(userEmail)}&role=${userRole}`);
      }, 1500);
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.email) {
          setMessage("❌ This email is already registered. Please try logging in instead.");
        } else if (errorData.password) {
          setMessage("❌ Password validation failed. Please choose a stronger password.");
        } else if (errorData.phone_number) {
          setMessage("❌ Invalid phone number format. Please check and try again.");
        } else {
          setMessage(errorData.message || "❌ Registration failed. Please check your information.");
        }
      } else if (err.response?.status === 500) {
        setMessage("⚠️ Account created but failed to send verification email. You can verify manually.");
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setMessage("🌐 Network error. Please check your connection and try again.");
      } else {
        setMessage(`❌ Registration failed: ${err.response?.data?.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Join Our School Portal</CardTitle>
        <CardDescription>
          Create your account to access our comprehensive school management system.
          Choose your role to get started with the appropriate features and dashboard.
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
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">
                    <div>
                      <div className="font-medium">Student</div>
                      <div className="text-sm text-muted-foreground">Access grades, assignments, and school events</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="PARENT">
                    <div>
                      <div className="font-medium">Parent/Guardian</div>
                      <div className="text-sm text-muted-foreground">Monitor your children's academic progress</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="TEACHER">
                    <div>
                      <div className="font-medium">Teacher</div>
                      <div className="text-sm text-muted-foreground">Manage classes, assignments, and grades</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div>
                      <div className="font-medium">Administrator</div>
                      <div className="text-sm text-muted-foreground">Full school management access</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                Choose your role to access the appropriate features and dashboard
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
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
            <div className={`text-center mt-4 text-sm ${
              message.includes('🎉') || message.includes('📧') 
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
