// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Loader for the Victooly helper tool
// @author       Stroke
// @match        http://s5.fourmizzz.fr/*
// @match        https://s5.fourmizzz.fr/*
// @match        *s5.fourmizzz.fr*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const USERNAME = 'timmus31';
    const REPO = 'FMZ_Vitooly';
    const FILE_PATH = 'Victooly.js';

    // API GitHub pour récupérer les infos du dernier commit sur Victooly.js (sans cache)
    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/commits?path=${FILE_PATH}&page=1&per_page=1&_=${Date.now()}`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(commits => {
            // SHA unique du dernier commit (ex: "a1b2c3d...")
            const latestCommitSha = commits[0].sha;
            const cachedSha = localStorage.getItem('victooly_commit_sha');

            let scriptUrl;

            if (cachedSha !== latestCommitSha) {
                console.log(`[Victooly] Nouveau commit détecté (${latestCommitSha.substring(0, 7)}). Chargement du nouveau code.`);
                localStorage.setItem('victooly_commit_sha', latestCommitSha);
                // On passe le SHA unique en paramètre pour forcer le téléchargement du nouveau code
                scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}?v=${latestCommitSha}`;
            } else {
                console.log(`[Victooly] Code déjà à jour. Chargement depuis le cache.`);
                // URL fixe sans paramètre : le navigateur utilise son cache local
                scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}`;
            }

            injectScript(scriptUrl);
        })
        .catch(err => {
            console.error('[Victooly] Erreur API GitHub, chargement de secours :', err);
            injectScript(`https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}`);
        });

    function injectScript(url) {
        let script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        script.id = 'Victooly';
        document.head.appendChild(script);
    }
})();
