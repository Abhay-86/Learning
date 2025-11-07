import { UserRole } from "@/types/types";

// Role hierarchy levels
export const ROLE_LEVELS: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

// Role checking utilities
export const roleUtils = {
  // Check if user has specific role
  hasRole: (userRole: UserRole, requiredRole: UserRole): boolean => {
    return userRole === requiredRole;
  },

  // Check if user has required role or higher
  canAccess: (userRole: UserRole, requiredRole: UserRole): boolean => {
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
  },

  // Check if user is admin
  isAdmin: (userRole: UserRole): boolean => {
    return userRole === 'ADMIN';
  },

  // Check if user is manager or above
  isManagerOrAbove: (userRole: UserRole): boolean => {
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS.MANAGER;
  },

  // Get available routes based on role
  getAvailableRoutes: (userRole: UserRole) => {
    const routes = {
      USER: ['/dashboard', '/profile', '/settings'],
      MANAGER: ['/dashboard', '/profile', '/settings', '/manager', '/manager/reports', '/manager/team'],
      ADMIN: ['/dashboard', '/profile', '/settings', '/manager', '/manager/reports', '/manager/team', '/admin', '/admin/users', '/admin/system'],
    };
    
    return routes[userRole] || routes.USER;
  },

  // Get role display name
  getRoleDisplayName: (role: UserRole): string => {
    const displayNames = {
      USER: 'User',
      MANAGER: 'Manager', 
      ADMIN: 'Administrator',
    };
    return displayNames[role] || 'User';
  },

  // Get role color for UI
  getRoleColor: (role: UserRole): string => {
    const colors = {
      USER: 'blue',
      MANAGER: 'green',
      ADMIN: 'red',
    };
    return colors[role] || 'gray';
  },
};

// Route access definitions
export const ROUTE_ACCESS: Record<string, UserRole> = {
  // Auth routes - accessible to all
  '/auth/login': 'USER',
  '/auth/signup': 'USER', 
  '/auth/verify-email': 'USER',
  
  // User routes
  '/dashboard': 'USER',
  '/profile': 'USER',
  '/settings': 'USER',
  '/product/dashboard': 'USER',
  '/product/payment': 'USER',
  '/product/privacy': 'USER',
  
  // Manager routes
  '/manager': 'MANAGER',
  '/manager/reports': 'MANAGER',
  '/manager/team': 'MANAGER',
  
  // Admin routes
  '/admin': 'ADMIN',
  '/admin/users': 'ADMIN',
  '/admin/system': 'ADMIN',
};

// Get required role for a route
export const getRequiredRole = (path: string): UserRole => {
  // Check exact match first
  if (ROUTE_ACCESS[path]) {
    return ROUTE_ACCESS[path];
  }
  
  // Check pattern matches
  if (path.startsWith('/admin')) return 'ADMIN';
  if (path.startsWith('/manager')) return 'MANAGER';
  
  // Default to USER for other authenticated routes
  return 'USER';
};