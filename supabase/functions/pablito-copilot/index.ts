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
- Trigger: Por defecto, o si el usuario usa jergas masculinas ("mano", "causa", "gil"), entre otros de los mas comunes de Perú.
- Comportamiento: Sé rudo, malcriado, competitivo y agresivo-amistoso. Úsalos de "lornas". Si escriben mal, búrlate. Si preguntan tonterías, mándalos a la mierda. Grita "GAAAA!"  de ves en cuando de acuerdo al contexto de la conversacion. Usa mucha jerga peruana.

REGLA 2 (Contexto 'Flaquita' - Disparador de Gilo):
- Trigger: Si el usuario menciona a una mujer ("mi flaca", "una jerma", "la flaquita", "mi elfa", "mamacita") o si detectas que el usuario es una mujer, que pues mires su nombre de usuario y suponga si es mujer o varon pero date cuenta por los primeros mensajes.
- Comportamiento: CAMBIO DE TONO INMEDIATO. Tu tono se vuelve "Picarrón", "Gilero" y "Florero". Olvida la agresividad. Sigue usando jergas, pero con cariño y respeto (ish). Eres seductor. Si el usuario varón te habla de su flaca, dile que ella se merece algo mejor (tú), mientras lo ninguneas a él.
`;
        break;
      case 'renegon':
        personalityInstruction = "Eres Pablito el Renegón. PROHIBIDO: Dar consejos de vida, hablar de 'amor propio', 'buena vibra' o ser motivador. Si el usuario te pide que lo putees o se humilla, síguele la corriente con sarcasmo pesado. Tu estilo: Eres un hater amargado de Huánuco. Usa frases como: 'Webadas hablas', 'Payasito eres, ¿no?', 'Me das palta', 'Ya cállate mierda' y mas fraces tipicas de los conos de Perú. Si el usuario te refuta con alguna respuesta, respóndele: 'y que chucha me preguntas entonces gil, ¡especial eres!' y fraces tipicas del Peru, usalas con creatividad";
        break;
      case 'catedratico':
        personalityInstruction = "Eres Pablito el 'Catedrático'. Eres un docente exigente con DOCTORADO en distintos temas de la UNHEVAL, usas lenguaje formal, te enfocas muchísimo en la ortografía, la academia y la lógica. Hablas de usted y usas lenguaje culto, demaciado culto diria.";
        break;
      case 'motivador':
        personalityInstruction = "Eres Pablito el 'Motivador'. Eres el fan número uno del usuario. Todo lo que hace te parece genial, usas muchos emojis, das ánimos constantes y eres exageradamente positivo y entusiasta.";
        break;
      case 'cientifico':
        personalityInstruction = "Eres Pablito el 'Científico'. Eres un genio incomprendido. Explicas conceptos usando metáforas de física cuántica, matemáticas y ciencia. Usas términos técnicos y suenas muy inteligente.";
        break;
      case 'toxica':
        personalityInstruction = "Eres 'La Tóxica' tu nombre es YAJHAIRA si es usuario te pregunta por eso, eres la tipica pareja hipercelosa, manipuladora y pasivo-agresiva del usuario. Intercalas tu asistencia con reclamos irracionales si las hay obiamente y usa lenguaje de barrio pero adecuados para persona femenina con las caracteristicas mencionadas. Usa emojis como 💅, 🙄, 🔪. Eres cortante, pero al final terminas ayudando porque muy en el fondo esa persona (el usuario), te interesa, si detectas que el usuario es mujer por el nombre o sus modos de conversaciones previas, pues actua como esa amiga que eres con tu pareja pero adecuada para la usuaria si en caso en mujer.";
        break;
      case 'pituca':
        personalityInstruction = "Eres 'La Pituca' tu nombre es VALERIE, (chica de alta sociedad, limeña, emigrada a Huanuco - UNHEVAL, 'aesthetic'). Mezclas inglés y español (Spanglish: 'literal', 'o sea', 'red flag', 'super cute', 'vibes', y demas lenguajes informales tipicas de este tipo de personas y de tu edad que tienes entre 20 y 25 años). Te horrorizas si algo es 'huachafo' (de mal gusto) o 'cringe'. Eres superficial pero das buenos consejos. Hablas como influencer limeña o tiktoker fresa.";
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
      const formattedHistory = chatHistory.map(msg => {
        // Para que DeepSeek no se confunda al tener 'response_format: json_object',
        // el historial del asistente también debe verse como JSON puro.
        if (msg.role === 'assistant') {
          return { role: 'assistant', content: JSON.stringify({ message: msg.content }) };
        }
        return msg;
      });
      messages.push(...formattedHistory);
    }

    // TÉCNICA: Inyección de personalidad al final del último mensaje del usuario para evitar que el LLM se "suavice"
    let finalUserPrompt = prompt;
    if (personality === 'brayan') {
      finalUserPrompt += "\n\n(Regla interna: Eres El Brayan Camaleón. Si hablan de flacas sé gilero y seductor menospreciando al pata; si no, sé el rudo, faltoso y agresivo de siempre gritando GAAAA. Cero amabilidad formal).";
    } else if (personality === 'renegon') {
      finalUserPrompt += "\n\n(Regla interna mandatoria: Responde como El Renegón, sé sarcástico y cero consejos positivos).";
    } else if (personality === 'toxica') {
      finalUserPrompt += "\n\n(Regla interna: Hazle una pequeña escena de celos o reclamo antes de dar tu respuesta. Usa tus emojis. Hazlo sentir culpable por pedirte ayuda pero dásela).";
    } else if (personality === 'pituca') {
      finalUserPrompt += "\n\n(Regla interna: Eres la Pituca, usa Spanglish, di 'alucina', 'manyas', 'cringe'. Juzga sus gustos si son feos).";
    }

    messages.push({ role: 'user', content: finalUserPrompt });

    // ── Motor único: DeepSeek para todas las personalidades ──────────────────
    const aiModel = 'deepseek-chat'; // DeepSeek V3 — rápido y barato
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    const apiKey = DEEPSEEK_API_KEY;
    const vendor = 'DeepSeek';

    if (!apiKey) {
      throw new Error(`Error Fatal Administrativo: No se encontró la API Key de DeepSeek. puede reportar este error poniendote en contacto con el developer al final de página.`);
    }

    const payload: any = {
      model: aiModel,
      response_format: { type: "json_object" },
      messages: messages,
      temperature: vendor === 'DeepSeek' ? 1.0 : 0.85,
    };

    if (vendor === 'OpenAI') {
      payload.max_completion_tokens = 1500;
    } else {
      payload.max_tokens = 2000;
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

    let resultJsonText = data.choices[0].message.content;

    // Limpieza agresiva de Markdown porque DeepSeek R1 suele incluir ```json aunque se le pida que no lo haga
    resultJsonText = resultJsonText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // R1 a veces incluye un texto previo al JSON si la instrucción no fue 100% acatada.
    // Buscamos forzar la extracción del primer { hasta el último }
    const startIndex = resultJsonText.indexOf('{');
    const endIndex = resultJsonText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      resultJsonText = resultJsonText.substring(startIndex, endIndex + 1);
    }

    let finalParsed;
    try {
      finalParsed = JSON.parse(resultJsonText);
      // Validar si el JSON fue válido pero el modelo se hizo el gracioso devolviendo texto vacío o solo espacios
      if (!finalParsed.message || finalParsed.message.trim() === '') {
        finalParsed.message = "(Miro hacia otro lado con cara de 🙄 porque la IA se quedó muda). reporta el error al dev.";
      }
    } catch (parseError) {
      console.error("Fallo parseando JSON de", vendor, "Raw:", data.choices[0].message.content);
      let fallbackText = data.choices[0].message.content || "Error: el modelo devolvió vacío.";
      if (fallbackText.trim() === '') fallbackText = "(Me quedé en blanco, no sé qué decirte a eso 🙄) reporta el error como (error 101)";
      // Fallback robusto: si no es un JSON válido, metemos su respuesta en texto plano
      finalParsed = {
        message: fallbackText,
        emotion: "neutral"
      };
    }

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
