-- Allow developers to manage all appointments (same as admins)
CREATE POLICY "Developers can manage all appointments" 
ON public.appointments 
FOR ALL 
USING (has_role(auth.uid(), 'developer'::app_role));

-- Allow developers to view all appointments
CREATE POLICY "Developers can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (has_role(auth.uid(), 'developer'::app_role));

-- Allow developers to manage specialty blocks
CREATE POLICY "Developers can manage specialty blocks" 
ON public.user_specialty_blocks 
FOR ALL 
USING (has_role(auth.uid(), 'developer'::app_role));