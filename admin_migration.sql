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

CREATE POLICY "Superadmins can view security logs" ON public.security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- (Opcional) permitir que el mismo sistema registre logs desde el cliente autenticado
CREATE POLICY "Cualquiera puede insertar logs de su propia cuenta" ON public.security_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Modo Dios para la tabla de presentaciones (para poder revisar lo que publican)
-- Supabase acumula políticas con un OR lógico, esto significa que la política existente sigue intacta, sólo sumamos esta excepción.
CREATE POLICY "Superadmin can view all presentations" ON public.presentations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
        )
    );
