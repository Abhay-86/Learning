import axiosInstance from "@/utils/axiosInstance";
import { FolderStructure } from "@/types/types";

export async function getFullFolderStructure(): Promise<FolderStructure> {
    const response = await axiosInstance.get("referly/folders/full/");
    return response.data;
}

export async function getTemplatesFolderStructure(): Promise<FolderStructure> {
    const response = await axiosInstance.get("referly/folders/templates/");
    return response.data;
}

export async function getResumesFolderStructure(): Promise<FolderStructure> {
    const response = await axiosInstance.get("referly/folders/resumes/");
    return response.data;
}