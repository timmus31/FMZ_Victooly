let adminSortCol = 'group_id', adminSortAsc = true, currentAdminDataCache = null;

function toggleAdminSort(col) { if (adminSortCol === col) adminSortAsc = !adminSortAsc; else { adminSortCol = col; adminSortAsc = true; } if (currentAdminDataCache) renderAdminTable(currentAdminDataCache); }

async function loadAdminPanel() {
    const sessionToken = localStorage.getItem('alliance_session_token'); const contentDiv = document.getElementById('content-area');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_alliance_admin_list`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: sessionToken }) });
        if (!res.ok) { contentDiv.innerHTML = `<p class="font-fredoka font-bold text-retro-coral text-center bg-white p-6 rounded-2xl border-4 border-retro-slate shadow-retro">⚠️ Accès refusé à la console d'administration : ${escapeHtml((await res.json()).message)}</p>`; return; }
        const data = await res.json();
        if (data && data.length > 0) currentUserAdminInfo = { ...currentUserAdminInfo, role: data[0].current_user_role, group_id: data[0].current_user_group_id };
        renderAdminTable(data);
    } catch (e) { contentDiv.innerHTML = `<p class="font-fredoka font-bold text-retro-coral text-center">⚠️ Erreur réseau.</p>`; }
}

function renderAdminTable(members) {
    currentAdminDataCache = members; const contentDiv = document.getElementById('content-area'); const myRole = currentUserAdminInfo.role; const myGroupId = currentUserAdminInfo.group_id;
    let sortedMembers = [...members];
    sortedMembers.sort((a, b) => {
        let valA = a[adminSortCol], valB = b[adminSortCol];
        if (adminSortCol === 'role') { const weights = { 'superadmin': 1, 'admin': 2, 'chef_de_rang': 3, 'member': 4 }; valA = weights[a.role] || 5; valB = weights[b.role] || 5; }
        else if (adminSortCol === 'group_id') { valA = a.group_id === 0 ? 999 : a.group_id; valB = b.group_id === 0 ? 999 : b.group_id; }
        if (valA === null || valA === undefined) valA = adminSortAsc ? 99999 : -99999; if (valB === null || valB === undefined) valB = adminSortAsc ? 99999 : -99999;
        if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return adminSortAsc ? -1 : 1; if (valA > valB) return adminSortAsc ? 1 : -1; return 0;
    });

    const getSortIcon = (col) => adminSortCol !== col ? '<i class="fa-solid fa-sort text-retro-slate/30 ml-1"></i>' : adminSortAsc ? '<i class="fa-solid fa-sort-up text-retro-coral ml-1"></i>' : '<i class="fa-solid fa-sort-down text-retro-coral ml-1"></i>';
    const buildGroupOptions = (currentGroup) => { 
        let opts = `<option value="0" ${currentGroup === 0 ? 'selected' : ''}>⚪ Hors-chaîne</option>`; 
        if (myRole === 'superadmin' || myRole === 'admin') { for (let g = 1; g <= 10; g++) opts += `<option value="${g}" ${currentGroup === g ? 'selected' : ''}>🔵 Groupe #${g}</option>`; } 
        else if (myRole === 'chef_de_rang' && myGroupId > 0) opts += `<option value="${myGroupId}" ${currentGroup === myGroupId ? 'selected' : ''}>🔵 Groupe #${myGroupId}</option>`;
        return opts; 
    };

    let html = `<div class="flex items-center gap-3 mb-2 mt-4"><div class="w-12 h-12 bg-retro-yellow border-2 border-retro-slate rounded-full flex items-center justify-center text-retro-slate shadow-retro-sm text-xl"><i class="fa-solid fa-gears"></i></div><div class="flex flex-col"><h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Console d'Administration</h3><span class="font-fredoka text-sm font-bold text-retro-coral uppercase tracking-wide">Connecté en tant que : ${myRole}</span></div></div><div class="table-container mt-6"><table><thead><tr><th class="cursor-pointer" onclick="toggleAdminSort('member_pseudo')">Joueur ${getSortIcon('member_pseudo')}</th><th class="cursor-pointer text-center" onclick="toggleAdminSort('group_id')">Groupe ${getSortIcon('group_id')}</th><th class="cursor-pointer text-center" onclick="toggleAdminSort('group_role')">Rôle Groupe ${getSortIcon('group_role')}</th><th class="cursor-pointer text-center" onclick="toggleAdminSort('floor_level')">Étage ${getSortIcon('floor_level')}</th><th class="cursor-pointer text-center" onclick="toggleAdminSort('ratio')">Ratio (%) ${getSortIcon('ratio')}</th><th class="cursor-pointer text-center" onclick="toggleAdminSort('role')">Droits Admin ${getSortIcon('role')}</th></tr></thead><tbody>`;

    sortedMembers.forEach(m => {
        let badge = '<span class="badge badge-member">Membre</span>';
        if (m.role === 'superadmin') badge = '<span class="badge badge-superadmin"><i class="fa-solid fa-crown text-retro-yellow"></i> Super Admin</span>'; else if (m.role === 'admin') badge = '<span class="badge badge-admin"><i class="fa-solid fa-shield"></i> Admin</span>'; else if (m.role === 'chef_de_rang') badge = '<span class="badge badge-chef"><i class="fa-solid fa-star"></i> Chef de rang</span>';
        
        const gRole = m.group_role || 'chasseur'; const showFloor = gRole === 'passeur_inter';
        const canEditGroup = (myRole === 'superadmin' || myRole === 'admin') || (myRole === 'chef_de_rang' && (m.group_id === 0 || m.group_id === myGroupId));
        const groupCell = canEditGroup ? `<select class="group-select" onchange="updatePlayerGroup(${m.player_id}, this.value)">${buildGroupOptions(m.group_id)}</select>` : `<span class="font-fredoka font-bold text-retro-slate/80 text-sm">${m.group_id === 0 ? '⚪ Hors-chaîne' : 'Groupe #' + m.group_id}</span>`;
        const canEditTactics = (myRole === 'superadmin' || myRole === 'admin') || (myRole === 'chef_de_rang' && myGroupId > 0 && myGroupId === m.group_id);
        const tacticsCell = canEditTactics ? `<select id="role-select-${m.player_id}" onchange="updatePlayerTactics(${m.player_id})"><option value="chasseur" ${gRole === 'chasseur' ? 'selected' : ''}>🏹 Chasseur</option><option value="passeur_bas" ${gRole === 'passeur_bas' ? 'selected' : ''}>📉 Passeur bas</option><option value="passeur_inter" ${gRole === 'passeur_inter' ? 'selected' : ''}>🔄 Passeur inter.</option><option value="grenier" ${gRole === 'grenier' ? 'selected' : ''}>🌾 Grenier</option></select>` : `<span class="font-fredoka font-bold text-retro-slate/80 text-sm">${gRole}</span>`;
        const floorCell = canEditTactics ? `<input type="number" id="floor-input-${m.player_id}" value="${m.floor_level !== null ? m.floor_level : ''}" placeholder="Ex: 2" min="1" max="100" style="width: 60px; text-align:center; margin:0; padding:0.4rem; display: ${showFloor ? 'inline-block' : 'none'};" onchange="updatePlayerTactics(${m.player_id})" class="bg-white border-2 border-retro-slate rounded-lg font-outfit outline-none" /><span id="floor-dash-${m.player_id}" style="color:#4a5d73; display: ${showFloor ? 'none' : 'inline'};">-</span>` : `<span class="font-fredoka font-bold text-retro-slate/80 text-sm">${m.floor_level !== null ? m.floor_level : '-'}</span>`;
        const currentRatio = m.ratio !== undefined && m.ratio !== null ? m.ratio : 100;
        const ratioCell = canEditTactics ? `<input type="number" id="ratio-input-${m.player_id}" value="${currentRatio}" min="0" max="100" style="width: 70px; text-align:center; margin:0; padding:0.4rem;" onchange="updatePlayerRatio(${m.player_id})" class="bg-white border-2 border-retro-slate rounded-lg font-bold text-retro-mint-dark outline-none" />` : `<span class="font-fredoka font-bold text-retro-slate/80 text-sm">${currentRatio}%</span>`;

        let adminRoleAction = badge; const canEditAdminRole = (myRole === 'superadmin') || (myRole === 'admin' && m.role !== 'superadmin');
        if (canEditAdminRole) { if (m.role === 'superadmin') adminRoleAction = badge; else adminRoleAction = `<select class="role-select" onchange="updatePlayerAdminRole(${m.player_id}, this.value)"><option value="member" ${m.role === 'member' ? 'selected' : ''}>👤 Membre</option><option value="chef_de_rang" ${m.role === 'chef_de_rang' ? 'selected' : ''}>🎖️ Chef de rang</option><option value="admin" ${m.role === 'admin' ? 'selected' : ''}>🛡️ Admin</option></select>`; }
        html += `<tr><td><strong class="text-retro-slate">${escapeHtml(m.member_pseudo)}</strong></td><td class="text-center">${groupCell}</td><td class="text-center">${tacticsCell}</td><td class="text-center">${floorCell}</td><td class="text-center">${ratioCell}</td><td class="text-center">${adminRoleAction}</td></tr>`;
    });
    contentDiv.innerHTML = html + `</tbody></table></div>`;
}

async function updatePlayerAdminRole(targetPlayerId, newRole) { try { const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_player_admin_role`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: localStorage.getItem('alliance_session_token'), p_target_player_id: parseInt(targetPlayerId), p_new_role: newRole }) }); if (res.ok) { showToast("Mise à jour", "Droits d'administration modifiés."); loadAdminPanel(); } else { alert("❌ Action refusée."); loadAdminPanel(); } } catch (e) { alert("❌ Erreur réseau."); } }
async function updatePlayerTactics(playerId) { const roleSelect = document.getElementById(`role-select-${playerId}`); const floorInput = document.getElementById(`floor-input-${playerId}`); const floorDash = document.getElementById(`floor-dash-${playerId}`); const selectedRole = roleSelect.value; const isInter = selectedRole === 'passeur_inter'; floorInput.style.display = isInter ? 'inline-block' : 'none'; floorDash.style.display = isInter ? 'none' : 'inline'; const floorValue = isInter && floorInput.value !== '' ? parseInt(floorInput.value) : null; try { await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_player_group_role_and_floor`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: localStorage.getItem('alliance_session_token'), p_target_player_id: parseInt(playerId), p_group_role: selectedRole, p_floor_level: floorValue }) }); showToast("Mise à jour", "Nouvelles directives tactiques appliquées."); } catch (e) { alert("❌ Erreur."); } }
async function updatePlayerGroup(targetPlayerId, newGroupId) { try { const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_player_group`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: localStorage.getItem('alliance_session_token'), p_target_player_id: parseInt(targetPlayerId), p_new_group_id: parseInt(newGroupId) }) }); if (res.ok) { showToast("Mise à jour", "Nouveau groupe assigné."); loadAdminPanel(); } else { alert("❌ Action refusée."); loadAdminPanel(); } } catch (e) { alert("❌ Erreur réseau."); } }
async function updatePlayerRatio(playerId) { const input = document.getElementById(`ratio-input-${playerId}`); let newRatio = parseInt(input.value); if (isNaN(newRatio) || newRatio < 0) newRatio = 0; if (newRatio > 100) newRatio = 100; input.value = newRatio; try { const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_player_ratio`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: localStorage.getItem('alliance_session_token'), p_target_player_id: parseInt(playerId), p_ratio: newRatio }) }); if (res.ok) showToast("Mise à jour", `Ratio réglé à ${newRatio}%.`); else { alert("❌ Action refusée."); loadAdminPanel(); } } catch (e) { alert("❌ Erreur réseau."); } }
