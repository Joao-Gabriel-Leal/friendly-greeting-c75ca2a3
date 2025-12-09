-- Allow developers to view all profiles (same as admins)
CREATE POLICY "Developers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'developer'::app_role));

-- Allow developers to update all profiles (same as admins)
CREATE POLICY "Developers can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'developer'::app_role));

-- Allow developers to view all user_roles
CREATE POLICY "Developers can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'developer'::app_role));

-- Allow developers to manage roles (except their own protection via trigger)
CREATE POLICY "Developers can manage roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'developer'::app_role));