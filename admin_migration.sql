-- ==========================================
-- Migración: Super Admin Panel y Seguridad
-- ==========================================

-- 1. Ampliar la tabla de perfiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_credits integer DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timeout_until timestamp with time zone;

-- 2. Asignar rol de SUPERADMIN a tu cuenta maestra (nota: debes haber iniciado sesión al menos una vez para que tu perfil exista)
UPDATE public.profiles SET role = 'superadmin' WHERE email = 'pabloclsa87@gmail.com';

-- 3. Crear tabla de monitoreo de seguridad (Logs)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users,
    action text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Proteger los logs con Seguridad a Nivel de Filas (solo superadmins)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can view security logs" ON public.security_logs;
CREATE POLICY "Superadmins can view security logs" ON public.security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- (Opcional) permitir que el mismo sistema registre logs desde el cliente autenticado
DROP POLICY IF EXISTS "Cualquiera puede insertar logs de su propia cuenta" ON public.security_logs;
CREATE POLICY "Cualquiera puede insertar logs de su propia cuenta" ON public.security_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Modo Dios para la tabla de presentaciones (para poder revisar lo que publican)
-- Supabase acumula políticas con un OR lógico, esto significa que la política existente sigue intacta, sólo sumamos esta excepción.
DROP POLICY IF EXISTS "Superadmin can view all presentations" ON public.presentations;
CREATE POLICY "Superadmin can view all presentations" ON public.presentations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- ==========================================
-- Extensión: Módulo de Emisión de Correos y OTP
-- ==========================================

-- 1. Campos de Verificación OTP en perfiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_expires_at timestamp with time zone;

-- 2. Tabla para credenciales y configuración del Mailer Corporativo
CREATE TABLE IF NOT EXISTS public.corporate_email_settings (
    id integer PRIMARY KEY DEFAULT 1, -- Solo existirá 1 fila
    smtp_email text,
    smtp_app_password text,
    html_template text DEFAULT '<div style="background:#06060d; color:#fff; padding:40px; font-family:sans-serif; text-align:center;"><img src="{{LOGO_URL}}" width="80" style="margin-bottom:20px;" /><h1 style="color:#00f0ff;">Hola {{NICKNAME}}</h1><div style="background:#111; padding:20px; border-radius:10px; border:1px solid #333; margin:20px 0; font-size:16px;">{{MESSAGE}}</div><p style="color:#777; font-size:12px;">© 2026 Pablito Expo</p></div>',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Asegurarse de que exista la fila de configuración única
INSERT INTO public.corporate_email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Proteger con RLS: solo superadmins
ALTER TABLE public.corporate_email_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can manage email config" ON public.corporate_email_settings;
CREATE POLICY "Superadmins can manage email config" ON public.corporate_email_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        )
    );
