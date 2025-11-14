'use client'

import { X, FileCode, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface OpenFile {
  id: string
  name: string
  content: string
  isDirty: boolean
  extension?: string
}

interface FileTabsProps {
  openFiles: OpenFile[]
  activeFileId?: string
  onFileSelect: (fileId: string) => void
  onFileClose: (fileId: string) => void
}

function getFileIcon(extension?: string) {
  switch (extension) {
    case 'html':
      return <FileCode className="h-4 w-4 text-orange-500" />
    case 'pdf':
    case 'docx':
    case 'doc':
      return <FileText className="h-4 w-4 text-blue-500" />
    default:
      return <FileText className="h-4 w-4 text-gray-500" />
  }
}

export function FileTabs({ openFiles, activeFileId, onFileSelect, onFileClose }: FileTabsProps) {
  if (openFiles.length === 0) {
    return (
      <div className="h-10 border-b bg-muted/30 flex items-center px-4">
        <span className="text-sm text-muted-foreground">No files open</span>
      </div>
    )
  }

  return (
    <div className="flex items-center h-10 border-b bg-muted/30 overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={file.id}
          className={`
            flex items-center min-w-0 max-w-48 border-r last:border-r-0 
            ${activeFileId === file.id 
              ? 'bg-background border-b-2 border-b-primary' 
              : 'bg-muted/50 hover:bg-muted'
            }
          `}
        >
          <button
            onClick={() => onFileSelect(file.id)}
            className="flex items-center gap-2 px-3 py-2 min-w-0 flex-1 text-left"
          >
            {getFileIcon(file.extension)}
            <span className="text-sm truncate">
              {file.name}
              {file.isDirty && (
                <span className="ml-1 text-orange-500 animate-pulse" title="Unsaved changes">●</span>
              )}
            </span>
          </button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onFileClose(file.id)
            }}
            className="h-6 w-6 p-0 mr-1 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      
      {/* Add some spacing at the end */}
      <div className="flex-1 min-w-4"></div>
    </div>
  )
}