"use client"

import { useState, useEffect } from "react"
import { JobFilters } from "./job-filters"
import { JobList } from "./job-list"
import { JobApplyModal } from "./job-apply-modal"
import { QuotaSidebar } from "./quota-sidebar"

// Filter types
export interface Filters {
  search: string
  roles: string[]
  jobTypes: string[]
  timeRange: string
}

// Job types
export interface Job {
  id: string
  role: string
  company: string
  jobType: string
  jobUrl: string
  postedAt: string
  hasHR: boolean
}

// Sample mock jobs data
const MOCK_JOBS: Job[] = [
  {
    id: "1",
    role: "Senior React Developer",
    company: "Google",
    jobType: "Full-time",
    jobUrl: "https://google.com/careers",
    postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    hasHR: true,
  },
  {
    id: "2",
    role: "Python Backend Engineer",
    company: "Meta",
    jobType: "Full-time",
    jobUrl: "https://meta.com/careers",
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    hasHR: true,
  },
  {
    id: "3",
    role: "DevOps Engineer",
    company: "Amazon",
    jobType: "Full-time",
    jobUrl: "https://amazon.com/careers",
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    hasHR: false,
  },
  {
    id: "4",
    role: "Frontend Developer",
    company: "Microsoft",
    jobType: "Contract",
    jobUrl: "https://microsoft.com/careers",
    postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    hasHR: true,
  },
  {
    id: "5",
    role: "Full Stack Developer",
    company: "Apple",
    jobType: "Full-time",
    jobUrl: "https://apple.com/careers",
    postedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    hasHR: true,
  },
  {
    id: "6",
    role: "Data Scientist",
    company: "Netflix",
    jobType: "Full-time",
    jobUrl: "https://netflix.com/careers",
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    hasHR: true,
  },
  {
    id: "7",
    role: "ML Engineer",
    company: "OpenAI",
    jobType: "Full-time",
    jobUrl: "https://openai.com/careers",
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    hasHR: false,
  },
  {
    id: "8",
    role: "Cloud Architect",
    company: "IBM",
    jobType: "Part-time",
    jobUrl: "https://ibm.com/careers",
    postedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    hasHR: true,
  },
]

export function JobBoard() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    roles: [],
    jobTypes: [],
    timeRange: "all",
  })

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(MOCK_JOBS)

  // Filter logic
  useEffect(() => {
    let result = MOCK_JOBS

    // Search filter (company name)
    if (filters.search) {
      const search = filters.search.toLowerCase()
      result = result.filter((job) => job.company.toLowerCase().includes(search))
    }

    // Roles filter (match job titles with roles)
    if (filters.roles.length > 0) {
      result = result.filter((job) => {
        const jobRole = job.role.toLowerCase()
        return filters.roles.some((role) => jobRole.includes(role.toLowerCase()))
      })
    }

    // Job types filter
    if (filters.jobTypes.length > 0) {
      result = result.filter((job) => filters.jobTypes.includes(job.jobType))
    }

    // Time range filter
    if (filters.timeRange !== "all") {
      const now = new Date()
      let cutoffDate: Date

      if (filters.timeRange === "24h") {
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      } else if (filters.timeRange === "7d") {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (filters.timeRange === "30d") {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      } else {
        cutoffDate = new Date(0)
      }

      result = result.filter((job) => new Date(job.postedAt) >= cutoffDate)
    }

    setFilteredJobs(result)
  }, [filters])

  const handleApplyViaHR = (job: Job) => {
    setSelectedJob(job)
    setIsApplyModalOpen(true)
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Job Board</h1>
            <p className="text-muted-foreground">
              Discover opportunities and apply via HR contacts
            </p>
          </div>

          {/* Filters */}
          <JobFilters filters={filters} onFiltersChange={setFilters} />

          {/* Jobs List */}
          <JobList jobs={filteredJobs} onApplyViaHR={handleApplyViaHR} />
        </div>
      </div>

      {/* Sidebar */}
      <QuotaSidebar />

      {/* Apply Modal */}
      <JobApplyModal job={selectedJob} open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} />
    </div>
  )
}

