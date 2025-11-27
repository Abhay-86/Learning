"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Clock, ExternalLink, Mail, CheckCircle2 } from "lucide-react"
import type { Job } from "./job-board"

interface JobListProps {
  jobs: Job[]
  onApplyViaHR: (job: Job) => void
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "1 day ago"
  return `${diffDays} days ago`
}

export function JobList({ jobs, onApplyViaHR }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No jobs found</h3>
        <p className="text-muted-foreground">Try adjusting your filters to see more results</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:border-primary/30 transition-colors">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Job Info */}
              <div className="flex gap-4">
                {/* Company Logo Placeholder */}
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{job.company}</h3>
                    {job.hasHR && (
                      <Badge variant="outline" className="text-xs border-green-500/50 text-green-600 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        HR Available
                      </Badge>
                    )}
                  </div>

                  <p className="text-foreground font-medium">{job.role}</p>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {job.jobType}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTimeAgo(job.postedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <a href={job.jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Job
                  </a>
                </Button>

                {job.hasHR && (
                  <Button size="sm" onClick={() => onApplyViaHR(job)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Apply via HR
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
