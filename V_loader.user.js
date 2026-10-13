// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.8.0
// @description  Loader with direct SHA resolution (Instant updates)
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

    // Déclaration du script pour la page Web GitHub Pages
    window.FOURMIZZZ_SCRIPT_INSTALLED = true;
    document.documentElement.setAttribute('data-fourmizzz-script', 'true');

    // On récupère le SHA du dernier commit en forçant l'API à ne pas mettre en cache
    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/commits?path=${FILE_PATH}&page=1&per_page=1&_=${Date.now()}`;

    fetch(apiUrl, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error(`API GitHub HTTP ${res.status}`);
            return res.json();
        })
        .then(commits => {
            const latestCommitSha = commits[0].sha;

            // En pointant directement sur @latestCommitSha, on force jsDelivr
            // à aller chercher le fichier exact de ce commit précis. zéro cache !
            const scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@${latestCommitSha}/${FILE_PATH}`;

            injectScript(scriptUrl);
        })
        .catch(err => {
            console.warn('[Victooly Loader] Erreur API GitHub, chargement de secours :', err);
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
