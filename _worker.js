import htmlContent from './index2.html'; // Assurez-vous de charger votre HTML

export default {
  async fetch(request, env) {
    // 1. On récupère le contenu HTML sous forme de texte
    let modifiedHtml = htmlContent;
    
    // 2. On remplace les marqueurs par les secrets Cloudflare
    modifiedHtml = modifiedHtml.replace("__INJECT_SUPABASE_URL__", env.SUPABASE_URL);
    modifiedHtml = modifiedHtml.replace("__INJECT_SUPABASE_ANON_KEY__", env.SUPABASE_ANON_KEY);

    // 3. On renvoie le HTML prêt à l'emploi au navigateur
    return new Response(modifiedHtml, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }
};
