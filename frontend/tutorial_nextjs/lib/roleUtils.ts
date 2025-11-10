import { UserRole } from "@/types/types";

/* ------------------------------------------
 * ROLE LEVELS — Defines the hierarchy
 * ------------------------------------------ */
export const ROLE_LEVELS: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

/* ------------------------------------------
 * ROLE UTILS — Reusable role helper functions
 * ------------------------------------------ */
export const roleUtils = {
  /** Check if user has a specific role */
  hasRole: (userRole: UserRole, requiredRole: UserRole): boolean => {
    return userRole === requiredRole;
  },

  /** Check if user has required role or higher (based on hierarchy) */
  canAccess: (userRole: UserRole, requiredRole: UserRole): boolean => {
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
  },

  /** Check if user is admin */
  isAdmin: (userRole: UserRole): boolean => {
    return userRole === "ADMIN";
  },

  /** Check if user is manager or above */
  isManagerOrAbove: (userRole: UserRole): boolean => {
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS.MANAGER;
  },

  /** Get available routes for a role */
  getAvailableRoutes: (userRole: UserRole) => {
    const routes = {
      USER: [
        "/dashboard",
        "/profile",
        "/settings",
        "/payments",
        "/privacy",        
      ],
      MANAGER: [
        "/dashboard",
        "/profile",
        "/settings",
        "/manager",
        "/manager/reports",
        "/manager/team",
      ],
      ADMIN: [
        "/dashboard",
        "/profile",
        "/settings",
        "/manager",
        "/manager/reports",
        "/manager/team",
        "/admin",
        "/admin/users",
        "/admin/system",
      ],
    };

    return routes[userRole] || routes.USER;
  },

  /** Get display name for role (for UI) */
  getRoleDisplayName: (role: UserRole): string => {
    const displayNames = {
      USER: "User",
      MANAGER: "Manager",
      ADMIN: "Administrator",
    };
    return displayNames[role] || "User";
  },

  /** Get UI color for each role (for tags/badges) */
  getRoleColor: (role: UserRole): string => {
    const colors = {
      USER: "blue",
      MANAGER: "green",
      ADMIN: "red",
    };
    return colors[role] || "gray";
  },

  /** Check if route is strictly for USER only (no managers/admins) */
  isUserOnlyRoute: (path: string): boolean => {
    const userOnlyRoutes = ["/product/payment", "/product/privacy"];
    return userOnlyRoutes.includes(path);
  },
};

/* ------------------------------------------
 * ROUTE ACCESS — Defines minimum role required for each route
 * ------------------------------------------ */
export const ROUTE_ACCESS: Record<string, UserRole> = {
  // Auth routes
  "/auth/login": "USER",
  "/auth/signup": "USER",
  "/auth/verify-email": "USER",

  // Common routes (shared by all)
  "/dashboard": "USER",
  "/profile": "USER",
  "/settings": "USER",
  "/product/dashboard": "USER",

  // User-only routes (explicitly checked later)
  "/product/payment": "USER",
  "/product/privacy": "USER",

  // Manager routes
  "/manager": "MANAGER",
  "/manager/reports": "MANAGER",
  "/manager/team": "MANAGER",

  // Admin routes
  "/admin": "ADMIN",
  "/admin/users": "ADMIN",
  "/admin/system": "ADMIN",
};

/* ------------------------------------------
 * Get required role for a given route
 * ------------------------------------------ */
export const getRequiredRole = (path: string): UserRole => {
  // Check exact mapping
  if (ROUTE_ACCESS[path]) return ROUTE_ACCESS[path];

  // Handle nested paths
  if (path.startsWith("/admin")) return "ADMIN";
  if (path.startsWith("/manager")) return "MANAGER";

  // Default to USER (for authenticated pages)
  return "USER";
};

/* ------------------------------------------
 * Centralized route access check
 * ------------------------------------------ */
export const canUserAccessRoute = (
  userRole: UserRole,
  path: string
): boolean => {
  // Deny if route is user-only but user is not USER
  if (roleUtils.isUserOnlyRoute(path) && userRole !== "USER") {
    return false;
  }

  // Otherwise, use hierarchical role check
  const requiredRole = getRequiredRole(path);
  return roleUtils.canAccess(userRole, requiredRole);
};
