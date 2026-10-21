function getMenuAlliance() {
    return document.getElementById('menuAlliance');
}

function initMenu() {
    const menuAlliance = getMenuAlliance();
    if (menuAlliance && !document.getElementById('nav-victooly-item')) {
        const customLi = document.createElement('li');
        customLi.id = 'nav-victooly-item';
        customLi.innerHTML = `<a class="boutonListeAmis" href="https://victooly.fourmizzz.workers.dev/" target="_blank" rel="noopener noreferrer"><span></span>Victooly</a>`;
        menuAlliance.appendChild(customLi);
    }
}

// Initialisation globale
initMenu();
