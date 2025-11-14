'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Eye, FileText, ExternalLink, AlertCircle, RefreshCw } from "lucide-react"
import { downloadResume, getResumePreviewUrl, getResumeFileUrl } from "@/services/referly/resumeApi"

interface ResumeViewerProps {
  resumeId: number
  fileName: string
  fileExtension: string
  fileSize?: number
}

export function ResumeViewer({ resumeId, fileName, fileExtension, fileSize }: ResumeViewerProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'download'>('preview')
  const [isLoading, setIsLoading] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [isIframeLoading, setIsIframeLoading] = useState(true)

  // Debug logging
  console.log('ResumeViewer props:', { resumeId, fileName, fileExtension, fileSize })

  const handleDownload = () => {
    setIsLoading(true)
    try {
      downloadResume(resumeId)
    } finally {
      setIsLoading(false)
    }
  }

  // Raw file URL for iframe embedding (returns actual PDF, not JSON)
  const fileUrl = getResumeFileUrl(resumeId)
  
  // JSON preview URL (for metadata, not for iframe)
  const previewUrl = getResumePreviewUrl(resumeId)
  
  // Enhanced PDF file URL with embed parameters for better iframe support
  const embedUrl = `${fileUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&embedded=true`
  
  // Google Docs Viewer fallback (often works better with CORS restrictions)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  
  const handleIframeLoad = () => {
    setIsIframeLoading(false)
    setIframeError(false)
  }
  
  const handleIframeError = () => {
    setIsIframeLoading(false)
    setIframeError(true)
    console.log('Iframe failed to load, URL:', embedUrl)
  }
  
  const retryPreview = () => {
    setIframeError(false)
    setIsIframeLoading(true)
  }

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
            onClick={() => {
              setViewMode('preview')
              setIframeError(false)
              setIsIframeLoading(true)
            }}
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
            onClick={() => window.open(fileUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          
          {fileExtension?.toLowerCase() === 'pdf' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fileUrl)}`, '_blank')}
              title="Open with PDF.js viewer"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF.js Viewer
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <div className="h-full relative">
            {fileExtension?.toLowerCase() === 'pdf' || fileExtension?.toLowerCase() === 'docx' ? (
              <>
                {isIframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading {fileExtension?.toUpperCase()} preview...</p>
                      <div className="text-xs text-muted-foreground mt-2 max-w-md space-y-1">
                        <p className="break-all"><strong>Extension:</strong> {fileExtension}</p>
                        <p className="break-all"><strong>File URL:</strong> {fileUrl}</p>
                        <p className="break-all"><strong>Preview URL:</strong> {previewUrl}</p>
                        <p className="break-all"><strong>Embed URL:</strong> {embedUrl}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {iframeError ? (
                  <div className="h-full flex flex-col items-center justify-center p-8">
                    <Alert className="max-w-md">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="mb-4">
                        <strong>Preview Unavailable</strong><br />
                        This {fileExtension?.toUpperCase()} file cannot be displayed in an embedded viewer due to browser security restrictions or server settings.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="mt-6 space-y-3 text-center">
                      <div className="text-sm text-muted-foreground mb-3">
                        Try alternative preview methods:
                      </div>
                      
                      <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        <Button 
                          onClick={() => {
                            // Try Google Docs Viewer
                            const iframe = document.createElement('iframe')
                            iframe.src = googleViewerUrl
                            iframe.className = "w-full h-full border-0"
                            iframe.title = `Google Docs preview of ${fileName}`
                            const container = document.querySelector('.resume-viewer-container')
                            if (container) {
                              container.innerHTML = ''
                              container.appendChild(iframe)
                              setIframeError(false)
                            }
                          }} 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Try Google Viewer
                        </Button>
                        
                        <Button onClick={retryPreview} variant="outline" size="sm" className="w-full">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Direct Preview
                        </Button>
                        
                        <Button onClick={() => window.open(fileUrl, '_blank')} size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        
                        <Button onClick={handleDownload} disabled={isLoading} variant="secondary" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          {isLoading ? 'Downloading...' : 'Download PDF'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="resume-viewer-container w-full h-full">
                    {/* Try iframe with enhanced parameters */}
                    <iframe
                      src={embedUrl}
                      className="w-full h-full border-0"
                      title={`Preview of ${fileName}`}
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <Card className="p-8 text-center max-w-md">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                  <p className="text-muted-foreground mb-4">
                    {fileExtension.toUpperCase()} files cannot be previewed directly in the browser.
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => window.open(fileUrl, '_blank')} className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button onClick={handleDownload} disabled={isLoading} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      {isLoading ? 'Downloading...' : 'Download to View'}
                    </Button>
                  </div>
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