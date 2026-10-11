// ==UserScript==
// @name         Victooly Helper Loader (Debug)
// @namespace    http://tampermonkey.net/
// @version      1.5.1
// @description  Loader for Victooly with debug alerts
// @author       Stroke
// @match        http://s5.fourmizzz.fr/*
// @match        https://s5.fourmizzz.fr/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Alerte pour confirmer que le loader s'exécute bien
    alert("🟢 Loader exécuté sur la page !");

    // 2. Capture des erreurs globales du loader
    window.onerror = function(msg, url, line) {
        alert("❌ Erreur JS globale : " + msg + "\nLigne : " + line);
        return false;
    };

    const USERNAME = 'timmus31';
    const REPO = 'FMZ_Victooly';
    const FILE_PATH = 'Victooly.js';

    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/commits?path=${FILE_PATH}&page=1&per_page=1&_=${Date.now()}`;

    // 3. Récupération du commit avec gestion d'erreur
    fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error(`API GitHub HTTP ${res.status}`);
            return res.json();
        })
        .then(commits => {
            const latestCommitSha = commits[0].sha;
            const cachedSha = localStorage.getItem('victooly_commit_sha');

            let scriptUrl;

            if (cachedSha !== latestCommitSha) {
                localStorage.setItem('victooly_commit_sha', latestCommitSha);
                scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}?v=${latestCommitSha}`;
            } else {
                scriptUrl = `https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}`;
            }

            alert("🌐 URL à charger : " + scriptUrl);
            injectScript(scriptUrl);
        })
        .catch(err => {
            alert("⚠️ Erreur API GitHub : " + err.message + "\nTentative de chargement direct...");
            injectScript(`https://cdn.jsdelivr.net/gh/${USERNAME}/${REPO}@main/${FILE_PATH}`);
        });

    function injectScript(url) {
        let script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        script.id = 'Victooly';

        // 4. Événements de confirmation ou d'échec sur la balise <script>
        script.onload = function() {
            alert("✅ Victooly.js a été téléchargé avec succès par le navigateur !");
        };

        script.onerror = function() {
            alert("❌ ÉCHEC DU TÉLÉCHARGEMENT de Victooly.js (Erreur Réseau ou CORS)");
        };

        document.head.appendChild(script);
    }
})();
