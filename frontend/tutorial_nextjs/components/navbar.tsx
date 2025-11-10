"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "@/components/toggle";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { roleUtils } from "@/lib/roleUtils";
import { UserRole } from "@/types/types";

interface NavigationLink {
  name: string;
  href: string;
  role: UserRole;
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logoutUser, isAdmin, isManager, canAccess } = useAuth();

  const publicLinks = [{ name: "Home", href: "/" }];
  
  // Role-based navigation links
  const getNavigationLinks = (): NavigationLink[] => {
    if (!user) return [];

    const links: NavigationLink[] = [
      { name: "Dashboard", href: "/dashboard", role: "USER" },
    ];

    // Manager links
    if (isManager()) {
      links.push(
        { name: "Team", href: "/manager/team", role: "MANAGER" },
        { name: "Reports", href: "/manager/reports", role: "MANAGER" }
      );
    }

    // Admin links
    if (isAdmin()) {
      links.push(
        { name: "Admin Panel", href: "/admin", role: "ADMIN" },
        { name: "Users", href: "/admin/users", role: "ADMIN" }
      );
    }

    // User profile links (all authenticated users)
    links.push(
      { name: "Profile", href: "/profile", role: "USER" },
      { name: "Settings", href: "/settings", role: "USER" }
    );

    return links.filter(link => canAccess(link.role));
  };

  const navigationLinks = getNavigationLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">Brand Name</span>
        </Link>

        <NavigationMenu className="hidden md:block">
          <NavigationMenuList className="flex space-x-6">
            {publicLinks.map((link) => (
              <NavigationMenuItem key={link.name}>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Link href={link.href}>{link.name}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}

            {user &&
              navigationLinks.map((link) => (
                <NavigationMenuItem key={link.name}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === link.href ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Link href={link.href}>{link.name}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden md:flex items-center gap-4">
          <ModeToggle />
          {!loading && !user ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {/* <div className="flex items-center gap-2"> */}
                {/* <span className="text-sm">Hi, {user?.username}</span> */}
                {/* <span className={`text-xs px-2 py-1 rounded-full ${
                  user?.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  user?.role === 'MANAGER' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {roleUtils.getRoleDisplayName(user?.role || 'USER')}
                </span> */}
              {/* </div> */}
              <Button variant="outline" size="sm" onClick={logoutUser}>
                Logout
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col space-y-2 p-4">
            {publicLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "block text-sm font-medium hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user &&
              navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "block text-sm font-medium hover:text-primary",
                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

            {!loading && !user && (
              <>
                <Button variant="outline" size="sm" className="w-full">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button size="sm" className="w-full">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
