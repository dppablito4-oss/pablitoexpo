-- ==========================================
-- Migración: Sistema de XP, Niveles y HP
-- Pablito Expo — Gamificación v1
-- ==========================================

-- 1. Campos de Gamificación en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hp integer DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_xp_log jsonb DEFAULT '{}';
-- daily_xp_log almacena: { "date": "2026-04-21", "create": 2, "section": 5, ... }
-- Se compara la fecha para resetear contadores diariamente.

-- 2. Tabla de Configuración Global del Sistema XP (1 sola fila, editable desde Admin Panel)
CREATE TABLE IF NOT EXISTS public.xp_config (
    id integer PRIMARY KEY DEFAULT 1,
    enabled boolean DEFAULT true,                          -- Kill-switch maestro
    xp_multiplier numeric DEFAULT 1.0,                     -- 1.0 = normal, 2.0 = evento doble XP
    level_thresholds jsonb DEFAULT '[0, 50, 150, 350, 600, 1000]',
    rank_names jsonb DEFAULT '["Cachumbo", "Aprendiz", "Creador", "Experto", "Patrón", "Leyenda"]',
    hp_costs jsonb DEFAULT '{"brayan": 2, "renegon": 2, "catedratico": 5, "cientifico": 5, "motivador": 5, "image_mini": 10, "image_pro": 25}',
    updated_at timestamptz DEFAULT now()
);

-- Insertar la fila de configuración si no existe
INSERT INTO public.xp_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. Seguridad con RLS
ALTER TABLE public.xp_config ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer la config (necesaria para el frontend)
DROP POLICY IF EXISTS "Anyone can read xp_config" ON public.xp_config;
CREATE POLICY "Anyone can read xp_config" ON public.xp_config
    FOR SELECT USING (true);

-- Solo superadmins pueden modificar la config
DROP POLICY IF EXISTS "Superadmin can update xp_config" ON public.xp_config;
CREATE POLICY "Superadmin can update xp_config" ON public.xp_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        )
    );
