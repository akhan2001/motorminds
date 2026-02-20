-- Add part_number, description, parts_description for standalone credits/refunds
-- (Expense-linked credits use related_expense data as-is; standalone credits need these fields)

ALTER TABLE credits_refunds
    ADD COLUMN IF NOT EXISTS part_number TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS parts_description TEXT,
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) NULL;

-- Index for searching standalone credits by description/part_number
CREATE INDEX IF NOT EXISTS idx_credits_refunds_description ON credits_refunds(description) WHERE description IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credits_refunds_part_number ON credits_refunds(part_number) WHERE part_number IS NOT NULL;
