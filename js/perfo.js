let perfoFilterMode = 'day', perfoStartDate = '', perfoEndDate = '';
let perfoChartInstance = null, perfoChartMetric = 'total_field', perfoChartLimit = 10;
let perfoSortCol = 'diff', perfoSortAsc = false, currentPerfoDataCache = null;
let perfoAllianceSortCol = 'diff', perfoAllianceSortAsc = false;

function togglePerfoSort(col) { if (perfoSortCol === col) perfoSortAsc = !perfoSortAsc; else { perfoSortCol = col; perfoSortAsc = (col === 'id'); } if (currentPerfoDataCache) renderPerfoUI(currentPerfoDataCache.playersData, currentPerfoDataCache.alliancesData); }
function togglePerfoAllianceSort(col) { if (perfoAllianceSortCol === col) perfoAllianceSortAsc = !perfoAllianceSortAsc; else { perfoAllianceSortCol = col; perfoAllianceSortAsc = false; } if (currentPerfoDataCache && currentPerfoDataCache.alliancesData) renderAlliancesTable(currentPerfoDataCache.alliancesData); }

async function loadPerfoData() {
    const sessionToken = localStorage.getItem('alliance_session_token');
    try {
        const today = new Date(); const formatDate = d => d.toISOString().split('T')[0];
        if (perfoFilterMode === '7days') { const start = new Date(); start.setDate(today.getDate() - 6); perfoStartDate = formatDate(start); perfoEndDate = formatDate(today); }
        else if (perfoFilterMode === 'day') { const inputDay = document.getElementById('perfo-filter-day'); perfoStartDate = perfoEndDate = inputDay && inputDay.value ? inputDay.value : formatDate(today); }
        else if (perfoFilterMode === 'week') {
            const inputWeek = document.getElementById('perfo-filter-week'); let refDate = new Date();
            if (inputWeek && inputWeek.value) { const parts = inputWeek.value.split('-W'); if (parts.length === 2) { const date = new Date(parseInt(parts[0]), 0, 1 + (parseInt(parts[1]) - 1) * 7); const dow = date.getDay(); refDate = date; if (dow <= 4) refDate.setDate(date.getDate() - dow + 1); else refDate.setDate(date.getDate() + 8 - dow); } }
            else { const day = today.getDay() || 7; refDate.setDate(today.getDate() - day + 1); }
            const monday = new Date(refDate); const sunday = new Date(refDate); sunday.setDate(monday.getDate() + 6); perfoStartDate = formatDate(monday); perfoEndDate = formatDate(sunday);
        } else if (perfoFilterMode === 'custom') {
            const startInput = document.getElementById('perfo-filter-start'); const endInput = document.getElementById('perfo-filter-end');
            perfoStartDate = startInput && startInput.value ? startInput.value : formatDate(today); perfoEndDate = endInput && endInput.value ? endInput.value : formatDate(today);
        }

        const resGroups = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_group_player_performances_v2`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: sessionToken, p_start_date: perfoStartDate, p_end_date: perfoEndDate, p_target_group_id: -1 }) });
        const allPlayersPerf = resGroups.ok ? await resGroups.json() : [];

        const resAlliances = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_top_alliances_metrics`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Range': '0-5000' }, body: JSON.stringify({ p_start_date: perfoStartDate + 'T00:00:00Z', p_end_date: perfoEndDate + 'T23:59:59Z', p_metric: perfoChartMetric, p_limit: perfoChartLimit }) });
        const topAlliances = resAlliances.ok ? await resAlliances.json() : [];
        renderPerfoUI(allPlayersPerf, topAlliances);
    } catch (err) { document.getElementById('content-area').innerHTML = `<p class="font-fredoka font-bold text-retro-coral text-center">⚠️ Erreur de chargement.</p>`; }
}

function renderPerfoUI(playersData, alliancesData) {
    currentPerfoDataCache = { playersData, alliancesData }; const contentDiv = document.getElementById('content-area'); const todayStr = new Date().toISOString().split('T')[0];
    const groupStats = {}; let totalDiff = 0, totalRes = 0, totalStart = 0, totalEnd = 0, totalPlayers = 0;
    playersData.forEach(p => { if(p.group_id <= 0) return; if(!groupStats[p.group_id]) groupStats[p.group_id] = { id: p.group_id, start: 0, end: 0, diff: 0, res: 0, players: 0 }; groupStats[p.group_id].start += p.start_terrain; groupStats[p.group_id].end += p.end_terrain; groupStats[p.group_id].diff += p.terrain_diff; groupStats[p.group_id].res += Number(p.resources_generated); groupStats[p.group_id].players += 1; totalStart += p.start_terrain; totalEnd += p.end_terrain; totalDiff += p.terrain_diff; totalRes += Number(p.resources_generated); totalPlayers += 1; });
    Object.values(groupStats).forEach(g => { g.prog_per_player = Math.round(g.diff / g.players); });
    const avgPerPlayer = totalPlayers > 0 ? Math.round(totalEnd / totalPlayers) : 0;
    const sortedGroups = Object.values(groupStats).sort((a, b) => { let valA = a[perfoSortCol]; let valB = b[perfoSortCol]; if (valA < valB) return perfoSortAsc ? -1 : 1; if (valA > valB) return perfoSortAsc ? 1 : -1; return 0; });
    const getSortIcon = (col) => perfoSortCol !== col ? '<i class="fa-solid fa-sort text-retro-cream/30 ml-1"></i>' : perfoSortAsc ? '<i class="fa-solid fa-sort-up text-retro-yellow ml-1"></i>' : '<i class="fa-solid fa-sort-down text-retro-yellow ml-1"></i>';

    let dateInputsHtml = '';
    if (perfoFilterMode === 'day') dateInputsHtml = `<input type="date" id="perfo-filter-day" value="${perfoStartDate || todayStr}" onchange="loadPerfoData()">`;
    else if (perfoFilterMode === 'week') dateInputsHtml = `<input type="week" id="perfo-filter-week" onchange="loadPerfoData()">`;
    else if (perfoFilterMode === 'custom') dateInputsHtml = `<span class="font-fredoka font-bold ml-2">De</span> <input type="date" id="perfo-filter-start" value="${perfoStartDate || todayStr}"> <span class="font-fredoka font-bold">à</span> <input type="date" id="perfo-filter-end" value="${perfoEndDate || todayStr}"> <button onclick="loadPerfoData()"><i class="fa-solid fa-check"></i> Activer</button>`;

    let html = `<div class="flex items-center gap-3 mb-6"><div class="w-12 h-12 bg-retro-coral border-2 border-retro-slate rounded-full flex items-center justify-center text-white shadow-retro-sm text-xl"><i class="fa-solid fa-chart-pie"></i></div><h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Rapport de Performances</h3></div><div class="date-filter-box mb-6"><strong class="font-shrikhand text-lg text-retro-coral mr-2">📅 Période :</strong><select id="perfo-filter-select" onchange="perfoFilterMode = this.value; loadPerfoData();"><option value="7days" ${perfoFilterMode === '7days' ? 'selected' : ''}>7 derniers jours</option><option value="day" ${perfoFilterMode === 'day' ? 'selected' : ''}>Journée précise</option><option value="week" ${perfoFilterMode === 'week' ? 'selected' : ''}>Semaine (Lun - Dim)</option><option value="custom" ${perfoFilterMode === 'custom' ? 'selected' : ''}>Personnalisé (De - À)</option></select>${dateInputsHtml}</div><div class="stats-summary mb-8 flex-wrap"><div class="stat-card"><div class="val">${totalStart.toLocaleString('fr-FR')}</div><div class="lbl">Terrain Initial</div></div><div class="stat-card"><div class="val">${totalEnd.toLocaleString('fr-FR')}</div><div class="lbl">Terrain Actuel</div></div><div class="stat-card"><div class="val" style="color:${totalDiff >= 0 ? '#3aafa9' : '#ff6f61'}; text-shadow: 1px 1px 0 #1d2d44;">${totalDiff >= 0 ? '+' : ''}${totalDiff.toLocaleString('fr-FR')}</div><div class="lbl">Progression</div></div><div class="stat-card"><div class="val" style="color:#8ba888; text-shadow: 1px 1px 0 #1d2d44;">${avgPerPlayer.toLocaleString('fr-FR')}</div><div class="lbl">Moy. par Joueur</div></div><div class="stat-card"><div class="val" style="color:#f4d03f; text-shadow: 1px 1px 0 #1d2d44;">${totalRes.toLocaleString('fr-FR')}</div><div class="lbl">Ressources Générées</div></div></div><h3 class="font-shrikhand text-xl text-retro-slate mb-4">🏆 Podium des Groupes</h3><div class="table-container mb-8"><table><thead><tr><th class="cursor-pointer" onclick="togglePerfoSort('id')">Groupe ${getSortIcon('id')}</th><th class="cursor-pointer text-center" onclick="togglePerfoSort('players')">Effectif ${getSortIcon('players')}</th><th class="cursor-pointer text-center" onclick="togglePerfoSort('start')">Terrain Initial ${getSortIcon('start')}</th><th class="cursor-pointer text-center" onclick="togglePerfoSort('end')">Terrain Actuel ${getSortIcon('end')}</th><th class="cursor-pointer text-center" onclick="togglePerfoSort('diff')">Progression ${getSortIcon('diff')}</th><th class="cursor-pointer text-center" onclick="togglePerfoSort('prog_per_player')">Prog par joueur ${getSortIcon('prog_per_player')}</th><th class="cursor-pointer text-center" onclick="togglePerfoSort('res')">Ressources ${getSortIcon('res')}</th></tr></thead><tbody>`;

    sortedGroups.forEach((g, idx) => {
        let medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
        html += `<tr><td class="font-bold text-retro-slate">${medal} Groupe ${g.id}</td><td class="text-center">${g.players} <i class="fa-solid fa-user text-xs opacity-50"></i></td><td class="text-center">${g.start.toLocaleString('fr-FR')} cm²</td><td class="text-center font-bold">${g.end.toLocaleString('fr-FR')} cm²</td><td class="text-center font-bold ${g.diff >= 0 ? 'text-retro-mint' : 'text-retro-coral'}">${g.diff >= 0 ? '+' : ''}${g.diff.toLocaleString('fr-FR')} cm²</td><td class="text-center font-bold ${g.prog_per_player >= 0 ? 'text-retro-mint' : 'text-retro-coral'}">${g.prog_per_player >= 0 ? '+' : ''}${g.prog_per_player.toLocaleString('fr-FR')} cm²</td><td class="text-center font-bold text-retro-yellow">${g.res.toLocaleString('fr-FR')}</td></tr>`;
    });

    html += `</tbody></table></div><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 mt-8"><h3 class="font-shrikhand text-xl text-retro-slate m-0">🌍 Comparateur d'Alliances</h3><div class="flex items-center gap-2 flex-wrap"><select id="perfo-chart-limit" class="bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer shadow-retro-sm m-0 w-auto" onchange="perfoChartLimit = parseInt(this.value); loadPerfoData();"><option value="10" ${perfoChartLimit === 10 ? 'selected' : ''}>Top 10</option><option value="5" ${perfoChartLimit === 5 ? 'selected' : ''}>Top 5</option><option value="3" ${perfoChartLimit === 3 ? 'selected' : ''}>Top 3</option><option value="0" ${perfoChartLimit === 0 ? 'selected' : ''}>Seulement "V"</option></select><select id="perfo-chart-metric" class="bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer shadow-retro-sm m-0 w-auto" onchange="perfoChartMetric = this.value; loadPerfoData();"><option value="total_field" ${perfoChartMetric === 'total_field' ? 'selected' : ''}>Terrain Total</option><option value="avg_field" ${perfoChartMetric === 'avg_field' ? 'selected' : ''}>Terrain / Joueur</option><option value="velocity" ${perfoChartMetric === 'velocity' ? 'selected' : ''}>Vélocité (Gain terrain / Jour)</option><option value="players_count" ${perfoChartMetric === 'players_count' ? 'selected' : ''}>Effectifs (Joueurs)</option><option value="avg_build" ${perfoChartMetric === 'avg_build' ? 'selected' : ''}>Score Bâtiments / Joueur</option><option value="avg_tech" ${perfoChartMetric === 'avg_tech' ? 'selected' : ''}>Score Techs / Joueur</option></select></div></div><div class="bg-white border-4 border-retro-slate rounded-2xl p-4 shadow-retro mb-8" id="chart-container"></div><div id="alliances-table-container"></div>`;

    contentDiv.innerHTML = html;
    if (!alliancesData || alliancesData.length <= 0) document.getElementById('chart-container').innerHTML = `<div class="text-center py-8"><i class="fa-solid fa-chart-line text-4xl text-retro-slate/30 mb-3"></i><p class="font-fredoka text-retro-slate/60 font-bold">La base de données historique vient d'être activée.</p><p class="font-outfit text-retro-slate/50 text-sm">Le graphique s'affichera ici dès que nous aurons au moins 2 relevés (d'ici 1 à 2 heures).</p></div>`;
    else { document.getElementById('chart-container').innerHTML = `<canvas id="alliancesChart" width="100%" height="45"></canvas>`; drawAlliancesChart(alliancesData); renderAlliancesTable(alliancesData); }
}

function drawAlliancesChart(data) {
    const ctx = document.getElementById('alliancesChart').getContext('2d');
    const datasetsMap = {}, labelsSet = new Set(), colors = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#8ab17d', '#b5838d', '#ffb703', '#fb8500', '#8ecae6', '#9b5de5'];
    let previousPoint = {}; 

    data.forEach(row => {
        const dateLabel = new Date(row.snapshot_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
        labelsSet.add(dateLabel);
        if (!datasetsMap[row.alliance_tag]) { datasetsMap[row.alliance_tag] = { data: [], tag: row.alliance_tag }; previousPoint[row.alliance_tag] = null; }
        let yValue = null; const players = Math.max(1, Number(row.players_count));
        if (perfoChartMetric === 'total_field') yValue = Number(row.total_field); else if (perfoChartMetric === 'avg_field') yValue = Math.round(Number(row.total_field) / players); else if (perfoChartMetric === 'players_count') yValue = players; else if (perfoChartMetric === 'avg_build') yValue = Math.round(Number(row.total_building_score) / players); else if (perfoChartMetric === 'avg_tech') yValue = Math.round(Number(row.total_technology_score) / players);
        else if (perfoChartMetric === 'velocity') {
            if (previousPoint[row.alliance_tag] !== null) {
                const diffField = Number(row.total_field) - previousPoint[row.alliance_tag].field; const diffHours = (new Date(row.snapshot_at) - new Date(previousPoint[row.alliance_tag].date)) / (1000 * 60 * 60);
                if (diffHours > 0) yValue = Math.round((diffField / diffHours) * 24);
            }
            previousPoint[row.alliance_tag] = { field: Number(row.total_field), date: row.snapshot_at };
        }
        datasetsMap[row.alliance_tag].data.push({ x: dateLabel, y: yValue });
    });

    const labels = Array.from(labelsSet).sort(); let colorIndex = 0; 
    const datasets = Object.values(datasetsMap).map(d => {
        const alignedData = labels.map(l => { const point = d.data.find(pt => pt.x === l); return point && point.y !== null ? point.y : null; });
        const isMyAlliance = d.tag === 'V'; const lineColor = isMyAlliance ? '#1d2d44' : colors[colorIndex % colors.length]; if (!isMyAlliance) colorIndex++;
        return { label: d.tag, data: alignedData, borderColor: lineColor, backgroundColor: lineColor, tension: 0.2, borderWidth: 2, pointRadius: 0, pointHoverRadius: 6, spanGaps: false, order: isMyAlliance ? -1 : 1 };
    });

    if (perfoChartInstance) perfoChartInstance.destroy();
    perfoChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: datasets }, options: { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { tooltip: { enabled: true, itemSort: function(a, b) { return b.raw - a.raw; } }, legend: { position: 'bottom', labels: { font: { family: 'Outfit', weight: 'bold' }, usePointStyle: true } } }, scales: { y: { beginAtZero: false, ticks: { font: { family: 'Outfit' } } }, x: { ticks: { font: { family: 'Outfit' }, maxTicksLimit: 14, maxRotation: 45, minRotation: 45 } } } } });
}

function renderAlliancesTable(data) {
    const container = document.getElementById('alliances-table-container'); if (!container) return;
    const getMetricValue = (row) => { const players = Math.max(1, Number(row.players_count)); if (perfoChartMetric === 'total_field' || perfoChartMetric === 'velocity') return Number(row.total_field); if (perfoChartMetric === 'avg_field') return Math.round(Number(row.total_field) / players); if (perfoChartMetric === 'players_count') return players; if (perfoChartMetric === 'avg_build') return Math.round(Number(row.total_building_score) / players); if (perfoChartMetric === 'avg_tech') return Math.round(Number(row.total_technology_score) / players); return 0; };
    const summaryMap = {};
    data.forEach(row => {
        if (!summaryMap[row.alliance_tag]) summaryMap[row.alliance_tag] = { tag: row.alliance_tag, first_date: row.snapshot_at, last_date: row.snapshot_at, start_val: getMetricValue(row), end_val: getMetricValue(row) };
        else { if (row.snapshot_at < summaryMap[row.alliance_tag].first_date) { summaryMap[row.alliance_tag].first_date = row.snapshot_at; summaryMap[row.alliance_tag].start_val = getMetricValue(row); } if (row.snapshot_at > summaryMap[row.alliance_tag].last_date) { summaryMap[row.alliance_tag].last_date = row.snapshot_at; summaryMap[row.alliance_tag].end_val = getMetricValue(row); } }
    });
    const summaryList = Object.values(summaryMap).map(item => { item.diff = item.end_val - item.start_val; if (perfoChartMetric === 'velocity') { const diffHours = (new Date(item.last_date) - new Date(item.first_date)) / (1000 * 60 * 60); item.diff = diffHours > 0 ? Math.round((item.diff / diffHours) * 24) : 0; } return item; });
    summaryList.sort((a, b) => { let valA = a[perfoAllianceSortCol]; let valB = b[perfoAllianceSortCol]; if (perfoAllianceSortCol === 'tag') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); } if (valA < valB) return perfoAllianceSortAsc ? -1 : 1; if (valA > valB) return perfoAllianceSortAsc ? 1 : -1; return 0; });
    const getSortIcon = (col) => perfoAllianceSortCol !== col ? '<i class="fa-solid fa-sort text-retro-cream/30 ml-1"></i>' : perfoAllianceSortAsc ? '<i class="fa-solid fa-sort-up text-retro-yellow ml-1"></i>' : '<i class="fa-solid fa-sort-down text-retro-yellow ml-1"></i>';

    let colStartName = "Valeur Initiale", colEndName = "Valeur Finale", colDiffName = "Progression", unit = "", diffUnit = "";
    if (perfoChartMetric === 'total_field' || perfoChartMetric === 'avg_field') { unit = " cm²"; diffUnit = " cm²"; } else if (perfoChartMetric === 'players_count') { unit = " j."; diffUnit = " j."; } else if (perfoChartMetric === 'velocity') { colStartName = "Terrain Initial"; colEndName = "Terrain Final"; colDiffName = "Gain Moyen / Jour"; unit = " cm²"; diffUnit = " cm²/j"; }

    let html = `<div class="table-container mt-4"><table><thead><tr><th class="cursor-pointer" onclick="togglePerfoAllianceSort('tag')">Alliance ${getSortIcon('tag')}</th><th class="cursor-pointer text-center" onclick="togglePerfoAllianceSort('start_val')">${colStartName} ${getSortIcon('start_val')}</th><th class="cursor-pointer text-center" onclick="togglePerfoAllianceSort('end_val')">${colEndName} ${getSortIcon('end_val')}</th><th class="cursor-pointer text-center" onclick="togglePerfoAllianceSort('diff')">${colDiffName} ${getSortIcon('diff')}</th></tr></thead><tbody>`;
    summaryList.forEach(item => { const diffClass = item.diff >= 0 ? 'text-retro-mint' : 'text-retro-coral'; const tagDisplay = item.tag === 'V' ? `<strong class="text-retro-coral bg-retro-cream px-2 py-1 rounded border-2 border-retro-slate shadow-retro-sm">${item.tag}</strong>` : `<strong>${item.tag}</strong>`; html += `<tr><td>${tagDisplay}</td><td class="text-center">${item.start_val.toLocaleString('fr-FR')}${unit}</td><td class="text-center font-bold">${item.end_val.toLocaleString('fr-FR')}${unit}</td><td class="text-center font-bold ${diffClass}">${item.diff >= 0 ? '+' : ''}${item.diff.toLocaleString('fr-FR')}${diffUnit}</td></tr>`; });
    container.innerHTML = html + `</tbody></table></div>`;
}
