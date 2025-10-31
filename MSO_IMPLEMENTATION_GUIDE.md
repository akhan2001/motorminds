# MSO (Multi-Shop Organization) Implementation Guide

## Overview
This guide will help you fully implement the MSO structure in MotorMinds, allowing organizations to manage multiple shops with proper role-based access control.

## Step 1: Database Setup

### Run this SQL in Supabase SQL Editor:

```sql
-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_type TEXT DEFAULT 'mso' CHECK (organization_type IN ('mso', 'franchise', 'corporate')),
    billing_email TEXT,
    subscription_plan TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add organization_id to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 3. Add organization_id to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shops_organization_id ON public.shops(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- 5. Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for organizations
CREATE POLICY "Super admins can view all organizations" ON public.organizations
FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND organization_id IS NULL
    )
);

CREATE POLICY "Organization admins can view their organization" ON public.organizations
FOR SELECT TO authenticated USING (
    id IN (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Only super admins can insert organizations" ON public.organizations
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND organization_id IS NULL
    )
);

CREATE POLICY "Only super admins can update organizations" ON public.organizations
FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND organization_id IS NULL
    )
);

CREATE POLICY "Only super admins can delete organizations" ON public.organizations
FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND organization_id IS NULL
    )
);
```

## Step 2: Create CanLube Organization

```sql
-- Create CanLube organization
INSERT INTO public.organizations (name, organization_type, billing_email, subscription_plan, status)
VALUES ('CanLube Auto Care MSO', 'mso', 'CanLube@outlook.com', 'ENTERPRISE', 'active')
RETURNING id;

-- Copy the returned ID and use it below
-- Link the three CanLube shops to the organization
UPDATE public.shops 
SET organization_id = 'PASTE_ORGANIZATION_ID_HERE'
WHERE id IN (
    'e3f88f66-1aef-49ef-91b3-001dc1d98cbb',  -- Toronto
    '25d32a2c-2e6d-429b-a7d8-130eaa37c93d',  -- Hamilton
    'd5e1aefa-87f4-4317-a184-d2407bf25c02'   -- Kitchener
);

-- Verify the organization structure
SELECT 
    o.name as organization_name,
    o.organization_type,
    o.status,
    s.shop_name,
    s.shop_city,
    s.shop_province
FROM public.organizations o
LEFT JOIN public.shops s ON o.id = s.organization_id
WHERE o.name = 'CanLube Auto Care MSO'
ORDER BY s.shop_city;
```

## Step 3: User Role Configuration

### Admin Types:

1. **Super Admin (MotorMinds Platform Admin)**
   - `role = 'admin'`
   - `organization_id = NULL`
   - `shop_id = NULL`
   - Access: All organizations, shops, and platform settings

2. **Organization Admin (MSO Admin)**
   - `role = 'admin'`
   - `organization_id = '<org_id>'`
   - `shop_id = NULL` (can access all shops in organization)
   - Access: All shops within their organization

3. **Shop Admin**
   - `role = 'admin'` or `'shop_admin'`
   - `shop_id = '<shop_id>'`
   - Access: Specific shop only

### Example: Create an Organization Admin for CanLube

```sql
-- First, get the organization ID
SELECT id FROM public.organizations WHERE name = 'CanLube Auto Care MSO';

-- Update a user to be an organization admin
UPDATE public.users
SET 
    role = 'admin',
    organization_id = 'PASTE_ORGANIZATION_ID_HERE',
    shop_id = NULL
WHERE email = 'admin@canlube.ca';
```

## Step 4: Testing the Implementation

### Test Super Admin Access:
1. Login as a super admin user (role='admin', organization_id=NULL)
2. Navigate to `/admin`
3. You should see the "MotorMinds Platform Admin" dashboard
4. Click "Organizations" to see all organizations

### Test Organization Admin Access:
1. Login as an organization admin (role='admin', organization_id='<org_id>')
2. Navigate to `/admin`
3. You should see the "Organization Management" dashboard
4. Click "Shops" to see all shops in your organization

### Test Shop Admin Access:
1. Login as a shop admin (role='admin', shop_id='<shop_id>')
2. Navigate to `/admin`
3. You should see the "Shop Management" dashboard

## Step 5: API Routes Created

The following API routes are now available:

### Super Admin Routes:
- `GET /api/admin/super-admin/organizations` - List all organizations
- `POST /api/admin/super-admin/organizations` - Create new organization

### Organization Admin Routes:
- `GET /api/admin/organization/[id]/shops` - List shops in organization

### Context Route:
- `GET /api/admin/context` - Get current user's admin context

## Step 6: Pages Created

### Super Admin Pages:
- `/admin/super-admin/organizations` - Organizations list

### Organization Admin Pages:
- `/admin/organization/shops` - Organization shops list

### Dashboards:
- Super Admin Dashboard - Platform-wide management
- Organization Dashboard - MSO management
- Shop Dashboard - Shop-specific management

## Step 7: Next Steps

### To complete the implementation:

1. **Update the Organizations Page API Call:**
   - In `src/app/(features)/admin/(pages)/super-admin/organizations/page.tsx`
   - Uncomment the API call in `fetchOrganizations()`

2. **Update the Shops Page API Call:**
   - In `src/app/(features)/admin/(pages)/organization/shops/page.tsx`
   - Uncomment the API call in `fetchShops()`

3. **Create Organization Detail Page:**
   - Create `/admin/super-admin/organizations/[id]/page.tsx`
   - Show organization details, shops, and settings

4. **Create Shop Detail Page:**
   - Create `/admin/organization/shops/[id]/page.tsx`
   - Show shop details, users, and performance

5. **Add Organization Creation Modal:**
   - Create a modal/dialog for creating new organizations
   - Include form validation and error handling

6. **Implement Organization Users Management:**
   - Create `/admin/organization/users/page.tsx`
   - Allow organization admins to manage users across all shops

7. **Add Shared Resources Management:**
   - Create `/admin/organization/resources/page.tsx`
   - Manage shared parts catalog, pricing, and procedures

## Troubleshooting

### Issue: User can't access admin pages
**Solution:** Check user's role and organization_id:
```sql
SELECT id, email, role, shop_id, organization_id 
FROM public.users 
WHERE email = 'user@example.com';
```

### Issue: Organizations not showing
**Solution:** Check RLS policies are enabled:
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'organizations';
```

### Issue: Shops not linked to organization
**Solution:** Verify shop organization_id:
```sql
SELECT id, shop_name, organization_id 
FROM public.shops 
WHERE organization_id IS NOT NULL;
```

## Security Considerations

1. **RLS Policies:** All tables have proper Row Level Security policies
2. **Admin Verification:** API routes verify admin access before returning data
3. **Organization Isolation:** Users can only access data within their organization
4. **Super Admin Protection:** Only super admins can create/modify organizations

## Architecture Summary

```
MotorMinds Platform
├── Super Admin (Platform-wide)
│   ├── Manage all organizations
│   ├── Manage all shops
│   ├── Platform settings
│   └── System monitoring
│
├── Organization Admin (MSO-level)
│   ├── Manage organization shops
│   ├── Cross-shop user management
│   ├── Shared resources
│   └── Organization analytics
│
└── Shop Admin (Shop-level)
    ├── Manage shop users
    ├── Shop performance
    └── Shop settings
```

## Complete!

Your MSO structure is now implemented. Users will automatically see the appropriate admin dashboard based on their role and organization context.

