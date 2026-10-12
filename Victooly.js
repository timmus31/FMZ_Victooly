const SUPABASE_URL = "https://dwtpxurffahnbwekmtjw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ctcgp3OXPzErZw879wL1eg_jWtgqgSe";

let originalContent = null;
let currentPlayer = null;

// --- Helpers DOM dynamiques ---
function getTargetElement() {
    return document.getElementById('alliance');
}

function getMenuAlliance() {
    return document.getElementById('menuAlliance');
}

// --- Console de Débogage Mobile ---
function logToScreen(message, type = 'info') {
    const consoleEl = document.getElementById('custom-mobile-console');
    if (!consoleEl) return;

    const time = new Date().toLocaleTimeString();
    let color = '#333';
    if (type === 'error') color = '#c0392b';
    if (type === 'success') color = '#27ae60';
    if (type === 'warn') color = '#d35400';

    const line = document.createElement('div');
    line.style.cssText = `color: ${color}; font-family: monospace; font-size: 11px; margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px;`;
    line.textContent = `[${time}] ${message}`;
    
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function getCleanPlayerName() {
    const titleEl = document.querySelector("#titre_boite_info > span");
    if (!titleEl) return null;
    return titleEl.textContent.trim().replace(/^\s*S\d+\s+/i, '');
}

function initMenu() {
    const menuAlliance = getMenuAlliance();
    if (menuAlliance && !document.getElementById('nav-convois-item')) {
        const customLi = document.createElement('li');
        customLi.id = 'nav-convois-item';
        customLi.innerHTML = `<a class="boutonListeAmis" href="alliance.php#custom"><span></span>Convois</a>`;
        menuAlliance.appendChild(customLi);
        window.addEventListener('hashchange', checkViewMode);
    }
}

function checkViewMode() {
    const targetElement = getTargetElement();
    if (!targetElement) return;

    const isAlliancePage = window.location.pathname.includes('alliance.php');
    const isCustomHash = window.location.hash === '#custom';

    if (isAlliancePage && isCustomHash) {
        if (originalContent === null && !document.getElementById('custom-page-container')) {
            originalContent = targetElement.innerHTML;
        }
        renderCustomView();
    } else if (originalContent !== null && !isCustomHash) {
        renderOriginalView();
    }
}

function renderCustomView() {
    const targetElement = getTargetElement();
    if (!targetElement) return;

    currentPlayer = getCleanPlayerName();

    targetElement.innerHTML = `
        <div id="custom-page-container" style="padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); font-family: sans-serif; color: #333;">
            <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px; font-size: 1.3em;">
                \uD83D\uDCE6 Tableau des Convois Alliance
            </h2>
            <div id="tab-content-container">
                <div id="main-status-content">Authentification en cours...</div>
            </div>

            <!-- Console de Débogage Mobile -->
            <div style="margin-top: 25px;">
                <h4 style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 0.9em;">\uD83D\uDCF1 Console de Débogage Mobile</h4>
                <div id="custom-mobile-console" style="background: #222; color: #fff; padding: 10px; border-radius: 5px; height: 130px; overflow-y: auto;">
                </div>
            </div>
        </div>
    `;

    logToScreen(`Page chargée. Joueur : "${currentPlayer}"`, "info");
    authenticateAndLoadConvoys();
}

function renderOriginalView() {
    const targetElement = getTargetElement();
    if (originalContent !== null && targetElement) {
        targetElement.innerHTML = originalContent;
        originalContent = null;
    }
}

// --- AUTHENTIFICATION SÉCURISÉE & CONVOIS ---

function authenticateAndLoadConvoys() {
    const contentDiv = document.getElementById('main-status-content');
    logToScreen("Obtention du token Fourmizzz...", "info");

    // 1. Récupération d'un token éphémère du navigateur
    fetch('/api.php?getToken')
        .then(res => res.json())
        .then(tokenData => {
            const token = typeof tokenData === 'object' ? (tokenData.token || tokenData.id) : String(tokenData);
            logToScreen(`Token obtenu (${token.substring(0, 8)}...). Transmis à Supabase pour validation serveur...`, "info");

            // 2. Transmettre le token brut à Supabase (PostgreSQL interrogera lui-même Fourmizzz)
            return fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_convoys`, {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ p_pseudo: currentPlayer, p_token: token })
            });
        })
        .then(async (res) => {
            const text = await res.text();
            logToScreen(`RPC get_my_convoys (HTTP ${res.status})`, res.status === 200 ? "success" : "warn");

            if (res.status === 200) {
                renderConvoysDashboard(JSON.parse(text));
            } else {
                logToScreen(`Échec RPC : ${text}`, "error");
                contentDiv.innerHTML = `<div style="background: #fadbd8; border: 1px solid #e74c3c; padding: 15px; border-radius: 6px;">\uD83D\uDEAB <strong>Accès refusé. Token invalide ou joueur non autorisé.</strong></div>`;
            }
        })
        .catch(err => {
            logToScreen(`Erreur : ${err.message}`, "error");
            contentDiv.innerHTML = `<div style="background: #fadbd8; border: 1px solid #e74c3c; padding: 15px; border-radius: 6px;">\uD83D\uDEAB <strong>Erreur de réseau ou d'authentification.</strong></div>`;
        });
}

function renderConvoysDashboard(convoys) {
    const contentDiv = document.getElementById('main-status-content');
    const toSend = convoys.filter(c => c.is_sender);
    const toReceive = convoys.filter(c => !c.is_sender);

    contentDiv.innerHTML = `
        <h3 style="color: #e67e22;">\uD83D\uDCE4 Convois à envoyer</h3>
        <div style="background: #fdf2e9; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
            ${renderTable(toSend, true)}
        </div>
        <h3 style="color: #27ae60;">\uD83D\uDCE5 Convois à recevoir</h3>
        <div style="background: #eafaf1; padding: 10px; border-radius: 6px;">
            ${renderTable(toReceive, false)}
        </div>
    `;

    contentDiv.querySelectorAll('.btn-complete-convoy').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            completeConvoyAction(id);
        });
    });
}

function renderTable(list, isSender) {
    if (list.length === 0) return `<em>${isSender ? '✅ Aucun convoi à envoyer.' : 'Aucun convoi attendu.'}</em>`;
    let html = '<table style="width:100%; border-collapse: collapse; font-size: 12px; background: white;">';
    html += `<tr style="background:${isSender ? '#f39c12' : '#27ae60'}; color:white;"><th style="padding:6px;">Date</th><th style="padding:6px;">Joueur</th><th style="padding:6px;">Montant</th>${isSender ? '<th style="padding:6px;">Action</th>' : ''}</tr>`;
    list.forEach(c => {
        const target = isSender ? c.to_player_pseudo : c.from_player_pseudo;
        html += `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding:6px;">${c.balance_date}</td>
            <td style="padding:6px;"><strong>${escapeHtml(target)}</strong></td>
            <td style="padding:6px; font-weight:bold;">${c.amount.toLocaleString('fr-FR')}</td>
            ${isSender ? `<td style="padding:6px;"><button class="btn-complete-convoy" data-id="${c.id}" style="padding:3px 8px; background:#27ae60; color:white; border:none; border-radius:3px; cursor:pointer;">OK</button></td>` : ''}
        </tr>`;
    });
    return html + '</table>';
}

function completeConvoyAction(convoyId) {
    logToScreen(`Validation du convoi #${convoyId}...`, "info");
    
    fetch('/api.php?getToken')
        .then(res => res.json())
        .then(tokenData => {
            const token = typeof tokenData === 'object' ? (tokenData.token || tokenData.id) : String(tokenData);
            return fetch(`${SUPABASE_URL}/rest/v1/rpc/complete_convoy`, {
                method: "POST",
                headers: { 
                    "apikey": SUPABASE_ANON_KEY, 
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ p_convoy_id: convoyId, p_pseudo: currentPlayer, p_token: token })
            });
        })
        .then(() => authenticateAndLoadConvoys())
        .catch(err => logToScreen(`Erreur validation convoi : ${err.message}`, "error"));
}

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])) : '';
}

function showNotification(message, isError = true) {
    let toast = document.getElementById('custom-toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: bold;
            font-family: sans-serif;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease-in-out;
            opacity: 0;
        `;
        document.body.appendChild(toast);
    }

    toast.style.background = isError ? '#e74c3c' : '#27ae60';
    toast.style.color = '#ffffff';
    toast.textContent = message;
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Initialisation au chargement du script
initMenu();
checkViewMode();
