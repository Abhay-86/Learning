'use client'

import { useState } from "react"
import { usePathname } from "next/navigation"
import { EmailServiceRouteGuard } from "@/components/ProductRouteGuard"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { EmailServiceSidebar } from "./components/email-service-sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function EmailServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedFileId, setSelectedFileId] = useState<string>()
  const pathname = usePathname()
  
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

  const handleDeleteResume = (resumeId: string) => {
    console.log('Delete resume requested for ID:', resumeId)
    // TODO: Integrate with API
    // For now, just dispatch an event to refresh the file list
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resumeDeleted', { detail: { resumeId } }))
    }
  }

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === '/product/referly') return 'home'
    if (pathname === '/product/referly/email_dashboard') return 'dashboard'
    if (pathname === '/product/referly/send_email') return 'send-email'
    return 'home' // default
  }
  
  return (
    <EmailServiceRouteGuard redirectOnNoAccess={true}>
      <SidebarProvider>
        <EmailServiceSidebar 
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFileId}
          onDeleteResume={handleDeleteResume}
        />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with Sidebar Toggle and Tabs */}
            <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center px-4 py-3">
                <button className="p-2 rounded-md hover:bg-muted transition-all mr-4">
                  <SidebarTrigger className="w-5 h-5" />
                </button>
                
                {/* Navigation Tabs */}
                <Tabs value={getActiveTab()} className="flex-1">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="home" asChild>
                      <Link href="/product/referly" className="cursor-pointer">
                        🏠 Home
                      </Link>
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" asChild>
                      <Link href="/product/referly/email_dashboard" className="cursor-pointer">
                        📊 Dashboard
                      </Link>
                    </TabsTrigger>
                    <TabsTrigger value="send-email" asChild>
                      <Link href="/product/referly/send_email" className="cursor-pointer">
                        📧 Send Email
                      </Link>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </div>
      </SidebarProvider>
    </EmailServiceRouteGuard>
  )
}