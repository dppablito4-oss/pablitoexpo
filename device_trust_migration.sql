-- ==========================================
-- PablitoExpo: Migración de Device Trust (Fingerprinting)
-- Motor: Supabase PostgreSQL
-- Fecha: 2026-05-14
-- ==========================================

-- 1. Tabla de Confianza de Dispositivos
-- Vincula visitorId (fingerprint) con emails de usuario.
-- Regla de Oro: Máximo 2 emails por visitorId.
create table if not exists public.device_trust (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  user_id uuid references auth.users on delete cascade,
  user_email text not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Asegurar unicidad de la combinación visitorId + email
  unique (visitor_id, user_email)
);

-- Índices para consultas rápidas
create index if not exists idx_device_trust_visitor_id on public.device_trust (visitor_id);
create index if not exists idx_device_trust_user_email on public.device_trust (user_email);

-- RLS: Cada usuario solo puede ver/insertar sus propios registros
alter table public.device_trust enable row level security;

create policy "Users can view own device trust records"
  on public.device_trust for select
  using (auth.uid() = user_id);

create policy "Users can insert own device trust records"
  on public.device_trust for insert
  with check (auth.uid() = user_id);

create policy "Users can update own device trust records"
  on public.device_trust for update
  using (auth.uid() = user_id);

-- 2. (Opcional) Vista administrativa para ver todos los vínculos
-- Solo accesible via service_role, no a través del cliente.
comment on table public.device_trust is 
  'Tabla de fingerprinting: vincula visitorId con email. Máximo 2 emails por dispositivo.';

-- Fin de la migración
