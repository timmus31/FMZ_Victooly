// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Loader for the Victooly helper tool
// @author       Stroke
// @match        http://s5.fourmizzz.fr/*
// @match        https://s5.fourmizzz.fr/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const USERNAME = 'timmus31';
    const REPO = 'FMZ_Vitooly';
    const BRANCH = 'main';

    // 1. URL du fichier de version (contourne toujours le cache pour être sûr)
    const versionUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@${BRANCH}/version.json?nocache=${Date.now()}`;

    fetch(versionUrl)
        .then(response => response.json())
        .then(data => {
            const remoteVersion = data.version;
            const localVersion = localStorage.getItem('victooly_script_version');

            let scriptUrl;

            if (localVersion !== remoteVersion) {
                // Discrépance détectée ! On force le rechargement en passant la nouvelle version en paramètre
                console.log(`[Victooly] Mise à jour détectée : v${localVersion} -> v${remoteVersion}`);
                localStorage.setItem('victooly_script_version', remoteVersion);
                scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@${BRANCH}/Victooly.js?v=${remoteVersion}`;
            } else {
                // La version est identique : on charge l'URL fixe, le navigateur utilise son CACHE local
                console.log(`[Victooly] Version à jour (v${localVersion}). Chargement depuis le cache.`);
                scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@${BRANCH}/Victooly.js`;
            }

            // 2. Injection du script dans la page
            let script = document.createElement('script');
            script.src = scriptUrl;
            script.type = 'text/javascript';
            script.id = 'Victooly';
            document.head.appendChild(script);
        })
        .catch(err => {
            console.error('[Victooly] Erreur de vérification de version, chargement secours :', err);
            // En cas d'erreur réseau sur version.json, on charge le script standard
            let script = document.createElement('script');
            script.src = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@${BRANCH}/Victooly.js`;
            script.type = 'text/javascript';
            script.id = 'Victooly';
            document.head.appendChild(script);
        });
})();
