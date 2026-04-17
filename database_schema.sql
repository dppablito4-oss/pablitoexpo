-- ==========================================
-- PablitoExpo: Esquema Maestro de Base de Datos
-- Motor: Supabase PostgreSQL
-- ==========================================

-- 1. Tabla Principal de Presentaciones
create table if not exists public.presentations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  slides_data jsonb default '{"slides": []}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Colaboración SaaS
  is_public boolean default true,
  editors_emails jsonb default '[]'::jsonb
);

-- Habilitar Seguridad a Nivel de Filas (RLS) en Presentaciones
alter table public.presentations enable row level security;

create policy "Anyone can view presentations" on public.presentations
  for select using (is_public = true or auth.uid() = user_id);

create policy "Users can insert own presentations" on public.presentations
  for insert with check (auth.uid() = user_id);

create policy "Owners and editors can update presentations" on public.presentations
  for update using (
    auth.uid() = user_id 
    or 
    (auth.jwt() ->> 'email') in (select jsonb_array_elements_text(editors_emails))
  );

-- 2. Tabla Automática de Perfiles (Espejo Seguro de Emails)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar lectura pública de perfiles para el buscador del Dashboard
alter table public.profiles enable row level security;
create policy "Everyone can view profiles" on public.profiles for select using (true);

-- 3. Función y Trigger Robótico para sincronizar los perfiles nuevos
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fin del Archivo Maestro
