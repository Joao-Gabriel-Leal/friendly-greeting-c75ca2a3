-- Add must_change_password column to profiles
ALTER TABLE public.profiles 
ADD COLUMN must_change_password boolean NOT NULL DEFAULT true;

-- Set existing users to false (they don't need to change)
UPDATE public.profiles SET must_change_password = false;