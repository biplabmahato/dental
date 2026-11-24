-- Run this in your Supabase SQL Editor to fix the "permission denied for table admin_users"
-- error on services and grant the minimal permissions needed for public booking & admin access.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.services, public.clinic_settings, public.business_hours, public.blocked_dates TO anon, authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services, public.clinic_settings, public.business_hours, public.blocked_dates TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

-- Security-definer helper so RLS policies on services/etc. do not require anon
-- to have SELECT privileges on admin_users.
CREATE OR REPLACE FUNCTION public.is_clinic_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

-- Update services policies so anon reads active services cleanly without touching admin_users
DROP POLICY IF EXISTS "Public can read active services" ON public.services;
DROP POLICY IF EXISTS "Anyone can read active services" ON public.services;
CREATE POLICY "Anyone can read active services"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (public.is_clinic_admin())
  WITH CHECK (public.is_clinic_admin());
