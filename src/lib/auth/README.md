# Authentication System Documentation

This directory contains the refactored authentication system for the MotorMinds application. The system is built on top of Supabase Auth with a clean, modular architecture.

## Architecture

### Core Modules

```
src/lib/auth/
├── types.ts              # TypeScript types and interfaces
├── schemas.ts            # Zod validation schemas
├── service.ts            # Core auth service functions
├── roles.ts              # Role management and permissions
├── actions.ts            # Server actions (Next.js 14)
├── hooks.ts              # Client-side React hooks
├── guards.ts             # Middleware guards for route protection
├── middleware-config.ts  # Route configuration
├── admin-guard.ts        # Legacy admin guard (deprecated)
├── role-checker.ts       # Legacy role checker (deprecated)
└── index.ts             # Public API exports
```

## Usage Guide

### 1. Server-Side Authentication

#### Server Components & Route Handlers

```typescript
import { getCurrentUser, getCurrentSession } from '@/lib/auth'

export default async function Page() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Welcome {user.email}</div>
}
```

#### Server Actions

```typescript
import { loginAction, logoutAction, signupAction } from '@/lib/auth'

// In your component:
async function handleLogin(formData: FormData) {
  const result = await loginAction(formData)

  if (!result.success) {
    console.error(result.error)
  }
}
```

### 2. Client-Side Authentication

#### Hooks

```typescript
'use client'

import { useUser, useSession, useIsAuthenticated, useUserRole, useIsAdmin } from '@/lib/auth'

function ProfileComponent() {
  const { user, loading } = useUser()
  const { isAuthenticated } = useIsAuthenticated()
  const { role } = useUserRole()
  const { isAdmin } = useIsAdmin()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Role: {role}</p>
      <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

#### Logout

```typescript
'use client'

import { useLogout } from '@/lib/auth'

function LogoutButton() {
  const { logout, loading } = useLogout()

  return (
    <button onClick={logout} disabled={loading}>
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}
```

### 3. Role-Based Access Control

#### Check User Role

```typescript
import { isUserAdmin, getUserRole, checkUserRole } from '@/lib/auth'

// Check if user is admin
const admin = await isUserAdmin(userId)

// Get user's role
const role = await getUserRole(userId)

// Check specific role
const hasRole = await checkUserRole(userId, 'shop_admin')
```

#### Available Roles

```typescript
import { ROLES, ADMIN_ROLES, isAdminRole } from '@/lib/auth'

// Role constants
ROLES.ADMIN                      // 'admin'
ROLES.SUPER_ADMIN                // 'super-admin'
ROLES.SUPER_ADMIN_UNDERSCORE     // 'super_admin'
ROLES.SHOP_ADMIN                 // 'shop_admin'
ROLES.ORGANIZATION_ADMIN         // 'organization_admin'
ROLES.DEMO                       // 'demo'
ROLES.USER                       // 'user'

// Check if role is admin
isAdminRole('super-admin') // true
isAdminRole('user')        // false
```

### 4. Form Validation

```typescript
import { loginSchema, signupSchema } from '@/lib/auth'

// Validate login form
const result = loginSchema.safeParse({
  email: 'user@example.com',
  password: 'password123',
})

if (!result.success) {
  console.error(result.error.errors)
}

// Validate signup form
const signupResult = signupSchema.safeParse({
  email: 'user@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
})
```

### 5. Middleware Guards

The middleware uses modular guards for route protection:

```typescript
// src/utils/supabase/middleware.ts

import {
  createAuthGuard,
  createShopGuard,
  createAdminGuard,
  createDemoRedirectGuard,
} from '@/lib/auth/guards'

// Guards are automatically applied based on route configuration
// See src/lib/auth/middleware-config.ts for route definitions
```

#### Route Configuration

```typescript
// src/lib/auth/middleware-config.ts

export const PUBLIC_PATHS = ['/signup', '/login', '/auth']
export const PROTECTED_PATHS = ['/operations', '/financials', '/admin']
export const ADMIN_PATHS = ['/admin']
export const DEMO_REDIRECT_PATHS = ['/', '/dashboard']
```

## Password Requirements

The signup schema enforces the following password requirements:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Error Handling

All auth operations return a consistent `AuthResult` type:

```typescript
interface AuthResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
```

Example:

```typescript
const result = await loginAction(formData)

if (!result.success) {
  // Handle error
  console.error(result.error)
} else {
  // Success - user will be redirected
}
```

## Migration Guide

### Migrating from Old Auth System

#### Before (Old System):

```typescript
import { login } from '@/app/(auth)/login/actions'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { adminGuard } from '@/lib/auth/admin-guard'

// Server action
await login(formData)

// Check user
const user = await checkUser()

// Admin guard
const result = await adminGuard(request)
```

#### After (New System):

```typescript
import { loginAction, getCurrentUser, createAdminGuard } from '@/lib/auth'

// Server action (with validation)
const result = await loginAction(formData)

// Check user
const user = await getCurrentUser()

// Admin guard (modular)
const adminGuard = createAdminGuard(['/admin'])
const result = await adminGuard(ctx)
```

### Deprecated Functions

The following functions are deprecated and will be removed in a future version:

- `adminGuard()` from `admin-guard.ts` → Use `createAdminGuard()` from `guards.ts`
- `checkRole()` from `role-checker.ts` → Use guards from `guards.ts`
- `getUserRole()` from `role-checker.ts` → Use `getUserRole()` from `roles.ts`
- `checkUser()` from `supabase-auth.tsx` → Use `getCurrentUser()` from `service.ts`

## Best Practices

1. **Always validate user input** - Use the provided Zod schemas
2. **Use hooks in client components** - Never call server functions directly
3. **Handle loading states** - All hooks return a `loading` state
4. **Check authentication** - Use `useIsAuthenticated()` or `getCurrentUser()`
5. **Centralize role checks** - Use the `roles.ts` utilities
6. **Handle errors gracefully** - Check `AuthResult.success` before proceeding

## Examples

### Login Form

```typescript
'use client'

import { loginAction, loginSchema } from '@/lib/auth'
import { useState } from 'react'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await loginAction(formData)

      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      // loginAction throws on redirect (expected)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-500">{error}</p>}

      <input name="email" type="email" required />
      <input name="password" type="password" required />

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Protected Route

```typescript
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Protected content for {user.email}</div>
}
```

### Admin-Only Component

```typescript
'use client'

import { useIsAdmin } from '@/lib/auth'

export function AdminPanel() {
  const { isAdmin, loading } = useIsAdmin()

  if (loading) return <div>Loading...</div>
  if (!isAdmin) return <div>Access denied</div>

  return <div>Admin panel content</div>
}
```

## Support

For issues or questions, please refer to the Supabase Auth documentation or open an issue in the project repository.
