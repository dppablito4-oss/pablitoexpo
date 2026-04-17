import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
                        || Deno.env.get('open ai key')
                        || Deno.env.get('OPENAI_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('No se encontró la API Key de OpenAI.');
    }

    const { nasaData, questionCount = 0 } = await req.json();

    // Extraer el contexto de texto de la presentación
    const contextText = nasaData?.context
      || (typeof nasaData === 'string' ? nasaData : JSON.stringify(nasaData).slice(0, 1000));

    const systemPrompt = `Eres un asistente educativo para "Pablito Expo".
Tu trabajo es generar preguntas de reflexión y sus respuestas basadas ESTRICTAMENTE en el contenido de una presentación.

CONTEXTO DE LA PRESENTACIÓN:
${contextText || 'Presentación general sobre tecnología y ciencia.'}

NÚMERO DE PREGUNTA ACTUAL: ${questionCount + 1}

REGLAS:
- Genera UNA sola pregunta de reflexión abierta basada en el tema del contexto.
- La pregunta debe invitar a pensar y debatir, no tener respuesta de "sí/no".
- La respuesta (answer) debe ser una guía breve de 1-2 oraciones con la idea clave esperada.
- Varía el tipo de pregunta (análisis, opinión, comparación, aplicación).
- Responde SOLO con JSON puro: { "question": "...", "answer": "..." }`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Genera la pregunta de esta sesión.' }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error('OpenAI error:', data);
      throw new Error('Error en la API de OpenAI');
    }

    const parsed = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({
        question: parsed.question || '¿Cuál es la idea principal de este tema?',
        answer:   parsed.answer   || 'Reflexiona sobre el contexto de la presentación.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
