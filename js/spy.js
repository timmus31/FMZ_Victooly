let spyPlayersMap = new Map();
let spyAlliancesMap = new Set();
let currentSpyChart = null;
let currentSpyData = [];
let currentSpyIsPlayer = true;

async function loadSpyTab() {
    const contentDiv = document.getElementById('content-area');
    const today = new Date().toISOString().split('T')[0];

    contentDiv.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-retro-slate border-2 border-retro-slate rounded-full flex items-center justify-center text-retro-cream shadow-retro-sm text-xl"><i class="fa-solid fa-user-secret"></i></div>
            <h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Spy & Archives</h3>
        </div>

        <div class="flex gap-2 mb-6 border-b-4 border-retro-slate pb-4 flex-wrap">
            <button id="spy-tab-joueurs-btn" class="btn-action bg-retro-coral text-white" onclick="switchSpySubTab('joueurs')"><i class="fa-solid fa-user-secret"></i> Joueurs</button>
            <button id="spy-tab-alliances-btn" class="btn-action bg-white" onclick="switchSpySubTab('alliances')"><i class="fa-solid fa-shield"></i> Alliances</button>
        </div>

        <!-- Section Joueurs -->
        <div id="spy-tab-joueurs" class="bg-retro-cream border-4 border-retro-slate rounded-2xl p-6 shadow-retro mb-8">
            <h2 class="font-shrikhand text-2xl text-retro-slate mb-4"><i class="fa-solid fa-magnifying-glass text-retro-mint mr-2"></i> Analyser un joueur</h2>
            <div class="flex flex-wrap items-center gap-4">
                <input type="text" id="spy-player-search" list="spy-players-list" class="flex-grow min-w-[200px]" placeholder="Commencez à taper un pseudo..." autocomplete="off">
                <datalist id="spy-players-list"></datalist>
                
                <div class="flex items-center gap-2">
                    <span class="font-fredoka font-bold text-retro-slate text-sm">Du</span>
                    <input type="date" id="playerStartDate" value="${today}" class="w-auto m-0">
                    <span class="font-fredoka font-bold text-retro-slate text-sm">au</span>
                    <input type="date" id="playerEndDate" value="${today}" class="w-auto m-0">
                </div>
                <button class="btn-manual-ok ml-auto" onclick="loadSpyData('joueurs')"><i class="fa-solid fa-magnifying-glass"></i> Analyser</button>
            </div>
            <p id="spy-player-msg" class="text-xs font-fredoka text-retro-slate/50 font-bold uppercase tracking-wider mt-2"><i class="fa-solid fa-spinner fa-spin"></i> Indexation des joueurs en cours...</p>
        </div>

        <!-- Section Alliances -->
        <div id="spy-tab-alliances" class="bg-retro-cream border-4 border-retro-slate rounded-2xl p-6 shadow-retro mb-8" style="display: none;">
            <h2 class="font-shrikhand text-2xl text-retro-slate mb-4"><i class="fa-solid fa-magnifying-glass text-[#8e44ad] mr-2"></i> Analyser une alliance</h2>
            <div class="flex flex-wrap items-center gap-4">
                <input type="text" id="spy-alliance-search" list="spy-alliances-list" class="flex-grow min-w-[200px]" placeholder="Tag de l'alliance (ex: -V-)..." autocomplete="off">
                <datalist id="spy-alliances-list"></datalist>
                
                <div class="flex items-center gap-2">
                    <span class="font-fredoka font-bold text-retro-slate text-sm">Du</span>
                    <input type="date" id="allianceStartDate" value="${today}" class="w-auto m-0">
                    <span class="font-fredoka font-bold text-retro-slate text-sm">au</span>
                    <input type="date" id="allianceEndDate" value="${today}" class="w-auto m-0">
                </div>
                <button class="btn-manual-ok ml-auto" style="background-color: #8e44ad;" onclick="loadSpyData('alliances')"><i class="fa-solid fa-magnifying-glass"></i> Analyser</button>
            </div>
            <p id="spy-alliance-msg" class="text-xs font-fredoka text-retro-slate/50 font-bold uppercase tracking-wider mt-2"><i class="fa-solid fa-spinner fa-spin"></i> Indexation des alliances en cours...</p>
        </div>

        <!-- Conteneur des résultats -->
        <div id="spy-results-container" style="display: none;"></div>
    `;

    const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

    try {
        const [resPlayers, resAlliances] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/rpc/get_history_players`, { method: 'POST', headers: headers }),
            fetch(`${SUPABASE_URL}/rest/v1/rpc/get_history_alliances`, { method: 'POST', headers: headers })
        ]);

        if (resPlayers.ok) {
            const players = await resPlayers.json();
            const datalistP = document.getElementById('spy-players-list');
            spyPlayersMap.clear();
            players.forEach(p => {
                spyPlayersMap.set(p.pseudo, p.player_id);
                const option = document.createElement('option');
                option.value = p.pseudo;
                datalistP.appendChild(option);
            });
            document.getElementById('spy-player-msg').innerHTML = `<i class="fa-solid fa-check text-retro-mint"></i> Registre prêt (${players.length.toLocaleString('fr-FR')} profils indexés)`;
        } else throw new Error("Erreur joueurs");

        if (resAlliances.ok) {
            const alliances = await resAlliances.json();
            const datalistA = document.getElementById('spy-alliances-list');
            spyAlliancesMap.clear();
            alliances.forEach(a => {
                spyAlliancesMap.add(a.tag);
                const option = document.createElement('option');
                option.value = a.tag;
                datalistA.appendChild(option);
            });
            document.getElementById('spy-alliance-msg').innerHTML = `<i class="fa-solid fa-check text-[#8e44ad]"></i> Registre prêt (${alliances.length.toLocaleString('fr-FR')} alliances indexées)`;
        } else throw new Error("Erreur alliances");

    } catch (err) {
        document.getElementById('spy-player-msg').innerHTML = `<span class="text-retro-coral"><i class="fa-solid fa-triangle-exclamation"></i> Erreur de chargement de l'index.</span>`;
        document.getElementById('spy-alliance-msg').innerHTML = `<span class="text-retro-coral"><i class="fa-solid fa-triangle-exclamation"></i> Erreur de chargement de l'index.</span>`;
    }
}

function switchSpySubTab(tabName) {
    document.getElementById('spy-tab-joueurs').style.display = tabName === 'joueurs' ? 'block' : 'none';
    document.getElementById('spy-tab-alliances').style.display = tabName === 'alliances' ? 'block' : 'none';
    
    document.getElementById('spy-tab-joueurs-btn').className = `btn-action ${tabName === 'joueurs' ? 'bg-retro-coral text-white' : 'bg-white'}`;
    document.getElementById('spy-tab-alliances-btn').className = `btn-action ${tabName === 'alliances' ? 'bg-retro-coral text-white' : 'bg-white'}`;
    
    document.getElementById('spy-results-container').style.display = 'none';
}

async function loadSpyData(type) {
    currentSpyIsPlayer = type === 'joueurs';
    const inputVal = document.getElementById(currentSpyIsPlayer ? "spy-player-search" : "spy-alliance-search").value.trim();
    
    if (!inputVal) return showToast("Erreur", "Veuillez entrer une cible valide.");

    let finalSearchParam = '';
    let searchColumn = '';

    if (currentSpyIsPlayer) {
        const pId = spyPlayersMap.get(inputVal);
        if (!pId) return showToast("Erreur", "Joueur introuvable dans le registre.");
        searchColumn = 'player_id';
        finalSearchParam = `eq.${pId}`;
    } else {
        if (!spyAlliancesMap.has(inputVal)) return showToast("Erreur", "Alliance introuvable dans le registre.");
        searchColumn = 'tag';
        finalSearchParam = `eq.${encodeURIComponent(inputVal)}`;
    }

    const startDate = document.getElementById(currentSpyIsPlayer ? "playerStartDate" : "allianceStartDate").value;
    const endDate = document.getElementById(currentSpyIsPlayer ? "playerEndDate" : "allianceEndDate").value;

    const startIso = `${startDate}T00:00:00Z`;
    const endIso = `${endDate}T23:59:59Z`;
    const tableName = currentSpyIsPlayer ? 'players_history' : 'alliances_history';

    const url = `${SUPABASE_URL}/rest/v1/${tableName}?${searchColumn}=${finalSearchParam}&snapshot_date=gte.${startIso}&snapshot_date=lte.${endIso}&order=snapshot_date.asc`;

    try {
        const response = await fetch(url, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' } });
        currentSpyData = await response.json();

        if (currentSpyData.length === 0) return showToast("Aucun résultat", "Aucune donnée trouvée pour cette période.");
        
        renderSpyResultsContainer();

    } catch (error) {
        showToast("Erreur", "Impossible de récupérer l'historique.");
    }
}

function renderSpyResultsContainer() {
    const container = document.getElementById('spy-results-container');
    container.style.display = 'block';

    const firstDate = new Date(currentSpyData[0].snapshot_date);
    const lastDate = new Date(currentSpyData[currentSpyData.length - 1].snapshot_date);
    const diffDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

    let intervalOptions = `<option value="raw">Données brutes</option>`;
    
    if (diffDays <= 3) {
        intervalOptions += `
            <option value="1h">Moyenne / 1H</option>
            <option value="3h">Moyenne / 3H</option>
            <option value="6h">Moyenne / 6H</option>
            <option value="12h">Moyenne / 12H</option>
        `;
    } else if (diffDays <= 30) {
        intervalOptions += `
            <option value="12h">Moyenne / 12H</option>
            <option value="1d">Moyenne / 1 Jour</option>
            <option value="3d">Moyenne / 3 Jours</option>
            <option value="1w">Moyenne / 1 Semaine</option>
        `;
    } else {
        intervalOptions += `
            <option value="1d">Moyenne / 1 Jour</option>
            <option value="3d">Moyenne / 3 Jours</option>
            <option value="1w">Moyenne / 1 Semaine</option>
            <option value="1m">Moyenne / 1 Mois</option>
        `;
    }

    let metricOptions = '';
    if (currentSpyIsPlayer) {
        metricOptions = `
            <option value="field">Terrain de chasse</option>
            <option value="building_score">Score Bâtiment</option>
            <option value="technology_score">Score Technologie</option>
            <option value="trophy_score">Score Trophée</option>
        `;
    } else {
        metricOptions = `
            <option value="total_field">Terrain total</option>
            <option value="avg_field">Terrain / Joueur</option>
            <option value="players_count">Nombre de joueurs</option>
            <option value="total_building_score">Score Bâtiment total</option>
            <option value="total_technology_score">Score Technologie total</option>
            <option value="total_trophy_score">Score Trophée total</option>
        `;
    }

    const latestSnapshot = currentSpyData[currentSpyData.length - 1];
    const title = currentSpyIsPlayer ? latestSnapshot.pseudo : `[${latestSnapshot.tag}] ${latestSnapshot.name || ''}`;
    const subtitle = currentSpyIsPlayer ? (latestSnapshot.alliance ? `Alliance [${latestSnapshot.alliance}]` : "Sans Alliance") : `${latestSnapshot.players_count} membres`;
    const icon = currentSpyIsPlayer ? '🐜' : '🛡️';

    container.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-8">
            <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-white border-4 border-retro-slate rounded-full flex items-center justify-center text-3xl shadow-retro-sm">${icon}</div>
                <div>
                    <h3 class="font-shrikhand text-3xl text-retro-slate m-0 leading-none">${title}</h3>
                    <p class="font-fredoka font-bold text-retro-coral tracking-widest uppercase text-sm mt-1">${subtitle}</p>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <select id="spy-dynamic-metric" class="bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer shadow-retro-sm m-0" onchange="updateSpyView()">
                    ${metricOptions}
                </select>
                <select id="spy-dynamic-interval" class="bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer shadow-retro-sm m-0" onchange="updateSpyView()">
                    ${intervalOptions}
                </select>
            </div>
        </div>

        <div id="spy-summary-cards" class="stats-summary mb-6 flex-wrap"></div>
        
        <div class="bg-white border-4 border-retro-slate rounded-2xl p-4 shadow-retro mb-8">
            <h4 class="font-shrikhand text-lg text-retro-slate mb-2" id="spy-chart-title">📈 Évolution</h4>
            <canvas id="spyHistoryChart" width="100%" height="40"></canvas>
        </div>
        
        <h4 class="font-shrikhand text-lg text-retro-slate mb-4">📋 Historique complet des variations</h4>
        <div class="table-container mb-8">
            <table>
                <thead>
                    <tr>
                        <th>Date du Relevé</th>
                        <th class="text-center" id="spy-table-metric-col">Valeur</th>
                        <th class="text-center">Évolution</th>
                    </tr>
                </thead>
                <tbody id="spy-history-tbody"></tbody>
            </table>
        </div>
    `;

    const intSelect = document.getElementById('spy-dynamic-interval');
    if (intSelect.options.length > 1) intSelect.selectedIndex = 1;
    
    updateSpyView();
}

function getBucketSize(intervalStr) {
    const hoursMap = { '1h': 1, '3h': 3, '6h': 6, '12h': 12, '1d': 24, '3d': 72, '1w': 168, '1m': 720 };
    return hoursMap[intervalStr] ? hoursMap[intervalStr] * 60 * 60 * 1000 : null;
}

function updateSpyView() {
    const metric = document.getElementById('spy-dynamic-metric').value;
    const interval = document.getElementById('spy-dynamic-interval').value;
    const selectElem = document.getElementById('spy-dynamic-metric');
    const metricLabel = selectElem.options[selectElem.selectedIndex].text;
    
    document.getElementById('spy-chart-title').innerText = `📈 Évolution : ${metricLabel}`;
    document.getElementById('spy-table-metric-col').innerText = metricLabel;

    // Fonction pour intercepter la métrique "avg_field" calculée côté client
    const getMetricValue = (snap, m) => {
        if (m === 'avg_field') {
            const field = Number(snap['total_field']) || 0;
            const players = Math.max(1, Number(snap['players_count']) || 1); // Empêche la division par 0
            return Math.round(field / players);
        }
        return Number(snap[m]) || 0;
    };

    // --- CARTES DE RÉSUMÉ ---
    const startVal = getMetricValue(currentSpyData[0], metric);
    const endVal = getMetricValue(currentSpyData[currentSpyData.length - 1], metric);
    const diffVal = endVal - startVal;
    const diffFormatted = diffVal >= 0 ? `+${diffVal.toLocaleString('fr-FR')}` : diffVal.toLocaleString('fr-FR');
    const diffColor = diffVal >= 0 ? '#3aafa9' : '#ff6f61';

    document.getElementById('spy-summary-cards').innerHTML = `
        <div class="stat-card"><div class="val">${startVal.toLocaleString('fr-FR')}</div><div class="lbl">Valeur Initiale</div></div>
        <div class="stat-card"><div class="val">${endVal.toLocaleString('fr-FR')}</div><div class="lbl">Valeur Finale</div></div>
        <div class="stat-card"><div class="val" style="color:${diffColor}; text-shadow: 1px 1px 0 #1d2d44;">${diffFormatted}</div><div class="lbl">Progression Globale</div></div>
    `;

    // --- 1. PRÉPARATION DES DONNÉES (Lissage selon l'intervalle) ---
    let processedData = [];
    const bucketMs = interval !== 'raw' ? getBucketSize(interval) : 0;

    if (interval === 'raw') {
        processedData = currentSpyData.map(snap => ({
            dateObj: new Date(snap.snapshot_date),
            val: getMetricValue(snap, metric)
        }));
    } else {
        const buckets = {};
        currentSpyData.forEach(snap => {
            const ts = new Date(snap.snapshot_date).getTime();
            const bucketKey = Math.floor(ts / bucketMs) * bucketMs;
            
            if (!buckets[bucketKey]) buckets[bucketKey] = { sum: 0, count: 0 };
            buckets[bucketKey].sum += getMetricValue(snap, metric);
            buckets[bucketKey].count += 1;
        });

        Object.keys(buckets).sort((a, b) => a - b).forEach(key => {
            processedData.push({
                dateObj: new Date(Number(key)),
                val: Math.round(buckets[key].sum / buckets[key].count)
            });
        });
    }

    // --- 2. TABLEAU ---
    const tableRows = [];
    let previousVal = null;

    processedData.forEach(item => {
        if (previousVal === null || item.val !== previousVal) {
            let formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' };
            if (interval !== 'raw' && bucketMs >= 24 * 60 * 60 * 1000) {
                formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
            }
            
            const dateLabel = item.dateObj.toLocaleString('fr-FR', formatOptions);
            let diffText = "-"; 
            let tableDiffColor = "text-retro-slate/30";
            
            if (previousVal !== null) {
                const stepDiff = item.val - previousVal;
                if (stepDiff > 0) { 
                    diffText = `+${stepDiff.toLocaleString('fr-FR')}`; 
                    tableDiffColor = "text-retro-mint-dark"; 
                } else if (stepDiff < 0) { 
                    diffText = `${stepDiff.toLocaleString('fr-FR')}`; 
                    tableDiffColor = "text-retro-coral"; 
                }
            }

            tableRows.unshift(`
                <tr>
                    <td class="font-bold text-retro-slate">${dateLabel}</td>
                    <td class="text-center font-bold text-retro-slate text-lg">${item.val.toLocaleString('fr-FR')}</td>
                    <td class="text-center font-black ${tableDiffColor}">${diffText}</td>
                </tr>
            `);
        }
        previousVal = item.val;
    });

    document.getElementById('spy-history-tbody').innerHTML = tableRows.join('');

    // --- 3. GRAPHIQUE ---
    let chartLabels = [];
    let chartDataPoints = [];

    processedData.forEach(item => {
        let formatOptions = { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' };
        if (interval !== 'raw' && bucketMs >= 24 * 60 * 60 * 1000) {
            formatOptions = { day: '2-digit', month: '2-digit' };
        }
        chartLabels.push(item.dateObj.toLocaleString('fr-FR', formatOptions));
        chartDataPoints.push(item.val);
    });

    renderSpyHistoryChart(chartLabels, chartDataPoints, metricLabel, currentSpyIsPlayer);
}

function renderSpyHistoryChart(labels, dataPoints, metricLabel, isPlayer) {
    const ctx = document.getElementById('spyHistoryChart').getContext('2d');
    if (currentSpyChart) currentSpyChart.destroy();

    const chartColor = isPlayer ? '#3aafa9' : '#8e44ad';

    currentSpyChart = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: labels, 
            datasets: [{ 
                label: metricLabel, 
                data: dataPoints, 
                borderColor: '#1d2d44', 
                backgroundColor: chartColor, 
                pointBackgroundColor: '#ff6f61', 
                pointBorderColor: '#1d2d44', 
                pointHoverRadius: 8, 
                pointRadius: 4, 
                borderWidth: 3, 
                tension: 0.1 
            }] 
        },
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
