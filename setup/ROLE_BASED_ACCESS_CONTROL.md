# Role-Based Access Control (RBAC) Implementation

## Overview
This implementation provides comprehensive role-based access control for your Next.js frontend, integrating seamlessly with your Django backend's user roles.

## Role Hierarchy
- **ADMIN** - Full system access (level 3)
- **MANAGER** - Management access + user features (level 2) 
- **USER** - Basic user features (level 1)

## Implementation Components

### 1. **Enhanced Types** (`/types/types.ts`)
```typescript
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  // ... other fields
  role: UserRole;
}

export interface AuthContextType {
  // ... existing methods
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
}
```

### 2. **Role Utilities** (`/lib/roleUtils.ts`)
- **Role hierarchy checking** with numeric levels
- **Route access definitions** for path-based permissions
- **Utility functions** for role validation and display
- **Color coding** for UI role badges

### 3. **Enhanced AuthContext** (`/context/AuthContext.tsx`)
Added role-based methods:
- `hasRole()` - Check specific role or role array
- `isAdmin()` - Quick admin check
- `isManager()` - Manager or above check  
- `canAccess()` - Hierarchical role access check

### 4. **Protected Route Components** (`/components/ProtectedRoute.tsx`)
- `<ProtectedRoute>` - Generic role-based protection
- `<AdminRoute>` - Admin-only access
- `<ManagerRoute>` - Manager+ access
- `<UserRoute>` - User+ access (all authenticated)
- `<AuthGuard>` - Any authenticated user

### 5. **Role-Based Navigation** (`/components/navbar.tsx`)
- **Dynamic menu items** based on user role
- **Role badges** showing current user permission level
- **Conditional link display** with proper access checks

## Route Structure & Access Control

### Public Routes (No Authentication Required)
- `/` - Home page
- `/auth/login` - Login page
- `/auth/signup` - Registration page
- `/auth/verify-email` - Email verification

### User Routes (USER+ access)
- `/product/dashboard` - Main user dashboard
- `/profile` - User profile management
- `/settings` - Account settings
- `/product/payment` - Payment features
- `/product/privacy` - Privacy settings

### Manager Routes (MANAGER+ access)
- `/manager` - Manager dashboard
- `/manager/team` - Team management
- `/manager/reports` - Performance reports

### Admin Routes (ADMIN only)
- `/admin` - Admin dashboard  
- `/admin/users` - User management
- `/admin/system` - System administration

## Usage Examples

### Protecting a Page Component
```tsx
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <AdminRoute>
      <div>Admin-only content</div>
    </AdminRoute>
  );
}
```

### Conditional Content Rendering
```tsx
import { useAuth } from "@/context/AuthContext";

export function Dashboard() {
  const { user, isAdmin, canAccess } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      
      {canAccess('MANAGER') && (
        <div>Manager features here</div>
      )}
      
      {isAdmin() && (
        <div>Admin-only controls</div>
      )}
    </div>
  );
}
```

### Role-Based Navigation
```tsx
const { isManager, isAdmin, canAccess } = useAuth();

// Navigation items are automatically filtered based on role
const navigationLinks = getNavigationLinks(); // Returns role-appropriate links
```

## Security Features

### 1. **Automatic Redirects**
- Unauthenticated users → `/auth/login`
- Insufficient permissions → Role-appropriate dashboard
- Failed access attempts → Proper error handling

### 2. **Route Protection Hierarchy**
```
ADMIN (3) → Can access MANAGER + USER routes
MANAGER (2) → Can access USER routes  
USER (1) → Can access USER routes only
```

### 3. **Frontend + Backend Integration**
- Frontend role checking for UX
- Backend API validation for security
- Consistent role definitions across stack

### 4. **Loading States & Error Handling**
- Graceful loading indicators during auth checks
- Proper fallback content for unauthorized access
- Clear error messages for users

## Testing Role-Based Access

### 1. **Test User Creation**
Create test users in Django admin with different roles:
```python
# In Django shell
from django.contrib.auth.models import User
from accounts.models import CustomUser

# Create test users
admin_user = User.objects.create_user('admin@test.com', 'admin@test.com', 'password')
manager_user = User.objects.create_user('manager@test.com', 'manager@test.com', 'password') 
user_user = User.objects.create_user('user@test.com', 'user@test.com', 'password')

# Set roles
CustomUser.objects.create(user=admin_user, role='ADMIN')
CustomUser.objects.create(user=manager_user, role='MANAGER')
CustomUser.objects.create(user=user_user, role='USER')
```

### 2. **Testing Access Patterns**
1. **Login as USER** → Should see Dashboard, Profile, Settings only
2. **Login as MANAGER** → Should see USER routes + Manager dashboard
3. **Login as ADMIN** → Should see all routes including Admin panel

### 3. **Testing Protection**
- Try accessing `/admin` as USER → Should redirect to `/product/dashboard`
- Try accessing `/manager` as USER → Should redirect to `/product/dashboard`  
- Access protected routes without login → Should redirect to `/auth/login`

## Customization Options

### 1. **Adding New Roles**
```typescript
// Update types
export type UserRole = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'USER';

// Update role levels
export const ROLE_LEVELS: Record<UserRole, number> = {
  USER: 1,
  SUPERVISOR: 2,
  MANAGER: 3,
  ADMIN: 4,
};
```

### 2. **Custom Route Protection**
```tsx
<ProtectedRoute 
  allowedRoles={['ADMIN', 'MANAGER']}
  redirectTo="/unauthorized"
  fallback={<UnauthorizedMessage />}
>
  <YourComponent />
</ProtectedRoute>
```

### 3. **Role-Based Styling**
```tsx
const getRoleBadgeStyle = (role: UserRole) => {
  return {
    ADMIN: 'bg-red-100 text-red-800',
    MANAGER: 'bg-green-100 text-green-800', 
    USER: 'bg-blue-100 text-blue-800',
  }[role];
};
```

## Benefits

### For Users:
- **Clear role visibility** with badges and appropriate menus
- **Seamless navigation** to permitted areas only
- **No confusing access errors** - proper redirects
- **Consistent experience** across the application

### For Developers:
- **Reusable components** for role protection
- **Type-safe role checking** with TypeScript
- **Centralized role logic** in utilities
- **Easy to extend** for new roles or permissions
- **Frontend + Backend consistency**

### For Security:
- **Defense in depth** - frontend UX + backend validation
- **Proper access control** with role hierarchy
- **No sensitive data exposure** to unauthorized users
- **Audit trail ready** - role checks are logged

## Integration with Backend
Your Django backend roles are automatically mapped:
```python
# Backend (Django)
class CustomUser(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'), 
        ('USER', 'User'),
    ]
    role = models.CharField(choices=ROLE_CHOICES, default='USER')
```

```typescript
// Frontend (Next.js) 
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER'; // Matches exactly
```

This creates a seamless, secure, and user-friendly role-based access control system! 🔐