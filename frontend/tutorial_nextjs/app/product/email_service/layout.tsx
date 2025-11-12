'use client'

import { useState } from "react"
import { EmailServiceRouteGuard } from "@/components/ProductRouteGuard"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { EmailServiceSidebar } from "./components/email-service-sidebar"

export default function EmailServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedFileId, setSelectedFileId] = useState<string>()
  
  // Debug log to confirm layout is running
  console.log("🔍 Email service access check via layout.tsx...")
  
  const handleFileSelect = (file: any) => {
    setSelectedFileId(file.id)
    // Pass the file selection to the page component
    // This will be handled by the page component's state management
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fileSelected', { detail: file }))
    }
  }
  
  return (
    <EmailServiceRouteGuard redirectOnNoAccess={true}>
      <SidebarProvider>
        <EmailServiceSidebar 
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFileId}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-12 items-center px-4">
              <SidebarTrigger />
              <div className="ml-4">
                <h1 className="text-lg font-semibold">Email Service Studio</h1>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </EmailServiceRouteGuard>
  )
}