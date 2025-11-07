import { ManagerRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagerDashboard() {
  return (
    <ManagerRoute>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the manager dashboard. Only managers and admins can access this page.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>Manage your team members</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>View team performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">85%</p>
              <p className="text-sm text-muted-foreground">Team efficiency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ManagerRoute>
  );
}