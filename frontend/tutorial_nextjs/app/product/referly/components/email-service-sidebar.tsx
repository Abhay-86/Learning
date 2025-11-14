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
  FileCode
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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { getTemplatesFolderStructure, getResumesFolderStructure } from "@/services/referly"
import { FolderStructure, FolderItem } from "@/types/types"

// Use FolderItem from types instead of local interface
// This matches the API response structure

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
  level = 0,
  isFolder = false,
  usage = ''
}: { 
  item: FolderItem | FolderStructure
  onFileSelect: (file: FolderItem) => void
  selectedFileId?: string
  level?: number
  isFolder?: boolean
  usage?: string
}) {
  const [isOpen, setIsOpen] = useState(true)
  
  if (isFolder || item.type === 'folder') {
    const folderData = item as FolderStructure
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
          <span>{folderData.name}</span>
          {usage && (
            <span className="ml-auto text-xs text-muted-foreground">{usage}</span>
          )}
        </SidebarMenuButton>
        
        {isOpen && folderData.children && (
          <div className="ml-4">
            {folderData.children.map((child) => (
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
              {folderData.name === 'Templates' && folderData.can_create && (
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
              
              {folderData.name === 'Resumes' && folderData.can_create && (
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
  const fileItem = item as FolderItem
  return (
    <SidebarMenuButton
      onClick={() => onFileSelect(fileItem)}
      className={`w-full justify-start pl-${level * 4 + 6} ${
        selectedFileId === fileItem.id ? 'bg-accent' : ''
      }`}
    >
      <FileIcon extension={fileItem.extension} />
      <span className="text-sm">{fileItem.display_name || fileItem.name}</span>
      {fileItem.size && (
        <span className="ml-auto text-xs text-muted-foreground">
          {fileItem.size_formatted || `${Math.round(fileItem.size / 1024)}KB`}
        </span>
      )}
    </SidebarMenuButton>
  )
}

export function EmailServiceSidebar({ onFileSelect, selectedFileId }: FileExplorerProps) {
  const [templatesFolder, setTemplatesFolder] = useState<FolderStructure | null>(null)
  const [resumesFolder, setResumesFolder] = useState<FolderStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFolderStructures = async () => {
      try {
        setLoading(true)
        setError(null)
        const [templatesData, resumesData] = await Promise.all([
          getTemplatesFolderStructure(),
          getResumesFolderStructure()
        ])
        setTemplatesFolder(templatesData)
        setResumesFolder(resumesData)
      } catch (err) {
        console.error('Failed to load folder structures in sidebar:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
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
            Referly Files
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500 text-sm">
                <div>Failed to load files</div>
                <div className="text-xs mt-1">{error}</div>
              </div>
            ) : (
              <SidebarMenu>
                {templatesFolder && (
                  <SidebarMenuItem key={templatesFolder.id}>
                    <FileTreeItem
                      item={templatesFolder}
                      onFileSelect={onFileSelect}
                      selectedFileId={selectedFileId}
                      isFolder={true}
                      usage={templatesFolder.usage}
                    />
                  </SidebarMenuItem>
                )}
                {resumesFolder && (
                  <SidebarMenuItem key={resumesFolder.id}>
                    <FileTreeItem
                      item={resumesFolder}
                      onFileSelect={onFileSelect}
                      selectedFileId={selectedFileId}
                      isFolder={true}
                      usage={resumesFolder.usage}
                    />
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}