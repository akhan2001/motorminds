-- Search customers by phone digits (ignores formatting)
-- Used by GET /api/customers when search term is phone-like so that
-- "(365) 889-0136" matches search "3658890136" or "(365) 889-0136".
--
-- Run once: Supabase Dashboard -> SQL Editor -> paste and run this file.

CREATE OR REPLACE FUNCTION search_customer_ids_by_phone(digits text, shop_ids uuid[])
RETURNS setof uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id
  FROM customers
  WHERE shop_id = ANY(shop_ids)
    AND customer_phone IS NOT NULL
    AND customer_phone != ''
    AND regexp_replace(customer_phone, '\D', '', 'g') LIKE '%' || digits || '%';
$$;

COMMENT ON FUNCTION search_customer_ids_by_phone IS 'Returns customer ids whose phone (digits only) contains the given digits. Used for customer search.';
