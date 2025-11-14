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
  AlertCircle
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
import { getTemplatesFolderStructure, getResumesFolderStructure } from "@/services/referly/folderApi"
import { FolderStructure, FolderItem } from "@/types/types"

// Extended interface for tree rendering
interface TreeItem extends FolderItem {
  children?: TreeItem[]
}

interface FileExplorerProps {
  onFileSelect: (file: FolderItem) => void
  selectedFileId?: string
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
  level = 0 
}: { 
  item: TreeItem
  onFileSelect: (file: FolderItem) => void
  selectedFileId?: string
  level?: number 
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
              />
            ))}
            
            {/* Action buttons for each folder */}
            <div className="flex gap-1 mt-2 ml-2">
              {item.id === 'templates' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    // TODO: Implement create template functionality
                    console.log('Create new template')
                  }}
                >
                  <FilePlus className="h-3 w-3 mr-1" />
                  New Template
                </Button>
              )}
              
              {item.id === 'resume' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    // TODO: Implement file upload functionality
                    console.log('Upload file to resume folder')
                  }}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // File item
  return (
    <SidebarMenuButton
      onClick={() => onFileSelect(item)}
      className={`w-full justify-start pl-${level * 4 + 6} ${
        selectedFileId === item.id ? 'bg-accent' : ''
      }`}
    >
      <FileIcon extension={item.extension} />
      <span className="text-sm">{item.name}</span>
    </SidebarMenuButton>
  )
}

// Helper function to convert FolderStructure to TreeItem
function convertToTreeItem(folderStructure: FolderStructure): TreeItem {
  return {
    id: folderStructure.id || folderStructure.name.toLowerCase(),
    name: folderStructure.name,
    type: 'folder' as const,
    children: folderStructure.children.map(child => ({
      ...child,
      children: child.type === 'folder' ? [] : undefined
    }))
  }
}

export function EmailServiceSidebar({ onFileSelect, selectedFileId }: FileExplorerProps) {
  const [fileSystem, setFileSystem] = useState<TreeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          convertToTreeItem(templatesData),
          convertToTreeItem(resumesData)
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