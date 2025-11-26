"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, File, Plus, Settings, ChevronRight } from "lucide-react"
import Link from "next/link"

// Static mock data - replace with API call to /quota/
const MOCK_QUOTA = {
  maxTemplates: 2,
  currentTemplates: 1,
  maxResumes: 2,
  currentResumes: 2,
}

export function QuotaSidebar() {
  const templatePercentage = (MOCK_QUOTA.currentTemplates / MOCK_QUOTA.maxTemplates) * 100
  const resumePercentage = (MOCK_QUOTA.currentResumes / MOCK_QUOTA.maxResumes) * 100

  return (
    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-muted/30 p-6">
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/product/referly/templates">
                <FileText className="h-4 w-4 mr-2" />
                Manage Templates
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/product/referly/resumes">
                <File className="h-4 w-4 mr-2" />
                Manage Resumes
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/product/referly/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quota Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Quota</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Templates Quota */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Templates
                </span>
                <span className="font-medium">
                  {MOCK_QUOTA.currentTemplates}/{MOCK_QUOTA.maxTemplates}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${templatePercentage}%` }}
                />
              </div>
              {MOCK_QUOTA.currentTemplates < MOCK_QUOTA.maxTemplates && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Template
                </Button>
              )}
            </div>

            <Separator />

            {/* Resumes Quota */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  Resumes
                </span>
                <span className="font-medium">
                  {MOCK_QUOTA.currentResumes}/{MOCK_QUOTA.maxResumes}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${resumePercentage >= 100 ? "bg-amber-500" : "bg-blue-500"}`}
                  style={{ width: `${resumePercentage}%` }}
                />
              </div>
              {MOCK_QUOTA.currentResumes >= MOCK_QUOTA.maxResumes ? (
                <p className="text-xs text-amber-600">Resume limit reached. Delete one to upload more.</p>
              ) : (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Upload Resume
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Applications Sent</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">This Week</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Response Rate</span>
              <span className="font-medium text-green-600">25%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
