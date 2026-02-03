-- Migration: Add advance_payments column to work_orders table
-- This enables tracking advance payments made before invoice creation
-- Date: 2026-01-27

-- Add advance_payments column to work_orders table
-- Stores payments as JSONB array, similar to invoices_table.payments
ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS advance_payments jsonb NULL DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.work_orders.advance_payments IS 
'Array of advance payments made before invoice creation. Each payment object contains: id, amount, payment_method, payment_date, payment_reference, notes, created_at, created_by. These payments are carried forward to the invoice when the work order is converted.';

-- Create GIN index for efficient querying of advance_payments
-- Only index when advance_payments is not null and has items
CREATE INDEX IF NOT EXISTS idx_work_orders_advance_payments 
ON public.work_orders 
USING gin (advance_payments) 
WHERE (advance_payments IS NOT NULL AND jsonb_array_length(advance_payments) > 0);
