-- SMS Shop Read State Table
-- Tracks per-shop, per-conversation read state for unread message indicators

-- Create the table
CREATE TABLE IF NOT EXISTS sms_shop_read_state (
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    last_read_message_id UUID REFERENCES sms_messages(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shop_id, customer_phone)
);

-- Create index for faster lookups by shop_id
CREATE INDEX IF NOT EXISTS idx_sms_shop_read_state_shop_id ON sms_shop_read_state(shop_id);

-- Enable Row Level Security
ALTER TABLE sms_shop_read_state ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access read state for their own shop
CREATE POLICY "Users can view their shop read state"
    ON sms_shop_read_state
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their shop read state"
    ON sms_shop_read_state
    FOR INSERT
    WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their shop read state"
    ON sms_shop_read_state
    FOR UPDATE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Add table to Supabase Realtime publication for postgres_changes
-- Note: Run this separately if the publication doesn't exist or already has the table
-- ALTER PUBLICATION supabase_realtime ADD TABLE sms_shop_read_state;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_shop_read_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_sms_shop_read_state_updated_at ON sms_shop_read_state;
CREATE TRIGGER trigger_update_sms_shop_read_state_updated_at
    BEFORE UPDATE ON sms_shop_read_state
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_shop_read_state_updated_at();
