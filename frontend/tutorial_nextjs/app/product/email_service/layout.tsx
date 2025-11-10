import { EmailServiceRouteGuard } from "@/components/ProductRouteGuard";

export default function AIBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Debug log to confirm layout is running
  console.log("🔍 Email service excesss check via layout.tsx...");
  
  return (
    <EmailServiceRouteGuard redirectOnNoAccess={true}>
      <div className="min-h-screen">
        {/* Optional: Add AI Bot specific navigation */}
        <div className="bg-purple-100 dark:bg-purple-900/20 p-2 text-center text-sm">
          🤖 AI Bot Area - Protected by layout.tsx
        </div>
        {children}
      </div>
    </EmailServiceRouteGuard>
  );
}