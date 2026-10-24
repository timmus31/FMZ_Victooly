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
