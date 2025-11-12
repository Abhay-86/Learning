'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Smartphone, Monitor, Tablet } from "lucide-react"

interface PreviewPanelProps {
  htmlContent: string
  fileName?: string
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export function PreviewPanel({ htmlContent, fileName }: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile': return '375px'
      case 'tablet': return '768px' 
      case 'desktop': return '100%'
    }
  }

  return (
    <div className="flex flex-col h-full border-t">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </span>
          {fileName && (
            <span className="text-xs text-muted-foreground">
              • {fileName}
            </span>
          )}
        </div>
        
        {/* Device Mode Toggle */}
        <div className="flex items-center border rounded-lg bg-muted/50">
          <Button
            size="sm"
            variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
            onClick={() => setDeviceMode('desktop')}
            className="h-9 px-3 rounded-r-none border-r"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
            onClick={() => setDeviceMode('tablet')}
            className="h-9 px-3 rounded-none border-r"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
            onClick={() => setDeviceMode('mobile')}
            className="h-9 px-3 rounded-l-none"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content Only */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 flex justify-center">
          <div 
            className="transition-all duration-300 border rounded-lg shadow-sm bg-white overflow-hidden"
            style={{ 
              width: getDeviceWidth(),
              maxWidth: '100%',
              minHeight: '400px'
            }}
          >
            {htmlContent ? (
              <iframe
                srcDoc={htmlContent}
                className="w-full h-full min-h-[400px] border-0"
                title="Email Preview"
                style={{ backgroundColor: 'white' }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content to preview</p>
                  <p className="text-sm">Select a file or start editing to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Preview Footer */}
      <div className="p-2 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {htmlContent ? `${htmlContent.length} characters` : 'Empty'}
          </span>
          <span>
            Viewing in {deviceMode} mode
          </span>
        </div>
      </div>
    </div>
  )
}