-- Create the trigger function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the main function to set up OBD table
CREATE OR REPLACE FUNCTION create_obd_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'obd_status') THEN
        CREATE TYPE obd_status AS ENUM ('healthy', 'warning', 'critical');
    END IF;

    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS vehicle_obd_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vehicle_id UUID,
        timestamp TIMESTAMPTZ DEFAULT now(),
        rpm INTEGER,
        engine_temp INTEGER,
        fuel_level INTEGER,
        dtc_codes TEXT[],
        status obd_status,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'vehicle_obd_data'
        AND indexname = 'idx_vehicle_obd_timestamp'
    ) THEN
        CREATE INDEX idx_vehicle_obd_timestamp ON vehicle_obd_data(vehicle_id, timestamp);
    END IF;

    -- Create updated_at trigger if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_vehicle_obd_data_updated_at'
    ) THEN
        CREATE TRIGGER update_vehicle_obd_data_updated_at
            BEFORE UPDATE ON vehicle_obd_data
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$; 