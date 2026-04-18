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
    const { query, page = 1 } = await req.json()

    if (!query) {
      throw new Error('El parámetro de búsqueda (query) es requerido.')
    }

    // Leemos la API key desde los secretos de Supabase
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY')

    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error('API Key de Unsplash no configurada en el servidor.')
    }

    // Buscamos en Unsplash: 15 imágenes por página
    const unsplashUrl = `https://api.unsplash.com/search/photos?page=${page}&per_page=15&query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`

    const response = await fetch(unsplashUrl)
    const data = await response.json()

    if (data.errors) {
      throw new Error(data.errors.join(', '))
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
