'use client'

import { useState } from "react"
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

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  extension?: string
  children?: FileItem[]
}

// Dummy data structure
const dummyFileSystem: FileItem[] = [
  {
    id: 'templates',
    name: 'Templates',
    type: 'folder',
    children: [
      { id: 'template1', name: 'welcome.html', type: 'file', extension: 'html' },
      { id: 'template2', name: 'job-application.html', type: 'file', extension: 'html' },
      { id: 'template3', name: 'follow-up.html', type: 'file', extension: 'html' },
    ]
  },
  {
    id: 'resume',
    name: 'Resume',
    type: 'folder',
    children: [
      { id: 'resume1', name: 'resume-2024.pdf', type: 'file', extension: 'pdf' },
      { id: 'resume2', name: 'cover-letter.docx', type: 'file', extension: 'docx' },
    ]
  }
]

interface FileExplorerProps {
  onFileSelect: (file: FileItem) => void
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
  item: FileItem
  onFileSelect: (file: FileItem) => void
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
            {item.children.map((child) => (
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

export function EmailServiceSidebar({ onFileSelect, selectedFileId }: FileExplorerProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">
            Email Service Files
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dummyFileSystem.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <FileTreeItem
                    item={item}
                    onFileSelect={onFileSelect}
                    selectedFileId={selectedFileId}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}