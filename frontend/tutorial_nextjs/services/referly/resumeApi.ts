import axiosInstance from "@/utils/axiosInstance";
import { Resume, ResumeUploadPayload, ResumePreview } from "@/types/types";

export async function getResumes(): Promise<Resume[]> {
    const response = await axiosInstance.get("referly/resumes/");
    return response.data;
}

export async function uploadResume(payload: ResumeUploadPayload): Promise<{ message: string; data: Resume }> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('file', payload.file);
    
    const response = await axiosInstance.post("referly/resumes/upload/", formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export async function getResume(resumeId: number): Promise<Resume> {
    const response = await axiosInstance.get(`referly/resumes/${resumeId}/`);
    return response.data;
}

export function getResumePreviewUrl(resumeId: number): string {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/";
    return `${baseURL}referly/resumes/${resumeId}/preview/`;
}

export function downloadResume(resumeId: number): void {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/";
    const url = `${baseURL}referly/resumes/${resumeId}/download/`;
    window.open(url, '_blank');
}

export async function getResumeEmailFormat(resumeId: number): Promise<ResumePreview> {
    const response = await axiosInstance.get(`referly/resumes/${resumeId}/email-format/`);
    return response.data;
}

export async function deleteResume(resumeId: number): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`referly/resumes/${resumeId}/`);
    return response.data;
}