'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Save, Copy, Loader2 } from "lucide-react"

interface CodeEditorProps {
  content: string
  onChange: (content: string) => void
  fileName?: string
  language?: string
  templateId?: number
  onSave?: (templateId: number, content: string) => Promise<void>
  onCopy?: (success: boolean, message: string) => void
}

export function CodeEditor({ 
  content, 
  onChange, 
  fileName, 
  language = 'html',
  templateId,
  onSave,
  onCopy
}: CodeEditorProps) {
  const [editorContent, setEditorContent] = useState(content)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditorContent(content)
  }, [content])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setEditorContent(newContent)
    onChange(newContent)
  }

  const handleSave = async () => {
    if (!templateId || !onSave) {
      onCopy?.(false, 'No template ID available for saving')
      return
    }

    setIsSaving(true)
    try {
      await onSave(templateId, editorContent)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(editorContent)
        onCopy?.(true, 'Content copied to clipboard!')
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = editorContent
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        onCopy?.(true, 'Content copied to clipboard!')
      }
    } catch (error) {
      onCopy?.(false, 'Failed to copy content to clipboard')
    }
  }

  const handleCompile = () => {
    // TODO: Implement compile/preview functionality
    console.log('Compiling/previewing code:', editorContent)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {fileName || 'Untitled'}
          </span>
          {language && (
            <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">
              {language.toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy to clipboard">
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleSave}
            disabled={isSaving || !templateId}
            title={templateId ? 'Save template' : 'No template selected'}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
          {/* <Button size="sm" variant="default" onClick={handleCompile}>
            <Play className="h-4 w-4 mr-1" />
            Preview
          </Button> */}
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 relative">
        <textarea
          value={editorContent}
          onChange={handleContentChange}
          className="w-full h-full p-4 font-mono text-sm bg-background border-0 resize-none outline-none"
          style={{
            lineHeight: '1.5',
            tabSize: 2,
          }}
          placeholder={language === 'html' ? 
            `<!DOCTYPE html>
<html>
<head>
    <title>Email Template</title>
</head>
<body>
    <!-- Your email content here -->
</body>
</html>` : 
            'Start typing your code here...'
          }
        />
        
        {/* Line numbers overlay (optional enhancement) */}
        <div className="absolute left-0 top-0 p-4 pointer-events-none">
          <div className="font-mono text-sm text-muted-foreground leading-6">
            {editorContent.split('\n').map((_, index) => (
              <div key={index} className="h-6">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}