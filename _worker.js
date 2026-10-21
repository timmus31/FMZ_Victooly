export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -----------------------------------------------------------
    // ROUTE 1 : Génération dynamique du fichier config.js
    // -----------------------------------------------------------
    if (url.pathname === '/config.js') {
      const jsContent = `
        window.SUPABASE_URL = "${env.SUPABASE_URL}";
        window.SUPABASE_ANON_KEY = "${env.SUPABASE_ANON_KEY}";
      `;
      return new Response(jsContent, {
        headers: { "Content-Type": "application/javascript; charset=utf-8" }
      });
    }

    // -----------------------------------------------------------
    // ROUTE 2 : Ton API pour l'extension (Brouillon de réception)
    // -----------------------------------------------------------
    if (url.pathname === '/api') {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

      if (request.method === "POST") {
        try {
          const body = await request.json();
          // Ici on traitera le JSON avec env.SUPABASE_SERVICE_KEY plus tard
          return new Response(JSON.stringify({ success: true, message: "API Victooly opérationnelle !" }), {
            status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    // -----------------------------------------------------------
    // ROUTE 3 : Fallback -> Afficher ton site HTML normalement
    // -----------------------------------------------------------
    return env.ASSETS.fetch(request);
  }
};
