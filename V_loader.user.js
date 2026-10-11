// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.7.0
// @description  Loader with auto-purge jsDelivr cache
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

    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/commits?path=${FILE_PATH}&page=1&per_page=1&_=${Date.now()}`;

    fetch(apiUrl, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error(`API GitHub HTTP ${res.status}`);
            return res.json();
        })
        .then(async (commits) => {
            const latestCommitSha = commits[0].sha;
            const cachedSha = localStorage.getItem('victooly_commit_sha');

            // Si un nouveau commit est détecté, on purge le CDN jsDelivr
            if (cachedSha !== latestCommitSha) {
                console.log('[Victooly] Nouveautés détectées, purge du cache CDN...');
                try {
                    await fetch(`https://purge.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}`);
                } catch (e) {
                    console.warn('[Victooly] Échec de purge CDN :', e);
                }
                localStorage.setItem('victooly_commit_sha', latestCommitSha);
            }

            // On ajoute un paramètre nocache basé sur le timestamp exact pour court-circuiter le navigateur
            const scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}?nocache=${latestCommitSha}_${Date.now()}`;
            injectScript(scriptUrl);
        })
        .catch(err => {
            console.warn('[Victooly Loader] Erreur API GitHub, secours :', err);
            injectScript(`https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}?nocache=${Date.now()}`);
        });

    function injectScript(url) {
        let script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        script.id = 'Victooly';

        document.head.appendChild(script);
    }
})();
