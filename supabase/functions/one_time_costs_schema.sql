-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- One-time costs table to track ad-hoc, non-recurring business expenses
CREATE TABLE IF NOT EXISTS one_time_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    cost_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT,
    cost_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE one_time_costs IS 'Tracks ad-hoc, non-recurring expenses that occur only once.';
COMMENT ON COLUMN one_time_costs.cost_date IS 'Date on which the one-time cost was incurred.'; 