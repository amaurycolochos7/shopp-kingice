-- Add intent tracking fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS intent_confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_confirmed_by INTEGER REFERENCES admins(id);

-- Add source tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'whatsapp';

-- Add status change tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_status_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Add WhatsApp message snapshot
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;
