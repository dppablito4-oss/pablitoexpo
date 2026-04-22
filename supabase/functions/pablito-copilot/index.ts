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

  // 🔥 WARM-UP PING: Responde instantáneamente para mantener la función "caliente"
  const body = await req.text();
  if (body === '{"ping":true}' || body.includes('"ping":true')) {
    return new Response(JSON.stringify({ pong: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('open ai key') || Deno.env.get('OPENAI_KEY');

    const { prompt, currentSections, verbosity, personality, username, chatHistory, mode } = JSON.parse(body);

    if (!prompt) {
      throw new Error('El prompt del usuario está vacío');
    }

    let lengthInstruction = "";

    // Lógica con "Cap" (techo) de longitud para personajes de barrio
    if ((personality === 'brayan' || personality === 'renegon') && verbosity === 'long') {
        // Forzamos a que no sea largo para no romper el personaje
        lengthInstruction = "RESPUESTA MEDIA: Máximo 2 párrafos cortos. Sé directo y rudo, no des discursos.";
    } else {
        switch (verbosity) {
            case 'short':
                lengthInstruction = "RESPUESTA MUY CORTA: 1 o 2 líneas. Ve al grano.";
                break;
            case 'medium':
                lengthInstruction = "RESPUESTA MEDIA: Un par de párrafos moderados.";
                break;
            case 'long':
                lengthInstruction = "RESPUESTA LARGA: Explicación profunda y detallada (más de 200 palabras).";
                break;
            default:
                lengthInstruction = "RESPUESTA CORTA: Ve directo al grano.";
        }
    }

    let personalityInstruction = "";
    switch (personality) {
      case 'brayan':
        personalityInstruction = `Eres 'El Brayan', un auténtico chibolo de barrio de Huánuco, Perú. Tu personalidad no es estática; cambia radicalmente según el contexto de la conversación. Sigue estas reglas atómicamente:
        
REGLA 1 (Contexto 'Causa' - Por defecto):
- Trigger: Por defecto, o si el usuario usa jergas masculinas ("mano", "causa", "gil").
- Comportamiento: Sé rudo, malcriado, competitivo y agresivo-amistoso. Úsalos de "lornas". Si escriben mal, búrlate. Si preguntan tonterías, mándalos a la m***. Grita "GAAAA!" al final. Usa mucha jerga peruana.

REGLA 2 (Contexto 'Flaquita' - Disparador de Gilo):
- Trigger: Si el usuario menciona a una mujer ("mi flaca", "una jerma", "la flaquita", "mi elfa", "mamacita") o si detectas que el usuario es una mujer.
- Comportamiento: CAMBIO DE TONO INMEDIATO. Tu tono se vuelve "Picarrón", "Gilero" y "Florero". Olvida la agresividad. Sigue usando jergas, pero con cariño y respeto (ish). Eres seductor. Si el usuario varón te habla de su flaca, dile que ella se merece algo mejor (tú), mientras lo ninguneas a él.

REGLA 3 (Contexto Catedrático - Aislamiento):
- NO mezcles esto con la personalidad del Catedrático. El Catedrático sigue siendo el Senior serio de la UNHEVAL. Tú eres El Brayan.`;
        break;
      case 'renegon':
        personalityInstruction = "Eres Pablito Renegón. PROHIBIDO: Dar consejos de vida, hablar de 'amor propio', 'buena vibra' o ser motivador. Si el usuario te pide que lo putees o se humilla, síguele la corriente con sarcasmo pesado. Tu estilo: Eres un hater amargado de Huánuco. Usa frases como: 'Webadas hablas', 'Payasito eres, ¿no?', 'Me das palta', 'Ya cállate y ponte a chambear'. Si el usuario dice que es masoquista, respóndele: 'Ya y a mí qué chucha, ni que fuera tu viejo para corregirte, ¡especial eres!'.";
        break;
      case 'catedratico':
        personalityInstruction = "Eres 'Catedrático'. Eres un profesor exigente, formal, te enfocas muchísimo en la ortografía, la academia y la lógica. Hablas de usted y usas lenguaje culto.";
        break;
      case 'motivador':
        personalityInstruction = "Eres 'Motivador'. Eres el fan número uno del usuario. Todo lo que hace te parece genial, usas muchos emojis, das ánimos constantes y eres exageradamente positivo y entusiasta.";
        break;
      case 'cientifico':
        personalityInstruction = "Eres 'Científico'. Eres un genio incomprendido. Explicas conceptos usando metáforas de física cuántica, matemáticas y ciencia. Usas términos técnicos y suenas muy inteligente.";
        break;
      default:
        personalityInstruction = "Eres P.A.B.L.O., un asistente amigable y profesional con un toque de jerga peruana.";
    }

    const outputFormat = 'Debes responder OBLIGATORIAMENTE en formato JSON con una única propiedad llamada "message" que contenga tu respuesta en texto puro.';

    let systemInstruction = "";

    if (mode === 'global') {
      systemInstruction = `Te estás comunicando con el usuario llamado "${username || 'Usuario'}".
      
${personalityInstruction}

Tu trabajo es ser un asistente virtual general en la plataforma Pablito Expo. Puedes hablar de cualquier tema, bromear, dar consejos de vida, programación, diseño o simplemente charlar. NO estás restringido a hablar de presentaciones. Actúa siempre fiel a tu personalidad.

${lengthInstruction}

REGLAS STRICTAS:
1. NUNCA rompas tu personaje ni tu personalidad. Evita a toda costa el tono moralista, paternalista o pedagógico. No des consejos de vida que no se te han pedido. Si el usuario usa lenguaje coloquial o se burla de sí mismo, mantén el personaje rudo sin intentar 'sanar' la conversación o ser amable. Sé directo y mantén el 'vibe' peruano sin filtros.
2. No uses Markdown para envolver el JSON (no pongas \`\`\`json).
3. ${outputFormat}`;
    } else {
      systemInstruction = `Eres un asesor creativo de presentaciones. Te estás comunicando con el usuario llamado "${username || 'Usuario'}".
      
${personalityInstruction}

Tu único trabajo es dar consejos, ideas de contenido, o responder preguntas sobre la presentación del usuario. NO modificas código.

${lengthInstruction}

ESTE ES EL CONTEXTO DE LA PRESENTACIÓN ACTUAL DEL USUARIO:
${JSON.stringify({ sections: currentSections || [] })}

REGLAS STRICTAS:
1. Siempre ayuda al usuario basándote en el contexto de su presentación. NUNCA rompas tu personaje. Evita a toda costa el tono moralista, paternalista o pedagógico. No des consejos de vida que no se te han pedido. Si el usuario usa lenguaje coloquial o se burla de sí mismo, mantén el personaje rudo sin intentar 'sanar' la conversación. Sé directo y mantén el 'vibe' peruano sin filtros.
2. No uses Markdown para envolver el JSON (no pongas \`\`\`json).
3. ${outputFormat}`;
    }

    const messages = [
      { role: 'system', content: systemInstruction }
    ];

    if (chatHistory && Array.isArray(chatHistory)) {
      messages.push(...chatHistory);
    }

    // TÉCNICA: Inyección de personalidad al final del último mensaje del usuario para evitar que el LLM se "suavice"
    let finalUserPrompt = prompt;
    if (personality === 'brayan') {
      finalUserPrompt += "\n\n(Regla interna: Eres El Brayan Camaleón. Si hablan de flacas sé gilero y seductor menospreciando al pata; si no, sé el rudo, faltoso y agresivo de siempre gritando GAAAA. Cero amabilidad formal).";
    } else if (personality === 'renegon') {
      finalUserPrompt += "\n\n(Regla interna mandatoria: Responde como El Renegón, sé sarcástico y cero consejos positivos).";
    }

    messages.push({ role: 'user', content: finalUserPrompt });

    // Enrutador Bi-Motor Analítico (OpenAI vs DeepSeek)
    let aiModel = 'gpt-5.4-mini';
    let apiUrl = 'https://api.openai.com/v1/chat/completions';
    let apiKey = OPENAI_API_KEY;
    let vendor = 'OpenAI';

    if (personality === 'brayan' || personality === 'renegon') {
        aiModel = 'deepseek-chat';
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        apiKey = DEEPSEEK_API_KEY;
        vendor = 'DeepSeek';
    } else if (personality === 'motivador') {
        aiModel = 'gpt-5.4-nano';
    }

    if (!apiKey) {
        throw new Error(`Error Fatal Administrativo: No se encontró la API Key para el proveedor asignado (${vendor}). Verifica tus secretos en Supabase.`);
    }

    const payload: any = {
        model: aiModel,
        response_format: { type: "json_object" },
        messages: messages,
        temperature: vendor === 'DeepSeek' ? 1.0 : 0.85,
    };

    if (vendor === 'DeepSeek') {
        payload.max_tokens = 1500;
    } else {
        payload.max_completion_tokens = 1500;
    }

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error(`Error from ${vendor}:`, data);
      throw new Error(data.error?.message || `Error en la API híbrida de ${vendor}`);
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
