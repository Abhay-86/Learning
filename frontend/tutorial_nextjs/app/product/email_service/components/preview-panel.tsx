'use client'

import { Button } from "@/components/ui/button"
import { Code, Copy } from "lucide-react"

interface SourcePanelProps {
  htmlContent: string
  fileName?: string
}

export function PreviewPanel({ htmlContent, fileName }: SourcePanelProps) {
  return (
    <div className="flex flex-col h-full border-t">
      {/* Source Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium flex items-center">
            <Code className="h-4 w-4 mr-2" />
            <span>&lt;&gt;</span> Source Code
          </span>
          {fileName && (
            <span className="text-xs text-muted-foreground">
              • {fileName}
            </span>
          )}
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigator.clipboard.writeText(htmlContent)}
          className="h-7 px-2 text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy All
        </Button>
      </div>

      {/* Source Code Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full border rounded-lg bg-background overflow-hidden">
          <div className="h-full overflow-auto">
            <pre className="p-4 font-mono text-sm leading-relaxed h-full">
              <code className="text-foreground whitespace-pre-wrap break-words block">
                {htmlContent || '<!-- No content to display -->'}
              </code>
            </pre>
          </div>
        </div>
      </div>
      
      {/* Source Footer */}
      <div className="p-2 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {htmlContent ? `${htmlContent.length} characters` : 'Empty'}
          </span>
          <span>
            HTML source code view
          </span>
        </div>
      </div>
    </div>
  )
}