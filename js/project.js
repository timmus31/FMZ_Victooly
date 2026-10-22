let projectSubTab = 'changelog', projectData = { changelog: [], backlog: [], propositions: [] };

async function loadProjectTab() {
    const sessionToken = localStorage.getItem('alliance_session_token');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_project_data`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: sessionToken }) });
        if (!res.ok) throw new Error("Erreur SQL");
        projectData = await res.json(); renderProjectUI();
    } catch (e) { document.getElementById('content-area').innerHTML = `<p class="font-fredoka font-bold text-retro-coral text-center">⚠️ Erreur de chargement des données projet.</p>`; }
}

function switchProjectSubTab(sub) { projectSubTab = sub; renderProjectUI(); }

function renderProjectUI() {
    const contentDiv = document.getElementById('content-area'); const isSuperAdmin = currentUserAdminInfo.role === 'superadmin'; const myPseudo = currentUserAdminInfo.pseudo;
    let html = `<div class="flex items-center gap-3 mb-6"><div class="w-12 h-12 bg-retro-slate border-2 border-retro-slate rounded-full flex items-center justify-center text-retro-yellow shadow-retro-sm text-xl"><i class="fa-solid fa-clipboard-list"></i></div><h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Suivi du Projet</h3></div><div class="flex gap-2 mb-6 border-b-4 border-retro-slate pb-4 flex-wrap"><button class="btn-action ${projectSubTab === 'changelog' ? 'bg-retro-coral text-white' : 'bg-white'}" onclick="switchProjectSubTab('changelog')"><i class="fa-solid fa-book-journal-whills"></i> Journal (Changelog)</button><button class="btn-action ${projectSubTab === 'backlog' ? 'bg-retro-coral text-white' : 'bg-white'}" onclick="switchProjectSubTab('backlog')"><i class="fa-solid fa-list-check"></i> À faire (Backlog)</button><button class="btn-action ${projectSubTab === 'propositions' ? 'bg-retro-coral text-white' : 'bg-white'}" onclick="switchProjectSubTab('propositions')"><i class="fa-solid fa-lightbulb"></i> Boîte à idées</button></div>`;

    if (projectSubTab === 'changelog') {
        if (isSuperAdmin) html += `<div class="bg-white border-2 border-retro-slate p-4 rounded-xl shadow-retro-sm mb-6"><textarea id="new-changelog-text" rows="3" class="w-full bg-retro-cream border-2 border-retro-slate rounded-xl p-3 mb-3 font-outfit focus:border-retro-coral outline-none resize-y" placeholder="Décrivez la nouvelle mise à jour..."></textarea><button class="btn-manual-ok" onclick="submitProjectItem('changelog', 'add')"><i class="fa-solid fa-plus"></i> Publier</button></div>`;
        html += `<div class="flex flex-col gap-4">`;
        if (!projectData.changelog || projectData.changelog.length === 0) html += `<p class="italic text-retro-slate/60 font-fredoka">Aucun historique.</p>`;
        else projectData.changelog.forEach(c => {
            const prioLabels = { 1: "1 - Urgent", 2: "2 - Important", 3: "3 - À faire", 4: "4 - Pour plus tard", 5: "5 - Bonus" }, prioColors = { 1: "bg-retro-coral text-white", 2: "bg-retro-yellow text-retro-slate", 3: "bg-retro-mint text-white", 4: "bg-retro-slate text-white", 5: "bg-white text-retro-slate" };
            const prioBadge = c.priority ? `<span class="badge ${prioColors[c.priority] || 'bg-retro-slate text-white'} border-2 border-retro-slate mr-2 mb-1">${prioLabels[c.priority] || `Priorité ${c.priority}`}</span>` : '';
            html += `<div class="bg-white border-2 border-retro-slate p-4 rounded-xl shadow-sm relative group"><div class="flex items-center flex-wrap gap-1 mb-2">${prioBadge}<span class="text-xs text-retro-slate/60 font-bold"><i class="fa-regular fa-clock"></i> ${formatDateFR(c.created_at)} par <span class="text-retro-mint-dark">${escapeHtml(c.pseudo)}</span></span></div><div class="font-outfit text-retro-slate whitespace-pre-wrap">${escapeHtml(c.content)}</div>${isSuperAdmin ? `<button class="absolute top-3 right-3 text-retro-slate/40 hover:text-retro-coral" onclick="editProjectItem('changelog', ${c.id})" title="Modifier"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}</div>`;
        });
        html += `</div>`;
    } else if (projectSubTab === 'backlog') {
        if (isSuperAdmin) html += `<div class="bg-white border-2 border-retro-slate p-4 rounded-xl shadow-retro-sm mb-6 flex flex-col gap-3"><div class="flex gap-3 items-center"><label class="font-fredoka font-bold text-retro-slate text-sm">Priorité :</label><select id="new-backlog-prio" class="bg-retro-cream border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none m-0" style="margin-bottom:0; width:auto; cursor:pointer;"><option value="1">1 - Urgent</option><option value="2">2 - Important</option><option value="3" selected>3 - À faire</option><option value="4">4 - Pour plus tard</option><option value="5">5 - Bonus</option></select></div><textarea id="new-backlog-text" rows="2" class="w-full bg-retro-cream border-2 border-retro-slate rounded-xl p-3 font-outfit focus:border-retro-coral outline-none resize-y" placeholder="Description de la tâche..."></textarea><div><button class="btn-manual-ok" onclick="submitProjectItem('backlog', 'add')"><i class="fa-solid fa-plus"></i> Ajouter au Backlog</button></div></div>`;
        html += `<div class="flex flex-col gap-4">`;
        if (!projectData.backlog || projectData.backlog.length === 0) html += `<p class="italic text-retro-slate/60 font-fredoka">Le backlog est vide, tout est parfait !</p>`;
        else projectData.backlog.forEach(b => {
            const prioLabels = { 1: "1 - Urgent", 2: "2 - Important", 3: "3 - À faire", 4: "4 - Pour plus tard", 5: "5 - Bonus" }, prioColors = { 1: "bg-retro-coral text-white", 2: "bg-retro-yellow text-retro-slate", 3: "bg-retro-mint text-white", 4: "bg-retro-slate text-white", 5: "bg-white text-retro-slate" };
            html += `<div class="bg-white border-2 border-retro-slate p-4 rounded-xl shadow-sm relative group"><div class="flex items-center gap-2 mb-2"><span class="badge ${prioColors[b.priority] || 'bg-retro-slate text-white'} border-2 border-retro-slate">${prioLabels[b.priority] || `Priorité ${b.priority}`}</span><span class="text-xs text-retro-slate/60 font-bold">${formatDateFR(b.created_at)}</span></div><div class="font-outfit text-retro-slate whitespace-pre-wrap">${escapeHtml(b.content)}</div>${isSuperAdmin ? `<div class="absolute top-3 right-3 flex gap-2"><button class="text-retro-slate/40 hover:text-retro-mint" onclick="completeBacklogItem(${b.id})" title="Clôturer et publier"><i class="fa-solid fa-check-double"></i></button><button class="text-retro-slate/40 hover:text-retro-yellow" onclick="editProjectItem('backlog', ${b.id},${b.priority})" title="Modifier"><i class="fa-solid fa-pen-to-square"></i></button><button class="text-retro-slate/40 hover:text-retro-coral" onclick="deleteProjectItem('backlog', ${b.id})" title="Supprimer"><i class="fa-solid fa-trash"></i></button></div>` : ''}</div>`;
        });
        html += `</div>`;
    } else if (projectSubTab === 'propositions') {
        html += `<div class="bg-white border-2 border-retro-slate p-4 rounded-xl shadow-retro-sm mb-6"><textarea id="new-prop-text" rows="3" class="w-full bg-retro-cream border-2 border-retro-slate rounded-xl p-3 mb-3 font-outfit focus:border-retro-coral outline-none resize-y" placeholder="Vous avez une idée pour améliorer Victooly ? Décrivez-la ici..."></textarea><button class="btn-manual-ok" onclick="submitProjectItem('propositions', 'add')"><i class="fa-solid fa-paper-plane"></i> Soumettre l'idée</button></div><div class="flex flex-col gap-4">`;
        if (!projectData.propositions || projectData.propositions.length === 0) html += `<p class="italic text-retro-slate/60 font-fredoka">Aucune proposition pour le moment.</p>`;
        else projectData.propositions.forEach(p => {
            const isMine = p.pseudo === myPseudo; const canEdit = isMine || isSuperAdmin;
            let statusBadge = '<span class="badge bg-white text-retro-slate border-2 border-retro-slate"><i class="fa-solid fa-hourglass-half text-retro-yellow"></i> En attente</span>';
            if (p.status === 'accepted') statusBadge = '<span class="badge bg-retro-mint text-white border-2 border-retro-slate"><i class="fa-solid fa-check"></i> Acceptée</span>'; else if (p.status === 'rejected') statusBadge = '<span class="badge bg-retro-coral text-white border-2 border-retro-slate"><i class="fa-solid fa-xmark"></i> Refusée</span>';
            html += `<div class="bg-white border-2 border-retro-slate p-4 rounded-xl shadow-sm relative group"><div class="flex items-center gap-2 mb-2 flex-wrap">${statusBadge}<span class="text-xs text-retro-slate/60 font-bold">par <span class="text-retro-mint-dark">${escapeHtml(p.pseudo)}</span> le ${formatDateFR(p.created_at)}</span></div><div class="font-outfit text-retro-slate whitespace-pre-wrap">${escapeHtml(p.content)}</div><div class="mt-3 flex gap-2 justify-end">${isSuperAdmin && p.status === 'pending' ? `<button class="btn-action bg-retro-mint text-white border-2 border-retro-slate" onclick="acceptProposition(${p.id})"><i class="fa-solid fa-check"></i> Accepter</button><button class="btn-action bg-retro-coral text-white border-2 border-retro-slate" onclick="changePropStatus(${p.id}, 'rejected')"><i class="fa-solid fa-xmark"></i> Refuser</button>` : ''}${canEdit ? `<button class="btn-action bg-white text-retro-slate" onclick="editProjectItem('propositions', ${p.id})"><i class="fa-solid fa-pen-to-square"></i></button><button class="btn-action bg-white text-retro-coral" onclick="deleteProjectItem('propositions', ${p.id})"><i class="fa-solid fa-trash"></i></button>` : ''}</div></div>`;
        });
        html += `</div>`;
    }
    contentDiv.innerHTML = html;
}

function completeBacklogItem(id) { openRetroModal('Clôturer le développement', '<p class="font-bold">Avez-vous terminé cette tâche ?</p><p class="text-sm mt-2 opacity-80">Elle sera automatiquement retirée du Backlog et ajoutée au Changelog (Journal des mises à jour) en conservant sa priorité initiale.</p>', '<i class="fa-solid fa-check-double"></i> Clôturer & Publier', 'bg-retro-mint text-white', async () => { await submitProjectItem('backlog', 'complete', id); }); }

async function submitProjectItem(type, action, id = null, forcedContent = null, forcedPrio = null) {
    const sessionToken = localStorage.getItem('alliance_session_token');
    let content = forcedContent; let priority = forcedPrio || 3;
    if (action === 'add' && !forcedContent) {
        if (type === 'changelog') content = document.getElementById('new-changelog-text').value.trim();
        else if (type === 'backlog') { content = document.getElementById('new-backlog-text').value.trim(); priority = parseInt(document.getElementById('new-backlog-prio').value) || 3; }
        else if (type === 'propositions') content = document.getElementById('new-prop-text').value.trim();
        if (!content) return showToast("Erreur", "Le champ de texte est vide.");
    }
    let body = { p_session_token: sessionToken, p_action: action, p_content: content };
    if (id !== null) body.p_id = id; if (type === 'backlog') body.p_priority = priority;
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/manage_${type === 'propositions' ? 'proposition' : type}`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) { showToast("Succès", "Données sauvegardées avec succès."); loadProjectTab(); } else alert("❌ Action refusée : " + (await res.json()).message);
    } catch (e) { alert("❌ Erreur réseau."); }
}

function editProjectItem(type, id, extraParam = null) {
    let item = type === 'changelog' ? projectData.changelog.find(x => x.id === id) : type === 'backlog' ? projectData.backlog.find(x => x.id === id) : projectData.propositions.find(x => x.id === id);
    if (!item) return;
    let extraHtml = '';
    if (type === 'backlog') extraHtml = `<label class="font-fredoka font-bold text-retro-slate text-sm block mb-1 mt-4">Priorité :</label><select id="modal-edit-prio" class="w-full bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer"><option value="1" ${extraParam===1?'selected':''}>1 - Urgent</option><option value="2" ${extraParam===2?'selected':''}>2 - Important</option><option value="3" ${extraParam===3?'selected':''}>3 - À faire</option><option value="4" ${extraParam===4?'selected':''}>4 - Pour plus tard</option><option value="5" ${extraParam===5?'selected':''}>5 - Bonus</option></select>`;
    openRetroModal('Modifier l\'entrée', `<label class="font-fredoka font-bold text-retro-slate text-sm block mb-1">Texte :</label><textarea id="modal-edit-text" rows="5" class="w-full bg-white border-2 border-retro-slate rounded-xl p-3 font-outfit focus:border-retro-coral outline-none resize-y">${escapeHtml(item.content)}</textarea>${extraHtml}`, '<i class="fa-solid fa-floppy-disk"></i> Enregistrer', 'bg-retro-mint text-white', async () => {
        const newText = document.getElementById('modal-edit-text').value.trim(); if (!newText) return showToast("Erreur", "Le texte ne peut pas être vide.");
        await submitProjectItem(type, 'update', id, newText, type === 'backlog' ? (parseInt(document.getElementById('modal-edit-prio').value) || 3) : extraParam);
    });
}

function deleteProjectItem(type, id) { openRetroModal('Confirmation de suppression', '<p class="font-bold">Voulez-vous vraiment supprimer cet élément ?</p><p class="text-sm opacity-80">Cette action est irréversible.</p>', '<i class="fa-solid fa-trash"></i> Supprimer', 'bg-retro-coral text-white', async () => { try { const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/manage_${type === 'propositions' ? 'proposition' : type}`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: localStorage.getItem('alliance_session_token'), p_action: 'delete', p_id: id }) }); if (res.ok) { showToast("Succès", "Élément supprimé."); loadProjectTab(); } } catch (e) { alert("❌ Erreur."); } }); }

function acceptProposition(id) {
    const prop = projectData.propositions.find(x => x.id === id); if (!prop) return;
    openRetroModal('Accepter la proposition', `<p class="mb-4 text-sm">Vous allez transférer l'idée de <strong>${escapeHtml(prop.pseudo)}</strong> vers le Backlog. Choisissez sa priorité d'intégration :</p><label class="font-fredoka font-bold text-retro-slate text-sm block mb-1">Priorité :</label><select id="modal-accept-prio" class="w-full bg-white border-2 border-retro-slate rounded-xl p-2 font-outfit outline-none cursor-pointer"><option value="1">1 - Urgent</option><option value="2">2 - Important</option><option value="3" selected>3 - À faire</option><option value="4">4 - Pour plus tard</option><option value="5">5 - Bonus</option></select>`, '<i class="fa-solid fa-check"></i> Valider & Transférer', 'bg-retro-mint text-white', async () => {
        await submitProjectItem('backlog', 'add', null, `💡 Idée de ${prop.pseudo} :\n${prop.content}`, parseInt(document.getElementById('modal-accept-prio').value) || 3);
        await changePropStatus(id, 'accepted');
    });
}

async function changePropStatus(id, newStatus) { try { const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/manage_proposition`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: localStorage.getItem('alliance_session_token'), p_action: 'status', p_id: id, p_status: newStatus }) }); if (res.ok) { showToast("Succès", "Statut mis à jour."); loadProjectTab(); } } catch (e) { alert("❌ Erreur."); } }
