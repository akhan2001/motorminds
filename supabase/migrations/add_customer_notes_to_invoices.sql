-- Add customer_notes column to invoices table
-- This field stores the original customer service request/notes
-- Separate from description which is filled by the shop for actual work performed

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- Add comment for clarity
COMMENT ON COLUMN invoices.customer_notes IS 'Original customer service request notes from customer-generated invoices';

-- Create index for searching customer notes (performance optimization)
CREATE INDEX IF NOT EXISTS idx_invoices_customer_notes ON invoices USING gin(to_tsvector('english', customer_notes)) WHERE customer_notes IS NOT NULL; 