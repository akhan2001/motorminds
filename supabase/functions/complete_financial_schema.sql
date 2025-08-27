-- Complete Financial Integration Schema
-- Run this file to set up the complete financial system

-- First, create the base revenue table with all necessary columns
CREATE TABLE IF NOT EXISTS revenue (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    source TEXT, -- renamed from description for clarity
    notes TEXT, -- additional details
    shop_id UUID REFERENCES shops(id),
    invoice_id UUID REFERENCES invoices(id),
    work_order_id UUID REFERENCES repair_orders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the base cost table with all necessary columns
CREATE TABLE IF NOT EXISTS cost (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('inventory', 'fixed', 'other')),
    notes TEXT, -- renamed from description for clarity
    shop_id UUID REFERENCES shops(id),
    invoice_id UUID REFERENCES invoices(id),
    work_order_id UUID REFERENCES repair_orders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the tables already exist but are missing columns, add them
DO $$ 
BEGIN
    -- Add missing columns to revenue table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue' AND column_name = 'source') THEN
        ALTER TABLE revenue ADD COLUMN source TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue' AND column_name = 'notes') THEN
        ALTER TABLE revenue ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue' AND column_name = 'shop_id') THEN
        ALTER TABLE revenue ADD COLUMN shop_id UUID REFERENCES shops(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue' AND column_name = 'invoice_id') THEN
        ALTER TABLE revenue ADD COLUMN invoice_id UUID REFERENCES invoices(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue' AND column_name = 'work_order_id') THEN
        ALTER TABLE revenue ADD COLUMN work_order_id UUID REFERENCES repair_orders(id);
    END IF;

    -- Add missing columns to cost table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cost' AND column_name = 'notes') THEN
        ALTER TABLE cost ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cost' AND column_name = 'shop_id') THEN
        ALTER TABLE cost ADD COLUMN shop_id UUID REFERENCES shops(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cost' AND column_name = 'invoice_id') THEN
        ALTER TABLE cost ADD COLUMN invoice_id UUID REFERENCES invoices(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cost' AND column_name = 'work_order_id') THEN
        ALTER TABLE cost ADD COLUMN work_order_id UUID REFERENCES repair_orders(id);
    END IF;
END $$;

-- Migrate existing data if description column exists
DO $$
BEGIN
    -- For revenue table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue' AND column_name = 'description') THEN
        UPDATE revenue SET source = description WHERE source IS NULL AND description IS NOT NULL;
    END IF;
    
    -- For cost table  
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cost' AND column_name = 'description') THEN
        UPDATE cost SET notes = description WHERE notes IS NULL AND description IS NOT NULL;
    END IF;
END $$;

-- Create service_usage table to track when services/parts are used in work orders
CREATE TABLE IF NOT EXISTS service_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id),
    service_id UUID NOT NULL REFERENCES shop_services(id),
    work_order_id UUID NOT NULL REFERENCES repair_orders(id),
    quantity_used DECIMAL(10,2) NOT NULL CHECK (quantity_used > 0),
    cost_per_unit DECIMAL(10,2) NOT NULL CHECK (cost_per_unit >= 0),
    total_cost DECIMAL(10,2) NOT NULL CHECK (total_cost >= 0),
    usage_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_movements table to track parts inventory changes
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id),
    service_id UUID NOT NULL REFERENCES shop_services(id),
    work_order_id UUID REFERENCES repair_orders(id),
    quantity_change DECIMAL(10,2) NOT NULL, -- positive for additions, negative for usage
    reason TEXT NOT NULL,
    previous_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    new_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
CREATE INDEX IF NOT EXISTS idx_revenue_shop_id ON revenue(shop_id);
CREATE INDEX IF NOT EXISTS idx_revenue_invoice_id ON revenue(invoice_id);
CREATE INDEX IF NOT EXISTS idx_revenue_work_order_id ON revenue(work_order_id);

CREATE INDEX IF NOT EXISTS idx_cost_date ON cost(date);
CREATE INDEX IF NOT EXISTS idx_cost_type ON cost(type);
CREATE INDEX IF NOT EXISTS idx_cost_shop_id ON cost(shop_id);
CREATE INDEX IF NOT EXISTS idx_cost_invoice_id ON cost(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cost_work_order_id ON cost(work_order_id);

CREATE INDEX IF NOT EXISTS idx_service_usage_shop_id ON service_usage(shop_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_service_id ON service_usage(service_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_work_order_id ON service_usage(work_order_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_date ON service_usage(usage_date);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_shop_id ON inventory_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_service_id ON inventory_movements(service_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_work_order_id ON inventory_movements(work_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date);

-- Add constraints to shop_services table for better inventory management
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_parts_have_quantity') THEN
        ALTER TABLE shop_services ADD CONSTRAINT check_parts_have_quantity 
            CHECK (type != 'parts' OR quantity IS NOT NULL);
    END IF;
END $$;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers for all tables
DROP TRIGGER IF EXISTS update_revenue_updated_at ON revenue;
CREATE TRIGGER update_revenue_updated_at 
    BEFORE UPDATE ON revenue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cost_updated_at ON cost;
CREATE TRIGGER update_cost_updated_at 
    BEFORE UPDATE ON cost 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_usage_updated_at ON service_usage;
CREATE TRIGGER update_service_usage_updated_at 
    BEFORE UPDATE ON service_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for financial summary by work order
CREATE OR REPLACE VIEW work_order_financial_summary AS
SELECT 
    wo.id as work_order_id,
    wo.shop_id,
    wo.status,
    wo.created_at,
    COALESCE(SUM(CASE WHEN ss.type = 'labor' THEN su.total_cost ELSE 0 END), 0) as total_labor_cost,
    COALESCE(SUM(CASE WHEN ss.type = 'parts' THEN su.total_cost ELSE 0 END), 0) as total_parts_cost,
    COALESCE(SUM(su.total_cost), 0) as total_service_cost,
    i.amount as invoice_amount,
    i.status as invoice_status,
    i.issue_date as invoice_date
FROM repair_orders wo
LEFT JOIN service_usage su ON wo.id = su.work_order_id
LEFT JOIN shop_services ss ON su.service_id = ss.id
LEFT JOIN invoices i ON wo.id = i.workorder_id
GROUP BY wo.id, wo.shop_id, wo.status, wo.created_at, i.amount, i.status, i.issue_date;

-- Create a view for inventory status
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
    ss.id as service_id,
    ss.shop_id,
    ss.service_name,
    ss.description,
    ss.price,
    ss.quantity as current_quantity,
    ss.type,
    COALESCE(SUM(CASE WHEN im.quantity_change < 0 THEN ABS(im.quantity_change) ELSE 0 END), 0) as total_used,
    COALESCE(SUM(CASE WHEN im.quantity_change > 0 THEN im.quantity_change ELSE 0 END), 0) as total_restocked,
    COUNT(DISTINCT su.work_order_id) as work_orders_used_in
FROM shop_services ss
LEFT JOIN inventory_movements im ON ss.id = im.service_id
LEFT JOIN service_usage su ON ss.id = su.service_id
WHERE ss.type = 'parts'
GROUP BY ss.id, ss.shop_id, ss.service_name, ss.description, ss.price, ss.quantity, ss.type;

-- Create function to automatically create financial entries when invoice is marked as PAID
CREATE OR REPLACE FUNCTION auto_create_financial_entries()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to PAID
    IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
        -- Check if revenue entry already exists to prevent duplicates
        IF NOT EXISTS (SELECT 1 FROM revenue WHERE invoice_id = NEW.id) THEN
            -- Create revenue entry
            INSERT INTO revenue (
                date, 
                amount, 
                source, 
                notes, 
                shop_id, 
                invoice_id
            ) VALUES (
                NEW.issue_date::date,
                NEW.amount,
                'Invoice ' || NEW.invoice_number,
                'Revenue from completed work order - ' || COALESCE(NEW.description, 'Service completed'),
                NEW.shop_id,
                NEW.id
            );

            -- Create parts cost entry if exists
            IF NEW.parts_cost IS NOT NULL AND NEW.parts_cost > 0 THEN
                INSERT INTO cost (
                    date,
                    amount,
                    type,
                    notes,
                    shop_id,
                    invoice_id
                ) VALUES (
                    NEW.issue_date::date,
                    NEW.parts_cost,
                    'inventory',
                    'Parts cost for Invoice ' || NEW.invoice_number,
                    NEW.shop_id,
                    NEW.id
                );
            END IF;

            -- Create labor cost entry (40% of labor charge as actual cost)
            IF NEW.labour_cost IS NOT NULL AND NEW.labour_cost > 0 THEN
                INSERT INTO cost (
                    date,
                    amount,
                    type,
                    notes,
                    shop_id,
                    invoice_id
                ) VALUES (
                    NEW.issue_date::date,
                    NEW.labour_cost * 0.4,
                    'other',
                    'Labor cost for Invoice ' || NEW.invoice_number,
                    NEW.shop_id,
                    NEW.id
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic financial entry creation
DROP TRIGGER IF EXISTS auto_financial_entries_trigger ON invoices;
CREATE TRIGGER auto_financial_entries_trigger
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_financial_entries();

-- Insert some sample data for testing (optional)
-- Only insert if tables are empty to avoid conflicts
DO $$
BEGIN
    -- Sample revenue data
    IF (SELECT COUNT(*) FROM revenue) = 0 THEN
        INSERT INTO revenue (date, amount, source, notes) VALUES 
            (CURRENT_DATE - INTERVAL '30 days', 1500.00, 'Invoice INV-001', 'Oil change services'),
            (CURRENT_DATE - INTERVAL '25 days', 2300.00, 'Invoice INV-002', 'Brake repair'),
            (CURRENT_DATE - INTERVAL '20 days', 800.00, 'Invoice INV-003', 'Tire rotation'),
            (CURRENT_DATE - INTERVAL '15 days', 1200.00, 'Invoice INV-004', 'Engine diagnostic'),
            (CURRENT_DATE - INTERVAL '10 days', 950.00, 'Invoice INV-005', 'Battery replacement'),
            (CURRENT_DATE - INTERVAL '5 days', 1800.00, 'Invoice INV-006', 'Transmission service'),
            (CURRENT_DATE - INTERVAL '2 days', 600.00, 'Invoice INV-007', 'Air filter replacement'),
            (CURRENT_DATE, 1100.00, 'Invoice INV-008', 'Spark plug replacement');
    END IF;

    -- Sample cost data
    IF (SELECT COUNT(*) FROM cost) = 0 THEN
        INSERT INTO cost (date, amount, type, notes) VALUES 
            (CURRENT_DATE - INTERVAL '30 days', 400.00, 'inventory', 'Motor oil purchase'),
            (CURRENT_DATE - INTERVAL '28 days', 1200.00, 'fixed', 'Monthly rent'),
            (CURRENT_DATE - INTERVAL '25 days', 600.00, 'inventory', 'Brake pads'),
            (CURRENT_DATE - INTERVAL '20 days', 200.00, 'inventory', 'Tire supplies'),
            (CURRENT_DATE - INTERVAL '15 days', 300.00, 'other', 'Equipment maintenance'),
            (CURRENT_DATE - INTERVAL '10 days', 150.00, 'inventory', 'Car battery'),
            (CURRENT_DATE - INTERVAL '5 days', 500.00, 'inventory', 'Transmission fluid'),
            (CURRENT_DATE - INTERVAL '2 days', 80.00, 'inventory', 'Air filters'),
            (CURRENT_DATE, 120.00, 'inventory', 'Spark plugs');
    END IF;
END $$; 