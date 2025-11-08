"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserProfile } from "@/services/auth/authApi";
import axiosInstance from "@/utils/axiosInstance";

export default function CompleteProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>({});
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await getUserProfile();
        const userData = userResponse.data;
        setUser(userData);

        // Fetch classes and subjects for dropdowns
        const [classesRes, subjectsRes] = await Promise.all([
          axiosInstance.get("accounts/classes/"),
          axiosInstance.get("accounts/subjects/")
        ]);
        
        setClasses(classesRes.data);
        setSubjects(subjectsRes.data);

        // If profile is already complete, redirect to dashboard
        if (userData.profile_complete) {
          router.push("/dashboard");
          return;
        }

        // Initialize profile data based on role
        if (userData.role === 'STUDENT') {
          setProfileData({
            date_of_birth: "",
            address: "",
            emergency_contact: userData.phone_number || "",
            blood_group: "",
            class_id: ""
          });
        } else if (userData.role === 'TEACHER') {
          setProfileData({
            qualification: "",
            experience_years: 0,
            subject_ids: [],
            class_ids: []
          });
        } else if (userData.role === 'PARENT') {
          setProfileData({
            relationship: "FATHER",
            occupation: "",
            office_address: "",
            office_phone: ""
          });
        }

      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await axiosInstance.post("accounts/complete-profile/", profileData);
      setMessage("Profile completed successfully! Redirecting to dashboard...");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Profile completion failed:", error);
      setMessage(error.response?.data?.error || "Failed to complete profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData({ ...profileData, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground">
            Welcome {user.first_name}! Please complete your {user.role.toLowerCase()} profile to get started.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {user.role === 'STUDENT' && (
                <>
                  <Field>
                    <FieldLabel>Date of Birth</FieldLabel>
                    <Input
                      type="date"
                      value={profileData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Address</FieldLabel>
                    <Input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Your full address"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Emergency Contact</FieldLabel>
                    <Input
                      type="tel"
                      value={profileData.emergency_contact}
                      onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                      placeholder="Emergency contact number"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Blood Group (Optional)</FieldLabel>
                    <Select onValueChange={(value) => handleInputChange('blood_group', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Class (Optional - Admin will assign)</FieldLabel>
                    <Select onValueChange={(value) => handleInputChange('class_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}

              {user.role === 'TEACHER' && (
                <>
                  <Field>
                    <FieldLabel>Qualification</FieldLabel>
                    <Input
                      type="text"
                      value={profileData.qualification}
                      onChange={(e) => handleInputChange('qualification', e.target.value)}
                      placeholder="Your educational qualifications"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Years of Experience</FieldLabel>
                    <Input
                      type="number"
                      value={profileData.experience_years}
                      onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                      placeholder="Years of teaching experience"
                      min="0"
                      required
                    />
                  </Field>
                </>
              )}

              {user.role === 'PARENT' && (
                <>
                  <Field>
                    <FieldLabel>Relationship</FieldLabel>
                    <Select 
                      value={profileData.relationship}
                      onValueChange={(value) => handleInputChange('relationship', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FATHER">Father</SelectItem>
                        <SelectItem value="MOTHER">Mother</SelectItem>
                        <SelectItem value="GUARDIAN">Guardian</SelectItem>
                        <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Occupation</FieldLabel>
                    <Input
                      type="text"
                      value={profileData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      placeholder="Your profession/occupation"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Office Address (Optional)</FieldLabel>
                    <Input
                      type="text"
                      value={profileData.office_address}
                      onChange={(e) => handleInputChange('office_address', e.target.value)}
                      placeholder="Office address"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Office Phone (Optional)</FieldLabel>
                    <Input
                      type="tel"
                      value={profileData.office_phone}
                      onChange={(e) => handleInputChange('office_phone', e.target.value)}
                      placeholder="Office contact number"
                    />
                  </Field>
                </>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Completing Profile..." : "Complete Profile"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={submitting}
                >
                  Skip for Now
                </Button>
              </div>

              {message && (
                <div className={`text-center text-sm ${
                  message.includes('successfully') 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {message}
                </div>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}