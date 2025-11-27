'use client'

import { Briefcase, Building2, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Job, JOB_TYPE_LABELS } from '@/services/referly/jobApi'

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const getJobTypeColor = (jobType: string) => {
    const colorMap: Record<string, string> = {
      'software-developer': 'bg-blue-100 text-blue-800',
      'web-developer': 'bg-cyan-100 text-cyan-800',
      'python-developer': 'bg-indigo-100 text-indigo-800',
      'frontend-developer': 'bg-pink-100 text-pink-800',
      'backend-developer': 'bg-purple-100 text-purple-800',
      'full-stack-developer': 'bg-violet-100 text-violet-800',
      'data-scientist': 'bg-orange-100 text-orange-800',
      'machine-learning-engineer': 'bg-red-100 text-red-800',
      'mobile-app-developer': 'bg-green-100 text-green-800',
      'android-developer': 'bg-lime-100 text-lime-800',
      'ios-developer': 'bg-gray-100 text-gray-800',
      'devops-engineer': 'bg-yellow-100 text-yellow-800',
      'cloud-engineer': 'bg-blue-100 text-blue-800',
      'data-engineer': 'bg-emerald-100 text-emerald-800',
      'ai-engineer': 'bg-rose-100 text-rose-800',
    };
    return colorMap[jobType] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
      <CardContent className="p-6">
        <div className="space-y-3">
          {/* Header with Title and Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors break-words">
                {job.title_display}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{job.company_name}</p>
            </div>
            <Badge className={`${getJobTypeColor(job.job_type)} capitalize text-xs font-medium flex-shrink-0`}>
              {JOB_TYPE_LABELS[job.job_type] || job.job_type}
            </Badge>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            {/* Company */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">{job.company_name}</span>
            </div>

            {/* Job Type */}
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>
            </div>

            {/* Posted Date */}
            <div className="flex items-center gap-2 col-span-2">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600">{formatDate(job.posted_date)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

