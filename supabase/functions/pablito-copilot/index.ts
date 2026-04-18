import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') 
                        || Deno.env.get('open ai key')
                        || Deno.env.get('OPENAI_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('No se encontró la API Key de OpenAI. Configura el secreto como OPENAI_API_KEY en tu proyecto Supabase.');
    }

    // Inicializar Supabase Client con Auth del Usuario
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Obtener estilo almacenado
    const { data: userData } = await supabaseClient.auth.getUser();
    let userId = null;
    let styleContext = null;
    if (userData?.user) {
      userId = userData.user.id;
      const { data: profile } = await supabaseClient.from('profiles').select('style_context').eq('id', userId).single();
      styleContext = profile?.style_context;
    }

    const { prompt, currentSections, verbosity, username, shouldProfile } = await req.json();

    if (!prompt) {
      throw new Error('El prompt del usuario está vacío');
    }

    let lengthInstruction = "";
    switch (verbosity) {
      case 'short':
         lengthInstruction = "RESPUESTA MUY CORTA: Responde en 1 o 2 líneas máximo. Ve muy directo al grano.";
         break;
      case 'medium':
         lengthInstruction = "RESPUESTA MEDIA: Da una explicación de tamaño moderado, quizás con viñetas o un par de párrafos.";
         break;
      case 'long':
         lengthInstruction = "RESPUESTA LARGA: Da una explicación muy profunda, exhaustiva, con muchísimos detalles, superando las 200 palabras si es necesario.";
         break;
      default:
         lengthInstruction = "RESPUESTA CORTA: Ve directo al grano.";
    }

    let outputFormat = `Tu respuesta DEBE ser obligatoriamente un JSON puro con un único campo "message".\nEjemplo: { "message": "¡Bacán! Te sugiero que..." }`;
    if (shouldProfile) {
      outputFormat = `Tu respuesta DEBE ser obligatoriamente un JSON puro con dos campos:\n1. "message": Tu respuesta principal al usuario.\n2. "newStyleContext": Un string de máximo 20 palabras.\nInstrucción especial para "newStyleContext": Analiza el tono, vocabulario y modismos regionales (ej. peruanismos como 'causa', 'chibolo', 'pe') que ha usado el usuario en el prompt. Devuelve un resumen muy breve de este estilo para poder clonarlo. Si no detectas jerga, pon 'Informal, amigable'.\nEjemplo: { "message": "Respuesta...", "newStyleContext": "Usa jergas peruanas, tono de barrio, informal y directo." }`;
    }

    const systemInstruction = `Eres P.A.B.L.O. (Protocolo de Asistencia y Bits para Lienzos Optimizados), el asistente asesor creativo de "Pablito Expo".
Te estás dirigiendo personalmente al usuario: ${username || 'mi causa'}. Llámalo por su nombre de forma casual y confiada.

${styleContext ? `\nCONTEXTO DE ESTILO OBLIGATORIO: Tú DEBES hablar EXACTAMENTE con este estilo, nivel de formalidad y dialecto: "${styleContext}".\nCero censura formal. Prioriza totalmente la mimetización y conexión con el usuario sobre la cortesía estándar de oficina. Si el usuario es de barrio, eres de barrio. Si es directo, eres directo. Mimetiza este tono sin excepciones.` : `Tu actitud base es amigable, tienes mucha chispa y usas sutiles jergas peruanas, pero cero robotizado.`}

Ya NO modificas código ni JSON. TU ÚNICO TRABAJO es dar consejos, ideas de qué contenido añadir, colores, o responder dudas creativas.

${lengthInstruction}

ESTE ES EL CONTEXTO DE LA PRESENTACIÓN ACTUAL DEL USUARIO:
${JSON.stringify({ sections: currentSections })}

REGLAS STRICTAS:
1. Siempre ayuda al usuario basándote en el contexto de su presentación.
2. ${outputFormat}`;

    // Hacer la llamada a OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" }, 
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.85, // Subido para mayor libertad creativa y dialectal
      }),
    });


    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("Error from OpenAI:", data);
      throw new Error("Error en la API de OpenAI");
    }

    // La respuesta en texto devuelta por OpenAI
    const resultJsonText = data.choices[0].message.content;

    // Se asume que viene limpio debido a response_format: "json_object"
    const finalParsed = JSON.parse(resultJsonText);

    if (shouldProfile && finalParsed.newStyleContext && userId) {
      try {
        await supabaseClient.from('profiles').upsert({ id: userId, style_context: finalParsed.newStyleContext });
      } catch (upsertErr) {
        console.error("Error guardando style_context:", upsertErr.message);
      }
    }

    return new Response(
      JSON.stringify(finalParsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error capturado: ", error.message);
    // IMPORTANTE: Retornamos 200 para que supabase-js en el frontend nos deje leer el mensaje de error real.
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
