'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, FileText, Upload, Users, Plus, Mail, Check, AlertCircle, Shield, Lock } from "lucide-react"
import { getGmailPermissionStatus, getGmailAuthURL, acceptGmailPrivacy } from "@/services/auth/gmailApi"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SendEmailPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [recipients, setRecipients] = useState<string[]>(["john@example.com"])
  const [newRecipient, setNewRecipient] = useState("")

  // Gmail permission state
  const [hasGmailPermission, setHasGmailPermission] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [gmailLoading, setGmailLoading] = useState(true)
  const [connectingGmail, setConnectingGmail] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [acceptingPrivacy, setAcceptingPrivacy] = useState(false)

  // Mock templates data
  const templates = [
    { id: "1", name: "welcome.html", subject: "Welcome to our platform!" },
    { id: "2", name: "job-application.html", subject: "Job Application Follow-up" },
    { id: "3", name: "follow-up.html", subject: "Following up on our conversation" },
  ]

  // Check Gmail permission on mount
  useEffect(() => {
    checkGmailPermission()
  }, [])

  const checkGmailPermission = async () => {
    try {
      const status = await getGmailPermissionStatus()
      setHasGmailPermission(status.has_permission)
      setPrivacyAccepted(status.privacy_accepted)
    } catch (error) {
      console.error("Error checking Gmail permission:", error)
    } finally {
      setGmailLoading(false)
    }
  }

  const handleConnectGmail = () => {
    // Show privacy dialog first
    setShowPrivacyDialog(true)
  }

  const handleAcceptPrivacy = async () => {
    setAcceptingPrivacy(true)
    try {
      await acceptGmailPrivacy()
      setPrivacyAccepted(true)
    } catch (error) {
      console.error("Error accepting privacy:", error)
      alert("Failed to accept privacy policy. Please try again.")
    } finally {
      setAcceptingPrivacy(false)
    }
  }

  const handleConfirmConnect = async () => {
    setShowPrivacyDialog(false)
    setConnectingGmail(true)
    try {
      const { auth_url } = await getGmailAuthURL()
      // Redirect to Google OAuth
      window.location.href = auth_url
    } catch (error) {
      console.error("Error connecting Gmail:", error)
      alert("Failed to connect Gmail. Please try again.")
      setConnectingGmail(false)
    }
  }

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
    if (!hasGmailPermission) {
      alert("Please connect your Gmail account first")
      return
    }
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
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedTemplate === template.id
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

          {/* Gmail Connection Card */}
          <Card className={hasGmailPermission ? "border-green-500/50" : "border-orange-500/50"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Gmail Connection
              </CardTitle>
              <CardDescription>
                {hasGmailPermission
                  ? "Your Gmail is connected"
                  : "Connect Gmail to send emails"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {gmailLoading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Checking connection...
                </div>
              ) : hasGmailPermission ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    <span>Gmail connected successfully</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={checkGmailPermission}
                  >
                    Refresh Status
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Connect your Gmail account to send emails</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleConnectGmail}
                    disabled={connectingGmail}
                  >
                    {connectingGmail ? (
                      <>Connecting...</>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Connect Gmail
                      </>
                    )}
                  </Button>
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

      {/* Privacy Notice Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Gmail Permission Required
            </DialogTitle>
            <DialogDescription>
              Please review the permissions we're requesting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">We will request permission to:</h4>

              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Send emails on your behalf</p>
                    <p className="text-xs text-muted-foreground">
                      Send emails using your Gmail account to HR contacts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Your privacy is protected</p>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-1 ml-4 list-disc">
                    <li>We only request permission to <strong>send emails</strong></li>
                    <li>We <strong>cannot read</strong> your existing emails</li>
                    <li>Your refresh token is stored securely</li>
                    <li>You can revoke access anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> You'll be redirected to Google to grant permission.
                After granting access, you'll be redirected back to this application.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPrivacyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={privacyAccepted ? handleConfirmConnect : handleAcceptPrivacy}
              disabled={connectingGmail || acceptingPrivacy}
            >
              {privacyAccepted ? (
                connectingGmail ? (
                  "Connecting..."
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Connect with Google
                  </>
                )
              ) : (
                acceptingPrivacy ? (
                  "Accepting..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept Privacy Policy
                  </>
                )
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}