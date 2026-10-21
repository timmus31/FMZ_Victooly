export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ROUTE API : Uniquement pour recevoir les données de l'extension
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
          // Logique d'insertion Supabase à venir ici
          return new Response(JSON.stringify({ success: true, message: "API prête" }), {
            status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
      }
      return new Response("Méthode non autorisée", { status: 405, headers: corsHeaders });
    }

    // POUR TOUT LE RESTE (index.html, config.js, images...) : Affichage classique
    return env.ASSETS.fetch(request);
  }
};
