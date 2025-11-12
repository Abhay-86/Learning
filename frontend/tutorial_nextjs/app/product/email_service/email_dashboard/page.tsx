'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Send, Users, TrendingUp, Clock, CheckCircle } from "lucide-react"

export default function EmailDashboardPage() {
  // Mock data - replace with real data from your API
  const stats = {
    totalTemplates: 12,
    emailsSent: 1247,
    activeContacts: 856,
    successRate: 94.2
  }

  const recentTemplates = [
    { id: 1, name: "welcome.html", lastModified: "2 hours ago", status: "active" },
    { id: 2, name: "job-application.html", lastModified: "1 day ago", status: "active" },
    { id: 3, name: "follow-up.html", lastModified: "3 days ago", status: "draft" },
  ]

  const recentActivity = [
    { id: 1, action: "Email sent", template: "welcome.html", time: "5 minutes ago" },
    { id: 2, action: "Template created", template: "newsletter.html", time: "2 hours ago" },
    { id: 3, action: "Template updated", template: "job-application.html", time: "1 day ago" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your email templates, campaigns, and performance metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +5.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Templates</CardTitle>
            <CardDescription>
              Your recently modified email templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTemplates.map((template) => (
                <div key={template.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.lastModified}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={template.status === 'active' ? 'default' : 'secondary'}
                  >
                    {template.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Templates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions in your email service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {activity.action === 'Email sent' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {activity.action === 'Template created' && (
                      <FileText className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.action === 'Template updated' && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.template} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex flex-col gap-2">
              <FileText className="h-5 w-5" />
              Create Template
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Send className="h-5 w-5" />
              Send Email
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-5 w-5" />
              Manage Contacts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}