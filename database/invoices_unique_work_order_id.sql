-- Prevent duplicate invoices per work order.
-- One work order can have at most one invoice (work_order_id unique when not null).
-- Run in Supabase SQL Editor or via migration.
--
-- If you get: ERROR 23505 ... Key (work_order_id)=(...) is duplicated
-- run invoices_fix_duplicate_work_order_id.sql first, then run this again.

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_table_work_order_id_unique
ON public.invoices_table (work_order_id)
WHERE work_order_id IS NOT NULL;
