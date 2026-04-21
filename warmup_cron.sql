-- ==============================================================
-- 🔥 WARM-UP SCRIPT: pg_cron para mantener pablito-copilot caliente
-- Ejecuta este script en el SQL Editor de Supabase
-- ==============================================================

-- 1. Habilitar la extensión pg_cron (solo si no está habilitada)
--    Ve a: Database > Extensions > pg_cron y actívala desde la UI de Supabase
--    o ejecuta esto (puede requerir permisos de superadmin):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Habilitar la extensión pg_net para hacer HTTP requests desde SQL
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Crear el job de Warm-Up que pinga la función cada 15 minutos
--    REEMPLAZA 'wraogfketbdpfmrpfwfb' con tu project-ref de Supabase
--    REEMPLAZA 'tu-anon-key-aqui' con tu SUPABASE_ANON_KEY

SELECT cron.schedule(
    'warmup-pablito-copilot',        -- nombre del job (único)
    '*/15 * * * *',                  -- cada 15 minutos
    $$
    SELECT net.http_post(
        url     := 'https://wraogfketbdpfmrpfwfb.supabase.co/functions/v1/pablito-copilot',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'apikey',        current_setting('app.supabase_anon_key', true)
        ),
        body    := '{"ping":true}'::jsonb
    );
    $$
);

-- 4. (ALTERNATIVA SIMPLE) Si no quieres usar app.settings, puedes hardcodear la anon key:
--    (menos seguro pero más fácil para probar)
/*
SELECT cron.schedule(
    'warmup-pablito-copilot',
    '* /15 * * * *',
    $$
    SELECT net.http_post(
        url     := 'https://wraogfketbdpfmrpfwfb.supabase.co/functions/v1/pablito-copilot',
        headers := '{"Content-Type":"application/json","apikey":"TU_ANON_KEY_AQUI"}'::jsonb,
        body    := '{"ping":true}'::jsonb
    );
    $$
);
*/

-- 5. Para VER los jobs programados activos:
-- SELECT * FROM cron.job;

-- 6. Para ELIMINAR el job si lo necesitas:
-- SELECT cron.unschedule('warmup-pablito-copilot');
