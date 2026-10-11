// ==UserScript==
// @name         Victooly Helper Loader
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Loader for the Victooly helper tool
// @author       Stroke
// @match        http://s5.fourmizzz.fr/*
// @match        https://s5.fourmizzz.fr/*
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
