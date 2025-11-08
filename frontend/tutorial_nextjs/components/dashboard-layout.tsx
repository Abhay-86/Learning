"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserProfile, getDashboardData } from "@/services/auth/authApi";
import { useRouter } from "next/navigation";

interface DashboardData {
  role: string;
  [key: string]: any;
}

export function DashboardLayout() {
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, dashboardResponse] = await Promise.all([
          getUserProfile(),
          getDashboardData()
        ]);
        
        setUser(userResponse.data);
        setDashboardData(dashboardResponse.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Redirect to login if unauthorized
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Welcome, {user.first_name} {user.last_name}
        </h1>
        <p className="text-muted-foreground">
          {dashboardData.role.charAt(0).toUpperCase() + dashboardData.role.slice(1).toLowerCase()} Dashboard
        </p>
      </div>

      {dashboardData.role === 'STUDENT' && <StudentDashboard data={dashboardData} />}
      {dashboardData.role === 'PARENT' && <ParentDashboard data={dashboardData} />}
      {dashboardData.role === 'TEACHER' && <TeacherDashboard data={dashboardData} />}
      {dashboardData.role === 'ADMIN' && <AdminDashboard data={dashboardData} />}
    </div>
  );
}

function StudentDashboard({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Student Info Card */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Student ID:</strong> {data.student_info?.student_id}</p>
            <p><strong>Class:</strong> {data.student_info?.class_name}</p>
            <p><strong>Roll Number:</strong> {data.student_info?.roll_number}</p>
            <p><strong>School:</strong> {data.student_info?.school_name}</p>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {data.attendance_percentage}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Attendance</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Grades */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recent_grades?.slice(0, 5).map((grade: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{grade.subject_name}</span>
                <span className="font-semibold">{grade.marks_obtained}/{grade.total_marks}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assignments */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Upcoming Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.upcoming_assignments?.map((assignment: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">{assignment.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Subject: {assignment.subject_name}
                </p>
                <p className="text-sm">
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>School Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.upcoming_events?.map((event: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <p className="text-sm font-medium">
                  Date: {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParentDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Relationship:</strong> {data.parent_info?.relationship}</p>
          <p><strong>Occupation:</strong> {data.parent_info?.occupation}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.children?.map((child: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{child.student_info?.user_details?.first_name} {child.student_info?.user_details?.last_name}</CardTitle>
              <CardDescription>
                Class: {child.student_info?.class_name} | Roll: {child.student_info?.roll_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Attendance: {child.attendance_percentage}%</h4>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recent Grades</h4>
                  <div className="space-y-1">
                    {child.recent_grades?.map((grade: any, gradeIndex: number) => (
                      <div key={gradeIndex} className="flex justify-between text-sm">
                        <span>{grade.subject_name}</span>
                        <span>{grade.marks_obtained}/{grade.total_marks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeacherDashboard({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Teacher Info */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Teacher ID:</strong> {data.teacher_info?.teacher_id}</p>
            <p><strong>School:</strong> {data.teacher_info?.school_name}</p>
            <p><strong>Experience:</strong> {data.teacher_info?.experience_years} years</p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.classes_count}</div>
              <p className="text-sm text-muted-foreground">Classes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.total_students}</div>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recent_assignments?.map((assignment: any, index: number) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-sm">{assignment.title}</h4>
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Statistics Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {data.stats?.total_students}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {data.stats?.total_teachers}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">
            {data.stats?.total_parents}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {data.stats?.total_classes}
          </div>
        </CardContent>
      </Card>

      {/* Recent Students */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Recent Student Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recent_students?.map((student: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <h4 className="font-semibold">
                    {student.user_details?.first_name} {student.user_details?.last_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {student.class_name} | {student.student_id}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(student.user_details?.date_joined).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}