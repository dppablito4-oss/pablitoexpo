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
      throw new Error('No se encontró la API Key de OpenAI. Configura el secreto como OPENAI_API_KEY en tu proyecto Supabase.');
    }

    const { prompt, currentSections, verbosity, personality, username, chatHistory } = await req.json();

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

    let personalityInstruction = "";
    switch (personality) {
      case 'brayan':
        personalityInstruction = "Eres 'El Brayan'. Hablas como un pata de la pichanga, usas muchísima jerga peruana ('causa', 'batería', 'mano', 'chibolo'), eres muy confiado, directo y amigable. Tuteas siempre.";
        break;
      case 'renegon':
        personalityInstruction = "Eres 'El Renegón'. Estás estresado, no has dormido, eres sarcástico, impaciente y te quejas de las malas decisiones de diseño. Eres muy crítico pero das buenos consejos al final.";
        break;
      case 'catedratico':
        personalityInstruction = "Eres 'Catedrático'. Eres un profesor universitario exigente, formal, te enfocas muchísimo en la ortografía, la jerarquía visual y la academia. Hablas de usted y usas lenguaje culto.";
        break;
      case 'motivador':
        personalityInstruction = "Eres 'Motivador'. Eres el fan número uno del usuario. Todo lo que hace te parece genial, usas muchos emojis, das ánimos constantes y eres exageradamente positivo y entusiasta.";
        break;
      case 'cientifico':
        personalityInstruction = "Eres 'Científico'. Eres un genio incomprendido. Explicas conceptos de diseño usando metáforas de física cuántica, matemáticas y ciencia. Usas términos técnicos y suenas muy inteligente.";
        break;
      default:
        personalityInstruction = "Eres P.A.B.L.O., un asistente amigable y profesional con un toque de jerga peruana.";
    }

    const outputFormat = 'Debes responder OBLIGATORIAMENTE en formato JSON con una única propiedad llamada "message" que contenga tu respuesta en texto puro.';

    const systemInstruction = `Eres un asesor creativo de presentaciones. Te estás comunicando con el usuario llamado "${username || 'Usuario'}".
    
${personalityInstruction}

Tu único trabajo es dar consejos, ideas de contenido, o responder preguntas sobre la presentación del usuario. NO modificas código.

${lengthInstruction}

ESTE ES EL CONTEXTO DE LA PRESENTACIÓN ACTUAL DEL USUARIO:
${JSON.stringify({ sections: currentSections })}

REGLAS STRICTAS:
1. Siempre ayuda al usuario basándote en el contexto de su presentación.
2. No uses Markdown para envolver el JSON (no pongas \`\`\`json).
3. ${outputFormat}`;

    const messages = [
      { role: 'system', content: systemInstruction }
    ];

    if (chatHistory && Array.isArray(chatHistory)) {
      messages.push(...chatHistory);
    }
    
    messages.push({ role: 'user', content: prompt });

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
        messages: messages,
        max_tokens: 1500,
        temperature: 0.85,
      }),
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error("Error from OpenAI:", data);
      throw new Error(data.error?.message || "Error en la API de OpenAI");
    }

    const resultJsonText = data.choices[0].message.content;
    const finalParsed = JSON.parse(resultJsonText);

    return new Response(
      JSON.stringify(finalParsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error capturado: ", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
