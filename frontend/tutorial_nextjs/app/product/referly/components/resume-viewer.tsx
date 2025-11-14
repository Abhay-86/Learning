'use client'

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Eye, FileText, ExternalLink } from "lucide-react"
import { downloadResume, getResumePreviewUrl } from "@/services/referly/resumeApi"

interface ResumeViewerProps {
  resumeId: number
  fileName: string
  fileExtension: string
  fileSize?: number
}

export function ResumeViewer({ resumeId, fileName, fileExtension, fileSize }: ResumeViewerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'download'>('preview')
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = () => {
    setIsLoading(true)
    try {
      downloadResume(resumeId)
    } finally {
      setIsLoading(false)
    }
  }

  const previewUrl = getResumePreviewUrl(resumeId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="font-semibold">{fileName}</h3>
            <p className="text-sm text-muted-foreground">
              {fileExtension.toUpperCase()} • {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('preview')}
            className={viewMode === 'preview' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? 'Downloading...' : 'Download'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <div className="h-full">
            {fileExtension === 'pdf' ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={`Preview of ${fileName}`}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <Card className="p-8 text-center max-w-md">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                  <p className="text-muted-foreground mb-4">
                    {fileExtension.toUpperCase()} files cannot be previewed directly in the browser.
                  </p>
                  <Button onClick={handleDownload} disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    {isLoading ? 'Downloading...' : 'Download to View'}
                  </Button>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Card className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Ready to Download</h3>
              <p className="text-muted-foreground mb-4">
                Click the download button to save {fileName} to your device.
              </p>
              <Button onClick={handleDownload} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Downloading...' : 'Download Now'}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}