import { AdminRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System administration panel. Only administrators can access this page.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
              <CardDescription>All registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-sm text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Managers</CardTitle>
              <CardDescription>Manager accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-muted-foreground">Active managers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Overall status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Data usage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2.1TB</p>
              <p className="text-sm text-muted-foreground">75% capacity</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>System management tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline">Manage Users</Button>
                <Button variant="outline">System Settings</Button>
                <Button variant="outline">View Logs</Button>
                <Button variant="destructive">Emergency Actions</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRoute>
  );
}