"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { User, FileText, File, Eye, Send, CheckCircle2, Building2, AlertCircle } from "lucide-react"
import type { Job } from "./job-board"

interface JobApplyModalProps {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Static mock data - replace with API calls
const MOCK_HR_CONTACTS = [
  {
    id: 1,
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@google.com",
    emailVerified: true,
    linkedinVerified: true,
  },
  {
    id: 2,
    firstName: "Mike",
    lastName: "Chen",
    email: "mike.chen@google.com",
    emailVerified: true,
    linkedinVerified: false,
  },
]

const MOCK_TEMPLATES = [
  { id: 1, name: "Professional Introduction", subject: "Application for {role} Position" },
  { id: 2, name: "Referral Request", subject: "Referral Request - {role} at {company}" },
]

const MOCK_RESUMES = [
  { id: 1, name: "Software_Engineer_Resume", extension: "pdf", size: "245 KB" },
  { id: 2, name: "Full_Stack_Developer_CV", extension: "pdf", size: "312 KB" },
]

export function JobApplyModal({ job, open, onOpenChange }: JobApplyModalProps) {
  const [selectedHR, setSelectedHR] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedResume, setSelectedResume] = useState<string>("")
  const [step, setStep] = useState<"select" | "preview" | "success">("select")

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after close animation
    setTimeout(() => {
      setSelectedHR("")
      setSelectedTemplate("")
      setSelectedResume("")
      setStep("select")
    }, 200)
  }

  const handleSend = () => {
    // TODO: Implement actual email sending via API
    console.log("Sending email:", {
      job,
      hrId: selectedHR,
      templateId: selectedTemplate,
      resumeId: selectedResume,
    })
    setStep("success")
  }

  const canProceed = selectedHR && selectedTemplate && selectedResume

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        {step === "success" ? (
          <>
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl mb-2">Email Sent Successfully!</DialogTitle>
              <DialogDescription className="mb-6">
                Your application has been sent to the HR contact at {job.company}
              </DialogDescription>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </>
        ) : step === "preview" ? (
          <>
            <DialogHeader>
              <DialogTitle>Preview Email</DialogTitle>
              <DialogDescription>Review your email before sending</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">To:</span>{" "}
                  <span className="font-medium">
                    {MOCK_HR_CONTACTS.find((h) => h.id.toString() === selectedHR)?.email}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject:</span>{" "}
                  <span className="font-medium">Application for {job.role} Position</span>
                </div>
                <Separator />
                <div className="text-muted-foreground">
                  <p className="mb-2">
                    Dear {MOCK_HR_CONTACTS.find((h) => h.id.toString() === selectedHR)?.firstName},
                  </p>
                  <p className="mb-2">
                    I am writing to express my interest in the {job.role} position at {job.company}...
                  </p>
                  <p className="text-xs italic mt-4">[Preview of template content would appear here]</p>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span>Attachment: {MOCK_RESUMES.find((r) => r.id.toString() === selectedResume)?.name}.pdf</span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Apply to {job.company}
              </DialogTitle>
              <DialogDescription>
                {job.role} - {job.jobType}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Step 1: Select HR Contact */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select HR Contact
                </Label>
                <Select value={selectedHR} onValueChange={setSelectedHR}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an HR contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_HR_CONTACTS.map((hr) => (
                      <SelectItem key={hr.id} value={hr.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>
                            {hr.firstName} {hr.lastName}
                          </span>
                          {hr.emailVerified && (
                            <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedHR && (
                  <p className="text-xs text-muted-foreground">
                    Email: {MOCK_HR_CONTACTS.find((h) => h.id.toString() === selectedHR)?.email}
                  </p>
                )}
              </div>

              <Separator />

              {/* Step 2: Select Template */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Select Email Template
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" disabled={!selectedTemplate} title="Preview template">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                {MOCK_TEMPLATES.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>No templates yet. Create one in Templates section.</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Step 3: Select Resume */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Select Resume
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedResume} onValueChange={setSelectedResume}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choose a resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_RESUMES.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>
                              {resume.name}.{resume.extension}
                            </span>
                            <span className="text-xs text-muted-foreground">({resume.size})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" disabled={!selectedResume} title="Preview resume">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                {MOCK_RESUMES.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>No resumes yet. Upload one in Resumes section.</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button disabled={!canProceed} onClick={() => setStep("preview")}>
                Preview Email
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
