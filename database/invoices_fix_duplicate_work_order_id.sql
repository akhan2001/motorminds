-- Fix duplicate work_order_id in invoices_table so the unique index can be created.
-- Run this ONCE in Supabase SQL Editor before running invoices_unique_work_order_id.sql.
--
-- Strategy: For each work_order_id that has multiple invoices, we keep ONE row linked
-- (prefer the paid one, else the earliest created) and set work_order_id = NULL on the
-- others so they become standalone invoices. No rows are deleted.

-- Step 1: See which work_order_ids have duplicates (run as a check)
-- SELECT work_order_id, COUNT(*) AS cnt
-- FROM public.invoices_table
-- WHERE work_order_id IS NOT NULL
-- GROUP BY work_order_id
-- HAVING COUNT(*) > 1;

-- Step 2: Unlink duplicate rows (keep one per work_order_id)
-- For each duplicated work_order_id we keep the row with:
--   - status = 'paid' if any, else
--   - the smallest created_at (first created)
-- All other rows for that work_order_id get work_order_id set to NULL.

WITH duplicates AS (
  SELECT id,
         work_order_id,
         status,
         created_at,
         ROW_NUMBER() OVER (
           PARTITION BY work_order_id
           ORDER BY (CASE WHEN status = 'paid' THEN 0 ELSE 1 END), created_at ASC
         ) AS rn
  FROM public.invoices_table
  WHERE work_order_id IS NOT NULL
),
to_unlink AS (
  SELECT id
  FROM duplicates
  WHERE rn > 1
)
UPDATE public.invoices_table
SET work_order_id = NULL
WHERE id IN (SELECT id FROM to_unlink);

-- Step 3: Now run invoices_unique_work_order_id.sql to create the unique index.
