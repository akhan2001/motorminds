-- ============================================================================
-- Row-Level Security (RLS) Policies for Multi-Tenant Customer Access
-- ============================================================================
-- 
-- These policies provide defense-in-depth security at the database level.
-- They complement the API-level access control in:
-- - src/lib/auth/access-context.ts
-- - src/lib/services/customer-query-service.ts
--
-- IMPORTANT: Before applying these policies, ensure:
-- 1. The JWT claims include 'shop_id', 'organization_id', and 'role'
-- 2. RLS is enabled on the customers table
-- 3. Test thoroughly in a staging environment first
--
-- To apply: Run this SQL in Supabase SQL Editor or via migration
-- ============================================================================

-- Enable RLS on customers table (if not already enabled)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT - View customers based on access scope
-- ============================================================================
-- Access rules:
-- 1. Super Admin: Can view ALL customers
-- 2. Organization User: Can view customers from shops in their organization
-- 3. Shop User: Can only view customers from their own shop
-- ============================================================================

DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;

CREATE POLICY "customers_select_policy" ON public.customers
FOR SELECT USING (
    -- Super Admin: full access
    (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN')
    OR
    -- Organization-level access: match organization_id
    (
        (auth.jwt() ->> 'organization_id') IS NOT NULL 
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    )
    OR
    -- Shop-level access: match shop_id
    shop_id = (auth.jwt() ->> 'shop_id')::uuid
);

-- ============================================================================
-- POLICY: INSERT - Create customers in own shop only
-- ============================================================================
-- All users can only create customers in their own shop
-- Organization_id is automatically populated by the API
-- ============================================================================

DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;

CREATE POLICY "customers_insert_policy" ON public.customers
FOR INSERT WITH CHECK (
    -- Must have a shop_id in JWT
    (auth.jwt() ->> 'shop_id') IS NOT NULL
    AND
    -- Can only insert into own shop
    shop_id = (auth.jwt() ->> 'shop_id')::uuid
);

-- ============================================================================
-- POLICY: UPDATE - Edit customers based on access scope
-- ============================================================================
-- Access rules:
-- 1. Super Admin: Can edit ALL customers
-- 2. Organization User: Can only edit customers from their OWN shop
-- 3. Shop User: Can only edit customers from their own shop
-- ============================================================================

DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;

CREATE POLICY "customers_update_policy" ON public.customers
FOR UPDATE USING (
    -- Super Admin: full access
    (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN')
    OR
    -- All other users: can only edit own shop's customers
    shop_id = (auth.jwt() ->> 'shop_id')::uuid
) WITH CHECK (
    -- Cannot change shop_id to a different shop
    shop_id = (auth.jwt() ->> 'shop_id')::uuid
    OR
    (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN')
);

-- ============================================================================
-- POLICY: DELETE - Remove customers (restricted)
-- ============================================================================
-- Only Super Admin and shop owners/admins can delete
-- Consider using soft-delete (archived flag) instead
-- ============================================================================

DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

CREATE POLICY "customers_delete_policy" ON public.customers
FOR DELETE USING (
    -- Super Admin: full access
    (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN')
    OR
    -- Shop admin/owner: can delete own shop's customers
    (
        shop_id = (auth.jwt() ->> 'shop_id')::uuid
        AND (auth.jwt() ->> 'role')::text IN ('ADMIN', 'SHOP_ADMIN', 'owner')
    )
);

-- ============================================================================
-- HELPER FUNCTION: Get user's accessible shop IDs
-- ============================================================================
-- This function can be used in more complex RLS policies if needed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_accessible_shop_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    user_shop_id UUID;
    user_org_id UUID;
BEGIN
    user_role := auth.jwt() ->> 'role';
    user_shop_id := (auth.jwt() ->> 'shop_id')::uuid;
    user_org_id := (auth.jwt() ->> 'organization_id')::uuid;
    
    -- Super Admin: return all shop IDs
    IF user_role IN ('SUPER-ADMIN', 'SUPER_ADMIN') THEN
        RETURN QUERY SELECT id FROM public.shops;
        RETURN;
    END IF;
    
    -- Organization user: return all shops in organization
    IF user_org_id IS NOT NULL THEN
        RETURN QUERY 
            SELECT id FROM public.shops 
            WHERE organization_id = user_org_id;
        RETURN;
    END IF;
    
    -- Shop user: return only their shop
    IF user_shop_id IS NOT NULL THEN
        RETURN QUERY SELECT user_shop_id;
    END IF;
    
    RETURN;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Use these to verify policies are working correctly
-- ============================================================================

-- Check if RLS is enabled
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'customers';

-- List all policies on customers table
-- SELECT policyname, polcmd, polpermissive, polroles, polqual, polwithcheck 
-- FROM pg_policy 
-- WHERE polrelid = 'public.customers'::regclass;

-- Test access as current user
-- SET LOCAL role TO 'authenticated';
-- SELECT * FROM customers LIMIT 5;

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================
-- 
-- 1. JWT Claims Required:
--    The JWT token must include these custom claims:
--    - shop_id: UUID of user's shop
--    - organization_id: UUID of user's organization (nullable)
--    - role: User's role string
--
-- 2. Setting JWT Claims:
--    Update your auth.users trigger or use Supabase Auth Hooks to set claims:
--    
--    CREATE OR REPLACE FUNCTION public.handle_new_user()
--    RETURNS TRIGGER AS $$
--    BEGIN
--        UPDATE auth.users SET raw_app_meta_data = 
--            raw_app_meta_data || 
--            jsonb_build_object(
--                'shop_id', (SELECT shop_id FROM public.users WHERE id = NEW.id),
--                'organization_id', (SELECT organization_id FROM public.users WHERE id = NEW.id),
--                'role', (SELECT role FROM public.users WHERE id = NEW.id)
--            )
--        WHERE id = NEW.id;
--        RETURN NEW;
--    END;
--    $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- 3. Testing:
--    Always test RLS policies in a staging environment first.
--    Use the verification queries above to confirm behavior.
--
-- ============================================================================
