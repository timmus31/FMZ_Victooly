// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Loader for the Victooly helper tool
// @author       Stroke
// @match        *s5.fourmizzz.fr/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    let script = document.createElement('script');
    // URL jsDelivr pour charger directement le fichier JS depuis GitHub
    script.src = 'https://cdn.jsdelivr.net/gh/timmus31/FMZ_Vitooly@main/Victooly.js';
    script.type = 'text/javascript';
    script.id = 'Victooly';

    document.head.appendChild(script);
})();
