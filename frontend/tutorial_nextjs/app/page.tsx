"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Gamepad2,
  MessageSquare,
  Briefcase,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";

import { useState } from "react";
import { LoginModal } from "@/components/LoginModal";
import { SignupModal } from "@/components/SignupModal";
import { VerificationModal } from "@/components/VerificationModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    if (user) {
      setLoginOpen(false);
      setSignupOpen(false);
      setVerificationOpen(false);
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSwitchToSignup = () => {
    setLoginOpen(false);
    setSignupOpen(true);
  };

  const handleSwitchToLogin = () => {
    setSignupOpen(false);
    setLoginOpen(true);
  };

  const handleVerificationNeeded = (email: string) => {
    setSignupOpen(false);
    setVerificationEmail(email);
    setVerificationOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    router.push("/dashboard");
  };

  const handleVerificationSuccess = () => {
    setVerificationOpen(false);
    setLoginOpen(true); // Open login after verification
  };

  const features = [
    {
      icon: Gamepad2,
      title: "Play Games",
      description: "Connect with gamers worldwide and play your favorite games together",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      icon: MessageSquare,
      title: "Community Chat",
      description: "Join vibrant communities and chat with like-minded people",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      icon: Briefcase,
      title: "Find Jobs",
      description: "Discover opportunities and connect with top employers",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      icon: Users,
      title: "Build Network",
      description: "Expand your professional and social circles effortlessly",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  const stats = [
    { label: "Active Users", value: "50K+", icon: Users },
    { label: "Communities", value: "1,000+", icon: MessageSquare },
    { label: "Jobs Posted", value: "5,000+", icon: Briefcase },
    { label: "Games Available", value: "100+", icon: Gamepad2 },
  ];

  const benefits = [
    "Connect with people who share your interests",
    "Access exclusive gaming tournaments and events",
    "Get matched with job opportunities based on your skills",
    "Build meaningful relationships in safe communities",
    "Stay updated with the latest trends and news",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-600/5 dark:via-purple-600/5 dark:to-pink-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Your All-in-One Platform
            </Badge>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Connect. Play. Grow.
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The ultimate platform where you can play games, chat with communities,
              find your dream job, and connect with amazing people.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0" onClick={() => setSignupOpen(true)}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLoginOpen(true)}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From gaming to career growth, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className={`hover:shadow-xl transition-all border-2 ${feature.bgColor}`}>
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                <Shield className="h-3 w-3 mr-1" />
                Why Choose Us
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                Built for Connection & Growth
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We're not just another platform. We're a community-driven ecosystem designed to help you succeed in every aspect of your digital life.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-base">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-900">
                <CardContent className="pt-6">
                  <Gamepad2 className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-3" />
                  <h3 className="font-bold text-lg mb-2">Epic Gaming</h3>
                  <p className="text-sm text-muted-foreground">Join tournaments & win prizes</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-900 mt-8">
                <CardContent className="pt-6">
                  <MessageSquare className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-bold text-lg mb-2">Active Communities</h3>
                  <p className="text-sm text-muted-foreground">Connect with enthusiasts</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-900">
                <CardContent className="pt-6">
                  <Briefcase className="h-12 w-12 text-green-600 dark:text-green-400 mb-3" />
                  <h3 className="font-bold text-lg mb-2">Career Growth</h3>
                  <p className="text-sm text-muted-foreground">Land your dream job</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-900 mt-8">
                <CardContent className="pt-6">
                  <TrendingUp className="h-12 w-12 text-orange-600 dark:text-orange-400 mb-3" />
                  <h3 className="font-bold text-lg mb-2">Skill Building</h3>
                  <p className="text-sm text-muted-foreground">Level up your expertise</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-0 text-white">
            <CardContent className="pt-12 pb-12 text-center">
              <Star className="h-16 w-16 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Join thousands of users already enjoying our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => setSignupOpen(true)}>
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Link href="/dashboard">
                    Explore Features
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            © 2024 Your Platform. All rights reserved. | Built with ❤️ for the community
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToSignup={handleSwitchToSignup}
        onSuccess={handleLoginSuccess}
      />
      <SignupModal
        open={signupOpen}
        onOpenChange={setSignupOpen}
        onSwitchToLogin={handleSwitchToLogin}
        onVerificationNeeded={handleVerificationNeeded}
        onSuccess={handleLoginSuccess}
      />
      <VerificationModal
        open={verificationOpen}
        onOpenChange={setVerificationOpen}
        email={verificationEmail}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
