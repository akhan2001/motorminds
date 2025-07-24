-- Remove DocuSeal template columns since we're using HTML-based submissions
-- This migration removes template-related columns that are no longer needed

DO $$ 
BEGIN
    -- Remove docuseal_template_id column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_contracts' 
        AND column_name = 'docuseal_template_id'
    ) THEN
        -- Drop index first
        DROP INDEX IF EXISTS idx_service_contracts_docuseal_template_id;
        
        -- Drop column
        ALTER TABLE service_contracts 
        DROP COLUMN docuseal_template_id;
    END IF;

    -- Remove docuseal_template_url column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_contracts' 
        AND column_name = 'docuseal_template_url'
    ) THEN
        ALTER TABLE service_contracts 
        DROP COLUMN docuseal_template_url;
    END IF;

    -- Add comment about the new approach
    COMMENT ON TABLE service_contracts IS 'Service contracts table. Uses HTML-based DocuSeal submissions instead of templates.';
    
END $$; 