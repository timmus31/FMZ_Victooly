// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.6.0
// @description  Loader for Victooly (No-Cache Fix)
// @author       Stroke
// @match        http://s5.fourmizzz.fr/*
// @match        https://s5.fourmizzz.fr/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const USERNAME = 'timmus31';
    const REPO = 'FMZ_Victooly';
    const FILE_PATH = 'Victooly.js';

    // On force l'API GitHub à ne jamais mettre en cache la vérification du commit
    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/commits?path=${FILE_PATH}&page=1&per_page=1&_=${Date.now()}`;

    fetch(apiUrl, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error(`API GitHub HTTP ${res.status}`);
            return res.json();
        })
        .then(commits => {
            const latestCommitSha = commits[0].sha;
            
            // On injecte TOUJOURS le SHA du dernier commit dans l'URL.
            // Si le code n'a pas changé, jsDelivr sert le fichier rapidement.
            // Si tu viens de pusher, le SHA est différent et le nouveau code s'exécute INSTANTANÉMENT.
            const scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}?v=${latestCommitSha}`;

            injectScript(scriptUrl);
        })
        .catch(err => {
            console.warn('[Victooly Loader] Erreur API GitHub, chargement de secours :', err);
            // En cas de panne API, on passe le timestamp actuel pour forcer le rafraîchissement
            injectScript(`https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}?v=${Date.now()}`);
        });

    function injectScript(url) {
        let script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        script.id = 'Victooly';

        document.head.appendChild(script);
    }
})();
