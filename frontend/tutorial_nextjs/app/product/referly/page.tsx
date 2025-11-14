'use client'

import { useState, useEffect } from "react"
import { CodeEditor } from "./components/code-editor"
import { PreviewPanel } from "./components/preview-panel"
import { FileTabs, OpenFile } from "./components/file-tabs"
import { ResizablePanels } from "./components/resizable-panels"
import { getTemplatesFolderStructure, getResumesFolderStructure, getTemplateContent, updateTemplate, getResumePreviewUrl } from "@/services/referly"
import { FolderStructure, FolderItem } from "@/types/types"

export default function ReferlyPage() {
    const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
    const [activeFileId, setActiveFileId] = useState<string>()
    const [fileContents, setFileContents] = useState<{ [key: string]: string }>({})
    const [templatesFolder, setTemplatesFolder] = useState<FolderStructure | null>(null)
    const [resumesFolder, setResumesFolder] = useState<FolderStructure | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null)
    const [resumePreview, setResumePreview] = useState<{ id: string; name: string; url: string } | null>(null)

    // Load folder structures on component mount
    useEffect(() => {
        loadFolderStructures()
    }, [])

    // Listen for file selection events from the sidebar
    useEffect(() => {
        const handleFileSelected = (event: CustomEvent) => {
            handleFileSelect(event.detail)
        }

        window.addEventListener('fileSelected', handleFileSelected as EventListener)
        
        return () => {
            window.removeEventListener('fileSelected', handleFileSelected as EventListener)
        }
    }, [openFiles])

    const loadFolderStructures = async () => {
        try {
            setLoading(true)
            const [templatesData, resumesData] = await Promise.all([
                getTemplatesFolderStructure(),
                getResumesFolderStructure()
            ])
            setTemplatesFolder(templatesData)
            setResumesFolder(resumesData)
        } catch (error) {
            console.error('Failed to load folder structures:', error)
            // You can add error handling/toast here
        } finally {
            setLoading(false)
        }
    }

    const loadTemplateContent = async (templateId: number) => {
        try {
            setLoadingTemplate(templateId.toString())
            const content = await getTemplateContent(templateId)
            setFileContents(prev => ({ ...prev, [templateId]: content.html_content }))
            return content.html_content
        } catch (error) {
            console.error('Failed to load template content:', error)
            throw error
        } finally {
            setLoadingTemplate(null)
        }
    }

    const handleResumePreview = (resumeId: number, resumeName: string) => {
        const previewUrl = getResumePreviewUrl(resumeId)
        setResumePreview({
            id: resumeId.toString(),
            name: resumeName,
            url: previewUrl
        })
    }

    const handleFileSelect = async (file: FolderItem) => {
        if (file.type === 'file' && file.extension === 'html') {
            // Template file selected
            const existingFile = openFiles.find(f => f.id === file.id)
            
            if (existingFile) {
                setActiveFileId(file.id)
                console.log('Template already open:', file.name)
            } else {
                try {
                    // Extract template ID from file.id (format: "template_123")
                    const templateId = parseInt(file.id.replace('template_', ''))
                    const content = await loadTemplateContent(templateId)
                    
                    const newFile: OpenFile = {
                        id: file.id,
                        name: file.display_name || file.name,
                        content: content,
                        isDirty: false,
                        extension: file.extension
                    }
                    
                    setOpenFiles(prev => [...prev, newFile])
                    setActiveFileId(file.id)
                    setResumePreview(null) // Clear resume preview when template is selected
                } catch (error) {
                    console.error('Failed to open template:', error)
                    // You can add error handling/toast here
                }
            }
        } else if (file.extension === 'pdf' || file.extension === 'docx') {
            // Resume file selected - show preview
            const resumeId = parseInt(file.id.replace('resume_', ''))
            handleResumePreview(resumeId, file.display_name || file.name)
            setActiveFileId(undefined) // Clear active template when resume is selected
        }
    }

    const handleFileClose = (fileId: string) => {
        setOpenFiles(prev => prev.filter(f => f.id !== fileId))
        setFileContents(prev => {
            const newContents = { ...prev }
            delete newContents[fileId]
            return newContents
        })
        
        if (activeFileId === fileId) {
            const remainingFiles = openFiles.filter(f => f.id !== fileId)
            setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : undefined)
        }
    }

    const handleContentChange = (content: string) => {
        if (activeFileId) {
            setFileContents(prev => ({ ...prev, [activeFileId]: content }))
            
            // Mark file as dirty
            setOpenFiles(prev => prev.map(f => 
                f.id === activeFileId 
                    ? { ...f, isDirty: true, content }
                    : f
            ))
        }
    }

    const handleSaveTemplate = async (fileId: string) => {
        try {
            const content = fileContents[fileId]
            const templateId = parseInt(fileId.replace('template_', ''))
            
            await updateTemplate(templateId, { html_content: content })
            
            // Mark file as clean
            setOpenFiles(prev => prev.map(f => 
                f.id === fileId 
                    ? { ...f, isDirty: false }
                    : f
            ))
            
            console.log('Template saved successfully')
            // You can add success toast here
        } catch (error) {
            console.error('Failed to save template:', error)
            // You can add error handling/toast here
        }
    }

    const activeFile = openFiles.find(f => f.id === activeFileId)
    const activeContent = activeFileId ? fileContents[activeFileId] || '' : ''

    return (
        <div className="flex flex-col h-full">
            {/* File Tabs */}
            <div className="shrink-0">
                <FileTabs 
                    openFiles={openFiles}
                    activeFileId={activeFileId}
                    onFileSelect={setActiveFileId}
                    onFileClose={handleFileClose}
                />
            </div>
            
            {/* Main Content Area - Resizable Split Screen */}
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    /* Loading State */
                    <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                        <div>
                            <div className="animate-pulse text-6xl mb-4">⏳</div>
                            <h3 className="text-xl font-semibold mb-2">Loading Referly...</h3>
                            <p>Please wait while we load your templates and resumes</p>
                        </div>
                    </div>
                ) : activeFile ? (
                    /* Template Editor View */
                    <ResizablePanels 
                        defaultSizePercentage={55}
                        minSizePercentage={25}
                        maxSizePercentage={75}
                    >
                        {/* Code Editor - Top Panel (Resizable) */}
                        <CodeEditor
                            content={activeContent}
                            onChange={handleContentChange}
                            fileName={activeFile.name}
                            language={activeFile.extension}
                        />
                        
                        {/* Preview Panel - Bottom Panel (Resizable) */}
                        <PreviewPanel
                            htmlContent={activeContent}
                            fileName={activeFile.name}
                        />
                    </ResizablePanels>
                ) : resumePreview ? (
                    /* Resume Preview View */
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">Resume Preview: {resumePreview.name}</h3>
                            <button 
                                onClick={() => setResumePreview(null)}
                                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                            >
                                Close Preview
                            </button>
                        </div>
                        <div className="flex-1">
                            <iframe 
                                src={resumePreview.url}
                                className="w-full h-full border-0"
                                title={`Preview of ${resumePreview.name}`}
                            />
                        </div>
                    </div>
                ) : (
                    /* Welcome Screen */
                    <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                        <div>
                            <div className="text-6xl mb-4">📧</div>
                            <h3 className="text-xl font-semibold mb-2">Referly Studio</h3>
                            <p className="mb-4">Create and preview your email templates and resumes</p>
                            <div className="text-sm space-y-1">
                                <p>• Select a template from the sidebar to start editing</p>
                                <p>• Click on resume files to preview them</p>
                                <p>• Create new templates and upload resumes</p>
                                {templatesFolder && (
                                    <p className="mt-4 text-blue-600">Templates: {templatesFolder.usage}</p>
                                )}
                                {resumesFolder && (
                                    <p className="text-blue-600">Resumes: {resumesFolder.usage}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}