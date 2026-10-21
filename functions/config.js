export async function onRequest(context) {
    // Cloudflare lit les variables d'environnement secrètes
    const url = context.env.SUPABASE_URL;
    const anonKey = context.env.SUPABASE_ANON_KEY;

    // On utilise "window" pour être 100% sûr que le reste du site y aura accès
    const jsContent = `
        window.SUPABASE_URL = "${url}";
        window.SUPABASE_ANON_KEY = "${anonKey}";
        console.log("✅ Victooly Config : Variables sécurisées chargées avec succès !");
    `;

    return new Response(jsContent, {
        headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache" // On désactive le cache temporairement pour tes tests
        }
    });
}
