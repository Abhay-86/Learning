import axiosInstance from '@/utils/axiosInstance';

export interface Job {
  id: number;
  title: string;
  title_display: string;
  job_type: string;
  job_type_display: string;
  company: number;
  company_id: string;
  company_name: string;
  posted_date: string;
}

export const JOB_TYPES = [
  'software-developer',
  'web-developer',
  'python-developer',
  'frontend-developer',
  'backend-developer',
  'full-stack-developer',
  'data-scientist',
  'machine-learning-engineer',
  'mobile-app-developer',
  'android-developer',
  'ios-developer',
  'devops-engineer',
  'cloud-engineer',
  'data-engineer',
  'ai-engineer',
] as const;

export const JOB_TYPE_LABELS: Record<string, string> = {
  'software-developer': 'Software Developer',
  'web-developer': 'Web Developer',
  'python-developer': 'Python Developer',
  'frontend-developer': 'Frontend Developer',
  'backend-developer': 'Backend Developer',
  'full-stack-developer': 'Full Stack Developer',
  'data-scientist': 'Data Scientist',
  'machine-learning-engineer': 'Machine Learning Engineer',
  'mobile-app-developer': 'Mobile App Developer',
  'android-developer': 'Android Developer',
  'ios-developer': 'iOS Developer',
  'devops-engineer': 'DevOps Engineer',
  'cloud-engineer': 'Cloud Engineer',
  'data-engineer': 'Data Engineer',
  'ai-engineer': 'AI Engineer',
};

export interface JobFilters {
  search?: string;
  title?: string;
  company_name?: string;
}

// Get all jobs with optional filters
export const getJobs = async (filters?: JobFilters) => {
  try {
    const params: Record<string, string> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.title) params.title = filters.title;
    if (filters?.company_name) params.company_name = filters.company_name;

    const response = await axiosInstance.get('referly/jobs/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Get job by ID
export const getJobDetail = async (jobId: number) => {
  try {
    const response = await axiosInstance.get(`referly/jobs/${jobId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job detail:', error);
    throw error;
  }
};

// Search jobs
export const searchJobs = async (query: string) => {
  try {
    const response = await axiosInstance.get('referly/jobs/search/', {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};

// Get jobs by company
export const getJobsByCompany = async (companyId: string) => {
  try {
    const response = await axiosInstance.get(`referly/jobs/by-company/${companyId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    throw error;
  }
};

