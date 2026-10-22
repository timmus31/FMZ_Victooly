let groupSubTab = 'rapport';
let groupFilterMode = 'day'; 
let groupStartDate = null;
let groupEndDate = null;
let perfSortCol = 'end_terrain';
let perfSortAsc = false;
let currentGroupDataCache = null;

function switchGroupSubTab(sub) {
    groupSubTab = sub;
    if (sub !== 'chat' && window.chatInterval) { clearInterval(window.chatInterval); window.chatInterval = null; }
    loadGroupTabWrapper();
}

async function loadGroupTabWrapper() {
    const contentDiv = document.getElementById('content-area');
    contentDiv.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-retro-mint border-2 border-retro-slate rounded-full flex items-center justify-center text-white shadow-retro-sm text-xl"><i class="fa-solid fa-users-viewfinder"></i></div>
            <h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Espace Groupe</h3>
        </div>
        <div class="flex gap-2 mb-6 border-b-4 border-retro-slate pb-4 flex-wrap">
            <button class="btn-action ${groupSubTab === 'rapport' ? 'bg-retro-coral text-white' : 'bg-white'}" onclick="switchGroupSubTab('rapport')"><i class="fa-solid fa-chart-bar"></i> Rapport Stratégique</button>
            <button class="btn-action ${groupSubTab === 'chat' ? 'bg-retro-coral text-white' : 'bg-white'}" onclick="switchGroupSubTab('chat')"><i class="fa-solid fa-comments"></i> Communication</button>
        </div>
        <div id="group-content-area"><div class="flex justify-center p-12"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-retro-coral"></i></div></div>
    `;
    if (groupSubTab === 'rapport') loadGroupConvoys(selectedGroupId); else loadChatTab(chatSelectedGroupId);
}

function computeDateRange() {
    const today = new Date(); const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const formatDate = d => d.toISOString().split('T')[0];
    if (groupFilterMode === '7days') { const start = new Date(); start.setDate(today.getDate() - 6); groupStartDate = formatDate(start); groupEndDate = formatDate(today); }
    else if (groupFilterMode === 'day') { const inputDay = document.getElementById('filter-single-day'); groupStartDate = groupEndDate = inputDay && inputDay.value ? inputDay.value : formatDate(today); }
    else if (groupFilterMode === 'week') {
        const inputWeek = document.getElementById('filter-week-select'); let refDate = new Date();
        if (inputWeek && inputWeek.value) { const parts = inputWeek.value.split('-W'); if (parts.length === 2) refDate = getFirstDayOfWeek(parseInt(parts[0]), parseInt(parts[1])); }
        else { const day = today.getDay() || 7; refDate.setDate(today.getDate() - day + 1); }
        const monday = new Date(refDate); const sunday = new Date(refDate); sunday.setDate(monday.getDate() + 6);
        groupStartDate = formatDate(monday); groupEndDate = formatDate(sunday);
    } else if (groupFilterMode === 'custom') {
        const startInput = document.getElementById('filter-start-date'); const endInput = document.getElementById('filter-end-date');
        groupStartDate = startInput && startInput.value ? startInput.value : formatDate(today); groupEndDate = endInput && endInput.value ? endInput.value : formatDate(today);
    }
}

function getFirstDayOfWeek(year, week) {
    const date = new Date(year, 0, 1 + (week - 1) * 7); const dayOfWeek = date.getDay(); const ISOweekStart = date;
    if (dayOfWeek <= 4) ISOweekStart.setDate(date.getDate() - date.getDay() + 1); else ISOweekStart.setDate(date.getDate() + 8 - date.getDay());
    return ISOweekStart;
}

function togglePerfSort(col) {
    if (perfSortCol === col) perfSortAsc = !perfSortAsc; else { perfSortCol = col; perfSortAsc = (col === 'pseudo'); }
    if (currentGroupDataCache) renderGroupUI(currentGroupDataCache.convoys, currentGroupDataCache.dailyLogs, currentGroupDataCache.playerPerfs, currentGroupDataCache.currentGroupId, currentGroupDataCache.availableGroups);
}

async function loadGroupConvoys(targetGroupId = null) {
    const sessionToken = localStorage.getItem('alliance_session_token');
    try {
        if (targetGroupId !== null) selectedGroupId = parseInt(targetGroupId); else if (selectedGroupId === null) selectedGroupId = currentUserAdminInfo.group_id > 0 ? currentUserAdminInfo.group_id : -1;
        computeDateRange();
        const paramsGlobal = { p_session_token: sessionToken, p_start_date: groupStartDate || null, p_end_date: groupEndDate || null };
        const paramForConvoysAndLogs = selectedGroupId === -1 ? null : selectedGroupId;

        const resConvoys = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_group_convoys`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: sessionToken, p_target_group_id: paramForConvoysAndLogs }) });
        if (!resConvoys.ok) return logout();
        const convoysData = await resConvoys.json();

        const resLogs = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_group_daily_logs`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...paramsGlobal, p_target_group_id: paramForConvoysAndLogs }) });
        const logsData = resLogs.ok ? await resLogs.json() : [];

        const resPerfs = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_group_player_performances_v2`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...paramsGlobal, p_target_group_id: selectedGroupId }) });
        let playerPerfsData = resPerfs.ok ? await resPerfs.json() : [];

        let availableGroups = [];
        const groupsRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_available_groups`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' } });
        if (groupsRes.ok) availableGroups = await groupsRes.json();

        renderGroupUI(convoysData, logsData, playerPerfsData, selectedGroupId, availableGroups);
    } catch (e) { console.error(e); }
}

function renderGroupUI(convoys, dailyLogs, playerPerfs, currentGroupId, availableGroups) {
    currentGroupDataCache = { convoys, dailyLogs, playerPerfs, currentGroupId, availableGroups };
    const contentDiv = document.getElementById('group-content-area') || document.getElementById('content-area');
    
    let options = `<option value="-1" ${currentGroupId === -1 ? 'selected' : ''}>🌐 Tous les groupes (Global)</option>`;
    if (availableGroups && availableGroups.length > 0) options += availableGroups.map(g => `<option value="${g.group_id}" ${g.group_id == currentGroupId ? 'selected' : ''}>Groupe #${g.group_id}</option>`).join('');
    let groupSelectorHtml = `<select class="group-select" onchange="loadGroupConvoys(this.value)">${options}</select>`;

    const todayStr = new Date().toISOString().split('T')[0];
    let dateInputsHtml = '';
    if (groupFilterMode === 'day') dateInputsHtml = `<input type="date" id="filter-single-day" value="${groupStartDate || todayStr}" onchange="loadGroupConvoys()">`;
    else if (groupFilterMode === 'week') dateInputsHtml = `<input type="week" id="filter-week-select" onchange="loadGroupConvoys()">`;
    else if (groupFilterMode === 'custom') dateInputsHtml = `<span class="font-fredoka text-retro-slate font-bold">De</span> <input type="date" id="filter-start-date" value="${groupStartDate || todayStr}"> <span class="font-fredoka text-retro-slate font-bold">à</span> <input type="date" id="filter-end-date" value="${groupEndDate || todayStr}">`;

    let html = `
        <div class="flex items-center justify-between mb-4 mt-2"><h4 class="font-shrikhand text-xl text-retro-slate m-0"><i class="fa-solid fa-chart-bar text-retro-mint mr-2"></i> Statistiques du ${groupSelectorHtml}</h4></div>
        <div class="date-filter-box">
            <strong class="font-shrikhand text-lg text-retro-coral mr-2">📅 Période :</strong>
            <select id="filter-mode-select" onchange="groupFilterMode = this.value; loadGroupConvoys();">
                <option value="7days" ${groupFilterMode === '7days' ? 'selected' : ''}>7 jours glissants</option>
                <option value="day" ${groupFilterMode === 'day' ? 'selected' : ''}>Journée précise</option>
                <option value="week" ${groupFilterMode === 'week' ? 'selected' : ''}>Semaine (Lun - Dim)</option>
                <option value="custom" ${groupFilterMode === 'custom' ? 'selected' : ''}>Personnalisé (De - À)</option>
            </select>
            ${dateInputsHtml}
            ${groupFilterMode === 'custom' ? `<button onclick="loadGroupConvoys()"><i class="fa-solid fa-check"></i> Activer</button>` : ''}
        </div>
        <p class="font-fredoka text-sm text-retro-slate/70 mb-6 font-bold uppercase tracking-wide">Analyse du <span class="text-retro-coral">${formatDateFR(groupStartDate)}</span> au <span class="text-retro-coral">${formatDateFR(groupEndDate)}</span>.</p>
    `;

    if (currentGroupId === -1) {
        if (playerPerfs) playerPerfs = playerPerfs.filter(p => p.group_id > 0);
        if (dailyLogs) dailyLogs = dailyLogs.filter(l => l.group_id > 0);
        if (convoys) convoys = convoys.filter(c => c.group_id > 0);
    }

    let sumStart = 0, sumEnd = 0, sumDiff = 0, sumRes = 0;
    if (playerPerfs && playerPerfs.length > 0) {
        let potCommun = 0, goodStudentsCount = 0; const playerCount = playerPerfs.length;
        playerPerfs.forEach(p => { sumStart += p.start_terrain; sumEnd += p.end_terrain; sumDiff += p.terrain_diff; sumRes += Number(p.resources_generated); p.calc_ratio = (p.ratio !== null) ? Number(p.ratio) : 100; if (p.calc_ratio === 100) goodStudentsCount++; });
        const baseTargetAvg = playerCount > 0 ? (sumRes / playerCount) : 0;
        playerPerfs.forEach(p => { if (p.calc_ratio === 100) p.base_target = baseTargetAvg; else { const penaltyFactor = 0.5 + (p.calc_ratio / 200); p.base_target = baseTargetAvg * penaltyFactor; potCommun += (baseTargetAvg - p.base_target); } });
        const beneficiariesCount = goodStudentsCount > 0 ? goodStudentsCount : playerCount; const bonusPerPlayer = potCommun / beneficiariesCount;
        playerPerfs.forEach(p => { if (goodStudentsCount > 0) p.estimated_quota = Math.round(p.calc_ratio === 100 ? p.base_target + bonusPerPlayer : p.base_target); else p.estimated_quota = Math.round(p.base_target + bonusPerPlayer); });
    } else if (dailyLogs && dailyLogs.length > 0) {
        dailyLogs.forEach(l => { sumDiff += l.terrain_diff; sumRes += Number(l.resources_generated); });
        const startValues = dailyLogs.map(l => l.start_terrain); const endValues = dailyLogs.map(l => l.end_terrain);
        sumStart = Math.min(...startValues.filter(v => v > 0)); sumEnd = Math.max(...endValues);
    }

    const diffFormatted = sumDiff >= 0 ? `+${sumDiff.toLocaleString('fr-FR')}` : sumDiff.toLocaleString('fr-FR');
    const diffColor = sumDiff >= 0 ? '#3aafa9' : '#ff6f61';

    html += `<div class="stats-summary"><div class="stat-card"><div class="val">${sumStart.toLocaleString('fr-FR')}</div><div class="lbl">Terrain Initial</div></div><div class="stat-card"><div class="val">${sumEnd.toLocaleString('fr-FR')}</div><div class="lbl">Terrain Actuel</div></div><div class="stat-card"><div class="val" style="color:${diffColor}; text-shadow: 1px 1px 0 #1d2d44;">${diffFormatted}</div><div class="lbl">Progression</div></div><div class="stat-card"><div class="val" style="color:#f4d03f; text-shadow: 1px 1px 0 #1d2d44;">${sumRes.toLocaleString('fr-FR')}</div><div class="lbl">Ressources Générées</div></div></div>`;

    if (playerPerfs && playerPerfs.length > 0) {
        playerPerfs.sort((a, b) => {
            let valA = a[perfSortCol]; let valB = b[perfSortCol];
            if (perfSortCol === 'resources_generated') { valA = Number(valA); valB = Number(valB); } else { if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase(); }
            if (valA < valB) return perfSortAsc ? -1 : 1; if (valA > valB) return perfSortAsc ? 1 : -1; return 0;
        });
        const getSortIcon = (col) => perfSortCol !== col ? '<i class="fa-solid fa-sort text-retro-cream/30 ml-1"></i>' : perfSortAsc ? '<i class="fa-solid fa-sort-up text-retro-yellow ml-1"></i>' : '<i class="fa-solid fa-sort-down text-retro-yellow ml-1"></i>';
        html += `<h3 class="font-shrikhand text-xl text-retro-slate mt-8 mb-4">👤 Bilan Individuel</h3><div class="table-container"><table><thead><tr><th class="cursor-pointer" onclick="togglePerfSort('pseudo')">Joueur ${getSortIcon('pseudo')}</th><th class="cursor-pointer" onclick="togglePerfSort('start_terrain')">Terrain Initial ${getSortIcon('start_terrain')}</th><th class="cursor-pointer" onclick="togglePerfSort('end_terrain')">Terrain Actuel ${getSortIcon('end_terrain')}</th><th class="cursor-pointer" onclick="togglePerfSort('terrain_diff')">Progression ${getSortIcon('terrain_diff')}</th><th class="cursor-pointer" onclick="togglePerfSort('resources_generated')">Ressources ${getSortIcon('resources_generated')}</th><th class="cursor-pointer" onclick="togglePerfSort('calc_ratio')">Ratio ${getSortIcon('calc_ratio')}</th><th class="cursor-pointer" onclick="togglePerfSort('estimated_quota')">Quota Estimé ${getSortIcon('estimated_quota')}</th></tr></thead><tbody>`;
        playerPerfs.forEach(p => {
            const pDiffText = p.terrain_diff >= 0 ? `+${p.terrain_diff.toLocaleString('fr-FR')}` : p.terrain_diff.toLocaleString('fr-FR');
            const pDiffClass = p.terrain_diff >= 0 ? 'text-retro-mint' : 'text-retro-coral';
            let roleDisplay = ''; if (p.group_role) { let roleName = p.group_role; let icon = '🛡️'; if (p.group_role === 'chasseur') { roleName = 'Chasseur'; icon = '🏹'; } else if (p.group_role === 'passeur_bas') { roleName = 'Passeur bas'; icon = '📉'; } else if (p.group_role === 'passeur_inter') { roleName = `Passeur inter. (Étage ${p.floor_level || '?'})`; icon = '🔄'; } else if (p.group_role === 'grenier') { roleName = 'Grenier'; icon = '🌾'; } roleDisplay = `<br><span class="font-fredoka text-[0.65rem] text-retro-slate/60 font-bold uppercase tracking-widest">${icon} ${roleName}</span>`; }
            const pseudoLink = `<a href="https://s5.fourmizzz.fr/ennemie.php?Attaquer=${p.player_id}&lieu=1" target="_blank" class="text-retro-slate hover:text-retro-coral transition-colors" title="Attaquer ${escapeHtml(p.pseudo)}"><i class="fa-solid fa-crosshairs text-xs opacity-50 mr-1 hover:opacity-100"></i><strong>${escapeHtml(p.pseudo)}</strong></a>`;
            html += `<tr><td class="leading-tight">${pseudoLink}${roleDisplay}</td><td>${p.start_terrain.toLocaleString('fr-FR')} cm²</td><td><strong>${p.end_terrain.toLocaleString('fr-FR')} cm²</strong></td><td><strong class="${pDiffClass} drop-shadow-sm">${pDiffText} cm²</strong></td><td><strong class="text-retro-yellow drop-shadow-sm">${Number(p.resources_generated).toLocaleString('fr-FR')}</strong></td><td><strong class="text-retro-slate/80">${p.calc_ratio}%</strong></td><td><strong class="text-retro-mint-dark drop-shadow-sm">${p.estimated_quota.toLocaleString('fr-FR')}</strong></td></tr>`;
        });
        html += `</tbody></table></div>`;
    }

    html += `<h3 class="font-shrikhand text-xl text-retro-slate mt-8 mb-4">📦 Convois du Groupe</h3>`;
    if (convoys.length === 0) html += `<p class="font-fredoka text-retro-slate/60 italic">Aucun convoi enregistré sur cette période.</p>`;
    else {
        html += `<div class="table-container"><table><thead><tr><th>Date</th>${currentGroupId === -1 ? '<th>Grp</th>' : ''}<th>Expéditeur</th><th>Destinataire</th><th>Montant</th><th>Statut</th></tr></thead><tbody>`;
        convoys.forEach(c => {
            let badge = '<span class="badge badge-pending"><i class="fa-solid fa-spinner fa-spin-pulse"></i> En attente</span>';
            if (c.status === 'completed') badge = '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Complété</span>'; else if (c.status === 'failed') badge = '<span class="badge badge-failed"><i class="fa-solid fa-triangle-exclamation"></i> Échoué</span>'; else if (c.status === 'cancelled') badge = '<span class="badge bg-retro-slate text-white"><i class="fa-solid fa-ban"></i> Annulé</span>';
            let actionBtn = ''; const canManageConvoy = ['superadmin', 'admin'].includes(currentUserAdminInfo.role) || (currentUserAdminInfo.role == 'chef_de_rang' && currentUserAdminInfo.group_id == c.group_id);
            if (canManageConvoy && (c.status === 'pending' || c.status === 'failed')) actionBtn = `<button class="btn-action bg-retro-slate text-white ml-2 text-[0.65rem] py-1 px-2 border-2 border-retro-slate" onclick="openCloseConvoyModal(${c.id}, ${c.amount}, ${c.from_player_id}, '${escapeHtml(c.from_player_pseudo)}', ${c.group_id}, '${c.balance_date}')"><i class="fa-solid fa-ban"></i></button>`;
            html += `<tr><td>${formatDateFR(c.balance_date)}</td>${currentGroupId === -1 ? `<td><strong>#${c.group_id}</strong></td>` : ''}<td><strong>${escapeHtml(c.from_player_pseudo)}</strong></td><td><strong>${escapeHtml(c.to_player_pseudo)}</strong></td><td>${Number(c.amount).toLocaleString('fr-FR')} Ressources</td><td class="flex items-center gap-2">${badge} ${actionBtn}</td></tr>`;
        });
        html += `</tbody></table></div>`;
    }
    contentDiv.innerHTML = html;
}
