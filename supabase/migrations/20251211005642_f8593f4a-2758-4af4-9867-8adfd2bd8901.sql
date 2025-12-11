-- Add confirmation fields to appointments table
ALTER TABLE public.appointments
ADD COLUMN professional_confirmed boolean DEFAULT false,
ADD COLUMN professional_confirmed_at timestamp with time zone,
ADD COLUMN user_confirmed boolean DEFAULT false,
ADD COLUMN user_confirmed_at timestamp with time zone;

-- Add index for pending confirmations queries
CREATE INDEX idx_appointments_confirmations ON public.appointments (professional_confirmed, user_confirmed) WHERE status = 'completed';