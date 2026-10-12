const SUPABASE_URL = "https://dwtpxurffahnbwekmtjw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ctcgp3OXPzErZw879wL1eg_jWtgqgSe";
const ADMIN_PSEUDO = "stroke";
alert('test');
let originalContent = null;
let currentPlayer = null;
let deviceUuid = getOrCreateDeviceUuid();

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

function getOrCreateDeviceUuid() {
    let uuid = localStorage.getItem("fourmizzz_device_uuid");
    if (!uuid) {
        uuid = 'device_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem("fourmizzz_device_uuid", uuid);
    }
    return uuid;
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
    const isAdmin = currentPlayer && currentPlayer.toLowerCase() === ADMIN_PSEUDO;

    const navTabsHtml = `
        <div style="display: flex; gap: 10px; border-bottom: 2px solid #ddd; margin-bottom: 15px;">
            <button id="tab-btn-convoys" style="padding: 8px 16px; border: none; background: #3498db; color: white; border-radius: 5px 5px 0 0; cursor: pointer; font-weight: bold;">
                📦 Convois
            </button>
            ${isAdmin ? `
            <button id="tab-btn-admin" style="padding: 8px 16px; border: none; background: #95a5a6; color: white; border-radius: 5px 5px 0 0; cursor: pointer; font-weight: bold;">
                ⚙️ Administration
            </button>` : ''}
        </div>
    `;

    targetElement.innerHTML = `
        <div id="custom-page-container" style="padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); font-family: sans-serif; color: #333;">
            ${navTabsHtml}
            <div id="tab-content-container"></div>

            <!-- Console de Débogage Mobile -->
            <div style="margin-top: 25px;">
                <h4 style="margin: 0 0 5px 0; color: #7f8c8d; font-size: 0.9em;">📱 Console de Débogage Mobile</h4>
                <div id="custom-mobile-console" style="background: #222; color: #fff; padding: 10px; border-radius: 5px; height: 130px; overflow-y: auto;">
                </div>
            </div>
        </div>
    `;

    logToScreen(`Page chargée. Joueur : "${currentPlayer}" | Admin : ${isAdmin ? 'OUI' : 'NON'}`, "info");

    document.getElementById('tab-btn-convoys').addEventListener('click', () => switchTab('convoys'));
    if (isAdmin) {
        document.getElementById('tab-btn-admin').addEventListener('click', () => switchTab('admin'));
    }

    switchTab('convoys');
}

function switchTab(tabName) {
    const convoysBtn = document.getElementById('tab-btn-convoys');
    const adminBtn = document.getElementById('tab-btn-admin');
    const container = document.getElementById('tab-content-container');

    if (tabName === 'convoys') {
        if (convoysBtn) convoysBtn.style.background = '#3498db';
        if (adminBtn) adminBtn.style.background = '#95a5a6';
        container.innerHTML = '<div id="main-status-content">Vérification des convois...</div>';
        checkDeviceAndLoadData();
    } else if (tabName === 'admin') {
        if (convoysBtn) convoysBtn.style.background = '#95a5a6';
        if (adminBtn) adminBtn.style.background = '#e74c3c';
        container.innerHTML = '<div id="admin-status-content">Chargement du panneau admin...</div>';
        loadAdminPanel();
    }
}

function renderOriginalView() {
    const targetElement = getTargetElement();
    if (originalContent !== null && targetElement) {
        targetElement.innerHTML = originalContent;
        originalContent = null;
    }
}

// --- CONVOIS ---

function checkDeviceAndLoadData() {
    const contentDiv = document.getElementById('main-status-content');
    logToScreen("Vérification accès convois...", "info");

    fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_convoys`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_pseudo: currentPlayer, p_device_uuid: deviceUuid })
    })
    .then(async (res) => {
        const text = await res.text();
        logToScreen(`RPC get_my_convoys (HTTP ${res.status})`, res.status === 200 ? "success" : "warn");

        if (res.status === 200) {
            renderConvoysDashboard(JSON.parse(text));
        } else {
            if (text.includes("Device not registered")) {
                renderDeviceRegistrationForm();
            } else if (text.includes("pending_admin")) {
                contentDiv.innerHTML = `<div style="background: #fef9e7; border: 1px solid #f39c12; padding: 15px; border-radius: 6px;">⏳ <strong>Appareil en attente de validation par l'admin.</strong></div>`;
            } else {
                contentDiv.innerHTML = `<div style="background: #fadbd8; border: 1px solid #e74c3c; padding: 15px; border-radius: 6px;">🚫 <strong>Accès refusé.</strong></div>`;
            }
        }
    })
    .catch(err => {
        logToScreen(`Erreur réseau convois : ${err.message}`, "error");
    });
}

function renderDeviceRegistrationForm() {
    const contentDiv = document.getElementById('main-status-content');
    contentDiv.innerHTML = `
        <div style="background: #ebf5fb; border: 1px solid #3498db; padding: 15px; border-radius: 6px;">
            <h3 style="margin-top:0;">📱 Enregistrer cet appareil</h3>
            <input type="text" id="device-label-input" placeholder="ex: PC Maison, Smartphone..." style="padding: 8px; width: 220px; margin-bottom: 10px;">
            <br>
            <button id="register-device-btn" style="padding: 8px 15px; background: #2980b9; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Demander la validation
            </button>
        </div>
    `;
    document.getElementById('register-device-btn').addEventListener('click', function() {
        const label = document.getElementById('device-label-input').value.trim() || 'Appareil Inconnu';
        registerNewDevice(label);
    });
}

function registerNewDevice(label) {
    logToScreen("Demande d'enregistrement d'appareil...", "info");

    fetch(`${SUPABASE_URL}/rest/v1/rpc/register_device`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_pseudo: currentPlayer, p_device_uuid: deviceUuid, p_device_label: label })
    })
    .then(res => {
        logToScreen(`Réponse enregistrement (HTTP ${res.status})`, res.status === 200 ? "success" : "error");
        if (res.status === 200) checkDeviceAndLoadData();
    })
    .catch(err => {
        logToScreen(`Erreur enregistrement : ${err.message}`, "error");
    });
}

function renderConvoysDashboard(convoys) {
    const contentDiv = document.getElementById('main-status-content');
    const toSend = convoys.filter(c => c.is_sender);
    const toReceive = convoys.filter(c => !c.is_sender);

    contentDiv.innerHTML = `
        <h3 style="color: #e67e22;">📤 Convois à envoyer</h3>
        <div style="background: #fdf2e9; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
            ${renderTable(toSend, true)}
        </div>
        <h3 style="color: #27ae60;">📥 Convois à recevoir</h3>
        <div style="background: #eafaf1; padding: 10px; border-radius: 6px;">
            ${renderTable(toReceive, false)}
        </div>
    `;

    contentDiv.querySelectorAll('.btn-complete-convoy').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            fetch(`${SUPABASE_URL}/rest/v1/rpc/complete_convoy`, {
                method: "POST",
                headers: { 
                    "apikey": SUPABASE_ANON_KEY, 
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ p_convoy_id: id, p_pseudo: currentPlayer, p_device_uuid: deviceUuid })
            })
            .then(() => checkDeviceAndLoadData())
            .catch(err => logToScreen(`Erreur validation convoi : ${err.message}`, "error"));
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

// --- ADMINISTRATION ---

function loadAdminPanel() {
    const container = document.getElementById('admin-status-content');
    logToScreen("Chargement de la liste des appareils (Admin)...", "info");

    fetch(`${SUPABASE_URL}/rest/v1/rpc/get_admin_devices_list`, {
        method: "POST",
        headers: { 
            "apikey": SUPABASE_ANON_KEY, 
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ p_admin_pseudo: currentPlayer, p_admin_uuid: deviceUuid })
    })
    .then(async (res) => {
        const text = await res.text();
        logToScreen(`RPC get_admin_devices_list (HTTP ${res.status})`, res.status === 200 ? "success" : "error");
        if (res.status === 200) {
            renderAdminTable(JSON.parse(text));
        } else {
            container.innerHTML = `<div style="color:red; font-weight:bold;">Erreur de chargement des données admin. Consulter les logs ci-dessous.</div>`;
        }
    })
    .catch(err => {
        logToScreen(`Erreur chargement admin : ${err.message}`, "error");
    });
}

function renderAdminTable(devices) {
    const container = document.getElementById('admin-status-content');
    
    const pending = devices.filter(d => d.device_status === 'pending_admin');
    const active = devices.filter(d => d.device_status !== 'pending_admin');

    let html = `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #d35400;">⏳ Demandes en attente (${pending.length})</h3>
            ${renderAdminSubTable(pending, true)}
        </div>
        <div>
            <h3 style="color: #2c3e50;">📱 Appareils Enregistrés (${active.length})</h3>
            ${renderAdminSubTable(active, false)}
        </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.admin-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const deviceId = this.getAttribute('data-device-id');
            const playerId = this.getAttribute('data-player-id');
            executeAdminAction(action, deviceId, playerId);
        });
    });
}

function renderAdminSubTable(list, isPending) {
    if (list.length === 0) return '<em>Aucun appareil.</em>';

    let html = '<table style="width:100%; border-collapse: collapse; font-size: 11px; background: white; border: 1px solid #ddd;">';
    html += '<tr style="background:#34495e; color:white;"><th style="padding:6px;">Joueur</th><th style="padding:6px;">Appareil</th><th style="padding:6px;">Statut</th><th style="padding:6px;">Actions</th></tr>';

    list.forEach(d => {
        let statusBadge = `<span style="color:#f39c12; font-weight:bold;">En attente</span>`;
        if (d.device_status === 'validated') statusBadge = `<span style="color:#27ae60; font-weight:bold;">Validé</span>`;
        if (d.device_status === 'disabled') statusBadge = `<span style="color:#c0392b; font-weight:bold;">Désactivé</span>`;

        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding:6px;"><strong>${escapeHtml(d.player_pseudo)}</strong></td>
                <td style="padding:6px;">${escapeHtml(d.device_label)}</td>
                <td style="padding:6px;">${statusBadge}</td>
                <td style="padding:6px;">
                    ${isPending ? `
                        <button class="admin-action-btn" data-action="validate" data-device-id="${d.device_id}" style="background:#27ae60; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer;">Valider</button>
                        <button class="admin-action-btn" data-action="delete_device" data-device-id="${d.device_id}" style="background:#c0392b; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer;">Refuser</button>
                    ` : `
                        ${d.device_status === 'validated' ? `<button class="admin-action-btn" data-action="disable" data-device-id="${d.device_id}" style="background:#e67e22; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer;">Bloquer</button>` : `<button class="admin-action-btn" data-action="validate" data-device-id="${d.device_id}" style="background:#27ae60; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer;">Débloquer</button>`}
                        <button class="admin-action-btn" data-action="delete_device" data-device-id="${d.device_id}" style="background:#7f8c8d; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer;">Supprimer</button>
                        <button class="admin-action-btn" data-action="delete_all_player_devices" data-player-id="${d.player_id}" style="background:#c0392b; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer;" title="Supprimer tous les appareils de ce joueur">Tout Suppr.</button>
                    `}
                </td>
            </tr>
        `;
    });

    return html + '</table>';
}

function executeAdminAction(action, deviceId, playerId) {
    logToScreen(`Action Admin : ${action}...`, "info");
    fetch(`${SUPABASE_URL}/rest/v1/rpc/manage_player_device`, {
        method: "POST",
        headers: { 
            "apikey": SUPABASE_ANON_KEY, 
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({
            p_admin_pseudo: currentPlayer,
            p_admin_uuid: deviceUuid,
            p_action: action,
            p_target_device_id: deviceId ? parseInt(deviceId) : null,
            p_target_player_id: playerId ? parseInt(playerId) : null
        })
    })
    .then(res => {
        logToScreen(`Réponse action (HTTP ${res.status})`, res.status === 200 ? "success" : "error");
        if (res.status === 200) loadAdminPanel();
    })
    .catch(err => logToScreen(`Erreur action admin : ${err.message}`, "error"));
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

// Fin du script
