'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ResizablePanelsProps {
  children: [React.ReactNode, React.ReactNode]
  defaultSizePercentage?: number
  minSizePercentage?: number
  maxSizePercentage?: number
  className?: string
}

export function ResizablePanels({ 
  children, 
  defaultSizePercentage = 50, 
  minSizePercentage = 20, 
  maxSizePercentage = 80,
  className = ""
}: ResizablePanelsProps) {
  const [topHeight, setTopHeight] = useState(defaultSizePercentage)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMouseDown = useRef(false)

  const handleMouseDown = useCallback(() => {
    isMouseDown.current = true
    setIsDragging(true)
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown.current || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const newTopHeight = ((e.clientY - rect.top) / rect.height) * 100

    // Constrain within min/max bounds
    const constrainedHeight = Math.min(
      Math.max(newTopHeight, minSizePercentage), 
      maxSizePercentage
    )

    setTopHeight(constrainedHeight)
  }, [minSizePercentage, maxSizePercentage])

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div 
      ref={containerRef}
      className={`relative h-full ${className}`}
    >
      {/* Top Panel */}
      <div 
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: `${topHeight}%` }}
      >
        {children[0]}
      </div>

      {/* Resizer Handle */}
      <div
        className={`
          absolute left-0 right-0 z-10 bg-border hover:bg-primary/20 transition-colors duration-200 cursor-ns-resize
          ${isDragging ? 'bg-primary/30' : ''}
        `}
        style={{ 
          top: `${topHeight}%`, 
          height: '4px',
          transform: 'translateY(-2px)' // Center the handle on the boundary
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator dots */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
            <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
            <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
          </div>
        </div>
        
        {/* Hover area for better UX */}
        <div 
          className="absolute inset-x-0 -top-2 -bottom-2 cursor-ns-resize"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Bottom Panel - Anchored to bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{ height: `${100 - topHeight}%` }}
      >
        {children[1]}
      </div>
    </div>
  )
}