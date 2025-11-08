"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/simple-badge";
import { getUserProfile } from "@/services/auth/authApi";
import axiosInstance from "@/utils/axiosInstance";

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, gradesResponse] = await Promise.all([
          getUserProfile(),
          axiosInstance.get("accounts/grades/")
        ]);
        
        setUser(userResponse.data);
        setGrades(gradesResponse.data);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-blue-100 text-blue-800";
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800";
    if (percentage >= 60) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    return "F";
  };

  if (loading) {
    return (
      <AppLayout currentPage="/grades">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading grades...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="/grades">
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Grades</h1>
          <p className="text-muted-foreground">
            {user?.role === 'STUDENT' && "Your academic performance"}
            {user?.role === 'PARENT' && "Your children's academic performance"}
            {user?.role === 'TEACHER' && "Grades you've assigned"}
            {user?.role === 'ADMIN' && "All student grades"}
          </p>
        </div>

        {grades.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No grades available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grades.map((grade, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{grade.subject_name}</CardTitle>
                      {user?.role !== 'STUDENT' && (
                        <p className="text-sm text-muted-foreground">
                          Student: {grade.student_name}
                        </p>
                      )}
                    </div>
                    <Badge className={getGradeColor(grade.percentage)}>
                      {getGradeLetter(grade.percentage)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className="font-semibold">
                        {grade.marks_obtained}/{grade.total_marks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Percentage:</span>
                      <span className="font-semibold">{grade.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exam Type:</span>
                      <span className="text-sm">{grade.exam_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="text-sm">
                        {new Date(grade.exam_date).toLocaleDateString()}
                      </span>
                    </div>
                    {user?.role === 'STUDENT' && (
                      <div className="flex justify-between">
                        <span>Teacher:</span>
                        <span className="text-sm">{grade.teacher_name}</span>
                      </div>
                    )}
                    {grade.remarks && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-sm"><strong>Remarks:</strong> {grade.remarks}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}