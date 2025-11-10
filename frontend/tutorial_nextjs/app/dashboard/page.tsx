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
        <p className="text-muted-foreground">Loading products...</p>
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
  }));

  const userProductIds = normalizedProducts.map((p) => p.id);

  // Categorize products
  const activeProducts = allProducts.filter((p) => userProductIds.includes(p.id));
  const inactiveProducts = allProducts.filter(
    (p) => p.status === "active" && !userProductIds.includes(p.id)
  );
  const upcomingProducts = allProducts.filter((p) => p.status === "upcoming");

  return (
    <AuthGuard key={features.length}>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your available and upcoming products here.
          </p>
        </div>

        <div className="space-y-10">
          <ProductSection title="Active Products" products={activeProducts} badge="Active" color="outline" />
          <ProductSection
            title="Available (Inactive) Products"
            products={inactiveProducts}
            badge="Inactive"
            color="secondary"
            action="Activate Product"
          />
          <ProductSection
            title="Upcoming Products"
            products={upcomingProducts}
            badge="Upcoming"
            color="outline"
            disabled
          />
        </div>
      </div>
    </AuthGuard>
  );
}

// ✅ Reusable Section component for products
function ProductSection({ title, products, badge, color, action, disabled }: any) {
  if (!products || products.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="text-muted-foreground">No {title.toLowerCase()}.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product: any) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{product.name}</CardTitle>
                <Badge variant={color}>{badge}</Badge>
              </div>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant={disabled ? "outline" : "default"}
                className="w-full"
                disabled={disabled}
              >
                {disabled ? (
                  // Upcoming product: disabled button
                  <span>{action || "Upcoming..."}</span>
                ) : action ? (
                  // Inactive product: redirect to payment
                  <Link href="/payments">{action}</Link>
                ) : (
                  // Active product: redirect to product page
                  <Link href={`/product/${product.code}`}>View Product</Link>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
