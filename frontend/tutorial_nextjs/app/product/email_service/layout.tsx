import { EmailServiceRouteGuard } from "@/components/ProductRouteGuard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import App from "next/app";

export default function AIBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Debug log to confirm layout is running
  console.log("🔍 Email service excesss check via layout.tsx...");
  
  return (
    <EmailServiceRouteGuard redirectOnNoAccess={true}>
      <SidebarProvider>
        <AppSidebar />
      <div className="min-h-screen">
        <SidebarTrigger />
        {children}
      </div>
      </SidebarProvider>
    </EmailServiceRouteGuard>
  );
}