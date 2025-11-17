'use client'

import React, { useState, useEffect } from "react"
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  FileCode,
  Loader2,
  AlertCircle,
  Trash2,
  MoreVertical
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getTemplatesFolderStructure, getResumesFolderStructure } from "@/services/referly/folderApi"
import { createTemplate, deleteTemplate } from "@/services/referly/templateApi"
import { uploadResume, deleteResume } from "@/services/referly/resumeApi"
import { FolderStructure, FolderItem } from "@/types/types"

// Extended interface for tree rendering
interface TreeItem extends FolderItem {
  children?: TreeItem[]
}

interface FileExplorerProps {
  onFileSelect: (file: FolderItem) => void
  selectedFileId?: string
  onDeleteResume?: (fileId: string, fileType?: 'resume' | 'template') => void
}

function FileIcon({ extension }: { extension?: string }) {
  switch (extension) {
    case 'html':
      return <FileCode className="h-4 w-4 text-orange-500" />
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />
    case 'docx':
    case 'doc':
      return <FileText className="h-4 w-4 text-blue-500" />
    default:
      return <FileText className="h-4 w-4 text-gray-500" />
  }
}

function FileTreeItem({ 
  item, 
  onFileSelect, 
  selectedFileId, 
  level = 0,
  onDeleteResume
}: { 
  item: TreeItem
  onFileSelect: (file: FolderItem) => void
  selectedFileId?: string
  level?: number
  onDeleteResume?: (fileId: string, fileType?: 'resume' | 'template') => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  
  if (item.type === 'folder') {
    return (
      <div>
        <SidebarMenuButton
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full justify-start pl-${level * 4 + 2}`}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}
          <span>{item.name}</span>
        </SidebarMenuButton>
        
        {isOpen && item.children && (
          <div className="ml-4">
            {item.children.map((child: TreeItem) => (
              <FileTreeItem
                key={child.id}
                item={child}
                onFileSelect={onFileSelect}
                selectedFileId={selectedFileId}
                level={level + 1}
                onDeleteResume={onDeleteResume}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // File item
  return (
    <div className="flex items-center group hover:bg-accent/50 rounded-md">
      <SidebarMenuButton
        onClick={() => {
          console.log('File selected in sidebar:', item)
          onFileSelect(item)
        }}
        className={`flex-1 justify-start pl-${level * 4 + 6} ${
          selectedFileId === item.id ? 'bg-accent' : ''
        }`}
      >
        <FileIcon extension={item.extension} />
        <span className="text-sm">{item.display_name || item.name}</span>
      </SidebarMenuButton>
      
      {/* Delete button for both template and resume files */}
      {(item.id.startsWith('RES_') || item.id.startsWith('TPL_')) && onDeleteResume && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                const fileId = item.id.replace('RES_', '').replace('TPL_', '')
                const fileType = item.id.startsWith('RES_') ? 'resume' : 'template'
                const fileName = item.display_name || item.name
                
                if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
                  onDeleteResume(fileId, fileType)
                }
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {item.id.startsWith('RES_') ? 'Resume' : 'Template'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// Helper function to convert FolderStructure to TreeItem
function convertToTreeItem(folderStructure: FolderStructure, folderType: 'template' | 'resume'): TreeItem {
  const folderPrefix = folderType === 'template' ? 'TPL_' : 'RES_'
  
  return {
    id: folderStructure.id || folderStructure.name.toLowerCase(),
    name: folderStructure.name,
    type: 'folder' as const,
    children: folderStructure.children.map(child => ({
      ...child,
      id: `${folderPrefix}${child.id}`, // Add prefix to distinguish template vs resume files
      children: child.type === 'folder' ? [] : undefined
    }))
  }
}

export function EmailServiceSidebar({ onFileSelect, selectedFileId, onDeleteResume }: FileExplorerProps) {
  const [fileSystem, setFileSystem] = useState<TreeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isDeletingFile, setIsDeletingFile] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDeleteFile = async (fileId: string, fileType: 'resume' | 'template' = 'resume') => {
    
    setIsDeletingFile(true)
    try {
      if (fileType === 'resume') {
        await deleteResume(parseInt(fileId))
      } else {
        await deleteTemplate(parseInt(fileId))
      }
      
      // Refresh the folder structure to remove deleted file
      loadFolderStructures()
      
      // Also call the parent handler if provided
      if (onDeleteResume) {
        onDeleteResume(fileId, fileType)
      }
    } catch (error) {
      console.error(`Failed to delete ${fileType}:`, error)
    } finally {
      setIsDeletingFile(false)
    }
  }

  const handleCreateTemplate = async () => {
    const templateName = prompt('Enter template name:')
    if (!templateName || !templateName.trim()) {
      return
    }

    setIsCreatingTemplate(true)
    try {
      const newTemplate = await createTemplate({
        name: templateName.trim(),
        html_content: '<html><body><h1>New Template</h1><p>Start editing your template here...</p></body></html>'
      })
      
      console.log('Template created:', newTemplate)
      
      // Refresh the folder structure to show new template
      loadFolderStructures()
    } catch (error) {
      console.error('Failed to create template:', error)
    } finally {
      setIsCreatingTemplate(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!allowedTypes.includes(file.type)) {
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return
    }

    setIsUploadingResume(true)
    try {
      const uploadResult = await uploadResume({
        name: file.name,
        file: file
      })
      
      console.log('Resume uploaded:', uploadResult)
      // alert(`Resume "${file.name}" uploaded successfully! 📤`)
      
      // Refresh the folder structure to show new resume
      loadFolderStructures()
    } catch (error) {
      console.error('Failed to upload resume:', error)
      // alert('Failed to upload resume. Please try again.')
    } finally {
      setIsUploadingResume(false)
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const loadFolderStructures = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load both templates and resumes folders
      const [templatesData, resumesData] = await Promise.all([
        getTemplatesFolderStructure(),
        getResumesFolderStructure()
      ])

      const treeItems: TreeItem[] = [
        convertToTreeItem(templatesData, 'template'),
        convertToTreeItem(resumesData, 'resume')
      ]

      setFileSystem(treeItems)
    } catch (err) {
      console.error('Failed to load folder structures:', err)
      setError('Failed to load folders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFolderStructures()
  }, [])

  return (
    <Sidebar style={{ top: '4rem', height: 'calc(100vh - 4rem)' } as React.CSSProperties}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">
            Email Service Files
          </SidebarGroupLabel>
          
          {/* Action Bar - Always visible at the top */}
          <div className="px-3 py-3 border-b border-border/50">
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
                onClick={handleCreateTemplate}
                disabled={isCreatingTemplate}
              >
                {isCreatingTemplate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Create New Template
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                onClick={handleUploadClick}
                disabled={isUploadingResume}
              >
                {isUploadingResume ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Folder className="h-4 w-4 mr-2" />
                    Upload Resume
                  </>
                )}
              </Button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          
          <SidebarGroupContent>
            {loading ? (
              <SidebarMenu>
                {[1, 2].map((i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <SidebarMenu>
                {fileSystem.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <FileTreeItem
                      item={item}
                      onFileSelect={onFileSelect}
                      selectedFileId={selectedFileId}
                      onDeleteResume={handleDeleteFile}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}