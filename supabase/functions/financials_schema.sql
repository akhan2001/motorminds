-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table to manage payroll information
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    salary_or_wage NUMERIC(10, 2) NOT NULL,
    pay_frequency TEXT CHECK (pay_frequency IN ('hourly', 'weekly', 'bi-weekly', 'monthly')),
    hire_date DATE,
    termination_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fixed costs table to track recurring business expenses
CREATE TABLE IF NOT EXISTS fixed_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    cost_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    category TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial statements table to store generated monthly/quarterly reports
CREATE TABLE IF NOT EXISTS financial_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    statement_type TEXT NOT NULL, -- e.g., 'Monthly Summary', 'Quarterly P&L'
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    total_revenue NUMERIC(12, 2),
    total_cogs NUMERIC(12, 2),
    total_fixed_costs NUMERIC(12, 2),
    gross_profit NUMERIC(12, 2),
    net_profit NUMERIC(12, 2),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_financial_statement UNIQUE (shop_id, statement_type, period_start_date)
);

-- Add comments to tables and columns for clarity
COMMENT ON TABLE employees IS 'Stores employee data for payroll and revenue-per-headcount calculations.';
COMMENT ON TABLE fixed_costs IS 'Tracks recurring, non-job-related business expenses like rent and utilities.';
COMMENT ON TABLE financial_statements IS 'Stores periodic financial summaries for efficient historical reporting and trend analysis.'; 