// --- ÉTAT GLOBAL ---
let activeTab = 'convoys';
let currentUserAdminInfo = { isAdmin: false, isSuperAdmin: false, role: 'member', pseudo: '', group_id: 0, dette: 0 };
let selectedGroupId = null;
let chatSelectedGroupId = null;

// --- INITIALISATION ---
window.onload = () => {
    const savedSessionToken = localStorage.getItem('alliance_session_token');
    if (savedSessionToken) checkSessionAndLoad();
    else logout();
};

// --- UTILITAIRES ---
function formatDateFR(dateStr) {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

function escapeHtml(str) { return str ? String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])) : ''; }

function showToast(title, message) {
    const toast = document.getElementById('retro-toast');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-msg').innerText = message;
    toast.classList.remove('translate-y-[-150%]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-150%]', 'opacity-0');
    }, 3500);
}

function openRetroModal(title, contentHtml, confirmText, confirmClass, onConfirm) {
    const modal = document.getElementById('retro-modal');
    const contentDiv = document.getElementById('retro-modal-content');
    contentDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4 border-b-2 border-retro-slate pb-2">
            <h3 class="font-shrikhand text-2xl text-retro-slate m-0">${title}</h3>
            <button onclick="closeRetroModal()" class="text-retro-slate hover:text-retro-coral text-xl transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="mb-6 font-outfit text-retro-slate">${contentHtml}</div>
        <div class="flex justify-end gap-3">
            <button class="btn-action bg-white text-retro-slate" onclick="closeRetroModal()">Annuler</button>
            <button class="btn-action ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
        </div>
    `;
    document.getElementById('modal-confirm-btn').onclick = () => { onConfirm(); closeRetroModal(); };
    modal.classList.remove('opacity-0', 'pointer-events-none');
    contentDiv.classList.remove('scale-95');
}

function closeRetroModal() {
    const modal = document.getElementById('retro-modal');
    const contentDiv = document.getElementById('retro-modal-content');
    modal.classList.add('opacity-0', 'pointer-events-none');
    contentDiv.classList.add('scale-95');
}

// --- AUTHENTIFICATION ---
function cleanTokenInput(rawInput) {
    if (!rawInput) return '';
    let cleaned = rawInput.trim();
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        try { const parsed = JSON.parse(cleaned); if (parsed.Token) return parsed.Token.trim(); if (parsed.token) return parsed.token.trim(); } catch (e) {}
    }
    const jsonMatch = cleaned.match(/"Token"\s*:\s*"([^"]+)"/i);
    if (jsonMatch && jsonMatch[1]) return jsonMatch[1].trim();
    return cleaned.replace(/^["'\[\s]+\vert{}["'\]\s]+$/g, '');
}

async function handleAuth() {
    const rawInput = document.getElementById('token-input').value;
    const cleanedToken = cleanTokenInput(rawInput);
    document.getElementById('token-input').value = cleanedToken;
    if (!cleanedToken) return showToast("Erreur", "Veuillez saisir un token valide.");
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_with_fourmizzz_token`, {
            method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_fourmizzz_token: cleanedToken })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Token invalide.");
        localStorage.setItem('alliance_session_token', data[0].session_token);
        currentUserAdminInfo.pseudo = data[0].pseudo;
        showToast("Accès Autorisé", "Connexion au bureau central réussie.");
        checkSessionAndLoad();
    } catch (err) { showToast("Échec", "Connexion échouée : " + err.message); }
}

function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
}

function logout() {
    localStorage.removeItem('alliance_session_token');
    document.getElementById('token-input').value = '';
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
}

async function checkSessionAndLoad() {
    const sessionToken = localStorage.getItem('alliance_session_token');
    if (!sessionToken) return logout();
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_is_admin`, {
            method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_session_token: sessionToken })
        });
        if (!res.ok) return logout();
        const data = await res.json();
        if (data && data.length > 0) {
            const userRole = data[0].role || (data[0].is_superadmin ? 'superadmin' : (data[0].is_admin ? 'admin' : 'member'));
            currentUserAdminInfo = { 
                role: userRole, isAdmin: ['superadmin', 'admin', 'chef_de_rang'].includes(userRole),
                isSuperAdmin: userRole === 'superadmin', pseudo: data[0].pseudo || currentUserAdminInfo.pseudo,
                group_id: data[0].group_id, dette: data[0].dette || 0
            };
            const canSeeAdminTab = ['superadmin', 'admin', 'chef_de_rang'].includes(userRole);
            document.getElementById('tab-admin-btn').style.display = canSeeAdminTab ? 'inline-block' : 'none';
            showDashboard();
            renderTabContent();
        } else { logout(); }
    } catch (e) { logout(); }
}

// --- NAVIGATION ---
async function switchTab(tab) {
    activeTab = tab;
    document.getElementById('tab-convoys-btn').className = `tab-btn ${tab === 'convoys' ? 'active' : ''}`;
    document.getElementById('tab-group-btn').className = `tab-btn ${tab === 'group' ? 'group-active' : ''}`;
    document.getElementById('tab-perfo-btn').className = `tab-btn ${tab === 'perfo' ? 'perfo-active' : ''}`;
    document.getElementById('tab-map-btn').className = `tab-btn ${tab === 'map' ? 'map-active' : ''}`;
    document.getElementById('tab-project-btn').className = `tab-btn ${tab === 'project' ? 'active' : ''}`;
    document.getElementById('tab-spy-btn').className = `tab-btn ${tab === 'spy' ? 'spy-active' : ''}`;
    document.getElementById('tab-admin-btn').className = `tab-btn ${tab === 'admin' ? 'admin-active' : ''}`;
    
    if (window.chatInterval) { clearInterval(window.chatInterval); window.chatInterval = null; }
    await checkSessionAndLoad();
}

async function renderTabContent() {
    const sessionToken = localStorage.getItem('alliance_session_token');
    if (!sessionToken) return logout();
    const contentDiv = document.getElementById('content-area');
    contentDiv.innerHTML = `<div class="flex justify-center p-12"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-retro-coral"></i></div>`;

    if (activeTab === 'admin') { loadAdminPanel(); return; }
    if (activeTab === 'group') { loadGroupTabWrapper(); return; }
    if (activeTab === 'perfo') { loadPerfoData(); return; }
    if (activeTab === 'map') { loadMapTab(); return; }
    if (activeTab === 'project') { loadProjectTab(); return; }
    if (activeTab === 'spy') { loadSpyTab(); return; }
    if (activeTab === 'convoys') { loadConvoysTab(); return; }
}
