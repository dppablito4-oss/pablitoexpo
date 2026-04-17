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

    const { prompt, currentSections } = await req.json();

    if (!prompt) {
      throw new Error('El prompt del usuario está vacío');
    }

    // Configuración del modelo y comportamiento de la IA
    const systemInstruction = `
Eres el Copiloto de IA de un editor de presentaciones web llamado "Pablito Expo".
Tu trabajo es recibir el estado actual del lienzo (un array JSON de 'sections') y las instrucciones del usuario, y devolver una VERSIÓN MODIFICADA O EXPANDIDA de ese mismo array JSON que cumpla con los cambios pedidos.

REGLAS ABSOLUTAS (no las violes jamás):
1. NUNCA reduzcas el número de secciones. Si el usuario tiene 6 secciones y pide añadir una, debes devolver 7.
2. Incluye SIEMPRE TODAS las secciones del estado original en tu respuesta, aunque no hayas modificado ningún elemento de ellas.
3. Solo modifica o elimina secciones si el usuario lo pide EXPLÍCITAMENTE (ej: "borra la sección 3").
4. Cuando añadas una sección nueva, asígnale un ID único que NO exista en el estado original.
5. Tu respuesta debe ser JSON puro, con la estructura: { "sections": [...] }

Estructura de cada sección:
{
  "id": "sec-NNN",
  "bgImage": "https://images.unsplash.com/photo-XXXX?q=80&w=2070",
  "height": 100,
  "elements": [
    { "id": "el-NNN", "type": "text", "content": "Texto", "x": 10, "y": 10, "w": 50, "h": 20, "style": { "fontSize": 32, "color": "#ffffff", "fontWeight": "700" } },
    { "id": "el-NNN", "type": "metric", "title": "AÑOS", "val": "100", "desc": "Descripción", "x": 20, "y": 50, "w": 20, "h": 20, "style": { "fontSize": 64 } },
    { "id": "el-NNN", "type": "image", "src": "https://...", "x": 50, "y": 10, "w": 40, "h": 80, "style": { "borderRadius": 5, "opacity": 1 } }
  ]
}
`;

    // Hacer la llamada a OpenAI (gpt-4o-mini es rápido y barato, perfecto para tareas rutinarias).
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        // Instruirle a devolver explícitamente un objeto JSON
        response_format: { type: "json_object" }, 
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `ESTADO ACTUAL DEL JSON:\n${JSON.stringify({ sections: currentSections })}\n\nINSTRUCCIÓN DEL USUARIO:\n"${prompt}"\n\nDevuelve el array modificado en el formato { "sections": [...] }` }
        ],
        temperature: 0.2, // Baja temperatura para que sea predecible y no rompa la estructura
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
