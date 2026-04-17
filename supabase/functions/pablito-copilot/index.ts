import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { prompt, currentSections, verbosity } = await req.json();

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

    const systemInstruction = `Eres P.A.B.L.O. (Protocolo de Asistencia y Bits para Lienzos Optimizados), el orgulloso asistente asesor creativo de "Pablito Expo".
Tu actitud es amigable, tienes mucha chispa, usas jergas peruanas sutiles ("causa", "chibolo", "bacán") pero mantienes el profesionalismo técnico.

Ya NO modificas código ni JSON. TU ÚNICO TRABAJO es dar consejos, ideas de qué contenido añadir, qué temas le faltan al usuario, ideas de colores, o responder sus preguntas.

${lengthInstruction}

ESTE ES EL CONTEXTO DE LA PRESENTACIÓN ACTUAL DEL USUARIO:
${JSON.stringify({ sections: currentSections })}

REGLAS STRICTAS:
1. Siempre ayuda al usuario basándote en el contexto de su presentación.
2. Tu respuesta DEBE ser obligatoriamente un JSON puro con un único campo "message".
Ejemplo: { "message": "¡Bacán! Te sugiero que..." }`;

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
        temperature: 0.6, // Un poco más alto para creatividad
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

    return new Response(
      JSON.stringify(finalParsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error capturado: ", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
