'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Save, Copy } from "lucide-react"

interface CodeEditorProps {
  content: string
  onChange: (content: string) => void
  fileName?: string
  language?: string
  onSave?: () => void
  isSaving?: boolean
  isDirty?: boolean
}

export function CodeEditor({ content, onChange, fileName, language = 'html', onSave, isSaving = false, isDirty = false }: CodeEditorProps) {
  const [editorContent, setEditorContent] = useState(content)

  useEffect(() => {
    setEditorContent(content)
  }, [content])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (onSave && isDirty && !isSaving) {
          onSave()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave, isDirty, isSaving])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setEditorContent(newContent)
    onChange(newContent)
  }

  const handleSave = () => {
    if (onSave && !isSaving) {
      onSave()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent)
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
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleSave}
            disabled={!onSave || !isDirty || isSaving}
            className={isDirty ? 'text-orange-500' : ''}
          >
            <Save className="h-4 w-4" />
            {isSaving && <span className="ml-1 text-xs">Saving...</span>}
          </Button>
          <Button size="sm" variant="default" onClick={handleCompile}>
            <Play className="h-4 w-4 mr-1" />
            Preview
          </Button>
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