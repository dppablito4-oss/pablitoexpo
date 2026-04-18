import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Iniciando búsqueda en Unsplash...");
    const { query, page = 1 } = await req.json()
    console.log("Query:", query, "Page:", page);
    if (!query) {
      throw new Error('El parámetro de búsqueda (query) es requerido.')
    }

    // Leemos la API key desde los secretos de Supabase
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')

    if (!UNSPLASH_ACCESS_KEY) {
      console.error("ERROR: UNSPLASH_ACCESS_KEY no encontrada en variables de entorno.");
      throw new Error('API Key de Unsplash no configurada en el servidor (Secrets).')
    }

    // Buscamos en Unsplash: 15 imágenes por página
    const unsplashUrl = `https://api.unsplash.com/search/photos?page=${page}&per_page=15&query=${encodeURIComponent(query)}`
    console.log("Llamando a Unsplash...");

    const response = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })
    
    const data = await response.json()

    if (!response.ok) {
      console.error("Unsplash API Error:", data);
      throw new Error(data.errors ? data.errors.join(', ') : 'Error desconocido de Unsplash');
    }

    console.log("Resultados obtenidos:", data.results?.length || 0);

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error en Function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Mandamos 200 pero con el campo error para que el cliente lo maneje
      }
    )
  }
})
