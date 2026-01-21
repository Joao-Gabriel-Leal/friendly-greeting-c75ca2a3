-- Allow users to insert their own specialty blocks (for same-day cancellation suspension)
CREATE POLICY "Users can insert their own specialty blocks" 
ON public.user_specialty_blocks 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());