import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
// Deno + Supabase permite importar modulos de Node directamente vía 'npm:'
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usar Service Role para saltar RLS y buscar credentials
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Validar el body de la petición
    const reqBody = await req.json();
    let action = reqBody.action;
    let payload = reqBody.payload;

    // MAGIA: Si la petición viene directo de Supabase Webhook en automático:
    if (reqBody.type === 'INSERT' && reqBody.record && reqBody.record.email) {
       action = 'WELCOME';
       payload = {
          email: reqBody.record.email,
          username: reqBody.record.username || reqBody.record.email.split('@')[0]
       };
    }
    
    // Verificamos si la configuración existe
    
    // 2. Extraer configuración de la base de datos ultra secreta
    const { data: configData, error: configError } = await supabaseClient
      .from('corporate_email_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError || !configData?.smtp_email || !configData?.smtp_app_password) {
      throw new Error("El SuperAdmin aún no ha guardado las credenciales de Gmail en el panel.");
    }

    // 3. Inicializar Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: configData.smtp_email,
        pass: configData.smtp_app_password
      }
    });

    let emailsToBlast = [];

    // LÓGICA DE ACTIONS
    if (action === 'MANUAL_BLAST') {
        const { target, customHtml, selectedUsers } = payload;
        
        // Obtener correos destino
        if (target === 'ALL') {
             const { data: allUsers } = await supabaseClient.from('profiles').select('email, username');
             emailsToBlast = allUsers || [];
        } else if (target === 'SELECTED' && selectedUsers?.length > 0) {
             const { data: specUsers } = await supabaseClient.from('profiles').select('email, username').in('id', selectedUsers);
             emailsToBlast = specUsers || [];
        }

        // Construir la plantilla general
        const baseTemplate = configData.html_template || "<div>{{MESSAGE}}</div>";

        for (const user of emailsToBlast) {
            try {
                const finalHtml = baseTemplate
                    .replace(/{{LOGO_URL}}/g, 'https://raw.githubusercontent.com/dppablito4-oss/pablitoexpo/main/public/favicon.svg')
                    .replace(/{{NICKNAME}}/g, user.username || user.email.split('@')[0])
                    .replace(/{{MESSAGE}}/g, customHtml || 'Mensaje Corporativo');

                await transporter.sendMail({
                    from: `"Pablito Expo C.E.O." <${configData.smtp_email}>`,
                    to: user.email,
                    subject: payload.subject || "Notificación de Pablito Expo",
                    html: finalHtml
                });
            } catch (sendingErr) {
                console.error(`Error enviando a ${user.email}:`, sendingErr);
                // Evitamos que falle todo el ciclo por culpa de un proveedor estricto
            }
        }

    } else if (action === 'SEND_OTP') {
        const { email, username, code } = payload;
        const msg = `<h2 style="color:#ffd700; font-family:monospace; font-size:32px; letter-spacing:5px;">${code}</h2>
                     <p>Usa este código sagrado para destrabar el motor de IA. No lo compartas con nadie causa.</p>`;
                     
        const finalHtml = (configData.html_template || "<div>{{MESSAGE}}</div>")
            .replace(/{{LOGO_URL}}/g, 'https://raw.githubusercontent.com/dppablito4-oss/pablitoexpo/main/public/favicon.svg')
            .replace(/{{NICKNAME}}/g, username || email.split('@')[0])
            .replace(/{{MESSAGE}}/g, msg);

        await transporter.sendMail({
            from: `"Pablito Expo Security" <${configData.smtp_email}>`,
            to: email,
            subject: "🔐 Código Secreto - Pablito Expo AI",
            html: finalHtml
        });
        
    } else if (action === 'WELCOME') {
        const { email, username } = payload;
        const msg = `<p>¡Bienvenido a la revolución de presentaciones de Pablito Expo!</p>
                     <p>Estamos listos para que crees maravillas interactivas, recuerda que puedes usar nuestro proyector nativo y el apuntador láser modo control remoto.</p>
                     <br/><p>Que empiece el juego.</p>`;

        const finalHtml = (configData.html_template || "<div>{{MESSAGE}}</div>")
            .replace(/{{LOGO_URL}}/g, 'https://raw.githubusercontent.com/dppablito4-oss/pablitoexpo/main/public/favicon.svg')
            .replace(/{{NICKNAME}}/g, username || email.split('@')[0])
            .replace(/{{MESSAGE}}/g, msg);

        await transporter.sendMail({
            from: `"Pablito Expo Team" <${configData.smtp_email}>`,
            to: email,
            subject: "🔥 Bienvenido a Pablito Expo!",
            html: finalHtml
        });
    }

    return new Response(JSON.stringify({ success: true, message: 'La armada de correos fue despachada.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("Mailer Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
