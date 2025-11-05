"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { ModeToggle } from "@/components/toggle"
import { MenuIcon } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { name: "Home", href: "/" },
    { name: "Docs", href: "/docs" },
    { name: "Components", href: "/components" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      {/* Top Row */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-primary">Product</span>
        </Link>

        {/* Desktop Menu */}
        <NavigationMenu className="hidden md:block">
          <NavigationMenuList className="flex space-x-6">
            {links.map((link) => (
              <NavigationMenuItem key={link.name}>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Link href={link.href}>{link.name}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ModeToggle />
          <Button variant="outline" size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button size="sm">
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col space-y-2 p-4">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "block text-sm font-medium hover:text-primary",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" className="w-full">
                Login
              </Button>
              <Button size="sm" className="w-full">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
