let convoysSubTab = 'active';
let redistributeData = {};

function switchConvoysSubTab(sub) { convoysSubTab = sub; loadConvoysTab(); }

async function loadConvoysTab() {
    const sessionToken = localStorage.getItem('alliance_session_token');
    const contentDiv = document.getElementById('content-area');

    let detteHtml = '';
    if (currentUserAdminInfo.dette && currentUserAdminInfo.dette !== 0) {
        const isDebt = currentUserAdminInfo.dette > 0;
        const bgColor = isDebt ? 'bg-white/70 backdrop-blur-sm border-retro-coral' : 'bg-white/70 backdrop-blur-sm border-retro-mint';
        const textColor = isDebt ? 'text-retro-coral' : 'text-retro-mint-dark';
        const title = isDebt ? '⚠️ Régularisation de colonisation' : '🎁 Compensation de colonisation';
        const desc = isDebt ? "Prélèvement automatique appliqué sur vos livraisons entrantes jusqu'à résorption." : "Crédit en cours d'amortissement : vous conservez une plus grande part de votre production au lieu de l'expédier.";
        const sign = isDebt ? '+' : '';
        
        detteHtml = `
            <div class="mb-6 p-4 rounded-2xl border-4 shadow-retro ${bgColor} flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div><h4 class="font-shrikhand text-xl text-retro-slate m-0">${title}</h4><p class="font-outfit text-sm text-retro-slate/80 leading-tight mt-1">${desc}</p></div>
                <div class="font-fredoka font-bold text-xl ${textColor} whitespace-nowrap bg-white px-4 py-2 rounded-xl border-4 border-retro-slate shadow-retro-sm">${sign}${currentUserAdminInfo.dette.toLocaleString('fr-FR')}</div>
            </div>`;
    }

    contentDiv.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-retro-coral border-2 border-retro-slate rounded-full flex items-center justify-center text-white shadow-retro-sm text-xl"><i class="fa-solid fa-truck-fast"></i></div>
            <h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Logistique & Convois</h3>
        </div>
        ${detteHtml}
        <div class="flex gap-2 mb-6 border-b-4 border-retro-slate pb-4 flex-wrap">
            <button class="btn-action ${convoysSubTab === 'active' ? 'bg-retro-coral text-white' : 'bg-white'}" onclick="switchConvoysSubTab('active')"><i class="fa-solid fa-bolt"></i> En cours</button>
            <button class="btn-action ${convoysSubTab === 'history' ? 'bg-retro-coral text-white' : 'bg-white'}" onclick="switchConvoysSubTab('history')"><i class="fa-solid fa-scroll"></i> Historique</button>
        </div>
        <div id="convoys-content-area"><div class="flex justify-center p-12"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-retro-coral"></i></div></div>
    `;

    const rpcEndpoint = convoysSubTab === 'active' ? 'get_my_convoys' : 'get_my_convoy_history';
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpcEndpoint}`, {
            method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_session_token: sessionToken })
        });
        if (!response.ok) return logout();
        const data = await response.json();
        if (convoysSubTab === 'active') renderActiveConvoys(data); else renderHistoryConvoys(data);
    } catch (err) { logout(); }
}

function renderActiveConvoys(convoys) {
    const subContentDiv = document.getElementById('convoys-content-area');
    if (!subContentDiv) return;
    const toSend = convoys.filter(c => c.is_sender); const toReceive = convoys.filter(c => !c.is_sender);
    subContentDiv.innerHTML = `<h4 class="font-shrikhand text-xl text-retro-slate mb-4 mt-2"><i class="fa-solid fa-box-open text-retro-coral mr-2"></i> Ressources à expédier</h4>` + renderTable(toSend, true) + `<h4 class="font-shrikhand text-xl text-retro-slate mb-4 mt-8"><i class="fa-solid fa-box text-retro-mint mr-2"></i> Ressources en attente</h4>` + renderTable(toReceive, false);
}

function renderTable(list, isSender) {
    if (list.length === 0) return `<p class="font-fredoka font-bold text-retro-slate/50 italic bg-white p-4 rounded-xl border-2 border-retro-slate border-dashed">Aucun convoi dans cette catégorie.</p>`;
    let html = `<div class="table-container"><table><thead><tr><th>Date</th><th>Destinataire</th><th>Montant</th><th>Statut</th>${isSender ? '<th>Action</th>' : ''}</tr></thead><tbody>`;
    list.forEach(c => {
        const target = isSender ? c.to_player_pseudo : c.from_player_pseudo; 
        const targetId = isSender ? c.to_player_id : c.from_player_id; 
        const isFailed = c.status === 'failed';
        const statusBadge = isFailed ? `<span class="badge badge-failed"><i class="fa-solid fa-triangle-exclamation"></i> Échoué</span>` : `<span class="badge badge-pending"><i class="fa-solid fa-hourglass-half"></i> En attente</span>`;
        let amountDisplay = `<strong class="text-retro-mint">${Number(c.amount).toLocaleString('fr-FR')}</strong> Ressources`;
        let actionBtns = '';
        if (isSender) {
            amountDisplay = `<div class="flex items-center gap-1 sm:gap-2"><input type="text" inputmode="numeric" id="convoy-amount-${c.id}" value="${c.amount}" class="w-20 sm:w-24 shrink-0 bg-retro-cream border-2 border-retro-slate rounded-xl text-center font-bold text-retro-mint outline-none" style="margin:0; padding: 0.25rem; min-width: 75px;" oninput="cleanConvoyInput(this, ${c.amount})"><span class="text-xs font-bold text-retro-slate/50 whitespace-nowrap">/ ${Number(c.amount).toLocaleString('fr-FR')}</span></div>`;
            const btnColor = isFailed ? 'bg-retro-coral text-white' : 'bg-retro-yellow text-retro-slate';
            actionBtns += `<button class="btn-action ${btnColor}" onclick="dispatchConvoy(${targetId}, ${c.id}, ${c.amount})">${isFailed ? '<i class="fa-solid fa-rotate-right"></i> Relancer' : '<i class="fa-solid fa-bolt"></i> Expédier'}</button><button class="btn-manual-ok" onclick="markConvoyCompleted(${c.id}, ${c.amount})"><i class="fa-solid fa-check"></i> Acter</button>`;
        }
        html += `<tr class="${isFailed ? 'row-failed' : ''}"><td>${formatDateFR(c.balance_date)}</td><td><strong class="text-retro-slate">${escapeHtml(target)}</strong></td><td>${amountDisplay}</td><td>${statusBadge}</td>${isSender ? `<td>${actionBtns}</td>` : ''}</tr>`;
    });
    return html + `</tbody></table></div>`;
}

function dispatchConvoy(targetId, convoyId, maxAmount) {
    const input = document.getElementById(`convoy-amount-${convoyId}`);
    let amount = input ? parseInt(input.value) : maxAmount;
    if (amount > maxAmount) amount = maxAmount;
    if (amount < 1) amount = 1;
    window.open(`https://s5.fourmizzz.fr/commerce.php?ID=${targetId}&auto_convoy_id=${convoyId}&auto_amount=${amount}`, '_blank');
}

function cleanConvoyInput(input, maxAmount) {
    input.value = input.value.replace(/\D/g, '');
    if (input.value !== '') { let val = parseInt(input.value, 10); if (val > maxAmount) input.value = maxAmount; }
}

function markConvoyCompleted(convoyId, maxAmount) {
    const sessionToken = localStorage.getItem('alliance_session_token'); 
    if (!sessionToken) return logout();
    const input = document.getElementById(`convoy-amount-${convoyId}`);
    let amountSent = input ? parseInt(input.value) : maxAmount;
    if (!amountSent || amountSent <= 0 || amountSent > maxAmount) return showToast("Erreur", "Montant invalide.");

    const html = `<p class="mb-4 text-sm font-outfit text-retro-slate">Vous êtes sur le point de valider l'envoi de <strong class="text-retro-mint text-lg">${amountSent.toLocaleString('fr-FR')}</strong> ressources.</p><p class="text-xs text-retro-slate/80 italic border-l-4 border-retro-yellow pl-2">Avez-vous bien expédié cette quantité exacte en jeu ? Si le montant est inférieur au total, un nouveau convoi sera créé pour le reste.</p>`;
    openRetroModal('Confirmer l\'expédition', html, '<i class="fa-solid fa-check"></i> Acter l\'envoi', 'bg-retro-mint text-white', async () => {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/complete_convoy_partial`, { 
                method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ p_session_token: sessionToken, p_convoy_id: parseInt(convoyId), p_amount_sent: amountSent }) 
            });
            if (res.ok) { showToast("Confirmation", "Convoi validé avec succès !"); renderTabContent(); } else showToast("Erreur", "Erreur lors de la validation.");
        } catch (e) { showToast("Erreur", "Erreur réseau."); }
    });
}

function renderHistoryConvoys(historyList) {
    const subContentDiv = document.getElementById('convoys-content-area');
    if (!subContentDiv) return;
    if (historyList.length === 0) { subContentDiv.innerHTML = `<p class="font-fredoka font-bold text-retro-slate/50 italic bg-white p-4 rounded-xl border-2 border-retro-slate border-dashed">Aucune archive pour le moment.</p>`; return; }
    let html = `<div class="table-container"><table><thead><tr><th>Date</th><th>Flux</th><th>Partenaire</th><th>Montant</th><th>Statut</th></tr></thead><tbody>`;
    historyList.forEach(c => {
        const target = c.is_sender ? c.to_player_pseudo : c.from_player_pseudo;
        const typeText = c.is_sender ? '<span class="text-retro-coral font-bold uppercase tracking-wider text-xs"><i class="fa-solid fa-arrow-right"></i> Envoyé</span>' : '<span class="text-retro-mint font-bold uppercase tracking-wider text-xs"><i class="fa-solid fa-arrow-left"></i> Reçu</span>';
        html += `<tr><td>${formatDateFR(c.balance_date)}</td><td>${typeText}</td><td><strong class="text-retro-slate">${escapeHtml(target)}</strong></td><td>${Number(c.amount).toLocaleString('fr-FR')} Ressources</td><td><span class="badge badge-success"><i class="fa-solid fa-check-double"></i> Complété</span></td></tr>`;
    });
    subContentDiv.innerHTML = html + `</tbody></table></div>`;
}

function openCloseConvoyModal(convoyId, amount, senderId, senderPseudo, groupId, balanceDate) {
    let groupPlayers = currentGroupDataCache.playerPerfs.filter(p => p.group_id === groupId);
    redistributeData = {
        convoyId, amount, senderId, senderPseudo, groupId, balanceDate,
        players: groupPlayers.map(p => ({ player_id: p.player_id, pseudo: p.pseudo, ratio: p.calc_ratio, selected: true }))
    };
    renderCloseConvoyModal();
}

function renderCloseConvoyModal() {
    const scrollArea = document.getElementById('redistribute-scroll-area');
    const currentScroll = scrollArea ? scrollArea.scrollTop : 0;
    let totalRatio = redistributeData.players.filter(p => p.selected).reduce((sum, p) => sum + p.ratio, 0);
    
    let previewHtml = `<div id="redistribute-scroll-area" class="max-h-52 overflow-y-auto mt-4 border-2 border-retro-slate rounded-xl"><table class="w-full text-sm"><thead class="bg-retro-slate text-white"><tr><th class="p-2 text-center"><i class="fa-solid fa-check-square"></i></th><th class="p-2">Joueur</th><th class="p-2 text-center">Ratio</th><th class="p-2 text-center">Nouvelle Part</th></tr></thead><tbody>`;
    redistributeData.players.forEach((p, idx) => {
        let share = 0; if (p.selected && totalRatio > 0) share = Math.round(redistributeData.amount * (p.ratio / totalRatio));
        const isSender = p.player_id === redistributeData.senderId;
        previewHtml += `<tr class="${!p.selected ? 'opacity-40 bg-retro-slate/5' : ''} border-b border-retro-slate/10 transition-opacity"><td class="p-2 text-center"><input type="checkbox" class="cursor-pointer" ${p.selected ? 'checked' : ''} ${isSender ? 'disabled' : ''} onchange="toggleRedistributePlayer(${idx})"></td><td class="p-2 font-bold text-retro-slate">${escapeHtml(p.pseudo)} ${isSender ? '<br><span class="text-[0.65rem] text-retro-coral uppercase tracking-widest">(Expéditeur)</span>' : ''}</td><td class="p-2 text-center font-fredoka font-bold text-retro-slate/70">${p.ratio}%</td><td class="p-2 text-center font-bold ${share > 0 ? 'text-retro-mint-dark' : 'text-retro-slate/30'}">${share > 0 ? share.toLocaleString('fr-FR') : '-'}</td></tr>`;
    });
    previewHtml += `</tbody></table></div>`;

    const contentHtml = `<p class="mb-4 font-outfit text-retro-slate text-sm">Le convoi de <strong class="text-retro-coral">${redistributeData.amount.toLocaleString('fr-FR')} ressources</strong> de <strong>${escapeHtml(redistributeData.senderPseudo)}</strong> est bloqué. Que souhaitez-vous faire ?</p><div class="flex gap-2 mb-4"><button class="btn-action bg-retro-slate text-white w-full border-2 border-retro-slate hover:bg-retro-coral" onclick="confirmCancelConvoy()"><i class="fa-solid fa-trash"></i> Perte Sèche (Annuler)</button><button class="btn-action bg-retro-mint text-white w-full border-2 border-retro-slate" onclick="executeCloseConvoy('redistribute')"><i class="fa-solid fa-rotate"></i> Redistribuer</button></div><div id="redistribute-preview" class="bg-retro-cream p-3 rounded-xl border-2 border-retro-slate/20"><h5 class="font-fredoka font-bold text-retro-slate mb-2"><i class="fa-solid fa-calculator text-retro-yellow"></i> Prévisualisation de la redistribution :</h5><p class="text-xs text-retro-slate/70 leading-tight">Décochez les joueurs punis pour les exclure du calcul. L'expéditeur est verrouillé car il conserve sa propre part proportionnelle.</p>${previewHtml}</div>`;

    openRetroModal('Clôture Exceptionnelle', contentHtml, '', '', null);
    
    // Suppression du bouton par défaut de la modale puisqu'on a nos propres boutons d'action
    document.getElementById('modal-confirm-btn').style.display = 'none';

    const newScrollArea = document.getElementById('redistribute-scroll-area');
    if (newScrollArea) newScrollArea.scrollTop = currentScroll;
}

function confirmCancelConvoy() {
    const html = `<p class="font-outfit text-retro-slate mb-4">Êtes-vous absolument sûr de vouloir annuler ce convoi en <strong class="text-retro-coral">Perte Sèche</strong> ?</p><div class="bg-retro-coral/10 border-l-4 border-retro-coral p-3 rounded-r-xl"><p class="text-sm font-bold text-retro-slate/80"><i class="fa-solid fa-triangle-exclamation text-retro-coral"></i> Attention</p><p class="text-xs text-retro-slate/70 mt-1">Les <strong>${redistributeData.amount.toLocaleString('fr-FR')} ressources</strong> ne seront pas redistribuées. Le convoi sera archivé comme "Annulé". Cette action est irréversible.</p></div>`;
    openRetroModal('Confirmer la Perte Sèche', html, '<i class="fa-solid fa-trash"></i> Oui, annuler le convoi', 'bg-retro-coral text-white', () => { executeCloseConvoy('cancel'); });
}

function toggleRedistributePlayer(idx) { redistributeData.players[idx].selected = !redistributeData.players[idx].selected; renderCloseConvoyModal(); }

async function executeCloseConvoy(action) {
    const sessionToken = localStorage.getItem('alliance_session_token');
    let newConvoys = [];
    if (action === 'redistribute') {
        let totalRatio = redistributeData.players.filter(p => p.selected).reduce((sum, p) => sum + p.ratio, 0);
        if (totalRatio === 0) return showToast('Erreur', 'Aucun joueur sélectionné avec un ratio > 0.');
        redistributeData.players.forEach(p => {
            if (p.selected && p.player_id !== redistributeData.senderId) {
                let share = Math.round(redistributeData.amount * (p.ratio / totalRatio));
                if (share > 0) newConvoys.push({ balance_date: redistributeData.balanceDate, from_player_id: redistributeData.senderId, to_player_id: p.player_id, amount: share });
            }
        });
    }
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cancel_and_redistribute_convoy`, {
            method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_session_token: sessionToken, p_convoy_id: redistributeData.convoyId, p_action: action, p_new_convoys: newConvoys })
        });
        if (res.ok) { showToast('Opération Réussie', action === 'cancel' ? 'Convoi annulé.' : 'Convoi annulé et redistribué !'); closeRetroModal(); loadGroupConvoys(selectedGroupId); }
        else { const err = await res.json(); showToast('Erreur', err.message || 'Action refusée.'); }
    } catch (e) { showToast('Erreur', 'Erreur réseau.'); }
}
