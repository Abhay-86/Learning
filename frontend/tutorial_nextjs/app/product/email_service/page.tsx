'use client'

import { useState, useEffect } from "react"
import { CodeEditor } from "./components/code-editor"
import { PreviewPanel } from "./components/preview-panel"
import { FileTabs, OpenFile } from "./components/file-tabs"

// Dummy template data
const dummyTemplates: { [key: string]: string } = {
  'template1': `<!DOCTYPE html>
<html>
<head>
    <title>Welcome Email</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <tr>
            <td style="padding: 30px;">
                <h2 style="color: #2563eb; margin-bottom: 10px;">Welcome!</h2>
                <p>Hi there,</p>
                <p>Welcome to our platform! We're excited to have you on board.</p>
                <p>Best regards,<br>The Team</p>
            </td>
        </tr>
    </table>
</body>
</html>`,
  'template2': `<!DOCTYPE html>
<html>
<head>
    <title>Job Application</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <tr>
            <td style="padding: 30px;">
                <h2 style="color: #2563eb; margin-bottom: 10px;">Job Application</h2>
                <p>Dear Hiring Manager,</p>
                <p>I am writing to express my interest in the position at your company.</p>
                <p>I have attached my resume for your review.</p>
                <p>Thank you for your consideration.</p>
                <p>Best regards,<br>Your Name</p>
            </td>
        </tr>
    </table>
</body>
</html>`,
  'template3': `<!DOCTYPE html>
<html>
<head>
    <title>Follow Up Email</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #333;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <tr>
            <td style="padding: 30px;">
                <h2 style="color: #2563eb; margin-bottom: 10px;">Follow Up</h2>
                <p>Hi,</p>
                <p>I wanted to follow up on my previous email regarding the job opportunity.</p>
                <p>I remain very interested in the position and would love to discuss further.</p>
                <p>Thank you for your time.</p>
                <p>Best regards,<br>Your Name</p>
            </td>
        </tr>
    </table>
</body>
</html>`
}

export default function EmailServicePage() {
    const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
    const [activeFileId, setActiveFileId] = useState<string>()
    const [fileContents, setFileContents] = useState<{ [key: string]: string }>({})

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

    const handleFileSelect = (file: any) => {
        if (file.type === 'file' && file.extension === 'html') {
            // Check if file is already open
            const existingFile = openFiles.find(f => f.id === file.id)
            
            if (existingFile) {
                setActiveFileId(file.id)
            } else {
                // Open new file
                const content = dummyTemplates[file.id] || `<!DOCTYPE html>
<html>
<head>
    <title>${file.name}</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h1>New Template</h1>
    <p>Start editing your email template here...</p>
</body>
</html>`
                
                const newFile: OpenFile = {
                    id: file.id,
                    name: file.name,
                    content: content,
                    isDirty: false,
                    extension: file.extension
                }
                
                setOpenFiles(prev => [...prev, newFile])
                setFileContents(prev => ({ ...prev, [file.id]: content }))
                setActiveFileId(file.id)
            }
        } else if (file.extension === 'pdf' || file.extension === 'docx') {
            // Handle resume files - show info or download
            console.log('Resume file selected:', file.name)
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

    const activeFile = openFiles.find(f => f.id === activeFileId)
    const activeContent = activeFileId ? fileContents[activeFileId] || '' : ''

    return (
        <div className="flex flex-col h-screen">
            {/* File Tabs */}
            <FileTabs 
                openFiles={openFiles}
                activeFileId={activeFileId}
                onFileSelect={setActiveFileId}
                onFileClose={handleFileClose}
            />
            
            {/* Main Content Area - Split Screen */}
            <div className="flex-1 flex flex-col">
                {activeFile ? (
                    <>
                        {/* Code Editor - Top Half */}
                        <div className="flex-1 border-b">
                            <CodeEditor
                                content={activeContent}
                                onChange={handleContentChange}
                                fileName={activeFile.name}
                                language={activeFile.extension}
                            />
                        </div>
                        
                        {/* Preview Panel - Bottom Half */}
                        <div className="flex-1">
                            <PreviewPanel
                                htmlContent={activeContent}
                                fileName={activeFile.name}
                            />
                        </div>
                    </>
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