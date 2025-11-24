'use client'

import { useState, useEffect, useCallback } from "react"
import { CodeEditor } from "./components/code-editor"
import { PreviewPanel } from "./components/preview-panel"
import { FileTabs, OpenFile } from "./components/file-tabs"
import { ResizablePanels } from "./components/resizable-panels"
import { getTemplateContent, updateTemplate } from "@/services/referly/templateApi"
import { getResumeEmailFormat, getResumePreviewUrl } from "@/services/referly/resumeApi"
import { FolderItem } from "@/types/types"
import { Loader2 } from "lucide-react"
import { ResumeViewer } from "./components/resume-viewer"
import { useToast, ToastContainer } from "@/components/ui/toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Quote } from "lucide-react"

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
    const toast = useToast()
    const { user } = useAuth()

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
                    <h2>Error Loading File</h2>
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

    // Extract template ID from activeFile.id (remove TPL_ prefix)
    const activeTemplateId = activeFile?.id.startsWith('TPL_') ?
        parseInt(activeFile.id.replace('TPL_', '')) : undefined

    const handleSaveTemplate = async (templateId: number, content: string) => {
        try {
            const response = await updateTemplate(templateId, {
                html_content: content
            })
            toast.success('Template saved successfully!')

            // Mark as saved and clear dirty state
            if (activeFileId) {
                setFileContents(prev => ({
                    ...prev,
                    [activeFileId]: {
                        ...prev[activeFileId],
                        error: null
                    }
                }))

                // Clear the orange dot by setting isDirty to false
                setOpenFiles(prev => prev.map(f =>
                    f.id === activeFileId
                        ? { ...f, isDirty: false }
                        : f
                ))
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Failed to save template. Please try again.')
            throw error // Re-throw to let CodeEditor handle loading state
        }
    }

    const handleCopyFeedback = (success: boolean, message: string) => {
        if (success) {
            toast.success(message)
        } else {
            toast.error(message)
        }
    }



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
                        <>
                            {activeContent.startsWith('RESUME_FILE:') ? (
                                // Resume files - no resizable panels needed, just full viewer
                                <div className="h-full">
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
                            ) : activeFile.extension === 'html' ? (
                                // HTML templates - resizable panels with editor and preview
                                <ResizablePanels
                                    defaultSizePercentage={55}
                                    minSizePercentage={25}
                                    maxSizePercentage={75}
                                >
                                    <CodeEditor
                                        content={activeContent}
                                        onChange={handleContentChange}
                                        fileName={activeFile.name}
                                        language={activeFile.extension}
                                        templateId={activeTemplateId}
                                        onSave={handleSaveTemplate}
                                        onCopy={handleCopyFeedback}
                                    />

                                    <PreviewPanel
                                        htmlContent={activeContent}
                                        fileName={activeFile.name}
                                    />
                                </ResizablePanels>
                            ) : (
                                // Other file types - just preview panel
                                <div className="h-full">
                                    <PreviewPanel
                                        htmlContent={activeContent}
                                        fileName={activeFile.name}
                                    />
                                </div>
                            )}
                        </>
                    )
                ) : (
                    /* Welcome Screen */
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-8">
                        <div className="max-w-2xl w-full space-y-8">
                            {/* Header with Avatar */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-xl">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'User'}`} />
                                    <AvatarFallback className="text-2xl">{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Hello, {user?.first_name || user?.username || 'Creator'}!
                                    </h2>
                                    <p className="text-muted-foreground mt-2">Ready to create something amazing today?</p>
                                </div>
                            </div>

                            {/* Daily Motivation - Full Width & Full Height */}
                            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center">
                                <Card className="border-none shadow-none bg-transparent h-full flex flex-col justify-center">
                                    <CardContent className="pt-8 pb-8 px-0 text-center">
                                        <div className="relative inline-block">
                                            <Quote className="h-12 w-12 text-blue-500/20 absolute -top-8 -left-12 transform -scale-x-100" />

                                            <div className="space-y-8 max-w-3xl mx-auto">
                                                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                                    "Volume always wins. Luck doesn't."
                                                </h3>

                                                <div className="space-y-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                    <p>
                                                        Throw 10 balls → none may go in.<br />
                                                        Throw 100 → at least one will.<br />
                                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">That's not luck. That's volume.</span>
                                                    </p>

                                                    <p className="italic pl-4 border-l-4 border-blue-500/30">
                                                        Send that email. Make that call. Do that follow-up.<br />
                                                        Knock on that next door. Push again. Then push some more.
                                                    </p>

                                                    <p>
                                                        Because success isn't about one perfect move,<br />
                                                        it's about showing up a hundred times more than anyone else.
                                                    </p>

                                                    <p>
                                                        Luck fades. Volume compounds.<br />
                                                        Keep the volume high and watch results chase you.
                                                    </p>
                                                </div>

                                                <div className="pt-8 border-t border-gray-200 dark:border-gray-800 w-1/2 mx-auto">
                                                    <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                        At the end volume always beats luck. Always.
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-4">
                                                        — Alex Hormozi
                                                    </p>
                                                </div>
                                            </div>

                                            <Quote className="h-12 w-12 text-blue-500/20 absolute -bottom-8 -right-12" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                <p>Select a template from the sidebar to start working</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Toast notifications */}
            <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        </div>
    )
}