const SUPABASE_URL = "https://dwtpxurffahnbwekmtjw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ctcgp3OXPzErZw879wL1eg_jWtgqgSe";

let originalContent = null;
let activeSubTab = 'active'; // 'active' ou 'history'

// --- Helpers DOM ---
function getTargetElement() {
    return document.getElementById('alliance');
}

function getMenuAlliance() {
    return document.getElementById('menuAlliance');
}

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
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
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
    }, 3500);
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

    targetElement.innerHTML = `
        <div id="custom-page-container" style="padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); font-family: sans-serif; color: #333;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
                <h2 style="color: #2c3e50; margin: 0; font-size: 1.3em;">
                    \uD83D\uDCE6 Gestion des Convois Alliance
                </h2>
                <div>
                    <button id="btn-tab-active" style="padding: 6px 12px; margin-right: 5px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; background: ${activeSubTab === 'active' ? '#2980b9' : '#e0e0e0'}; color: ${activeSubTab === 'active' ? '#fff' : '#333'};">
                        En cours
                    </button>
                    <button id="btn-tab-history" style="padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; background: ${activeSubTab === 'history' ? '#2980b9' : '#e0e0e0'}; color: ${activeSubTab === 'history' ? '#fff' : '#333'};">
                        \uD83D\uDCDC Historique
                    </button>
                </div>
            </div>

            <div id="tab-content-container">
                <div id="main-status-content">Chargement des données...</div>
            </div>

            <!-- Console de Débogage Mobile -->
            <div style="margin-top: 25px;">
                <h4 style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 0.9em;">\uD83D\uDCF1 Console de Débogage Mobile</h4>
                <div id="custom-mobile-console" style="background: #222; color: #fff; padding: 10px; border-radius: 5px; height: 120px; overflow-y: auto;">
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-tab-active').addEventListener('click', () => {
        activeSubTab = 'active';
        renderCustomView();
    });

    document.getElementById('btn-tab-history').addEventListener('click', () => {
        activeSubTab = 'history';
        renderCustomView();
    });

    logToScreen(`Page convois initialisée (Onglet: ${activeSubTab}).`, "info");

    const flashSuccess = sessionStorage.getItem('convoy_flash_success');
    const flashError = sessionStorage.getItem('convoy_flash_error');
    if (flashSuccess) {
        showNotification(flashSuccess, false);
        sessionStorage.removeItem('convoy_flash_success');
    } else if (flashError) {
        showNotification(flashError, true);
        sessionStorage.removeItem('convoy_flash_error');
    }

    if (activeSubTab === 'active') {
        loadConvoys();
    } else {
        loadHistory();
    }
}

function renderOriginalView() {
    const targetElement = getTargetElement();
    if (originalContent !== null && targetElement) {
        targetElement.innerHTML = originalContent;
        originalContent = null;
    }
}

// --- RECUPERATION DES CONVOIS EN COURS ---

function loadConvoys() {
    const contentDiv = document.getElementById('main-status-content');
    logToScreen("Obtention d'un token natif Fourmizzz...", "info");

    fetch('/api.php?getToken')
        .then(res => res.json())
        .then(tokenData => {
            const token = typeof tokenData === 'object' ? (tokenData.token || tokenData.id) : String(tokenData);
            return fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_convoys`, {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ p_token: token })
            });
        })
        .then(async (res) => {
            const text = await res.text();
            if (res.status === 200) {
                renderConvoysDashboard(JSON.parse(text));
            } else {
                logToScreen(`Erreur : ${text}`, "error");
                contentDiv.innerHTML = `<div style="background: #fadbd8; border: 1px solid #e74c3c; padding: 15px; border-radius: 6px;">\uD83D\uDEAB <strong>Accès refusé. Token invalide ou joueur non membre.</strong></div>`;
            }
        })
        .catch(err => logToScreen(`Erreur : ${err.message}`, "error"));
}

function renderConvoysDashboard(convoys) {
    const contentDiv = document.getElementById('main-status-content');
    const toSend = convoys.filter(c => c.is_sender);
    const toReceive = convoys.filter(c => !c.is_sender);

    contentDiv.innerHTML = `
        <h3 style="color: #e67e22; margin-top: 5px;">\uD83D\uDCE4 Convois à envoyer</h3>
        <div style="background: #fdf2e9; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
            ${renderActiveTable(toSend, true)}
        </div>
        <h3 style="color: #27ae60;">\uD83D\uDCE5 Convois à recevoir</h3>
        <div style="background: #eafaf1; padding: 10px; border-radius: 6px;">
            ${renderActiveTable(toReceive, false)}
        </div>
    `;

    contentDiv.querySelectorAll('.btn-send-convoy').forEach(btn => {
        btn.addEventListener('click', function() {
            const convoyId = this.getAttribute('data-id');
            const targetId = this.getAttribute('data-target-id');
            const amount = this.getAttribute('data-amount');
            
            window.location.href = `commerce.php?ID=${targetId}&auto_convoy_id=${convoyId}&auto_amount=${amount}`;
        });
    });
}

function renderActiveTable(list, isSender) {
    if (list.length === 0) return `<em>${isSender ? '✅ Aucun convoi à envoyer.' : 'Aucun convoi attendu.'}</em>`;
    let html = '<table style="width:100%; border-collapse: collapse; font-size: 12px; background: white;">';
    html += `<tr style="background:${isSender ? '#f39c12' : '#27ae60'}; color:white;"><th style="padding:6px;">Date</th><th style="padding:6px;">Joueur</th><th style="padding:6px;">Montant</th><th style="padding:6px;">Statut</th>${isSender ? '<th style="padding:6px;">Action</th>' : ''}</tr>`;
    list.forEach(c => {
        const target = isSender ? c.to_player_pseudo : c.from_player_pseudo;
        const isFailed = c.status === 'failed';
        const statusBadge = isFailed 
            ? `<span style="background:#e74c3c; color:white; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">⚠️ Échoué</span>`
            : `<span style="background:#f39c12; color:white; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">En attente</span>`;

        html += `<tr style="border-bottom: 1px solid #eee; ${isFailed ? 'background: #fdf2f2;' : ''}">
            <td style="padding:6px;">${c.balance_date}</td>
            <td style="padding:6px;"><strong>${escapeHtml(target)}</strong></td>
            <td style="padding:6px; font-weight:bold;">${c.amount.toLocaleString('fr-FR')}</td>
            <td style="padding:6px;">${statusBadge}</td>
            ${isSender ? `<td style="padding:6px;">
                <button class="btn-send-convoy" 
                        data-id="${c.id}" 
                        data-target-id="${c.to_player_id}" 
                        data-amount="${c.amount}" 
                        style="padding:4px 10px; background:${isFailed ? '#c0392b' : '#e67e22'}; color:white; border:none; border-radius:3px; cursor:pointer; font-weight:bold;">
                    ${isFailed ? '\uD83D\uDD04 Réessayer' : '\uD83D\uDE80 Envoyer'}
                </button>
            </td>` : ''}
        </tr>`;
    });
    return html + '</table>';
}

// --- RECUPERATION DE L'HISTORIQUE ---

function loadHistory() {
    const contentDiv = document.getElementById('main-status-content');
    logToScreen("Chargement de l'historique des convois...", "info");

    fetch('/api.php?getToken')
        .then(res => res.json())
        .then(tokenData => {
            const token = typeof tokenData === 'object' ? (tokenData.token || tokenData.id) : String(tokenData);
            return fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_convoy_history`, {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ p_token: token, p_limit: 30 })
            });
        })
        .then(async (res) => {
            const text = await res.text();
            if (res.status === 200) {
                renderHistoryDashboard(JSON.parse(text));
            } else {
                logToScreen(`Erreur historique : ${text}`, "error");
            }
        })
        .catch(err => logToScreen(`Erreur : ${err.message}`, "error"));
}

function renderHistoryDashboard(historyList) {
    const contentDiv = document.getElementById('main-status-content');
    
    if (historyList.length === 0) {
        contentDiv.innerHTML = `<p style="color:#7f8c8d; font-style:italic;">Aucun convoi complété enregistré pour le moment.</p>`;
        return;
    }

    let html = '<table style="width:100%; border-collapse: collapse; font-size: 12px; background: white; border: 1px solid #eee;">';
    html += `<tr style="background:#34495e; color:white;"><th style="padding:6px;">Date</th><th style="padding:6px;">Type</th><th style="padding:6px;">Partenaire</th><th style="padding:6px;">Montant</th><th style="padding:6px;">Statut</th></tr>`;
    
    historyList.forEach(c => {
        const isSender = c.is_sender;
        const target = isSender ? c.to_player_pseudo : c.from_player_pseudo;
        const typeBadge = isSender 
            ? `<span style="color:#e67e22; font-weight:bold;">\uD83D\uDCE4 Envoyé</span>`
            : `<span style="color:#27ae60; font-weight:bold;">\uD83D\uDCE5 Reçu</span>`;

        html += `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding:6px;">${c.balance_date}</td>
            <td style="padding:6px;">${typeBadge}</td>
            <td style="padding:6px;"><strong>${escapeHtml(target)}</strong></td>
            <td style="padding:6px; font-weight:bold;">${c.amount.toLocaleString('fr-FR')}</td>
            <td style="padding:6px;"><span style="background:#27ae60; color:white; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">✅ Complété</span></td>
        </tr>`;
    });
    
    html += '</table>';
    contentDiv.innerHTML = `<h3 style="color:#34495e; margin-top:5px;">\uD83D\uDCDC Historique récent des convois</h3>${html}`;
}

// --- AUTOMATISATION SUR LA PAGE COMMERCE.PHP ---

function handleCommercePageAutomation() {
    const urlParams = new URLSearchParams(window.location.search);
    const autoConvoyId = urlParams.get('auto_convoy_id');
    const autoAmount = urlParams.get('auto_amount');

    if (!autoConvoyId || !autoAmount) return;

    const matInput = document.getElementById('input_nbMateriaux');
    const submitBtn = document.querySelector('input[type="submit"][name="convoi"]');

    if (matInput && submitBtn) {
        matInput.value = autoAmount;

        matInput.dispatchEvent(new Event('input', { bubbles: true }));
        matInput.dispatchEvent(new Event('change', { bubbles: true }));
        matInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));

        setTimeout(() => {
            submitBtn.click();
        }, 150);
    }
}

function handleCommercePostCheck() {
    const pendingConvoyId = sessionStorage.getItem('pending_auto_convoy_id');
    if (!pendingConvoyId) return;

    const okElement = document.querySelector('.verificationOK');

    if (okElement && (okElement.textContent.includes('Votre convoi est en piste') || okElement.textContent.includes('piste'))) {
        sessionStorage.removeItem('pending_auto_convoy_id');

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
                    body: JSON.stringify({ p_convoy_id: parseInt(pendingConvoyId), p_token: token })
                });
            })
            .then(() => {
                sessionStorage.setItem('convoy_flash_success', '✅ Convoi envoyé avec succès !');
                window.location.href = 'alliance.php#custom';
            })
            .catch(() => {
                sessionStorage.setItem('convoy_flash_success', '⚠️ Convoi parti mais erreur BDD.');
                window.location.href = 'alliance.php#custom';
            });
    } else {
        sessionStorage.removeItem('pending_auto_convoy_id');

        fetch('/api.php?getToken')
            .then(res => res.json())
            .then(tokenData => {
                const token = typeof tokenData === 'object' ? (tokenData.token || tokenData.id) : String(tokenData);
                return fetch(`${SUPABASE_URL}/rest/v1/rpc/fail_convoy`, {
                    method: "POST",
                    headers: { 
                        "apikey": SUPABASE_ANON_KEY, 
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({ p_convoy_id: parseInt(pendingConvoyId), p_token: token })
                });
            })
            .then(() => {
                sessionStorage.setItem('convoy_flash_error', '❌ Échec d\'envoi : Ressources ou capacité insuffisante.');
                window.location.href = 'alliance.php#custom';
            })
            .catch(() => {
                sessionStorage.setItem('convoy_flash_error', '❌ Échec du convoi en jeu.');
                window.location.href = 'alliance.php#custom';
            });
    }
}

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])) : '';
}

// Initialisation globale
if (window.location.pathname.includes('commerce.php')) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('auto_convoy_id')) {
        sessionStorage.setItem('pending_auto_convoy_id', urlParams.get('auto_convoy_id'));
        handleCommercePageAutomation();
    } else if (sessionStorage.getItem('pending_auto_convoy_id')) {
        handleCommercePostCheck();
    }
} else {
    initMenu();
    checkViewMode();
}
