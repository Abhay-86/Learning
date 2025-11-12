'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, FileText, Upload, Users, Plus } from "lucide-react"

export default function SendEmailPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [recipients, setRecipients] = useState<string[]>(["john@example.com"])
  const [newRecipient, setNewRecipient] = useState("")

  // Mock templates data
  const templates = [
    { id: "1", name: "welcome.html", subject: "Welcome to our platform!" },
    { id: "2", name: "job-application.html", subject: "Job Application Follow-up" },
    { id: "3", name: "follow-up.html", subject: "Following up on our conversation" },
  ]

  const handleAddRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient])
      setNewRecipient("")
    }
  }

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email))
  }

  const handleSendEmail = () => {
    // TODO: Implement email sending logic
    console.log("Sending email with:", {
      template: selectedTemplate,
      recipients,
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send Email</h1>
        <p className="text-muted-foreground">
          Compose and send emails using your templates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Email Composition Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Template
              </CardTitle>
              <CardDescription>
                Choose an email template to use as the base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                      </div>
                      {selectedTemplate === template.id && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients
              </CardTitle>
              <CardDescription>
                Add email addresses to send to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Recipient */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                />
                <Button onClick={handleAddRecipient} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Recipients List */}
              <div className="space-y-2">
                <Label>Recipients ({recipients.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {recipients.map((email, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveRecipient(email)}
                    >
                      {email} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Upload Recipients */}
              <Separator />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <span className="text-sm text-muted-foreground">
                  Or upload a CSV file with email addresses
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Email Customization */}
          <Card>
            <CardHeader>
              <CardTitle>Customize Email</CardTitle>
              <CardDescription>
                Override template settings if needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Email subject (leave empty to use template default)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender">Sender Name</Label>
                <Input
                  id="sender"
                  placeholder="Your Name"
                  defaultValue="Email Service Studio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply-to">Reply-To Email</Label>
                <Input
                  id="reply-to"
                  type="email"
                  placeholder="noreply@example.com"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions Sidebar */}
        <div className="space-y-6">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Preview your email before sending
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-3">
                  <div className="p-3 border rounded bg-muted/30">
                    <p className="text-sm font-medium">Template</p>
                    <p className="text-xs text-muted-foreground">
                      {templates.find(t => t.id === selectedTemplate)?.name}
                    </p>
                  </div>
                  <div className="p-3 border rounded bg-muted/30">
                    <p className="text-sm font-medium">Recipients</p>
                    <p className="text-xs text-muted-foreground">
                      {recipients.length} recipient(s)
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Preview Email
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a template to preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Send Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={handleSendEmail}
                disabled={!selectedTemplate || recipients.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </Button>
              
              <Button variant="outline" className="w-full">
                Schedule Send
              </Button>
              
              <Button variant="ghost" className="w-full">
                Save as Draft
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Templates</span>
                <span className="font-medium">{templates.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-medium">{recipients.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={selectedTemplate ? "default" : "secondary"}>
                  {selectedTemplate ? "Ready" : "Incomplete"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}