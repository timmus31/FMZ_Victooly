export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Si on accède à la racine du site, on pointe vers index3.html
    if (url.pathname === '/') {
      url.pathname = '/index3.html';
      request = new Request(url.toString(), request);
    }

    // Interception exclusive de la page HTML
    if (url.pathname === '/index3.html') {
      const response = await env.ASSETS.fetch(request);
      let html = await response.text();
      
      // Remplacement des secrets
      html = html.replace("__INJECT_SUPABASE_URL__", env.SUPABASE_URL);
      html = html.replace("__INJECT_SUPABASE_ANON_KEY__", env.SUPABASE_ANON_KEY);

      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // Pour tous les autres fichiers (CSS, images...), on laisse passer normalement
    return env.ASSETS.fetch(request);
  }
};
