-- Drop existing policy for managing settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;

-- Create new policy that allows both admins and developers to manage settings
CREATE POLICY "Admins and developers can manage settings" 
ON public.system_settings 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'developer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'developer'::app_role)
);