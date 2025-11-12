'use client'

import { useState } from "react"
import { EmailServiceRouteGuard } from "@/components/ProductRouteGuard"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { EmailServiceSidebar } from "./components/email-service-sidebar"
import Link from "next/link";

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
          <div className="flex-1 overflow-hidden">
            <div className="ml-4 flex items-center gap-3">
              <button className="p-2.5 rounded-md hover:bg-muted transition-all">
                <SidebarTrigger className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold tracking-wide">
                Email Service Studio
              </h1>
               <Link
                href="/send-email"
                className="ml-4 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-all"
              ></Link>
            </div>

            {children}
          </div>
      </SidebarProvider>
    </EmailServiceRouteGuard>
  )
}