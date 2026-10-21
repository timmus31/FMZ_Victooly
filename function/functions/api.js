// Gère les requêtes préliminaires (CORS) envoyées par les navigateurs
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    });
}

// Gère la réception de ton JSON (POST)
export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        // 1. Récupération des données envoyées par l'extension
        const body = await request.json();
        const { fourmizzz_token, payload } = body;

        if (!fourmizzz_token || !payload || !payload.globalInfo) {
            return new Response(JSON.stringify({ error: "Token ou payload invalide." }), { 
                status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } 
            });
        }

        const pseudoJoueur = payload.globalInfo.pseudo;

        // 2. [Optionnel] Vérification du token côté Fourmizzz ici plus tard...

        // 3. Envoi sécurisé vers Supabase
        // Note : On utilise env.SUPABASE_URL et env.SUPABASE_SERVICE_KEY définis dans Cloudflare
        const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/process_extension_stats`, {
            method: 'POST',
            headers: {
                'apikey': env.SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                p_pseudo: pseudoJoueur,
                p_data: payload
            })
        });

        if (!supabaseResponse.ok) {
            const err = await supabaseResponse.text();
            throw new Error(`Erreur Supabase: ${err}`);
        }

        // 4. Succès
        return new Response(JSON.stringify({ success: true, message: `Données de ${pseudoJoueur} traitées !` }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { 
            status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
    }
}
