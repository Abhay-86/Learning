'use client'

import React, { useState, useEffect } from "react"
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  FilePlus, 
  Upload, 
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
import { FolderStructure, FolderItem } from "@/types/types"
import { CreateTemplateModal } from "./create-template-modal"
import { UploadResumeModal } from "./upload-resume-modal"

// Extended interface for tree rendering
interface TreeItem extends FolderItem {
  children?: TreeItem[]
}

interface FileExplorerProps {
  onFileSelect: (file: FolderItem) => void
  selectedFileId?: string
  onDeleteResume?: (resumeId: string) => void
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
  onDeleteResume?: (resumeId: string) => void
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
            
            {/* Action buttons for each folder */}
            <div className="flex gap-1 mt-2 ml-2">
              {item.id === 'templates' && (
                <CreateTemplateModal
                  onCreate={(templateData) => {
                    console.log('Creating template:', templateData)
                    // TODO: Integrate with API
                  }}
                />
              )}
              
              {item.id === 'resume' && (
                <UploadResumeModal
                  onUpload={(file) => {
                    console.log('Uploading resume:', file.name, file.size)
                    // TODO: Integrate with API
                  }}
                />
              )}
            </div>
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
      
      {/* Delete button for resume files only */}
      {item.id.startsWith('RES_') && onDeleteResume && (
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
                const resumeId = item.id.replace('RES_', '')
                if (confirm(`Are you sure you want to delete "${item.display_name || item.name}"?`)) {
                  onDeleteResume(resumeId)
                }
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Resume
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

  const handleDeleteResume = (resumeId: string) => {
    console.log('Deleting resume:', resumeId)
    // TODO: Integrate with API
    if (onDeleteResume) {
      onDeleteResume(resumeId)
    }
    
    // For now, show success message
    alert('Resume deleted successfully!')
    
    // TODO: Refresh file system after deletion
  }

  useEffect(() => {
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

    loadFolderStructures()
  }, [])

  return (
    <Sidebar style={{ top: '4rem', height: 'calc(100vh - 4rem)' } as React.CSSProperties}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">
            Email Service Files
          </SidebarGroupLabel>
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
                      onDeleteResume={handleDeleteResume}
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