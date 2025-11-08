"use client";

import { AppLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/simple-badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen, Users, AlertCircle } from "lucide-react";

// Dummy data for student
const studentData = {
  name: "Alex Johnson",
  studentId: "STD001234",
  class: "Grade 10A",
  rollNumber: "15",
  attendance: {
    present: 85,
    total: 100,
    percentage: 85
  },
  recentGrades: [
    { subject: "Mathematics", grade: "A", marks: "92/100", exam: "Mid-term", date: "2025-10-15" },
    { subject: "Physics", grade: "B+", marks: "87/100", exam: "Unit Test", date: "2025-10-10" },
    { subject: "Chemistry", grade: "A-", marks: "89/100", exam: "Lab Test", date: "2025-10-08" },
    { subject: "English", grade: "A", marks: "94/100", exam: "Essay", date: "2025-10-05" }
  ],
  assignments: [
    { id: 1, title: "Algebra Problem Set 5", subject: "Mathematics", dueDate: "2025-11-12", status: "pending", priority: "high" },
    { id: 2, title: "Physics Lab Report", subject: "Physics", dueDate: "2025-11-10", status: "submitted", priority: "medium" },
    { id: 3, title: "Chemistry Equations", subject: "Chemistry", dueDate: "2025-11-15", status: "pending", priority: "low" },
    { id: 4, title: "Shakespeare Essay", subject: "English", dueDate: "2025-11-08", status: "overdue", priority: "high" }
  ],
  upcomingTests: [
    { subject: "Mathematics", type: "Final Exam", date: "2025-11-20", time: "9:00 AM" },
    { subject: "Physics", type: "Unit Test", date: "2025-11-18", time: "2:00 PM" },
    { subject: "Chemistry", type: "Practical", date: "2025-11-22", time: "10:00 AM" }
  ],
  recentAttendance: [
    { date: "2025-11-07", status: "Present", remarks: "" },
    { date: "2025-11-06", status: "Present", remarks: "" },
    { date: "2025-11-05", status: "Absent", remarks: "Sick leave" },
    { date: "2025-11-04", status: "Present", remarks: "" },
    { date: "2025-11-03", status: "Late", remarks: "Traffic delay" }
  ]
};

export default function StudentDashboard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-800";
      case "Absent": return "bg-red-100 text-red-800";
      case "Late": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AppLayout currentPage="/dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {studentData.name}!</h1>
          <p className="text-muted-foreground">
            {studentData.class} • Roll No: {studentData.rollNumber} • ID: {studentData.studentId}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.attendance.percentage}%</div>
              <p className="text-xs text-muted-foreground">
                {studentData.attendance.present} of {studentData.attendance.total} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentData.assignments.filter(a => a.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Due this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.upcomingTests.length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">A-</div>
              <p className="text-xs text-muted-foreground">Last semester</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Grades */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData.recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{grade.subject}</div>
                      <div className="text-sm text-muted-foreground">{grade.exam} • {grade.date}</div>
                    </div>
                    <div className="text-right">
                      <Badge className="mb-1">{grade.grade}</Badge>
                      <div className="text-sm text-muted-foreground">{grade.marks}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Grades
              </Button>
            </CardContent>
          </Card>

          {/* Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Homework & Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData.assignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{assignment.title}</div>
                        <div className="text-sm text-muted-foreground">{assignment.subject}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Due: {assignment.dueDate}
                    </div>
                    {assignment.status === "overdue" && (
                      <div className="flex items-center text-sm text-red-600 mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Overdue
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Assignments
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData.upcomingTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{test.subject}</div>
                      <div className="text-sm text-muted-foreground">{test.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{test.date}</div>
                      <div className="text-sm text-muted-foreground">{test.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentData.recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm font-medium">{record.date}</div>
                    <div className="flex items-center gap-2">
                      <Badge className={getAttendanceColor(record.status)}>
                        {record.status}
                      </Badge>
                      {record.remarks && (
                        <span className="text-xs text-muted-foreground">({record.remarks})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View Full Attendance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}