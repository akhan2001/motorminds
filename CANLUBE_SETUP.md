# CanLube Auto Care MSO Setup Guide

## Organization Details

**Organization ID:** `f439c30d-17dd-4f3d-8085-7c980b23c85d`
**Organization Name:** CanLube Auto Care MSO
**Type:** MSO (Multi-Shop Organization)

## Shops in Organization

### 1. CanLube Auto Care - Toronto
- **Shop ID:** `e3f88f66-1aef-49ef-91b3-001dc1d98cbb`
- **Location:** 637 Vaughan Rd, York, ON
- **Email:** CanLube@outlook.com
- **Phone:** 18553112886
- **Status:** ✅ Linked to organization

### 2. CanLube Auto Care Hamilton
- **Shop ID:** `25d32a2c-2e6d-429b-a7d8-130eaa37c93d`
- **Location:** 1296 Barton St E, Hamilton, ON
- **Email:** CanLube.Hamilton@outlook.com
- **Phone:** 18553112886
- **Status:** ✅ Linked to organization

### 3. CanLube Auto Care Kitchener
- **Shop ID:** `d5e1aefa-87f4-4317-a184-d2407bf25c02`
- **Location:** 1400 Weber St E A3, Kitchener, ON
- **Email:** CanLube.Kitchener@outlook.com
- **Phone:** 18553112886
- **Status:** ✅ Linked to organization

## User Role Setup

### Option 1: Create Organization Admin (Manages All 3 Shops)

This user can manage all CanLube locations from one dashboard.

```sql
-- Create or update user to be CanLube Organization Admin
UPDATE public.users
SET 
    role = 'admin',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d',
    shop_id = NULL
WHERE email = 'canlube@outlook.com';

-- Verify the update
SELECT 
    id, 
    email, 
    role, 
    organization_id, 
    shop_id 
FROM public.users 
WHERE email = 'canlube@outlook.com';
```

**What this user can do:**
- View all 3 CanLube shops
- Manage users across all shops
- View organization-wide analytics
- Access shared resources
- Configure organization settings

### Option 2: Create Individual Shop Admins

Each shop has its own admin who manages only their location.

```sql
-- Toronto Shop Admin
UPDATE public.users
SET 
    role = 'admin',
    shop_id = 'e3f88f66-1aef-49ef-91b3-001dc1d98cbb',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
WHERE email = 'canlube@outlook.com';

-- Hamilton Shop Admin
UPDATE public.users
SET 
    role = 'admin',
    shop_id = '25d32a2c-2e6d-429b-a7d8-130eaa37c93d',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
WHERE email = 'canlube.hamilton@outlook.com';

-- Kitchener Shop Admin
UPDATE public.users
SET 
    role = 'admin',
    shop_id = 'd5e1aefa-87f4-4317-a184-d2407bf25c02',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
WHERE email = 'canlube.kitchener@outlook.com';
```

**What each shop admin can do:**
- Manage their specific shop only
- View shop-specific analytics
- Manage shop users
- Configure shop settings

### Option 3: Hybrid Approach (Recommended)

One organization admin + individual shop managers.

```sql
-- Organization Admin (Full access)
UPDATE public.users
SET 
    role = 'admin',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d',
    shop_id = NULL
WHERE email = 'canlube@outlook.com';

-- Toronto Shop Manager
UPDATE public.users
SET 
    role = 'shop_admin',
    shop_id = 'e3f88f66-1aef-49ef-91b3-001dc1d98cbb',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
WHERE email = 'toronto.manager@canlube.ca';

-- Hamilton Shop Manager
UPDATE public.users
SET 
    role = 'shop_admin',
    shop_id = '25d32a2c-2e6d-429b-a7d8-130eaa37c93d',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
WHERE email = 'hamilton.manager@canlube.ca';

-- Kitchener Shop Manager
UPDATE public.users
SET 
    role = 'shop_admin',
    shop_id = 'd5e1aefa-87f4-4317-a184-d2407bf25c02',
    organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
WHERE email = 'kitchener.manager@canlube.ca';
```

## Testing the Setup

### Test Organization Admin Access:

1. Login with: `canlube@outlook.com`
2. Navigate to: `/admin`
3. Expected: "Organization Management" dashboard
4. Click: "Shops" → Should see all 3 CanLube locations
5. Click: "Users" → Should see users across all shops

### Test Shop Admin Access:

1. Login with shop-specific email
2. Navigate to: `/admin`
3. Expected: "Shop Management" dashboard
4. Should only see data for their specific shop

## Verification Queries

### Check Organization Structure:
```sql
SELECT 
    o.name as organization_name,
    o.organization_type,
    COUNT(s.id) as shop_count,
    array_agg(s.shop_name ORDER BY s.shop_city) as shops
FROM public.organizations o
LEFT JOIN public.shops s ON o.id = s.organization_id
WHERE o.id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
GROUP BY o.id, o.name, o.organization_type;
```

### Check User Assignments:
```sql
SELECT 
    u.email,
    u.role,
    s.shop_name,
    o.name as organization_name
FROM public.users u
LEFT JOIN public.shops s ON u.shop_id = s.id
LEFT JOIN public.organizations o ON u.organization_id = o.id
WHERE u.organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
   OR u.shop_id IN (
       'e3f88f66-1aef-49ef-91b3-001dc1d98cbb',
       '25d32a2c-2e6d-429b-a7d8-130eaa37c93d',
       'd5e1aefa-87f4-4317-a184-d2407bf25c02'
   );
```

### Check Shop Users Count:
```sql
SELECT 
    s.shop_name,
    s.shop_city,
    COUNT(u.id) as user_count
FROM public.shops s
LEFT JOIN public.users u ON u.shop_id = s.id
WHERE s.organization_id = 'f439c30d-17dd-4f3d-8085-7c980b23c85d'
GROUP BY s.id, s.shop_name, s.shop_city
ORDER BY s.shop_city;
```

## Admin Dashboard URLs

### Organization Admin:
- Dashboard: `/admin`
- Shops: `/admin/organization/shops`
- Users: `/admin/organization/users`
- Resources: `/admin/organization/resources`
- Settings: `/admin/organization/settings`

### Shop Admin:
- Dashboard: `/admin`
- Users: `/admin/shop/users`
- Performance: `/admin/shop/performance`
- Settings: `/admin/shop/settings`

## Next Steps

1. ✅ Organization created
2. ✅ Shops linked to organization
3. ⏳ Assign users to organization/shops (run SQL above)
4. ⏳ Test admin access for each user type
5. ⏳ Configure organization settings
6. ⏳ Set up shared resources (parts catalog, pricing)

## Support

If you encounter any issues:
1. Check user role and organization_id in database
2. Verify RLS policies are enabled
3. Check browser console for API errors
4. Review `MSO_IMPLEMENTATION_GUIDE.md` for troubleshooting

