import { DashboardLayout } from "@/components/dashboard-layout"
import { AppLayout } from "@/components/navigation"

export default function DashboardPage() {
  return (
    <AppLayout currentPage="/dashboard">
      <DashboardLayout />
    </AppLayout>
  )
}