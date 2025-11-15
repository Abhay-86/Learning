import axiosInstance from "@/utils/axiosInstance";
import { Template, TemplateCreatePayload, TemplateUpdatePayload } from "@/types/types";

export async function getTemplates(): Promise<Template[]> {
    const response = await axiosInstance.get("referly/templates/");
    return response.data;
}

export async function createTemplate(payload: TemplateCreatePayload): Promise<{ message: string; data: Template }> {
    const response = await axiosInstance.post("referly/templates/create/", payload);
    return response.data;
}

export async function getTemplate(templateId: number): Promise<Template> {
    const response = await axiosInstance.get(`referly/templates/${templateId}/`);
    return response.data;
}

export async function getTemplateContent(templateId: number): Promise<{ html_content: string }> {
    const response = await axiosInstance.get(`referly/templates/${templateId}/`);
    return { html_content: response.data.html_content };
}

export async function updateTemplate(templateId: number, payload: TemplateUpdatePayload): Promise<{ message: string; data: Template }> {
    const response = await axiosInstance.put(`referly/templates/${templateId}/`, payload);
    return response.data;
}

export async function deleteTemplate(templateId: number): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`referly/templates/${templateId}/`);
    return response.data;
}