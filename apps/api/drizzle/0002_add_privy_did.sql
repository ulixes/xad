-- Add privy_did column to users table for Privy authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS privy_did TEXT UNIQUE;