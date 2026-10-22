window.chatInterval = null;
let chatOldestId = null, chatLatestId = null, chatIsFetching = false, chatHasMore = true;

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr); const now = new Date(); const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return timeStr;
    const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month} -${timeStr}`;
}

async function loadChatTab(targetGroupId = null) {
    const sessionToken = localStorage.getItem('alliance_session_token');
    chatOldestId = null; chatLatestId = null; chatHasMore = true; chatIsFetching = false;
    if (targetGroupId !== null) chatSelectedGroupId = parseInt(targetGroupId); else if (chatSelectedGroupId === null) chatSelectedGroupId = currentUserAdminInfo.group_id || 1;
    try {
        let availableGroups = [];
        if (['superadmin', 'admin'].includes(currentUserAdminInfo.role)) {
            const groupsRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_available_groups`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' } });
            if (groupsRes.ok) availableGroups = await groupsRes.json();
        }
        renderChatBaseUI(chatSelectedGroupId, availableGroups);
        await fetchChatMessages(null, null, true);
        if (window.chatInterval) clearInterval(window.chatInterval);
        window.chatInterval = setInterval(() => { fetchChatMessages(null, chatLatestId, false); }, 5000);
    } catch (e) { console.error("Erreur Chat:", e); }
}

function renderChatBaseUI(currentGroupId, availableGroups) {
    const contentDiv = document.getElementById('group-content-area') || document.getElementById('content-area');
    let groupSelectorHtml = `Groupe #${currentGroupId}`;
    if (['superadmin', 'admin'].includes(currentUserAdminInfo.role)) {
        let options = availableGroups.filter(g => g.group_id > 0).map(g => `<option value="${g.group_id}" ${g.group_id == currentGroupId ? 'selected' : ''}>Groupe #${g.group_id}</option>`).join('');
        groupSelectorHtml = `<select class="group-select" onchange="loadChatTab(this.value)">${options}</select>`;
    }
    contentDiv.innerHTML = `
        <div class="flex items-center justify-between mb-4 mt-2"><h4 class="font-shrikhand text-xl text-retro-slate m-0"><i class="fa-solid fa-comments text-[#8e44ad] mr-2"></i> Canal de transmission : ${groupSelectorHtml}</h4></div>
        <div class="chat-container">
            <div id="chat-messages-box" class="chat-messages" onscroll="handleChatScroll()"><div id="chat-loader" class="text-center py-2 text-retro-slate/50 font-fredoka text-sm italic hidden">Récupération des archives...</div><div id="chat-content" class="flex flex-col gap-3"></div></div>
            <button id="chat-new-msg-pill" class="new-messages-pill" onclick="scrollToBottomChat()">⬇️ Nouveaux messages</button>
            <div class="chat-input-area"><input type="text" id="chat-input" placeholder="Saisissez votre transmission..." onkeypress="if(event.key === 'Enter') sendChatMessage()"><button class="chat-btn-send" onclick="sendChatMessage()"><i class="fa-solid fa-paper-plane"></i></button></div>
        </div>
    `;
}

async function fetchChatMessages(beforeId, afterId, isInitial = false) {
    if (chatIsFetching) return; chatIsFetching = true;
    const currentFetchGroupId = chatSelectedGroupId; const sessionToken = localStorage.getItem('alliance_session_token');
    const box = document.getElementById('chat-messages-box'); const loader = document.getElementById('chat-loader');
    if (beforeId && loader) loader.style.display = 'block';
    try {
        const bodyParams = { p_session_token: sessionToken, p_target_group_id: currentFetchGroupId, p_limit: 30 };
        if (beforeId) bodyParams.p_before_id = beforeId; if (afterId) bodyParams.p_after_id = afterId;
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_group_messages`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(bodyParams) });
        if (res.ok) {
            if (currentFetchGroupId !== chatSelectedGroupId) { chatIsFetching = false; return; }
            let messages = await res.json();
            if (messages && messages.length > 0) {
                messages.reverse();
                if (beforeId) {
                    chatOldestId = messages[0].message_id; const oldScrollHeight = box.scrollHeight;
                    appendMessagesToDOM(messages, true); box.scrollTop = box.scrollHeight - oldScrollHeight; 
                } else {
                    if (!chatOldestId) chatOldestId = messages[0].message_id; chatLatestId = messages[messages.length - 1].message_id;
                    const isNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100;
                    appendMessagesToDOM(messages, false);
                    if (isInitial || isNearBottom || !afterId) scrollToBottomChat(); else document.getElementById('chat-new-msg-pill').style.display = 'block';
                }
            } else if (beforeId) chatHasMore = false;
        }
    } catch (e) {}
    chatIsFetching = false; if (loader) loader.style.display = 'none';
}

function appendMessagesToDOM(messages, prepend) {
    const container = document.getElementById('chat-content'); let html = '';
    messages.forEach(m => {
        const dateHtml = `<span class="text-[0.65rem] text-retro-slate/60 mt-0.5">${formatChatTime(m.created_at)}</span>`;
        let colorClass = 'text-[#3498db]'; if (m.role === 'superadmin') colorClass = 'text-retro-coral'; else if (m.role === 'admin') colorClass = 'text-[#8e44ad]'; else if (m.role === 'chef_de_rang') colorClass = 'text-retro-mint-dark';
        const isMe = m.pseudo === currentUserAdminInfo.pseudo; const bubbleClass = isMe ? 'is-me' : 'is-other'; const metaClass = isMe ? 'is-me' : 'is-other';
        html += `<div class="chat-msg-bubble ${bubbleClass}"><div class="chat-meta ${metaClass}"><strong class="font-fredoka font-bold text-sm ${colorClass}">${escapeHtml(m.pseudo)}</strong>${dateHtml}</div><span class="text-sm font-outfit text-retro-slate leading-snug break-words">${escapeHtml(m.message).replace(/\n/g, '<br>')}</span></div>`;
    });
    if (prepend) container.insertAdjacentHTML('afterbegin', html); else container.insertAdjacentHTML('beforeend', html);
}

function handleChatScroll() {
    const box = document.getElementById('chat-messages-box'); if (!box || chatIsFetching) return;
    if (box.scrollTop < 50 && chatHasMore && chatOldestId) fetchChatMessages(chatOldestId, null, false);
    const isNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100; if (isNearBottom) document.getElementById('chat-new-msg-pill').style.display = 'none';
}

function scrollToBottomChat() { const box = document.getElementById('chat-messages-box'); if (box) box.scrollTop = box.scrollHeight; document.getElementById('chat-new-msg-pill').style.display = 'none'; }

async function sendChatMessage() {
    const input = document.getElementById('chat-input'); const msg = input.value.trim(); if (!msg) return;
    const sessionToken = localStorage.getItem('alliance_session_token'); input.value = '';
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/post_group_message`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: sessionToken, p_target_group_id: chatSelectedGroupId, p_message: msg }) });
        if (res.ok) { const checkAndFetch = () => { if (chatIsFetching) setTimeout(checkAndFetch, 500); else fetchChatMessages(null, chatLatestId, false).then(() => scrollToBottomChat()); }; checkAndFetch(); } else showToast("Erreur", "Transmission échouée.");
    } catch (e) { showToast("Erreur", "Réseau indisponible."); }
}
