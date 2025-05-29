-- Create enum type for OBD status
CREATE TYPE obd_status AS ENUM ('healthy', 'warning', 'critical');

-- Create vehicle_obd_data table
CREATE TABLE vehicle_obd_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES customer_vehicles(id),
    timestamp TIMESTAMPTZ DEFAULT now(),
    rpm INTEGER,
    engine_temp INTEGER,
    fuel_level INTEGER,
    dtc_codes TEXT[],
    status obd_status,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_vehicle_obd_timestamp ON vehicle_obd_data(vehicle_id, timestamp);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_vehicle_obd_data_updated_at
    BEFORE UPDATE ON vehicle_obd_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create shop_contact_requests table
CREATE TABLE shop_contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trigger for updating timestamp
CREATE TRIGGER update_shop_contact_requests_updated_at
    BEFORE UPDATE ON shop_contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 