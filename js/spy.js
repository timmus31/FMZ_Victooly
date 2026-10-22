let spyPlayersMap = new Map();
let spyHistoryChartInstance = null;

async function loadSpyTab() {
    const contentDiv = document.getElementById('content-area');
    contentDiv.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-retro-slate border-2 border-retro-slate rounded-full flex items-center justify-center text-retro-cream shadow-retro-sm text-xl"><i class="fa-solid fa-user-secret"></i></div>
            <h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Spy & Archives</h3>
        </div>

        <div class="bg-retro-cream border-4 border-retro-slate rounded-2xl p-6 shadow-retro mb-8 relative">
            <h2 class="font-shrikhand text-2xl text-retro-slate mb-4"><i class="fa-solid fa-magnifying-glass text-retro-mint mr-2"></i> Rechercher un joueur</h2>
            <div class="flex gap-4 items-center">
                <div class="flex-grow">
                    <input type="text" id="spy-player-search" list="spy-players-list" placeholder="Commencez à taper un pseudo..." autocomplete="off" onchange="handleSpyPlayerSelect()">
                    <datalist id="spy-players-list"></datalist>
                </div>
                <div id="spy-loader-spinner" class="hidden text-retro-coral text-2xl animate-spin"><i class="fa-solid fa-circle-notch"></i></div>
            </div>
            <p id="spy-player-count-msg" class="text-xs font-fredoka text-retro-slate/50 font-bold uppercase tracking-wider mt-2"><i class="fa-solid fa-spinner fa-spin"></i> Chargement du registre en cours...</p>
        </div>

        <div id="spy-player-data-container" style="display: none;">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 bg-white border-4 border-retro-slate rounded-full flex items-center justify-center text-3xl shadow-retro-sm">🐜</div>
                <div>
                    <h3 id="spy-display-pseudo" class="font-shrikhand text-3xl text-retro-slate m-0 leading-none">Pseudo</h3>
                    <p id="spy-display-alliance" class="font-fredoka font-bold text-retro-coral tracking-widest uppercase text-sm mt-1"></p>
                </div>
            </div>
            <div class="bg-white border-4 border-retro-slate rounded-2xl p-4 shadow-retro mb-8">
                <h4 class="font-shrikhand text-lg text-retro-slate mb-2">📈 Évolution du Terrain de Chasse</h4>
                <canvas id="spyHistoryChart" width="100%" height="40"></canvas>
            </div>
            <h4 class="font-shrikhand text-lg text-retro-slate mb-4">📋 Historique des relevés</h4>
            <div class="table-container mb-8" id="spy-history-table-container"></div>
        </div>
    `;

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_history_players`, {
            method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error();
        const players = await res.json();

        const datalist = document.getElementById('spy-players-list');
        spyPlayersMap.clear();
        players.forEach(p => {
            spyPlayersMap.set(p.pseudo, p.player_id);
            const option = document.createElement('option');
            option.value = p.pseudo;
            datalist.appendChild(option);
        });
        document.getElementById('spy-player-count-msg').innerHTML = `<i class="fa-solid fa-check text-retro-mint"></i> Registre prêt (${players.length.toLocaleString('fr-FR')} profils indexés)`;
    } catch (err) {
        document.getElementById('spy-player-count-msg').innerHTML = `<span class="text-retro-coral"><i class="fa-solid fa-triangle-exclamation"></i> Erreur de chargement.</span>`;
    }
}

async function handleSpyPlayerSelect() {
    const inputVal = document.getElementById('spy-player-search').value.trim();
    const playerId = spyPlayersMap.get(inputVal);
    if (!playerId) return;

    document.getElementById('spy-loader-spinner').classList.remove('hidden');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_player_history`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_player_id: playerId })
        });
        const data = await res.json();
        if (data.length > 0) renderSpyPlayerHistory(data, inputVal);
    } catch (err) {} finally { document.getElementById('spy-loader-spinner').classList.add('hidden'); }
}

function renderSpyPlayerHistory(data, pseudo) {
    document.getElementById('spy-player-data-container').style.display = 'block';
    const latestSnapshot = data[data.length - 1];
    document.getElementById('spy-display-pseudo').innerText = pseudo;
    document.getElementById('spy-display-alliance').innerText = latestSnapshot.alliance ? `Alliance [${latestSnapshot.alliance}]` : "Sans Alliance";

    const labels = []; const chartData = []; const tableRows = [];
    let previousField = null;

    data.forEach(snap => {
        const dateLabel = new Date(snap.snapshot_date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
        labels.push(dateLabel);
        chartData.push(snap.field);

        let diffText = "-"; let diffColor = "text-retro-slate/30";
        if (previousField !== null) {
            const diff = snap.field - previousField;
            if (diff > 0) { diffText = `+${diff.toLocaleString('fr-FR')}`; diffColor = "text-retro-mint-dark"; }
            else if (diff < 0) { diffText = `${diff.toLocaleString('fr-FR')}`; diffColor = "text-retro-coral"; }
            else { diffText = "="; }
        }

        tableRows.unshift(`<tr><td class="font-bold text-retro-slate">${dateLabel}</td><td>${snap.alliance ? `<span class="bg-retro-cream px-2 py-1 rounded border-2 border-retro-slate text-xs font-bold">${snap.alliance}</span>` : '<span class="italic text-retro-slate/50">Aucune</span>'}</td><td class="text-center font-bold text-retro-slate text-lg">${snap.field.toLocaleString('fr-FR')} cm²</td><td class="text-center font-black ${diffColor}">${diffText}</td></tr>`);
        previousField = snap.field;
    });

    document.getElementById('spy-history-table-container').innerHTML = `<table><thead><tr><th>Date du Relevé</th><th>Alliance</th><th class="text-center">Terrain de Chasse</th><th class="text-center">Évolution</th></tr></thead><tbody>${tableRows.join('')}</tbody></table>`;
    renderSpyHistoryChart(labels, chartData, pseudo);
}

function renderSpyHistoryChart(labels, dataPoints, pseudo) {
    const ctx = document.getElementById('spyHistoryChart').getContext('2d');
    if (spyHistoryChartInstance) spyHistoryChartInstance.destroy();

    spyHistoryChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: `Terrain de ${pseudo} (cm²)`, data: dataPoints, borderColor: '#1d2d44', backgroundColor: '#3aafa9', pointBackgroundColor: '#ff6f61', pointBorderColor: '#1d2d44', pointHoverRadius: 8, pointRadius: 4, borderWidth: 3, tension: 0.1 }] },
        options: { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top', labels: { font: { family: 'Outfit', weight: 'bold' } } } }, scales: { y: { ticks: { font: { family: 'Outfit', weight: 'bold' } }, grid: { color: 'rgba(29, 45, 68, 0.1)' } }, x: { ticks: { font: { family: 'Outfit' }, maxTicksLimit: 15 }, grid: { display: false } } } }
    });
}
