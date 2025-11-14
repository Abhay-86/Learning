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
    const [savingFile, setSavingFile] = useState<string | null>(null)
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

    // Auto-save functionality (save after 2 seconds of inactivity)
    useEffect(() => {
        if (!activeFileId) return

        const activeFile = openFiles.find(f => f.id === activeFileId)
        if (!activeFile?.isDirty) return

        const autoSaveTimer = setTimeout(() => {
            if (activeFile.extension === 'html') {
                console.log('Auto-saving template:', activeFile.name)
                handleSaveTemplate(activeFileId)
            }
        }, 2000)

        return () => clearTimeout(autoSaveTimer)
    }, [fileContents, activeFileId, openFiles])

    const loadFolderStructures = async () => {
        try {
            setLoading(true)
            console.log('Loading folder structures...')
            console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/")
            
            // Test basic connectivity first
            try {
                const [templatesData, resumesData] = await Promise.all([
                    getTemplatesFolderStructure(),
                    getResumesFolderStructure()
                ])
                console.log('Templates data:', templatesData)
                console.log('Resumes data:', resumesData)
                setTemplatesFolder(templatesData)
                setResumesFolder(resumesData)
            } catch (apiError) {
                console.error('API Error details:', apiError)
                throw apiError
            }
        } catch (error) {
            console.error('Failed to load folder structures:', error)
            // Show error in UI with more details
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            alert(`Failed to load data: ${errorMessage}\n\nCheck console for details. Make sure:\n1. Django backend is running\n2. You're logged in\n3. You have referly feature access`)
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
        console.log('File selected:', file)
        
        if (file.type === 'file' && file.extension === 'html') {
            // Template file selected
            const existingFile = openFiles.find(f => f.id === file.id)
            
            if (existingFile) {
                setActiveFileId(file.id)
                console.log('Template already open:', file.name)
            } else {
                try {
                    // Extract template ID from file.id (format: "template_123")
                    console.log('Raw file ID:', file.id)
                    const idString = file.id.replace('template_', '')
                    console.log('ID string after replace:', idString)
                    const templateId = parseInt(idString)
                    console.log('Parsed template ID:', templateId)
                    
                    if (isNaN(templateId)) {
                        throw new Error(`Invalid template ID: ${file.id}. Expected format: template_123`)
                    }
                    
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
            console.log('Resume selected:', file.id)
            const idString = file.id.replace('resume_', '')
            const resumeId = parseInt(idString)
            console.log('Parsed resume ID:', resumeId)
            
            if (isNaN(resumeId)) {
                console.error(`Invalid resume ID: ${file.id}. Expected format: resume_123`)
                return
            }
            
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
            setSavingFile(fileId)
            setSaveStatus(null)
            
            const content = fileContents[fileId]
            const idString = fileId.replace('template_', '')
            const templateId = parseInt(idString)
            
            console.log('Saving template - File ID:', fileId, 'Parsed ID:', templateId)
            
            if (isNaN(templateId)) {
                throw new Error(`Invalid template ID for saving: ${fileId}`)
            }
            
            await updateTemplate(templateId, { html_content: content })
            
            // Mark file as clean
            setOpenFiles(prev => prev.map(f => 
                f.id === fileId 
                    ? { ...f, isDirty: false }
                    : f
            ))
            
            setSaveStatus({ type: 'success', message: 'Template saved successfully!' })
            
            // Clear success message after 3 seconds
            setTimeout(() => setSaveStatus(null), 3000)
        } catch (error) {
            console.error('Failed to save template:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to save template'
            setSaveStatus({ type: 'error', message: errorMessage })
        } finally {
            setSavingFile(null)
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
                
                {/* Save Status Bar */}
                {saveStatus && (
                    <div className={`px-4 py-2 text-sm border-b ${
                        saveStatus.type === 'success' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {saveStatus.message}
                    </div>
                )}
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
                            onSave={() => handleSaveTemplate(activeFile.id)}
                            isSaving={savingFile === activeFile.id}
                            isDirty={activeFile.isDirty}
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
                        <div className="max-w-4xl">
                            <div className="text-6xl mb-4">📧</div>
                            <h3 className="text-xl font-semibold mb-2">Referly Studio</h3>
                            <p className="mb-4">Create and preview your email templates and resumes</p>
                            <div className="text-sm space-y-1 mb-6">
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

                            {/* Debug: Show folder structure data */}
                            <div className="mt-8 text-left bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Debug - Folder Structures:</h4>
                                
                                {templatesFolder && (
                                    <div className="mb-4">
                                        <h5 className="font-medium text-green-600">Templates ({templatesFolder.children.length} items):</h5>
                                        <div className="ml-4 space-y-1">
                                            {templatesFolder.children.map((item) => (
                                                <div key={item.id} className="text-sm">
                                                    <button 
                                                        onClick={() => handleFileSelect(item)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        📄 {item.display_name || item.name}
                                                    </button>
                                                    <span className="text-gray-500 ml-2">({item.id})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {resumesFolder && (
                                    <div className="mb-4">
                                        <h5 className="font-medium text-blue-600">Resumes ({resumesFolder.children.length} items):</h5>
                                        <div className="ml-4 space-y-1">
                                            {resumesFolder.children.map((item) => (
                                                <div key={item.id} className="text-sm">
                                                    <button 
                                                        onClick={() => handleFileSelect(item)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        📄 {item.display_name || item.name}
                                                    </button>
                                                    <span className="text-gray-500 ml-2">({item.id})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!templatesFolder && !resumesFolder && (
                                    <div>
                                        <p className="text-red-500 mb-2">No folder data loaded yet</p>
                                        <button 
                                            onClick={loadFolderStructures}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Retry Loading Data
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}