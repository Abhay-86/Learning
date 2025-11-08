"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  FileText, 
  CreditCard, 
  Settings,
  Home,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { getUserProfile, logout } from "@/services/auth/authApi";
import { useRouter } from "next/navigation";

interface NavigationProps {
  currentPage?: string;
}

const menuItems = {
  STUDENT: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "Grades", href: "/grades" },
    { icon: FileText, label: "Assignments", href: "/assignments" },
    { icon: Calendar, label: "Attendance", href: "/attendance" },
    { icon: CreditCard, label: "Fees", href: "/fees" },
    { icon: Calendar, label: "Events", href: "/events" },
  ],
  PARENT: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Children", href: "/children" },
    { icon: BookOpen, label: "Grades", href: "/grades" },
    { icon: Calendar, label: "Attendance", href: "/attendance" },
    { icon: CreditCard, label: "Fees", href: "/fees" },
    { icon: Calendar, label: "Events", href: "/events" },
  ],
  TEACHER: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "My Classes", href: "/classes" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: FileText, label: "Assignments", href: "/assignments" },
    { icon: BookOpen, label: "Grades", href: "/grades" },
    { icon: Calendar, label: "Attendance", href: "/attendance" },
  ],
  ADMIN: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: GraduationCap, label: "Teachers", href: "/teachers" },
    { icon: Users, label: "Parents", href: "/parents" },
    { icon: BookOpen, label: "Classes", href: "/classes" },
    { icon: BookOpen, label: "Subjects", href: "/subjects" },
    { icon: CreditCard, label: "Fees", href: "/fees" },
    { icon: Calendar, label: "Events", href: "/events" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ],
};

export function Navigation({ currentPage }: NavigationProps) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getUserProfile();
        setUser(response.data);
        setRole(response.data.role);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        router.push("/auth/login");
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/auth/login");
    }
  };

  const currentMenuItems = role ? menuItems[role as keyof typeof menuItems] || [] : [];

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-md"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-45 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">School Portal</h2>
          <div className="mt-2">
            <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {role.toLowerCase()}
            </p>
          </div>
        </div>

        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {currentMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href;
              
              return (
                <li key={index}>
                  <a
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                router.push("/profile");
                setIsOpen(false);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Bar for Mobile */}
        <div className="lg:hidden bg-white shadow-sm p-4 pl-16">
          <h1 className="text-lg font-semibold">
            {currentMenuItems.find(item => item.href === currentPage)?.label || "Dashboard"}
          </h1>
        </div>
      </div>
    </>
  );
}

// Layout wrapper component
export function AppLayout({ 
  children, 
  currentPage 
}: { 
  children: React.ReactNode;
  currentPage?: string;
}) {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Navigation currentPage={currentPage} />
      <main className="flex-1 lg:ml-64 p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}