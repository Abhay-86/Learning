import { AIBotRouteGuard } from "@/components/ProductRouteGuard";

export default function AIBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Debug log to confirm layout is running
  console.log("🔍 AI Bot Layout loaded - checking access...");
  
  return (
    <AIBotRouteGuard redirectOnNoAccess={true}>
      <div className="min-h-screen">
        {/* Optional: Add AI Bot specific navigation */}
        <div className="bg-purple-100 dark:bg-purple-900/20 p-2 text-center text-sm">
          🤖 AI Bot Area - Protected by layout.tsx
        </div>
        {children}
      </div>
    </AIBotRouteGuard>
  );
}