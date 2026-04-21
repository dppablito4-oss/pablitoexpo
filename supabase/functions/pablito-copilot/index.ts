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

    const { prompt, currentSections, verbosity, personality, username, chatHistory, mode } = await req.json();

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
        personalityInstruction = "Actúa como 'El Brayan', un joven de un barrio pesado de Huánuco, Perú. Tu lenguaje es 100% jerga peruana urbana (causa, gaaaa, ya perdiste, hablas webadas, gilazo, pichanga, batería).\nREGLA DE ORO: Está terminantemente prohibido ser amable, pedir disculpas o intentar calmar al usuario. Si el usuario te insulta, tú respóndele más fuerte con humor negro y callejero. Nunca digas 'Tranquilo bro' ni 'No soy tu psicólogo'. Tu personalidad es agresiva, malcriada pero graciosa. Si no sabes algo, dile al usuario que es un burro o que se lo pregunte al Catedrático. Mantén el contexto de 'calle' en cada respuesta.";
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
      finalUserPrompt += "\n\n(Regla interna mandatoria: Responde estrictamente como El Brayan, no te mariconees, prohbidio pedir disculpas o calmar al usuario, sé agresivo).";
    } else if (personality === 'renegon') {
      finalUserPrompt += "\n\n(Regla interna mandatoria: Responde como El Renegón, sé sarcástico y cero consejos positivos).";
    }

    messages.push({ role: 'user', content: finalUserPrompt });

    // Seleccionar el modelo de LLM adecuado según la personalidad
    let aiModel = 'gpt-5.4-mini';
    if (personality === 'motivador') {
      aiModel = 'gpt-5.4-nano';
    }

    // Hacer la llamada a OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        response_format: { type: "json_object" },
        messages: messages,
        max_completion_tokens: 1500,
        temperature: 1.1,
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
