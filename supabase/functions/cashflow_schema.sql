-- Create revenue table for tracking income
CREATE TABLE IF NOT EXISTS revenue (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cost table for tracking expenses
CREATE TABLE IF NOT EXISTS cost (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('inventory', 'fixed', 'other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
CREATE INDEX IF NOT EXISTS idx_cost_date ON cost(date);
CREATE INDEX IF NOT EXISTS idx_cost_type ON cost(type);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_revenue_updated_at ON revenue;
CREATE TRIGGER update_revenue_updated_at 
    BEFORE UPDATE ON revenue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cost_updated_at ON cost;
CREATE TRIGGER update_cost_updated_at 
    BEFORE UPDATE ON cost 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO revenue (date, amount, description) VALUES 
    (CURRENT_DATE - INTERVAL '30 days', 1500.00, 'Oil change services'),
    (CURRENT_DATE - INTERVAL '25 days', 2300.00, 'Brake repair'),
    (CURRENT_DATE - INTERVAL '20 days', 800.00, 'Tire rotation'),
    (CURRENT_DATE - INTERVAL '15 days', 1200.00, 'Engine diagnostic'),
    (CURRENT_DATE - INTERVAL '10 days', 950.00, 'Battery replacement'),
    (CURRENT_DATE - INTERVAL '5 days', 1800.00, 'Transmission service'),
    (CURRENT_DATE - INTERVAL '2 days', 600.00, 'Air filter replacement'),
    (CURRENT_DATE, 1100.00, 'Spark plug replacement')
ON CONFLICT DO NOTHING;

INSERT INTO cost (date, amount, type, description) VALUES 
    (CURRENT_DATE - INTERVAL '30 days', 400.00, 'inventory', 'Motor oil purchase'),
    (CURRENT_DATE - INTERVAL '28 days', 1200.00, 'fixed', 'Monthly rent'),
    (CURRENT_DATE - INTERVAL '25 days', 600.00, 'inventory', 'Brake pads'),
    (CURRENT_DATE - INTERVAL '20 days', 200.00, 'inventory', 'Tire supplies'),
    (CURRENT_DATE - INTERVAL '15 days', 300.00, 'other', 'Equipment maintenance'),
    (CURRENT_DATE - INTERVAL '10 days', 150.00, 'inventory', 'Car battery'),
    (CURRENT_DATE - INTERVAL '5 days', 500.00, 'inventory', 'Transmission fluid'),
    (CURRENT_DATE - INTERVAL '2 days', 80.00, 'inventory', 'Air filters'),
    (CURRENT_DATE, 120.00, 'inventory', 'Spark plugs')
ON CONFLICT DO NOTHING; 