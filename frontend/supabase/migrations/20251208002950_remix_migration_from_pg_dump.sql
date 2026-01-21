CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user',
    'professional'
);


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, setor)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data ->> 'setor'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    professional_id uuid,
    specialty_id uuid,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT appointments_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))
);


--
-- Name: available_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.available_days (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    CONSTRAINT available_days_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: blocked_days; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_days (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blocked_date date NOT NULL,
    reason text,
    specialty_id uuid,
    professional_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: professional_specialties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_specialties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    specialty_id uuid NOT NULL
);


--
-- Name: professionals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professionals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    password_temp text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    cpf text,
    suspended_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    setor text,
    blocked boolean DEFAULT false
);


--
-- Name: specialties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 30 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL
);


--
-- Name: user_specialty_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_specialty_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    specialty_id uuid NOT NULL,
    blocked_until timestamp with time zone,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: available_days available_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.available_days
    ADD CONSTRAINT available_days_pkey PRIMARY KEY (id);


--
-- Name: available_days available_days_professional_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.available_days
    ADD CONSTRAINT available_days_professional_id_day_of_week_key UNIQUE (professional_id, day_of_week);


--
-- Name: blocked_days blocked_days_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_days
    ADD CONSTRAINT blocked_days_pkey PRIMARY KEY (id);


--
-- Name: professional_specialties professional_specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_specialties
    ADD CONSTRAINT professional_specialties_pkey PRIMARY KEY (id);


--
-- Name: professional_specialties professional_specialties_professional_id_specialty_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_specialties
    ADD CONSTRAINT professional_specialties_professional_id_specialty_id_key UNIQUE (professional_id, specialty_id);


--
-- Name: professionals professionals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: specialties specialties_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_name_key UNIQUE (name);


--
-- Name: specialties specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_specialty_blocks user_specialty_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_specialty_blocks
    ADD CONSTRAINT user_specialty_blocks_pkey PRIMARY KEY (id);


--
-- Name: user_specialty_blocks user_specialty_blocks_user_id_specialty_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_specialty_blocks
    ADD CONSTRAINT user_specialty_blocks_user_id_specialty_id_key UNIQUE (user_id, specialty_id);


--
-- Name: idx_unique_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unique_appointment ON public.appointments USING btree (professional_id, appointment_date, appointment_time) WHERE (status = ANY (ARRAY['scheduled'::text, 'completed'::text]));


--
-- Name: professionals_user_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX professionals_user_id_unique ON public.professionals USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: available_days available_days_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.available_days
    ADD CONSTRAINT available_days_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;


--
-- Name: blocked_days blocked_days_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_days
    ADD CONSTRAINT blocked_days_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;


--
-- Name: blocked_days blocked_days_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_days
    ADD CONSTRAINT blocked_days_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;


--
-- Name: professional_specialties professional_specialties_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_specialties
    ADD CONSTRAINT professional_specialties_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;


--
-- Name: professional_specialties professional_specialties_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_specialties
    ADD CONSTRAINT professional_specialties_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;


--
-- Name: professionals professionals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_specialty_blocks user_specialty_blocks_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_specialty_blocks
    ADD CONSTRAINT user_specialty_blocks_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;


--
-- Name: admin_logs Admins can create logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create logs" ON public.admin_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: appointments Admins can manage all appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all appointments" ON public.appointments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: available_days Admins can manage available days; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage available days" ON public.available_days USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blocked_days Admins can manage blocked days; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage blocked days" ON public.blocked_days USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: professional_specialties Admins can manage professional specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage professional specialties" ON public.professional_specialties USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: professionals Admins can manage professionals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage professionals" ON public.professionals USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: specialties Admins can manage specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage specialties" ON public.specialties USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_specialty_blocks Admins can manage specialty blocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage specialty blocks" ON public.user_specialty_blocks USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: appointments Admins can view all appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_logs Admins can view logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view logs" ON public.admin_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: professionals Anyone can view active professionals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active professionals" ON public.professionals FOR SELECT USING ((active = true));


--
-- Name: specialties Anyone can view active specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active specialties" ON public.specialties FOR SELECT USING ((active = true));


--
-- Name: available_days Anyone can view available days; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view available days" ON public.available_days FOR SELECT TO authenticated USING (true);


--
-- Name: blocked_days Anyone can view blocked days; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view blocked days" ON public.blocked_days FOR SELECT TO authenticated USING (true);


--
-- Name: professional_specialties Anyone can view professional specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view professional specialties" ON public.professional_specialties FOR SELECT TO authenticated USING (true);


--
-- Name: appointments Professionals can update their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professionals can update their own appointments" ON public.appointments FOR UPDATE USING ((professional_id IN ( SELECT professionals.id
   FROM public.professionals
  WHERE (professionals.user_id = auth.uid()))));


--
-- Name: profiles Professionals can view profiles of their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professionals can view profiles of their clients" ON public.profiles FOR SELECT USING ((user_id IN ( SELECT a.user_id
   FROM (public.appointments a
     JOIN public.professionals p ON ((p.id = a.professional_id)))
  WHERE (p.user_id = auth.uid()))));


--
-- Name: appointments Professionals can view their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professionals can view their own appointments" ON public.appointments FOR SELECT USING ((professional_id IN ( SELECT professionals.id
   FROM public.professionals
  WHERE (professionals.user_id = auth.uid()))));


--
-- Name: appointments Users can create their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own appointments" ON public.appointments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_roles Users can insert their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (role = 'user'::public.app_role)));


--
-- Name: appointments Users can update their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: appointments Users can view their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_specialty_blocks Users can view their own blocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own blocks" ON public.user_specialty_blocks FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: available_days; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.available_days ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_days; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_days ENABLE ROW LEVEL SECURITY;

--
-- Name: professional_specialties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professional_specialties ENABLE ROW LEVEL SECURITY;

--
-- Name: professionals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: specialties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_specialty_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_specialty_blocks ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


