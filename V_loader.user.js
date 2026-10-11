// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.5.4
// @description  Loader for Victooly
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

            injectScript(scriptUrl);
        })
        .catch(err => {
            console.warn('[Victooly Loader] Erreur API GitHub, chargement de secours :', err);
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
