-- Add 'developer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- Create the developer user account
-- Note: This will be handled via edge function since we need to create auth user