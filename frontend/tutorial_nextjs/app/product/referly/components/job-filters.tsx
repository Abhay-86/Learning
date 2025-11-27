"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import type { Filters } from "./job-board"

const ROLE_OPTIONS = [
  "Software Developer",
  "Web Developer",
  "Python Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Mobile App Developer",
  "Android Developer",
  "iOS Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Data Engineer",
  "AI Engineer",
]

const JOB_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"]

interface JobFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function JobFilters({ filters, onFiltersChange }: JobFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleRoleToggle = (role: string) => {
    const newRoles = filters.roles.includes(role) ? filters.roles.filter((r: string) => r !== role) : [...filters.roles, role]
    onFiltersChange({ ...filters, roles: newRoles })
  }

  const handleJobTypeToggle = (type: string) => {
    const newTypes = filters.jobTypes.includes(type)
      ? filters.jobTypes.filter((t: string) => t !== type)
      : [...filters.jobTypes, type]
    onFiltersChange({ ...filters, jobTypes: newTypes })
  }

  const handleTimeRangeChange = (value: string) => {
    onFiltersChange({ ...filters, timeRange: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      roles: [],
      jobTypes: [],
      timeRange: "all",
    })
  }

  const hasActiveFilters =
    filters.search || filters.roles.length > 0 || filters.jobTypes.length > 0 || filters.timeRange !== "all"

  return (
    <div className="space-y-4 mb-6">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company name..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Role Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-between bg-transparent">
              <span>Role</span>
              {filters.roles.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {filters.roles.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Select Roles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLE_OPTIONS.map((role) => (
              <DropdownMenuCheckboxItem
                key={role}
                checked={filters.roles.includes(role)}
                onCheckedChange={() => handleRoleToggle(role)}
              >
                {role}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Job Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-between bg-transparent">
              <span>Job Type</span>
              {filters.jobTypes.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {filters.jobTypes.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuLabel>Select Job Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {JOB_TYPE_OPTIONS.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.jobTypes.includes(type)}
                onCheckedChange={() => handleJobTypeToggle(type)}
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Time Range */}
        <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Posted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleSearchChange("")} />
            </Badge>
          )}

          {filters.roles.map((role: string) => (
            <Badge key={role} variant="secondary" className="gap-1">
              {role}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleRoleToggle(role)} />
            </Badge>
          ))}

          {filters.jobTypes.map((type: string) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleJobTypeToggle(type)} />
            </Badge>
          ))}

          {filters.timeRange !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.timeRange === "24h" ? "Last 24h" : filters.timeRange === "7d" ? "Last 7 days" : "Last 30 days"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleTimeRangeChange("all")} />
            </Badge>
          )}

          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
