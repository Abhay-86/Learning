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
import { registerUser } from "@/services/auth/authApi";
import { useRouter } from "next/navigation";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await registerUser(formData);
      setMessage("🎉 Account created successfully!");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
        confirm_password: "",
      });
      setMessage("🎉 Account created successfully!");
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.message || "Something went wrong!");
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
                {loading ? "Creating..." : "Create Account"}
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
            <p className="text-center mt-4 text-sm text-green-600">{message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
