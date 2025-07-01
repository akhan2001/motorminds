-- First ensure the base tables exist (run cashflow_schema.sql first if they don't)
-- Add shop_id and invoice_id columns to revenue table for better tracking
DO $$ 
BEGIN
    -- Check if revenue table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'revenue') THEN
        CREATE TABLE revenue (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- Check if cost table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cost') THEN
        CREATE TABLE cost (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
            type VARCHAR(20) NOT NULL CHECK (type IN ('inventory', 'fixed', 'other')),
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Add new columns to revenue table (without foreign key constraints for now)
ALTER TABLE revenue ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE revenue ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE revenue ADD COLUMN IF NOT EXISTS shop_id UUID;
ALTER TABLE revenue ADD COLUMN IF NOT EXISTS invoice_id UUID;
ALTER TABLE revenue ADD COLUMN IF NOT EXISTS work_order_id UUID;

-- Add new columns to cost table (without foreign key constraints for now)
ALTER TABLE cost ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE cost ADD COLUMN IF NOT EXISTS shop_id UUID;
ALTER TABLE cost ADD COLUMN IF NOT EXISTS invoice_id UUID;
ALTER TABLE cost ADD COLUMN IF NOT EXISTS work_order_id UUID;

-- Migrate existing data if description column exists
DO $$
BEGIN
    -- For revenue table - copy description to source if source is empty
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'revenue' AND column_name = 'description') THEN
        UPDATE revenue SET source = description WHERE source IS NULL AND description IS NOT NULL;
    END IF;
    
    -- For cost table - copy description to notes if notes is empty
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cost' AND column_name = 'description') THEN
        UPDATE cost SET notes = description WHERE notes IS NULL AND description IS NOT NULL;
    END IF;
END $$;

-- Create service_usage table to track when services/parts are used in work orders
CREATE TABLE IF NOT EXISTS service_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    service_id UUID NOT NULL,
    work_order_id UUID NOT NULL,
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
    shop_id UUID NOT NULL,
    service_id UUID NOT NULL,
    work_order_id UUID,
    quantity_change DECIMAL(10,2) NOT NULL, -- positive for additions, negative for usage
    reason TEXT NOT NULL,
    previous_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    new_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenue_shop_id ON revenue(shop_id);
CREATE INDEX IF NOT EXISTS idx_revenue_invoice_id ON revenue(invoice_id);
CREATE INDEX IF NOT EXISTS idx_revenue_work_order_id ON revenue(work_order_id);

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

-- Add constraints to shop_services table for better inventory management (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shop_services') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_parts_have_quantity') THEN
            ALTER TABLE shop_services ADD CONSTRAINT check_parts_have_quantity 
                CHECK (type != 'parts' OR quantity IS NOT NULL);
        END IF;
    END IF;
END $$;

-- Create trigger to update updated_at column for service_usage
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_usage_updated_at ON service_usage;
CREATE TRIGGER update_service_usage_updated_at 
    BEFORE UPDATE ON service_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views only if the referenced tables exist
DO $$
BEGIN
    -- Create work_order_financial_summary view if tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'repair_orders') AND
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shop_services') AND
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        
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
    END IF;

    -- Create inventory_status view if shop_services table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shop_services') THEN
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
    END IF;
END $$;

-- Create function to automatically create financial entries when invoice is marked as PAID
CREATE OR REPLACE FUNCTION auto_create_financial_entries()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to PAID
    IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic financial entry creation (only if invoices table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        DROP TRIGGER IF EXISTS auto_financial_entries_trigger ON invoices;
        CREATE TRIGGER auto_financial_entries_trigger
            AFTER UPDATE ON invoices
            FOR EACH ROW
            EXECUTE FUNCTION auto_create_financial_entries();
    END IF;
END $$;

-- Insert sample data for testing (optional)
-- This would be removed in production
/*
INSERT INTO revenue (date, amount, source, notes) VALUES 
('2024-01-15', 250.00, 'Invoice INV-001', 'Oil change service'),
('2024-01-16', 450.00, 'Invoice INV-002', 'Brake repair service'),
('2024-01-17', 125.00, 'Invoice INV-003', 'Diagnostic service');

INSERT INTO cost (date, amount, type, notes) VALUES 
('2024-01-15', 25.00, 'inventory', 'Oil filter for INV-001'),
('2024-01-16', 150.00, 'inventory', 'Brake pads for INV-002'),
('2024-01-17', 0.00, 'other', 'Diagnostic labor cost');
*/ 