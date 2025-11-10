"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const products = [
    {
      name: "Placement Preparation",
      description: "Practice coding problems, aptitude tests, and interview questions.",
      badge: "Popular",
    },
    {
      name: "Job Application Tools",
      description: "Templates, trackers, and resources to apply efficiently to your desired roles.",
      badge: "New",
    },
    {
      name: "Learning Resources",
      description: "Curated tutorials, guides, and projects to upskill in trending technologies.",
      badge: "Trending",
    },
  ];

  const testimonials = [
    {
      name: "Rohit Sharma",
      feedback: "This platform helped me clear my first tech interview with confidence!",
    },
    {
      name: "Ananya Verma",
      feedback: "The placement preparation resources are amazing and easy to follow.",
    },
    {
      name: "Karan Mehta",
      feedback: "I got all the tools I needed to apply for multiple jobs efficiently.",
    },
  ];

  const pricing = [
    { plan: "Free", description: "Access to limited products and resources", price: "$0/month" },
    { plan: "Pro", description: "Full access to all products and features", price: "$15/month" },
    { plan: "Enterprise", description: "For teams and organizations", price: "Contact us" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground px-4 py-12">
      
      {/* Products Section */}
      <section className="w-full max-w-6xl mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Products</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((product, idx) => (
            <Card key={idx} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{product.name}</CardTitle>
                  <Badge variant="secondary">{product.badge}</Badge>
                </div>
              </CardHeader>
              <CardDescription>{product.description}</CardDescription>
              <CardContent></CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full max-w-4xl mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Testimonials</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="hover:shadow-lg transition">
              <CardContent>
                <p className="mb-2">&quot;{t.feedback}&quot;</p>
                <p className="font-semibold">- {t.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full max-w-6xl mb-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Pricing</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {pricing.map((p, idx) => (
            <Card key={idx} className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle>{p.plan}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{p.description}</p>
                <p className="font-bold">{p.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

    </div>
  );
}
