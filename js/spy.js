let spyPlayersMap = new Map();
let spyAlliancesMap = new Set();
let currentSpyChart = null;

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
                
                <select id="playerMetric" class="bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer">
                    <option value="field">Terrain de chasse</option>
                    <option value="building_score">Score Bâtiment</option>
                    <option value="technology_score">Score Technologie</option>
                    <option value="trophy_score">Score Trophée</option>
                </select>
                
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
                
                <select id="allianceMetric" class="bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer">
                    <option value="total_field">Terrain total</option>
                    <option value="players_count">Nombre de joueurs</option>
                    <option value="total_building_score">Score Bâtiment total</option>
                    <option value="total_technology_score">Score Technologie total</option>
                    <option value="total_trophy_score">Score Trophée total</option>
                </select>
                
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
        <div id="spy-results-container" style="display: none;">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 bg-white border-4 border-retro-slate rounded-full flex items-center justify-center text-3xl shadow-retro-sm" id="spy-result-icon">🐜</div>
                <div>
                    <h3 id="spy-display-title" class="font-shrikhand text-3xl text-retro-slate m-0 leading-none">Cible</h3>
                    <p id="spy-display-subtitle" class="font-fredoka font-bold text-retro-coral tracking-widest uppercase text-sm mt-1"></p>
                </div>
            </div>
            
            <div class="bg-white border-4 border-retro-slate rounded-2xl p-4 shadow-retro mb-8">
                <h4 class="font-shrikhand text-lg text-retro-slate mb-2" id="spy-chart-title">📈 Évolution</h4>
                <canvas id="spyHistoryChart" width="100%" height="40"></canvas>
            </div>
            
            <h4 class="font-shrikhand text-lg text-retro-slate mb-4">📋 Historique des relevés</h4>
            <div class="table-container mb-8" id="spy-history-table-container"></div>
        </div>
    `;

    const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

    // Chargement parallèle des deux index (Joueurs et Alliances)
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
    const isPlayer = type === 'joueurs';
    const inputVal = document.getElementById(isPlayer ? "spy-player-search" : "spy-alliance-search").value.trim();
    
    if (!inputVal) return showToast("Erreur", "Veuillez entrer une cible valide.");

    let finalSearchParam = '';
    let searchColumn = '';

    // Vérification stricte dans nos dictionnaires pré-chargés
    if (isPlayer) {
        const pId = spyPlayersMap.get(inputVal);
        if (!pId) return showToast("Erreur", "Joueur introuvable dans le registre.");
        searchColumn = 'player_id';
        finalSearchParam = `eq.${pId}`;
    } else {
        if (!spyAlliancesMap.has(inputVal)) return showToast("Erreur", "Alliance introuvable dans le registre.");
        searchColumn = 'tag';
        finalSearchParam = `eq.${encodeURIComponent(inputVal)}`;
    }

    const metric = document.getElementById(isPlayer ? "playerMetric" : "allianceMetric").value;
    const startDate = document.getElementById(isPlayer ? "playerStartDate" : "allianceStartDate").value;
    const endDate = document.getElementById(isPlayer ? "playerEndDate" : "allianceEndDate").value;

    const startIso = `${startDate}T00:00:00Z`;
    const endIso = `${endDate}T23:59:59Z`;
    const tableName = isPlayer ? 'players_history' : 'alliances_history';

    const url = `${SUPABASE_URL}/rest/v1/${tableName}?${searchColumn}=${finalSearchParam}&snapshot_date=gte.${startIso}&snapshot_date=lte.${endIso}&order=snapshot_date.asc`;

    try {
        const response = await fetch(url, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' } });
        const data = await response.json();

        if (data.length === 0) return showToast("Aucun résultat", "Aucune donnée trouvée pour cette période.");
        renderSpyResults(data, metric, isPlayer);

    } catch (error) {
        showToast("Erreur", "Impossible de récupérer l'historique.");
    }
}

function renderSpyResults(data, metric, isPlayer) {
    const container = document.getElementById('spy-results-container');
    container.style.display = 'block';
    
    const firstSnapshot = data[0];
    const latestSnapshot = data[data.length - 1];
    const selectElem = document.getElementById(isPlayer ? 'playerMetric' : 'allianceMetric');
    const metricLabel = selectElem.options[selectElem.selectedIndex].text;
    
    const title = isPlayer ? latestSnapshot.pseudo : `[${latestSnapshot.tag}] ${latestSnapshot.name || ''}`;
    const subtitle = isPlayer ? (latestSnapshot.alliance ? `Alliance [${latestSnapshot.alliance}]` : "Sans Alliance") : `${latestSnapshot.players_count} membres`;
    const icon = isPlayer ? '🐜' : '🛡️';

    // Calcul du résumé global
    const startVal = Number(firstSnapshot[metric]) || 0;
    const endVal = Number(latestSnapshot[metric]) || 0;
    const diffVal = endVal - startVal;
    const diffFormatted = diffVal >= 0 ? `+${diffVal.toLocaleString('fr-FR')}` : diffVal.toLocaleString('fr-FR');
    const diffColor = diffVal >= 0 ? '#3aafa9' : '#ff6f61';

    const labels = [];
    const chartData = [];
    const tableRows = [];
    let previousVal = null;

    data.forEach(snap => {
        const dateLabel = new Date(snap.snapshot_date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
        const currentVal = Number(snap[metric]) || 0;
        
        labels.push(dateLabel);
        chartData.push(currentVal);

        if (previousVal === null || currentVal !== previousVal) {
            let diffText = "-"; 
            let tableDiffColor = "text-retro-slate/30";
            
            if (previousVal !== null) {
                const stepDiff = currentVal - previousVal;
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
                    <td class="text-center font-bold text-retro-slate text-lg">${currentVal.toLocaleString('fr-FR')}</td>
                    <td class="text-center font-black ${tableDiffColor}">${diffText}</td>
                </tr>
            `);
        }
        previousVal = currentVal;
    });

    // Recomposition de l'affichage avec le tableau de résumé
    container.innerHTML = `
        <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-white border-4 border-retro-slate rounded-full flex items-center justify-center text-3xl shadow-retro-sm">${icon}</div>
            <div>
                <h3 class="font-shrikhand text-3xl text-retro-slate m-0 leading-none">${title}</h3>
                <p class="font-fredoka font-bold text-retro-coral tracking-widest uppercase text-sm mt-1">${subtitle}</p>
            </div>
        </div>

        <div class="stats-summary mb-6 flex-wrap">
            <div class="stat-card"><div class="val">${startVal.toLocaleString('fr-FR')}</div><div class="lbl">Valeur Initiale</div></div>
            <div class="stat-card"><div class="val">${endVal.toLocaleString('fr-FR')}</div><div class="lbl">Valeur Finale</div></div>
            <div class="stat-card"><div class="val" style="color:${diffColor}; text-shadow: 1px 1px 0 #1d2d44;">${diffFormatted}</div><div class="lbl">Progression</div></div>
        </div>
        
        <div class="bg-white border-4 border-retro-slate rounded-2xl p-4 shadow-retro mb-8">
            <h4 class="font-shrikhand text-lg text-retro-slate mb-2">📈 Évolution : ${metricLabel}</h4>
            <canvas id="spyHistoryChart" width="100%" height="40"></canvas>
        </div>
        
        <h4 class="font-shrikhand text-lg text-retro-slate mb-4">📋 Historique des relevés</h4>
        <div class="table-container mb-8">
            <table>
                <thead>
                    <tr>
                        <th>Date du Relevé</th>
                        <th class="text-center">${metricLabel}</th>
                        <th class="text-center">Évolution</th>
                    </tr>
                </thead>
                <tbody>${tableRows.join('')}</tbody>
            </table>
        </div>
    `;

    renderSpyHistoryChart(labels, chartData, metricLabel, isPlayer);
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
