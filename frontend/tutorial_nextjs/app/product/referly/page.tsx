'use client'

import { useState, useEffect, useCallback } from "react"
import { CodeEditor } from "./components/code-editor"
import { PreviewPanel } from "./components/preview-panel"
import { FileTabs, OpenFile } from "./components/file-tabs"
import { ResizablePanels } from "./components/resizable-panels"
import { getTemplateContent } from "@/services/referly/templateApi"
import { getResumeEmailFormat, getResumePreviewUrl } from "@/services/referly/resumeApi"
import { FolderItem } from "@/types/types"
import { Loader2 } from "lucide-react"
import { ResumeViewer } from "./components/resume-viewer"

// File content loading states
interface FileContentState {
  [fileId: string]: {
    content: string;
    loading: boolean;
    error: string | null;
  }
}

export default function EmailServicePage() {
    const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
    const [activeFileId, setActiveFileId] = useState<string>()
    const [fileContents, setFileContents] = useState<FileContentState>({})
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set())

    const handleFileSelect = useCallback(async (file: FolderItem) => {
        if (file.type === 'file') {
            // Check if file is already open
            const existingFile = openFiles.find(f => f.id === file.id)
            
            if (existingFile) {
                setActiveFileId(file.id)
                return
            }

            // Create new file entry with loading state
            const newFile: OpenFile = {
                id: file.id,
                name: file.display_name || file.name,
                content: '',
                isDirty: false,
                extension: file.extension || ''
            }
            
            setOpenFiles(prev => [...prev, newFile])
            setActiveFileId(file.id)
            setLoadingFiles(prev => new Set([...prev, file.id]))
            
            // Initialize content state
            setFileContents(prev => ({
                ...prev,
                [file.id]: {
                    content: '',
                    loading: true,
                    error: null
                }
            }))

            try {
                let content = ''
                
                // Extract the actual ID by removing the prefix
                let actualId = file.id
                let fileType: 'template' | 'resume' = 'template'
                
                if (file.id.startsWith('TPL_')) {
                    actualId = file.id.replace('TPL_', '')
                    fileType = 'template'
                } else if (file.id.startsWith('RES_')) {
                    actualId = file.id.replace('RES_', '')
                    fileType = 'resume'
                }
                
                console.log('Processing file:', { originalId: file.id, actualId, fileType, extension: file.extension })
                
                if (file.extension === 'html' && fileType === 'template') {
                    // Load template content
                    console.log('Loading template content for ID:', actualId)
                    const templateData = await getTemplateContent(parseInt(actualId))
                    console.log('Loaded template data:', templateData)
                    content = templateData.html_content
                } else if ((file.extension === 'pdf' || file.extension === 'docx') && fileType === 'resume') {
                    // For resume files, we'll use the ResumeViewer component
                    console.log('Loading resume file for ID:', actualId)
                    content = `RESUME_FILE:${actualId}:${file.display_name || file.name}:${file.extension}:${file.size || 0}`
                } else {
                    console.warn('Unhandled file type:', { fileType, extension: file.extension })
                    content = `<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                        <h2>⚠️ Unsupported File Type</h2>
                        <p>File: ${file.name}</p>
                        <p>Type: ${fileType} | Extension: ${file.extension}</p>
                    </div>`
                }
                
                // Update file content
                setFileContents(prev => ({
                    ...prev,
                    [file.id]: {
                        content,
                        loading: false,
                        error: null
                    }
                }))
                
                // Update the file in openFiles
                setOpenFiles(prev => prev.map(f => 
                    f.id === file.id ? { ...f, content } : f
                ))
                
            } catch (error) {
                console.error('Failed to load file content:', error)
                const errorContent = `<div style="text-align: center; padding: 50px; color: #ef4444; font-family: Arial, sans-serif;">
                    <h2>❌ Error Loading File</h2>
                    <p>Failed to load content for ${file.name}</p>
                    <p>Please try again or contact support.</p>
                </div>`
                
                setFileContents(prev => ({
                    ...prev,
                    [file.id]: {
                        content: errorContent,
                        loading: false,
                        error: 'Failed to load file content'
                    }
                }))
                
                setOpenFiles(prev => prev.map(f => 
                    f.id === file.id ? { ...f, content: errorContent } : f
                ))
            } finally {
                setLoadingFiles(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(file.id)
                    return newSet
                })
            }
        }
    }, [openFiles, fileContents, loadingFiles]) // Dependencies for useCallback

    // Listen for file selection events from the sidebar
    useEffect(() => {
        const handleFileSelected = (event: CustomEvent) => {
            console.log('File selection event received:', event.detail)
            handleFileSelect(event.detail)
        }

        window.addEventListener('fileSelected', handleFileSelected as EventListener)
        
        return () => {
            window.removeEventListener('fileSelected', handleFileSelected as EventListener)
        }
    }, [handleFileSelect])

    const handleFileClose = (fileId: string) => {
        setOpenFiles(prev => prev.filter(f => f.id !== fileId))
        setFileContents(prev => {
            const newContents = { ...prev }
            delete newContents[fileId]
            return newContents
        })
        setLoadingFiles(prev => {
            const newSet = new Set(prev)
            newSet.delete(fileId)
            return newSet
        })
        
        if (activeFileId === fileId) {
            const remainingFiles = openFiles.filter(f => f.id !== fileId)
            setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : undefined)
        }
    }

    const handleContentChange = (content: string) => {
        if (activeFileId) {
            setFileContents(prev => ({
                ...prev,
                [activeFileId]: {
                    ...prev[activeFileId],
                    content
                }
            }))
            
            // Mark file as dirty
            setOpenFiles(prev => prev.map(f => 
                f.id === activeFileId 
                    ? { ...f, isDirty: true, content }
                    : f
            ))
        }
    }

    const activeFile = openFiles.find(f => f.id === activeFileId)
    const activeContentState = activeFileId ? fileContents[activeFileId] : null
    const activeContent = activeContentState?.content || ''
    const isLoadingActiveFile = activeFileId ? loadingFiles.has(activeFileId) : false

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
                {activeFile ? (
                    isLoadingActiveFile ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                                <p className="text-muted-foreground">Loading {activeFile.name}...</p>
                            </div>
                        </div>
                    ) : (
                        <ResizablePanels 
                            defaultSizePercentage={activeFile.extension === 'html' ? 55 : 100}
                            minSizePercentage={25}
                            maxSizePercentage={75}
                        >
                            {/* Code Editor - Top Panel (Resizable) - Only for HTML templates */}
                            {activeFile.extension === 'html' ? (
                                <CodeEditor
                                    content={activeContent}
                                    onChange={handleContentChange}
                                    fileName={activeFile.name}
                                    language={activeFile.extension}
                                />
                            ) : activeContent.startsWith('RESUME_FILE:') ? (
                                <div className="flex-1 overflow-hidden h-full">
                                    {(() => {
                                        const [, resumeId, fileName, fileExtension, fileSize] = activeContent.split(':')
                                        console.log('Parsed resume data:', { resumeId, fileName, fileExtension, fileSize })
                                        console.log('Full activeContent:', activeContent)
                                        return (
                                            <ResumeViewer
                                                resumeId={parseInt(resumeId)}
                                                fileName={fileName}
                                                fileExtension={fileExtension}
                                                fileSize={parseInt(fileSize)}
                                            />
                                        )
                                    })()}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-hidden">
                                    <PreviewPanel
                                        htmlContent={activeContent}
                                        fileName={activeFile.name}
                                    />
                                </div>
                            )}
                            
                            {/* Preview Panel - Bottom Panel (Resizable) - Only for HTML templates */}
                            {activeFile.extension === 'html' && (
                                <PreviewPanel
                                    htmlContent={activeContent}
                                    fileName={activeFile.name}
                                />
                            )}
                        </ResizablePanels>
                    )
                ) : (
                    /* Welcome Screen */
                    <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                        <div>
                            <div className="text-6xl mb-4">📧</div>
                            <h3 className="text-xl font-semibold mb-2">Email Service Studio</h3>
                            <p className="mb-4">Create and preview your email templates</p>
                            <div className="text-sm space-y-1">
                                <p>• Select a template from the sidebar to start editing</p>
                                <p>• Create new HTML templates in the Templates folder</p>
                                <p>• Upload resume files to the Resume folder</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}