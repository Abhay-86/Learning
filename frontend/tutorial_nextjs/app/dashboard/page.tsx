"use client";

import { AuthGuard } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllFeatures } from '@/services/features/featureApi';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Feature } from "@/types/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
  Check,
  X,
  Clock,
  Zap,
  TrendingUp,
  Package,
  Shield,
  ChevronDown
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Dashboard() {
  const { features, loading } = useAuth();
  const [allProducts, setAllProducts] = useState<Feature[]>([]);

  useEffect(() => {
    async function fetchAllProducts() {
      const all = await getAllFeatures();
      setAllProducts(all);
    }
    fetchAllProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // Normalize user products
  const normalizedProducts = (features || []).map((item: any) => ({
    id: item.feature.id,
    name: item.feature.name,
    description: item.feature.description,
    code: item.feature.code,
    status: item.feature.status,
    is_active: item.is_active,
    activated_on: item.activated_on,
    expires_on: item.expires_on,
  }));

  const userProductIds = normalizedProducts.map((p) => p.id);

  // Categorize products
  const activeProducts = allProducts.filter((p) => userProductIds.includes(p.id) && p.status !== "upcoming");
  const inactiveProducts = allProducts.filter(
    (p) => p.status === "active" && !userProductIds.includes(p.id)
  );
  const upcomingProducts = allProducts.filter((p) => p.status === "upcoming");

  const getFeatureIcon = (code: string) => {
    const iconMap: Record<string, any> = {
      'crm': Package,
      'ai_bot': Zap,
      'referly': Shield,
      'time_travel': Clock,
    };
    const Icon = iconMap[code] || Package;
    return <Icon className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader className="pb-3">
            <CardDescription>Enabled Features</CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-600 dark:text-blue-400">{activeProducts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30">
          <CardHeader className="pb-3">
            <CardDescription>Available Features</CardDescription>
            <CardTitle className="text-4xl font-bold text-orange-600 dark:text-orange-400">{inactiveProducts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Ready to activate</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30">
          <CardHeader className="pb-3">
            <CardDescription>Upcoming Features</CardDescription>
            <CardTitle className="text-4xl font-bold text-purple-600 dark:text-purple-400">{upcomingProducts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Sections */}
      <Accordion type="multiple" defaultValue={["active", "available"]} className="space-y-4">
        {/* Active Features */}
        <AccordionItem value="active" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Active Features</h2>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                <Check className="h-3 w-3 mr-1" />
                {activeProducts.length} enabled
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>

            {activeProducts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active features yet. Explore available features below!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeProducts.map((product) => {
                  const userProduct = normalizedProducts.find(p => p.id === product.id);
                  return (
                    <Card key={product.id} className="hover:shadow-lg transition-all border-2 border-green-200 dark:border-green-900">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400">
                              {getFeatureIcon(product.code)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{product.name}</CardTitle>
                              <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <CardDescription className="mt-3">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {userProduct?.activated_on && (
                          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Activated: {formatDate(userProduct.activated_on)}
                          </div>
                        )}
                        <Button asChild className="w-full">
                          <Link href={`/product/${product.code}`}>
                            Open Feature
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Available Features */}
        <AccordionItem value="available" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Available Features</h2>
              <Badge variant="secondary">
                {inactiveProducts.length} available
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>

            {inactiveProducts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>You have access to all available features!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inactiveProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-all opacity-75 hover:opacity-100">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                            {getFeatureIcon(product.code)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              <X className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-3">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/payments?feature=${product.code}&product=${encodeURIComponent(product.name)}`}>
                          Activate Feature
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Upcoming Features */}
        <AccordionItem value="upcoming" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Upcoming Features</h2>
              <Badge variant="outline" className="border-purple-600 text-purple-600">
                <Clock className="h-3 w-3 mr-1" />
                {upcomingProducts.length} coming soon
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {upcomingProducts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming features at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {upcomingProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-all border-purple-200 dark:border-purple-900">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            {getFeatureIcon(product.code)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 border-purple-600 text-purple-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Coming Soon
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-3">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" disabled>
                        Not Available Yet
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
