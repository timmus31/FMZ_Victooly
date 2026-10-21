export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // On intercepte la page principale
    if (url.pathname === '/' || url.pathname === '/index3.html') {
      // 1. On lit le fichier HTML servi par Cloudflare
      const response = await env.ASSETS.fetch(request);
      let html = await response.text();
      
      // 2. On remplace les marqueurs par vos secrets
      html = html.replace("__INJECT_SUPABASE_URL__", env.SUPABASE_URL);
      html = html.replace("__INJECT_SUPABASE_ANON_KEY__", env.SUPABASE_ANON_KEY);

      // 3. On renvoie le HTML final au navigateur
      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // Pour les autres fichiers (images, css...), on laisse passer
    return env.ASSETS.fetch(request);
  }
};
