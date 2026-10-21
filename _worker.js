export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index3.html') {
      const response = await env.ASSETS.fetch(request);
      let html = await response.text();
      
      html = html.replace("__INJECT_SUPABASE_URL__", env.SUPABASE_URL);
      html = html.replace("__INJECT_SUPABASE_ANON_KEY__", env.SUPABASE_ANON_KEY);

      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    return env.ASSETS.fetch(request);
  }
};
