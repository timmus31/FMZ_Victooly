export async function onRequest(context) {
    // Cloudflare va lire les variables d'environnement secrètes
    const url = context.env.SUPABASE_URL;
    const anonKey = context.env.SUPABASE_ANON_KEY;

    // Et générer le texte d'un fichier Javascript à la volée !
    const jsContent = `
        const SUPABASE_URL = "${url}";
        const SUPABASE_ANON_KEY = "${anonKey}";
    `;

    return new Response(jsContent, {
        headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "public, max-age=3600"
        }
    });
}
