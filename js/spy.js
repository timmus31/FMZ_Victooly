let spyPlayersMap = new Map();
let spyAlliancesMap = new Set();
let spyAvailableGroups = [];
let spyActiveGroups = new Set();

let currentSpyChart = null;
let currentSpyData = [];
let currentSpyType = 'joueurs'; // 'joueurs', 'alliances', 'groupes'
let currentSpyStartDate = '';
let currentSpyEndDate = '';
let currentSpyMetric = '';

const SPY_GROUP_COLORS = ['#ff6f61', '#f4d03f', '#3aafa9', '#8ba888', '#e74c3c', '#9b59b6', '#3498db', '#f39c12', '#1abc9c', '#d35400'];

async function loadSpyTab() {
    const contentDiv = document.getElementById('content-area');
    
    // Initialisation : 7 derniers jours par défaut
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    currentSpyEndDate = today.toISOString().split('T')[0];
    currentSpyStartDate = sevenDaysAgo.toISOString().split('T')[0];

    contentDiv.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-retro-slate border-2 border-retro-slate rounded-full flex items-center justify-center text-retro-cream shadow-retro-sm text-xl"><i class="fa-solid fa-user-secret"></i></div>
            <h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Spy & Archives</h3>
        </div>

        <div class="flex gap-2 mb-6 border-b-4 border-retro-slate pb-4 flex-wrap">
            <button id="spy-tab-joueurs-btn" class="btn-action bg-retro-coral text-white" onclick="switchSpySubTab('joueurs')"><i class="fa-solid fa-user-secret"></i> Joueurs</button>
            <button id="spy-tab-alliances-btn" class="btn-action bg-white" onclick="switchSpySubTab('alliances')"><i class="fa-solid fa-shield"></i> Alliances</button>
            <button id="spy-tab-groupes-btn" class="btn-action bg-white" onclick="switchSpySubTab('groupes')"><i class="fa-solid fa-users-viewfinder"></i> Groupes</button>
        </div>

        <!-- Section Joueurs -->
        <div id="spy-tab-joueurs" class="bg-retro-cream border-4 border-retro-slate rounded-2xl p-6 shadow-retro mb-8">
            <h2 class="font-shrikhand text-2xl text-retro-slate mb-4"><i class="fa-solid fa-magnifying-glass text-retro-mint mr-2"></i> Analyser un joueur</h2>
            <div class="flex flex-wrap items-center gap-4">
                <input type="text" id="spy-player-search" list="spy-players-list" class="flex-grow min-w-[200px]" placeholder="Commencez à taper un pseudo..." autocomplete="off">
                <datalist id="spy-players-list"></datalist>
                <button class="btn-manual-ok ml-auto" onclick="loadSpyData('joueurs')"><i class="fa-solid fa-magnifying-glass"></i> Analyser</button>
            </div>
            <p id="spy-player-msg" class="text-xs font-fredoka text-retro-slate/50 font-bold uppercase tracking-wider mt-2"><i class="fa-solid fa-spinner fa-spin"></i> Indexation...</p>
        </div>

        <!-- Section Alliances -->
        <div id="spy-tab-alliances" class="bg-retro-cream border-4 border-retro-slate rounded-2xl p-6 shadow-retro mb-8" style="display: none;">
            <h2 class="font-shrikhand text-2xl text-retro-slate mb-4"><i class="fa-solid fa-magnifying-glass text-[#8e44ad] mr-2"></i> Analyser une alliance</h2>
            <div class="flex flex-wrap items-center gap-4">
                <input type="text" id="spy-alliance-search" list="spy-alliances-list" class="flex-grow min-w-[200px]" placeholder="Tag de l'alliance..." autocomplete="off">
                <datalist id="spy-alliances-list"></datalist>
                <button class="btn-manual-ok ml-auto" style="background-color: #8e44ad;" onclick="loadSpyData('alliances')"><i class="fa-solid fa-magnifying-glass"></i> Analyser</button>
            </div>
            <p id="spy-alliance-msg" class="text-xs font-fredoka text-retro-slate/50 font-bold uppercase tracking-wider mt-2"><i class="fa-solid fa-spinner fa-spin"></i> Indexation...</p>
        </div>

        <!-- Section Groupes -->
        <div id="spy-tab-groupes" class="bg-retro-cream border-4 border-retro-slate rounded-2xl p-6 shadow-retro mb-8" style="display: none;">
            <h2 class="font-shrikhand text-2xl text-retro-slate mb-4"><i class="fa-solid fa-users-viewfinder text-retro-yellow mr-2"></i> Comparer les Groupes</h2>
            
            <div class="mb-5">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-fredoka font-bold text-retro-slate">Sélectionnez les groupes :</span>
                    <button class="text-xs font-bold bg-retro-slate text-white px-3 py-1 rounded-lg hover:bg-retro-coral transition-colors shadow-retro-sm" onclick="toggleAllSpyGroups()"><i class="fa-solid fa-check-double"></i> Tous / Aucun</button>
                </div>
                <div id="spy-groups-bubbles" class="flex flex-wrap gap-3"></div>
            </div>

            <div class="flex flex-wrap items-center gap-4 border-t-2 border-retro-slate/10 pt-4">
                <button class="btn-manual-ok ml-auto" style="background-color: #f4d03f; color:#1d2d44;" onclick="loadSpyData('groupes')"><i class="fa-solid fa-magnifying-glass"></i> Comparer</button>
            </div>
        </div>

        <!-- Conteneur des résultats -->
        <div id="spy-results-container" style="display: none;"></div>
    `;

    const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

    try {
        const [resP, resA, resG] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/rpc/get_history_players`, { method: 'POST', headers }),
            fetch(`${SUPABASE_URL}/rest/v1/rpc/get_history_alliances`, { method: 'POST', headers }),
            fetch(`${SUPABASE_URL}/rest/v1/rpc/get_available_groups`, { method: 'POST', headers })
        ]);

        if (resP.ok) {
            const players = await resP.json();
            const datalistP = document.getElementById('spy-players-list');
            spyPlayersMap.clear();
            players.forEach(p => { spyPlayersMap.set(p.pseudo, p.player_id); datalistP.appendChild(new Option(p.pseudo, p.pseudo)); });
            document.getElementById('spy-player-msg').innerHTML = `<i class="fa-solid fa-check text-retro-mint"></i> ${players.length.toLocaleString()} profils`;
        }

        if (resA.ok) {
            const alliances = await resA.json();
            const datalistA = document.getElementById('spy-alliances-list');
            spyAlliancesMap.clear();
            alliances.forEach(a => { spyAlliancesMap.add(a.tag); datalistA.appendChild(new Option(a.tag, a.tag)); });
            document.getElementById('spy-alliance-msg').innerHTML = `<i class="fa-solid fa-check text-[#8e44ad]"></i> ${alliances.length.toLocaleString()} alliances`;
        }

        if (resG.ok) {
            const grps = await resG.json();
            spyAvailableGroups = grps.filter(g => g.group_id > 0).map(g => g.group_id).sort((a,b) => a-b);
            spyActiveGroups = new Set(spyAvailableGroups);
            renderSpyGroupBubbles();
        }

    } catch (err) {
        showToast("Erreur", "Erreur d'indexation.");
    }
}

function renderSpyGroupBubbles() {
    const container = document.getElementById('spy-groups-bubbles');
    if (!container) return;
    
    container.innerHTML = spyAvailableGroups.map(gid => {
        const isActive = spyActiveGroups.has(gid);
        const color = SPY_GROUP_COLORS[(gid - 1) % SPY_GROUP_COLORS.length];
        const baseStyle = `border: 3px solid ${color};`;
        const activeStyle = isActive 
            ? `background-color: ${color}; color: white; transform: translateY(-3px); box-shadow: 2px 4px 0px 0px #1d2d44;` 
            : `background-color: #ffffff; color: #1d2d44; box-shadow: inset 2px 2px 0px rgba(29, 45, 68, 0.05); opacity: 0.6;`;
            
        return `<button onclick="toggleSpyGroup(${gid})" class="font-shrikhand px-4 py-2 rounded-2xl transition-all duration-200 cursor-pointer select-none text-sm" style="${baseStyle} ${activeStyle}">G${gid}</button>`;
    }).join('');
}

function toggleSpyGroup(gid) {
    if (spyActiveGroups.has(gid)) spyActiveGroups.delete(gid);
    else spyActiveGroups.add(gid);
    renderSpyGroupBubbles();
}

function toggleAllSpyGroups() {
    if (spyActiveGroups.size === spyAvailableGroups.length) spyActiveGroups.clear();
    else spyAvailableGroups.forEach(gid => spyActiveGroups.add(gid));
    renderSpyGroupBubbles();
}

function switchSpySubTab(tabName) {
    document.getElementById('spy-tab-joueurs').style.display = tabName === 'joueurs' ? 'block' : 'none';
    document.getElementById('spy-tab-alliances').style.display = tabName === 'alliances' ? 'block' : 'none';
    document.getElementById('spy-tab-groupes').style.display = tabName === 'groupes' ? 'block' : 'none';
    
    document.getElementById('spy-tab-joueurs-btn').className = `btn-action ${tabName === 'joueurs' ? 'bg-retro-coral text-white' : 'bg-white'}`;
    document.getElementById('spy-tab-alliances-btn').className = `btn-action ${tabName === 'alliances' ? 'bg-retro-coral text-white' : 'bg-white'}`;
    document.getElementById('spy-tab-groupes-btn').className = `btn-action ${tabName === 'groupes' ? 'bg-retro-coral text-white' : 'bg-white'}`;
    
    document.getElementById('spy-results-container').style.display = 'none';
}

function updateSpyPeriod() {
    currentSpyStartDate = document.getElementById('spy-dynamic-start').value;
    currentSpyEndDate = document.getElementById('spy-dynamic-end').value;
    
    const metricSelect = document.getElementById('spy-dynamic-metric');
    if (metricSelect) currentSpyMetric = metricSelect.value;
    
    loadSpyData(currentSpyType);
}

async function loadSpyData(type) {
    currentSpyType = type;
    const isJoueur = type === 'joueurs';
    const isAlliance = type === 'alliances';
    const isGroupes = type === 'groupes';
    
    const startIso = `${currentSpyStartDate}T00:00:00Z`;
    const endIso = `${currentSpyEndDate}T23:59:59Z`;

    try {
        if (isGroupes) {
            if (spyActiveGroups.size === 0) return showToast("Erreur", "Sélectionnez au moins un groupe.");
            
            const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_history_groups`, {
                method: 'POST', 
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_start: startIso, p_end: endIso })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ ERREUR SUPABASE DÉTAILLÉE :", errorText);
                return showToast("Erreur", "Problème serveur, voir la console.");
            }

            const rawData = await res.json();
            currentSpyData = rawData.filter(d => spyActiveGroups.has(d.group_id));

        } else {
            const inputVal = document.getElementById(isJoueur ? "spy-player-search" : "spy-alliance-search").value.trim();
            if (!inputVal) return showToast("Erreur", "Veuillez entrer une cible.");

            let searchParam = '', searchColumn = '';
            if (isJoueur) {
                const pId = spyPlayersMap.get(inputVal);
                if (!pId) return showToast("Erreur", "Joueur introuvable.");
                searchColumn = 'player_id'; searchParam = `eq.${pId}`;
            } else {
                if (!spyAlliancesMap.has(inputVal)) return showToast("Erreur", "Alliance introuvable.");
                searchColumn = 'tag'; searchParam = `eq.${encodeURIComponent(inputVal)}`;
            }

            const tableName = isJoueur ? 'players_history' : 'alliances_history';
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?${searchColumn}=${searchParam}&snapshot_date=gte.${startIso}&snapshot_date=lte.${endIso}&order=snapshot_date.asc`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ ERREUR SUPABASE DÉTAILLÉE :", errorText);
                return showToast("Erreur", "Problème base de données.");
            }

            currentSpyData = await res.json();
        }

        if (currentSpyData.length === 0) return showToast("Aucun résultat", "Aucune donnée trouvée sur cette période.");
        renderSpyResultsContainer();

    } catch (error) {
        console.error("Erreur réseau/JS :", error);
        showToast("Erreur", "Impossible de contacter le serveur.");
    }
}

function renderSpyResultsContainer() {
    const container = document.getElementById('spy-results-container');
    container.style.display = 'block';

    const dates = currentSpyData.map(d => new Date(d.snapshot_date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    let intervalOptions = `<option value="raw">Données brutes</option>`;
    if (diffDays <= 3) intervalOptions += `<option value="1h">Moyenne / 1H</option><option value="3h">Moyenne / 3H</option><option value="6h">Moyenne / 6H</option><option value="12h">Moyenne / 12H</option>`;
    else if (diffDays <= 30) intervalOptions += `<option value="12h">Moyenne / 12H</option><option value="1d">Moyenne / 1 Jour</option><option value="3d">Moyenne / 3 Jours</option><option value="1w">Moyenne / 1 Semaine</option>`;
    else intervalOptions += `<option value="1d">Moyenne / 1 Jour</option><option value="3d">Moyenne / 3 Jours</option><option value="1w">Moyenne / 1 Semaine</option><option value="1m">Moyenne / 1 Mois</option>`;

    let metricOptions = '';
    if (currentSpyType === 'joueurs') {
        metricOptions = `<option value="field">Terrain de chasse</option><option value="building_score">Score Bâtiment</option><option value="technology_score">Score Technologie</option><option value="trophy_score">Score Trophée</option>`;
    } else {
        metricOptions = `<option value="total_field">Terrain total</option><option value="avg_field">Terrain / Joueur</option><option value="players_count">Nombre de joueurs</option><option value="total_building_score">Score Bâtiment total</option><option value="total_technology_score">Score Technologie total</option><option value="total_trophy_score">Score Trophée total</option>`;
    }

    let headerHtml = '';
    if (currentSpyType === 'groupes') {
        headerHtml = `<div class="flex items-center gap-4"><div class="w-16 h-16 bg-white border-4 border-retro-slate rounded-full flex items-center justify-center text-3xl shadow-retro-sm">🎯</div><div><h3 class="font-shrikhand text-3xl text-retro-slate m-0 leading-none">Comparateur de Groupes</h3><p class="font-fredoka font-bold text-retro-coral tracking-widest uppercase text-sm mt-1">Analyse Multidimensionnelle</p></div></div>`;
    } else {
        const latest = currentSpyData[currentSpyData.length - 1];
        const title = currentSpyType === 'joueurs' ? latest.pseudo : `[${latest.tag}] ${latest.name || ''}`;
        const subtitle = currentSpyType === 'joueurs' ? (latest.alliance ? `Alliance [${latest.alliance}]` : "Sans Alliance") : `${latest.players_count} membres`;
        const icon = currentSpyType === 'joueurs' ? '🐜' : '🛡️';
        headerHtml = `<div class="flex items-center gap-4"><div class="w-16 h-16 bg-white border-4 border-retro-slate rounded-full flex items-center justify-center text-3xl shadow-retro-sm">${icon}</div><div><h3 class="font-shrikhand text-3xl text-retro-slate m-0 leading-none">${title}</h3><p class="font-fredoka font-bold text-retro-coral tracking-widest uppercase text-sm mt-1">${subtitle}</p></div></div>`;
    }

    container.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 mt-8">
            ${headerHtml}
            
            <!-- BARRE D'OUTILS UNIFIÉE -->
            <div class="inline-flex flex-col xl:flex-row bg-white border-2 border-retro-slate rounded-xl shadow-retro-sm overflow-hidden divide-y xl:divide-y-0 xl:divide-x-2 divide-retro-slate m-0">
                
                <!-- Dates -->
                <div class="flex items-center justify-between px-4 py-2.5 hover:bg-retro-cream/30 transition-colors gap-3">
                    <div class="flex items-center gap-2">
                        <i class="fa-regular fa-calendar text-retro-slate/50"></i>
                        <input type="date" id="spy-dynamic-start" value="${currentSpyStartDate}" class="bg-transparent border-none p-0 m-0 outline-none text-sm font-outfit font-bold text-retro-slate cursor-pointer" onchange="updateSpyPeriod()">
                    </div>
                    <i class="fa-solid fa-arrow-right-long text-retro-slate/30 text-xs"></i>
                    <div class="flex items-center gap-2">
                        <input type="date" id="spy-dynamic-end" value="${currentSpyEndDate}" class="bg-transparent border-none p-0 m-0 outline-none text-sm font-outfit font-bold text-retro-slate cursor-pointer" onchange="updateSpyPeriod()">
                    </div>
                </div>
                
                <!-- Métrique -->
                <div class="flex items-center px-4 py-2.5 hover:bg-retro-cream/30 transition-colors cursor-pointer relative">
                    <i class="fa-solid fa-chart-pie text-retro-slate/50 mr-2"></i>
                    <select id="spy-dynamic-metric" class="bg-transparent border-none p-0 m-0 outline-none text-sm font-outfit font-bold text-retro-slate cursor-pointer appearance-none pr-4 w-full h-full" onchange="updateSpyView()">
                        ${metricOptions}
                    </select>
                    <i class="fa-solid fa-caret-down text-retro-slate/50 text-xs absolute right-4 pointer-events-none"></i>
                </div>
                
                <!-- Intervalle -->
                <div class="flex items-center px-4 py-2.5 hover:bg-retro-cream/30 transition-colors cursor-pointer relative">
                    <i class="fa-solid fa-layer-group text-retro-slate/50 mr-2"></i>
                    <select id="spy-dynamic-interval" class="bg-transparent border-none p-0 m-0 outline-none text-sm font-outfit font-bold text-retro-slate cursor-pointer appearance-none pr-4 w-full h-full" onchange="updateSpyView()">
                        ${intervalOptions}
                    </select>
                    <i class="fa-solid fa-caret-down text-retro-slate/50 text-xs absolute right-4 pointer-events-none"></i>
                </div>
                
            </div>
        </div>

        <div id="spy-summary-cards" class="stats-summary mb-6 flex-wrap"></div>
        
        <div class="bg-white border-4 border-retro-slate rounded-2xl p-4 shadow-retro mb-8">
            <h4 class="font-shrikhand text-lg text-retro-slate mb-2" id="spy-chart-title">📈 Évolution</h4>
            <canvas id="spyHistoryChart" width="100%" height="40"></canvas>
        </div>
        
        <div id="spy-tables-container" class="flex flex-wrap gap-6 mb-8 items-start"></div>
    `;

    // Restaure la métrique
    const metricSelect = document.getElementById('spy-dynamic-metric');
    if (currentSpyMetric && metricSelect.querySelector(`option[value="${currentSpyMetric}"]`)) {
        metricSelect.value = currentSpyMetric;
    }

    const intSelect = document.getElementById('spy-dynamic-interval');
    if (intSelect.options.length > 1) intSelect.selectedIndex = 1;
    
    updateSpyView();
}

function getBucketSize(intervalStr) {
    const hoursMap = { '1h': 1, '3h': 3, '6h': 6, '12h': 12, '1d': 24, '3d': 72, '1w': 168, '1m': 720 };
    return hoursMap[intervalStr] ? hoursMap[intervalStr] * 60 * 60 * 1000 : null;
}

function getMetricValue(snap, m) {
    if (m === 'avg_field') {
        const field = Number(snap['total_field']) || 0;
        const players = Math.max(1, Number(snap['players_count']) || 1);
        return Math.round(field / players);
    }
    return Number(snap[m]) || 0;
}

function updateSpyView() {
    const metricSelect = document.getElementById('spy-dynamic-metric');
    currentSpyMetric = metricSelect.value;
    const interval = document.getElementById('spy-dynamic-interval').value;
    const metricLabel = metricSelect.options[metricSelect.selectedIndex].text;
    
    document.getElementById('spy-chart-title').innerText = `📈 Évolution : ${metricLabel}`;

    const dataByEntity = {};
    
    currentSpyData.forEach(snap => {
        let eId, eName, color;
        if (currentSpyType === 'joueurs') { eId = snap.player_id; eName = snap.pseudo; color = '#3aafa9'; }
        else if (currentSpyType === 'alliances') { eId = snap.tag; eName = snap.tag; color = '#8e44ad'; }
        else { eId = snap.group_id; eName = `Groupe ${snap.group_id}`; color = SPY_GROUP_COLORS[(snap.group_id - 1) % SPY_GROUP_COLORS.length]; }
        
        if (!dataByEntity[eId]) dataByEntity[eId] = { id: eId, name: eName, color: color, rawData: [], processedData: [] };
        dataByEntity[eId].rawData.push(snap);
    });

    const bucketMs = interval !== 'raw' ? getBucketSize(interval) : 0;
    const globalTimeKeys = new Set();

    Object.values(dataByEntity).forEach(entity => {
        if (interval === 'raw') {
            entity.processedData = entity.rawData.map(snap => {
                const ts = new Date(snap.snapshot_date).getTime();
                globalTimeKeys.add(ts);
                return { ts: ts, val: getMetricValue(snap, currentSpyMetric) };
            });
        } else {
            const buckets = {};
            entity.rawData.forEach(snap => {
                const ts = new Date(snap.snapshot_date).getTime();
                const bucketKey = Math.floor(ts / bucketMs) * bucketMs;
                if (!buckets[bucketKey]) buckets[bucketKey] = { sum: 0, count: 0 };
                buckets[bucketKey].sum += getMetricValue(snap, currentSpyMetric);
                buckets[bucketKey].count += 1;
            });
            Object.keys(buckets).sort((a,b) => a-b).forEach(key => {
                const tsKey = Number(key);
                globalTimeKeys.add(tsKey);
                entity.processedData.push({ ts: tsKey, val: Math.round(buckets[key].sum / buckets[key].count) });
            });
        }
    });

    if (currentSpyType !== 'groupes') {
        const singleEntity = Object.values(dataByEntity)[0];
        const startVal = getMetricValue(singleEntity.rawData[0], currentSpyMetric);
        const endVal = getMetricValue(singleEntity.rawData[singleEntity.rawData.length - 1], currentSpyMetric);
        const diffVal = endVal - startVal;
        
        document.getElementById('spy-summary-cards').innerHTML = `
            <div class="stat-card"><div class="val">${startVal.toLocaleString('fr-FR')}</div><div class="lbl">Valeur Initiale</div></div>
            <div class="stat-card"><div class="val">${endVal.toLocaleString('fr-FR')}</div><div class="lbl">Valeur Finale</div></div>
            <div class="stat-card"><div class="val" style="color:${diffVal >= 0 ? '#3aafa9' : '#ff6f61'}; text-shadow: 1px 1px 0 #1d2d44;">${diffVal >= 0 ? '+' : ''}${diffVal.toLocaleString('fr-FR')}</div><div class="lbl">Progression Globale</div></div>
        `;
    } else {
        document.getElementById('spy-summary-cards').innerHTML = '';
    }

    let tablesHtml = '';
    const isMultiTable = currentSpyType === 'groupes';
    
    Object.values(dataByEntity).forEach(entity => {
        const tableRows = [];
        let previousVal = null;
        
        entity.processedData.forEach(item => {
            if (previousVal === null || item.val !== previousVal) {
                const dObj = new Date(item.ts);
                let fmt = (interval !== 'raw' && bucketMs >= 24*3600*1000) ? { day: '2-digit', month: '2-digit' } : { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' };
                const dateLabel = dObj.toLocaleString('fr-FR', fmt);
                
                let diffText = "-"; let colorCls = "text-retro-slate/30";
                if (previousVal !== null) {
                    const diff = item.val - previousVal;
                    if (diff > 0) { diffText = `+${diff.toLocaleString('fr-FR')}`; colorCls = "text-retro-mint-dark"; } 
                    else if (diff < 0) { diffText = `${diff.toLocaleString('fr-FR')}`; colorCls = "text-retro-coral"; }
                }

                tableRows.unshift(`<tr>
                    <td class="font-bold text-retro-slate text-sm whitespace-nowrap">${dateLabel}</td>
                    <td class="text-center font-bold text-retro-slate">${item.val.toLocaleString('fr-FR')}</td>
                    <td class="text-center font-black text-sm ${colorCls}">${diffText}</td>
                </tr>`);
            }
            previousVal = item.val;
        });

        const headerColor = isMultiTable ? entity.color : '#1d2d44';
        const titleHtml = isMultiTable ? `<h5 class="text-center font-shrikhand text-xl mb-3" style="color:${headerColor};">${entity.name}</h5>` : '';

        tablesHtml += `
            <div class="flex-1 min-w-[300px] table-container border-t-4" style="border-top-color: ${headerColor};">
                ${titleHtml}
                <table>
                    <thead><tr>
                        <th>Date</th>
                        <th class="text-center">${isMultiTable ? 'Valeur' : metricLabel}</th>
                        <th class="text-center">Évolution</th>
                    </tr></thead>
                    <tbody>${tableRows.join('')}</tbody>
                </table>
            </div>
        `;
    });
    
    document.getElementById('spy-tables-container').innerHTML = tablesHtml;

    const sortedGlobalTs = Array.from(globalTimeKeys).sort((a, b) => a - b);
    const chartLabels = sortedGlobalTs.map(ts => {
        let fmt = (interval !== 'raw' && bucketMs >= 24*3600*1000) ? { day: '2-digit', month: '2-digit' } : { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' };
        return new Date(ts).toLocaleString('fr-FR', fmt);
    });

    const datasets = Object.values(dataByEntity).map(entity => {
        const alignedData = sortedGlobalTs.map(ts => {
            const match = entity.processedData.find(d => d.ts === ts);
            return match ? match.val : null;
        });

        return {
            label: entity.name,
            data: alignedData,
            borderColor: entity.color,
            backgroundColor: entity.color,
            pointBackgroundColor: '#fff',
            pointBorderColor: entity.color,
            pointHoverRadius: 6,
            pointRadius: 3,
            borderWidth: 3,
            tension: 0.1,
            spanGaps: true
        };
    });

    if (currentSpyChart) currentSpyChart.destroy();
    currentSpyChart = new Chart(document.getElementById('spyHistoryChart').getContext('2d'), {
        type: 'line',
        data: { labels: chartLabels, datasets: datasets },
        options: { 
            responsive: true, 
            interaction: { mode: 'index', intersect: false }, 
            plugins: { legend: { position: 'top', labels: { font: { family: 'Outfit', weight: 'bold' } } } }, 
            scales: { 
                y: { ticks: { font: { family: 'Outfit', weight: 'bold' } }, grid: { color: 'rgba(29, 45, 68, 0.1)' } }, 
                x: { ticks: { font: { family: 'Outfit' }, maxTicksLimit: 15 }, grid: { display: false } } 
            } 
        }
    });
}
