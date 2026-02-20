-- Credits & Refunds Table
-- Tracks money flowing back into the business (supplier credits, refunds)
-- Mirrors expense structure for consistency

-- Create credits_refunds table
CREATE TABLE IF NOT EXISTS credits_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    supplier TEXT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    related_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'reconciled')),
    refund_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMPTZ
);

-- Create credits_refunds_history table for audit trail
CREATE TABLE IF NOT EXISTS credits_refunds_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credits_refund_id UUID NOT NULL REFERENCES credits_refunds(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    old_values JSONB,
    new_values JSONB
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_credits_refunds_shop_id ON credits_refunds(shop_id);
CREATE INDEX IF NOT EXISTS idx_credits_refunds_refund_date ON credits_refunds(refund_date);
CREATE INDEX IF NOT EXISTS idx_credits_refunds_status ON credits_refunds(status);
CREATE INDEX IF NOT EXISTS idx_credits_refunds_supplier ON credits_refunds(supplier);
CREATE INDEX IF NOT EXISTS idx_credits_refunds_related_expense ON credits_refunds(related_expense_id);
CREATE INDEX IF NOT EXISTS idx_credits_refunds_archived ON credits_refunds(archived) WHERE archived = false;

CREATE INDEX IF NOT EXISTS idx_credits_refunds_history_credits_refund_id ON credits_refunds_history(credits_refund_id);

-- Enable Row Level Security
ALTER TABLE credits_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_refunds_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credits_refunds (shop-scoped)
CREATE POLICY "credits_refunds_select_policy" ON credits_refunds
    FOR SELECT USING (
        shop_id = (auth.jwt() ->> 'shop_id')::uuid
        OR (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN')
    );

CREATE POLICY "credits_refunds_insert_policy" ON credits_refunds
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'shop_id') IS NOT NULL
        AND shop_id = (auth.jwt() ->> 'shop_id')::uuid
    );

CREATE POLICY "credits_refunds_update_policy" ON credits_refunds
    FOR UPDATE USING (
        shop_id = (auth.jwt() ->> 'shop_id')::uuid
        OR (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN')
    );

CREATE POLICY "credits_refunds_delete_policy" ON credits_refunds
    FOR DELETE USING (
        shop_id = (auth.jwt() ->> 'shop_id')::uuid
        OR (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN')
    );

-- RLS Policies for credits_refunds_history (via credits_refund_id)
CREATE POLICY "credits_refunds_history_select_policy" ON credits_refunds_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM credits_refunds cr
            WHERE cr.id = credits_refunds_history.credits_refund_id
            AND (cr.shop_id = (auth.jwt() ->> 'shop_id')::uuid
                 OR (auth.jwt() ->> 'role')::text IN ('SUPER-ADMIN', 'SUPER_ADMIN'))
        )
    );

CREATE POLICY "credits_refunds_history_insert_policy" ON credits_refunds_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM credits_refunds cr
            WHERE cr.id = credits_refunds_history.credits_refund_id
            AND cr.shop_id = (auth.jwt() ->> 'shop_id')::uuid
        )
    );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_credits_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_credits_refunds_updated_at ON credits_refunds;
CREATE TRIGGER trigger_update_credits_refunds_updated_at
    BEFORE UPDATE ON credits_refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_refunds_updated_at();
