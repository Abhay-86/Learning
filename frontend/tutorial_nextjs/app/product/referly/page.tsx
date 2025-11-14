'use client'

import { useState, useEffect } from "react"
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

    const handleFileSelect = async (file: FolderItem) => {
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
                
                if (file.extension === 'html') {
                    // Load template content
                    const templateData = await getTemplateContent(parseInt(file.id))
                    content = templateData.html_content
                } else if (file.extension === 'pdf' || file.extension === 'docx') {
                    // For resume files, we'll use the ResumeViewer component
                    content = `RESUME_FILE:${file.id}:${file.name}:${file.extension}:${file.size || 0}`
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
    }

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
                                <div className="flex-1 overflow-hidden">
                                    {(() => {
                                        const [, resumeId, fileName, fileExtension, fileSize] = activeContent.split(':')
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