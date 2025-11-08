"use client";

import React from "react";
import { AppLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/simple-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, BookOpen, Calendar, MessageSquare, Edit3, Save, Users } from "lucide-react";

// Dummy data for teacher
const teacherData = {
  name: "Dr. Michael Smith",
  employeeId: "TCH001",
  department: "Mathematics & Physics",
  classes: ["Grade 10A", "Grade 10B", "Grade 11A"],
  totalStudents: 85,
  
  // My Classes
  myClasses: [
    {
      id: 1,
      name: "Grade 10A",
      subject: "Mathematics",
      students: [
        { 
          id: 1, 
          name: "Alex Johnson", 
          rollNumber: "15", 
          currentGrade: "A-", 
          attendance: 85,
          recentMarks: { midterm: 88, assignment1: 92, assignment2: 85 },
          currentRemark: "Excellent problem-solving skills. Shows great improvement in calculus."
        },
        { 
          id: 2, 
          name: "Sarah Williams", 
          rollNumber: "23", 
          currentGrade: "B+", 
          attendance: 78,
          recentMarks: { midterm: 76, assignment1: 82, assignment2: 79 },
          currentRemark: "Good effort but needs more practice in algebra."
        },
        { 
          id: 3, 
          name: "David Brown", 
          rollNumber: "08", 
          currentGrade: "A", 
          attendance: 92,
          recentMarks: { midterm: 94, assignment1: 91, assignment2: 96 },
          currentRemark: "Outstanding mathematical abilities. Helps other students."
        },
        { 
          id: 4, 
          name: "Emily Davis", 
          rollNumber: "12", 
          currentGrade: "B", 
          attendance: 88,
          recentMarks: { midterm: 72, assignment1: 78, assignment2: 74 },
          currentRemark: "Shows improvement. Participate more in class discussions."
        }
      ]
    },
    {
      id: 2,
      name: "Grade 11A",
      subject: "Physics",
      students: [
        { 
          id: 5, 
          name: "John Wilson", 
          rollNumber: "19", 
          currentGrade: "A", 
          attendance: 90,
          recentMarks: { midterm: 89, lab1: 95, lab2: 88 },
          currentRemark: "Excellent understanding of physics concepts and lab work."
        },
        { 
          id: 6, 
          name: "Lisa Martinez", 
          rollNumber: "16", 
          currentGrade: "B+", 
          attendance: 86,
          recentMarks: { midterm: 81, lab1: 85, lab2: 83 },
          currentRemark: "Good theoretical knowledge. Needs improvement in practical applications."
        },
        { 
          id: 7, 
          name: "Robert Taylor", 
          rollNumber: "21", 
          currentGrade: "B", 
          attendance: 82,
          recentMarks: { midterm: 74, lab1: 78, lab2: 76 },
          currentRemark: "Average performance. Should focus on problem-solving techniques."
        }
      ]
    }
  ],
  
  upcomingTasks: [
    { date: "2025-11-10", task: "Grade Mid-term Papers - Grade 10A Math", priority: "high" },
    { date: "2025-11-12", task: "Submit Grade Reports", priority: "medium" },
    { date: "2025-11-15", task: "Parent-Teacher Meeting", priority: "high" },
    { date: "2025-11-18", task: "Prepare Physics Lab Exam", priority: "medium" }
  ],
  
  recentActivities: [
    { date: "2025-11-07", activity: "Graded Assignment 2 - Mathematics", count: "28 papers" },
    { date: "2025-11-06", activity: "Updated student remarks", count: "15 students" },
    { date: "2025-11-05", activity: "Conducted Physics Lab", count: "Grade 11A" },
    { date: "2025-11-04", activity: "Submitted attendance records", count: "All classes" }
  ]
};

export default function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = React.useState(0);
  const [editingRemark, setEditingRemark] = React.useState<number | null>(null);
  const [remarkText, setRemarkText] = React.useState("");
  const [gradeInput, setGradeInput] = React.useState("");

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "bg-green-100 text-green-800";
      case "A-": return "bg-green-100 text-green-700";
      case "B+": return "bg-blue-100 text-blue-800";
      case "B": return "bg-blue-100 text-blue-700";
      case "C+": return "bg-yellow-100 text-yellow-800";
      case "C": return "bg-orange-100 text-orange-800";
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

  const handleEditRemark = (studentId: number, currentRemark: string) => {
    setEditingRemark(studentId);
    setRemarkText(currentRemark);
  };

  const handleSaveRemark = (studentId: number) => {
    // In real app, this would make an API call
    console.log(`Saving remark for student ${studentId}: ${remarkText}`);
    setEditingRemark(null);
    setRemarkText("");
    // Show success message
    alert("Remark saved successfully!");
  };

  const handleCancelEdit = () => {
    setEditingRemark(null);
    setRemarkText("");
  };

  const currentClass = teacherData.myClasses[selectedClass];

  return (
    <AppLayout currentPage="/dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome, {teacherData.name}</h1>
          <p className="text-muted-foreground">
            {teacherData.department} • Employee ID: {teacherData.employeeId}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherData.classes.length}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherData.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherData.upcomingTasks.length}</div>
              <p className="text-xs text-muted-foreground">Due this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherData.recentActivities.length}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Class Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class to Manage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {teacherData.myClasses.map((classData, index) => (
                <Button
                  key={classData.id}
                  variant={selectedClass === index ? "default" : "outline"}
                  onClick={() => setSelectedClass(index)}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  {classData.name} - {classData.subject}
                  <Badge variant="secondary">{classData.students.length}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Management */}
        <Card>
          <CardHeader>
            <CardTitle>Student Management - {currentClass.name} ({currentClass.subject})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage grades, remarks, and track student progress
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentClass.students.map((student) => (
                <div key={student.id} className="border rounded-lg p-4 space-y-4">
                  {/* Student Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Roll: {student.rollNumber} • Attendance: {student.attendance}%
                        </p>
                      </div>
                      <Badge className={getGradeColor(student.currentGrade)}>
                        Grade: {student.currentGrade}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditRemark(student.id, student.currentRemark)}
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit Remark
                    </Button>
                  </div>

                  {/* Recent Marks */}
                  <div>
                    <h4 className="font-medium mb-2">Recent Assessment Scores</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {Object.entries(student.recentMarks).map(([test, marks]) => (
                        <div key={test} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="capitalize">{test.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-medium">{marks}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Remark */}
                  <div>
                    <h4 className="font-medium mb-2">Teacher's Remark</h4>
                    {editingRemark === student.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={remarkText}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarkText(e.target.value)}
                          placeholder="Enter your remark for this student..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveRemark(student.id)}
                            className="flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Save Remark
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm">{student.currentRemark}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Grade Update */}
                  <div>
                    <h4 className="font-medium mb-2">Quick Grade Update</h4>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Enter new grade (A, B+, B, etc.)"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button size="sm" variant="outline">
                        Update Grade
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teacherData.upcomingTasks.map((task, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{task.task}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {task.date}
                      </div>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teacherData.recentActivities.map((activity, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">{activity.activity}</div>
                    <div className="text-xs text-muted-foreground">{activity.date}</div>
                    <div className="text-sm text-blue-600">{activity.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col">
                <BookOpen className="h-6 w-6 mb-2" />
                Create Assignment
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                Take Attendance
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                Send Notice
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Schedule Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}