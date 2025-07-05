-- Add paid_at column to invoices table
ALTER TABLE public.invoices
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

-- Add an index to the new column for performance
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON public.invoices(paid_at);

COMMENT ON COLUMN public.invoices.paid_at IS 'The timestamp when the invoice was marked as paid. Used for cash-basis accounting.'; 