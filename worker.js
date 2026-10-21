import htmlContent from './index3.html';

export default {
  async fetch(request, env) {
    // On récupère l'URL demandée
    const url = new URL(request.url);

    // Si on demande la racine (/) ou index2.html, on intercepte
    if (url.pathname === '/' || url.pathname === '/index2.html') {
      let modifiedHtml = htmlContent;
      
      // On remplace les marqueurs par vos secrets (configurés dans l'interface)
      modifiedHtml = modifiedHtml.replace("__INJECT_SUPABASE_URL__", env.SUPABASE_URL);
      modifiedHtml = modifiedHtml.replace("__INJECT_SUPABASE_ANON_KEY__", env.SUPABASE_ANON_KEY);

      return new Response(modifiedHtml, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // Pour les autres requêtes (images, css...), on laisse Cloudflare faire
    return env.ASSETS.fetch(request);
  }
};
