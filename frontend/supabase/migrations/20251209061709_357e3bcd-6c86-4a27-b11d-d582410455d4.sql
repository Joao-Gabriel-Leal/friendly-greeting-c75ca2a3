-- Create trigger to protect developer role from being changed
CREATE OR REPLACE FUNCTION public.protect_developer_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent deletion of developer role
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'developer' THEN
      RAISE EXCEPTION 'Não é possível remover a role de desenvolvedor';
    END IF;
    RETURN OLD;
  END IF;
  
  -- Prevent update that changes developer role to something else
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'developer' AND NEW.role != 'developer' THEN
      RAISE EXCEPTION 'Não é possível alterar a role de desenvolvedor';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS protect_developer_role_trigger ON public.user_roles;
CREATE TRIGGER protect_developer_role_trigger
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_developer_role();