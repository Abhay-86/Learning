"use client";

import React from "react";
import { AppLayout } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/simple-badge";
import { Button } from "@/components/ui/button";
import { User, TrendingUp, Calendar, MessageSquare } from "lucide-react";

// Dummy data for parent
const parentData = {
  name: "Sarah Johnson",
  relationship: "Mother",
  children: [
    {
      id: 1,
      name: "Alex Johnson",
      class: "Grade 10A",
      rollNumber: "15",
      studentId: "STD001234",
      attendance: { percentage: 85, present: 85, total: 100 },
      overallGrade: "A-",
      marksheet: {
        semester: "First Semester 2024-25",
        subjects: [
          { 
            name: "Mathematics", 
            marks: { midterm: 88, final: 92, internal: 95, total: 275, outOf: 300 },
            grade: "A",
            teacherRemarks: "Excellent problem-solving skills. Shows great improvement in calculus.",
            attendance: 92
          },
          { 
            name: "Physics", 
            marks: { midterm: 82, final: 87, internal: 89, total: 258, outOf: 300 },
            grade: "B+",
            teacherRemarks: "Good understanding of concepts. Needs to work on numerical problems.",
            attendance: 88
          },
          { 
            name: "Chemistry", 
            marks: { midterm: 85, final: 89, internal: 91, total: 265, outOf: 300 },
            grade: "A-",
            teacherRemarks: "Strong in practical work. Theoretical knowledge is good.",
            attendance: 90
          },
          { 
            name: "English", 
            marks: { midterm: 90, final: 94, internal: 88, total: 272, outOf: 300 },
            grade: "A",
            teacherRemarks: "Excellent writing skills and vocabulary. Participates actively in discussions.",
            attendance: 95
          },
          { 
            name: "History", 
            marks: { midterm: 78, final: 82, internal: 85, total: 245, outOf: 300 },
            grade: "B",
            teacherRemarks: "Good analytical skills. Should focus more on dates and events.",
            attendance: 87
          }
        ],
        overallPercentage: 86.8,
        overallGrade: "A-",
        classTeacherRemarks: "Alex is a dedicated student with excellent academic performance. Shows leadership qualities and is helpful to classmates. Recommended to join advanced math program next semester.",
        principalRemarks: "Commendable performance. Keep up the good work!"
      },
      recentActivities: [
        { date: "2025-11-05", activity: "Science Fair Participation", status: "Participated", result: "2nd Prize in Physics Model" },
        { date: "2025-10-20", activity: "Math Olympiad", status: "Qualified", result: "Selected for State Level" },
        { date: "2025-10-15", activity: "Sports Day", status: "Participated", result: "3rd in 400m Race" }
      ],
      upcomingEvents: [
        { date: "2025-11-15", event: "Parent-Teacher Meeting", time: "10:00 AM", subject: "General Discussion" },
        { date: "2025-11-20", event: "Final Exams Begin", time: "9:00 AM", subject: "Mathematics" },
        { date: "2025-12-05", event: "Result Declaration", time: "11:00 AM", subject: "All Subjects" }
      ]
    },
    {
      id: 2,
      name: "Emma Johnson",
      class: "Grade 7B",
      rollNumber: "22",
      studentId: "STD001567",
      attendance: { percentage: 92, present: 92, total: 100 },
      overallGrade: "A",
      marksheet: {
        semester: "First Semester 2024-25",
        subjects: [
          { 
            name: "Mathematics", 
            marks: { midterm: 92, final: 95, internal: 88, total: 275, outOf: 300 },
            grade: "A",
            teacherRemarks: "Outstanding mathematical abilities. Very quick with mental calculations.",
            attendance: 96
          },
          { 
            name: "Science", 
            marks: { midterm: 88, final: 91, internal: 90, total: 269, outOf: 300 },
            grade: "A",
            teacherRemarks: "Shows great curiosity in experiments. Excellent lab work.",
            attendance: 94
          },
          { 
            name: "English", 
            marks: { midterm: 85, final: 88, internal: 92, total: 265, outOf: 300 },
            grade: "A-",
            teacherRemarks: "Creative writing skills are impressive. Good reader.",
            attendance: 90
          },
          { 
            name: "Social Studies", 
            marks: { midterm: 80, final: 85, internal: 88, total: 253, outOf: 300 },
            grade: "B+",
            teacherRemarks: "Good understanding of concepts. Active in group discussions.",
            attendance: 89
          }
        ],
        overallPercentage: 89.2,
        overallGrade: "A",
        classTeacherRemarks: "Emma is an enthusiastic learner with a positive attitude. She helps other students and maintains good discipline. Excellent overall performance.",
        principalRemarks: "Outstanding student. Keep encouraging her interests in STEM subjects."
      },
      recentActivities: [
        { date: "2025-11-02", activity: "Art Competition", status: "Won", result: "1st Prize in Painting" },
        { date: "2025-10-25", activity: "Spelling Bee", status: "Participated", result: "Reached Finals" },
        { date: "2025-10-10", activity: "Science Quiz", status: "Won", result: "Team Winner" }
      ],
      upcomingEvents: [
        { date: "2025-11-18", event: "Art Exhibition", time: "2:00 PM", subject: "Display of Student Art" },
        { date: "2025-11-25", event: "Mid-term Exams", time: "9:00 AM", subject: "All Subjects" }
      ]
    }
  ],
  notifications: [
    { date: "2025-11-07", message: "Alex's Math assignment submitted successfully", type: "info" },
    { date: "2025-11-06", message: "Emma won 1st prize in Art Competition", type: "success" },
    { date: "2025-11-05", message: "Parent-Teacher meeting scheduled for Nov 15", type: "reminder" },
    { date: "2025-11-04", message: "Fee payment due on Nov 10", type: "warning" }
  ]
};

const Tabs = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full">{children}</div>
);

const TabsList = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex space-x-1 bg-muted p-1 rounded-lg ${className}`}>{children}</div>
);

const TabsTrigger = ({ 
  value, 
  children, 
  isActive, 
  onClick 
}: { 
  value: string; 
  children: React.ReactNode; 
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({ 
  value, 
  children, 
  isActive 
}: { 
  value: string; 
  children: React.ReactNode; 
  isActive: boolean;
}) => (
  <div className={`mt-4 ${isActive ? 'block' : 'hidden'}`}>
    {children}
  </div>
);

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = React.useState("0");
  const [activeChild, setActiveChild] = React.useState(0);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-blue-100 text-blue-800";
    if (percentage >= 70) return "bg-yellow-100 text-yellow-800";
    if (percentage >= 60) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "reminder": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AppLayout currentPage="/dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome, {parentData.name}</h1>
          <p className="text-muted-foreground">
            {parentData.relationship} • Managing {parentData.children.length} children
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {parentData.children.map((child, index) => (
            <Card key={child.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{child.name}</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{child.class}</div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Grade: {child.overallGrade}</span>
                  <span>Att: {child.attendance.percentage}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parentData.notifications.length}</div>
              <p className="text-xs text-muted-foreground">New updates</p>
            </CardContent>
          </Card>
        </div>

        {/* Child Selector Tabs */}
        <Tabs>
          <TabsList>
            {parentData.children.map((child, index) => (
              <TabsTrigger
                key={child.id}
                value={index.toString()}
                isActive={activeTab === index.toString()}
                onClick={() => setActiveTab(index.toString())}
              >
                {child.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {parentData.children.map((child, index) => (
            <TabsContent 
              key={child.id} 
              value={index.toString()} 
              isActive={activeTab === index.toString()}
            >
              <div className="space-y-6">
                {/* Student Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Student Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Class</div>
                        <div className="font-medium">{child.class}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Roll Number</div>
                        <div className="font-medium">{child.rollNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Student ID</div>
                        <div className="font-medium">{child.studentId}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Overall Grade</div>
                        <Badge className={getGradeColor(child.marksheet.overallPercentage)}>
                          {child.overallGrade}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Marksheet */}
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Report - {child.marksheet.semester}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 p-3 text-left">Subject</th>
                              <th className="border border-gray-200 p-3 text-center">Mid-term</th>
                              <th className="border border-gray-200 p-3 text-center">Final</th>
                              <th className="border border-gray-200 p-3 text-center">Internal</th>
                              <th className="border border-gray-200 p-3 text-center">Total</th>
                              <th className="border border-gray-200 p-3 text-center">Grade</th>
                              <th className="border border-gray-200 p-3 text-center">Attendance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {child.marksheet.subjects.map((subject, idx) => (
                              <tr key={idx}>
                                <td className="border border-gray-200 p-3 font-medium">{subject.name}</td>
                                <td className="border border-gray-200 p-3 text-center">{subject.marks.midterm}</td>
                                <td className="border border-gray-200 p-3 text-center">{subject.marks.final}</td>
                                <td className="border border-gray-200 p-3 text-center">{subject.marks.internal}</td>
                                <td className="border border-gray-200 p-3 text-center">
                                  {subject.marks.total}/{subject.marks.outOf}
                                </td>
                                <td className="border border-gray-200 p-3 text-center">
                                  <Badge className={getGradeColor((subject.marks.total/subject.marks.outOf)*100)}>
                                    {subject.grade}
                                  </Badge>
                                </td>
                                <td className="border border-gray-200 p-3 text-center">{subject.attendance}%</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 font-bold">
                              <td className="border border-gray-200 p-3">Overall</td>
                              <td className="border border-gray-200 p-3 text-center" colSpan={4}>
                                {child.marksheet.overallPercentage}%
                              </td>
                              <td className="border border-gray-200 p-3 text-center">
                                <Badge className={getGradeColor(child.marksheet.overallPercentage)}>
                                  {child.marksheet.overallGrade}
                                </Badge>
                              </td>
                              <td className="border border-gray-200 p-3 text-center">{child.attendance.percentage}%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Teacher Remarks */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Subject-wise Teacher Remarks</h4>
                        {child.marksheet.subjects.map((subject, idx) => (
                          <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                            <div className="font-medium text-sm mb-1">{subject.name}</div>
                            <div className="text-sm text-muted-foreground">{subject.teacherRemarks}</div>
                          </div>
                        ))}
                      </div>

                      {/* Class Teacher & Principal Remarks */}
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-blue-50">
                          <h4 className="font-semibold mb-2">Class Teacher's Remarks</h4>
                          <p className="text-sm">{child.marksheet.classTeacherRemarks}</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-green-50">
                          <h4 className="font-semibold mb-2">Principal's Remarks</h4>
                          <p className="text-sm">{child.marksheet.principalRemarks}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activities */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {child.recentActivities.map((activity, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-sm">{activity.activity}</div>
                              <Badge className="text-xs">{activity.status}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">{activity.date}</div>
                            <div className="text-sm text-green-600">{activity.result}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming Events */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {child.upcomingEvents.map((event, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">{event.event}</div>
                            <div className="text-xs text-muted-foreground">{event.subject}</div>
                            <div className="text-sm flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {event.date} at {event.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parentData.notifications.map((notification, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm">{notification.message}</div>
                    <div className="text-xs text-muted-foreground">{notification.date}</div>
                  </div>
                  <Badge className={getNotificationColor(notification.type)}>
                    {notification.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}