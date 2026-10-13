<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alliance V — Gestion des Convois</title>
    <script src="config.js"></script>
    <style>
        :root {
            --primary: #2980b9;
            --accent: #e67e22;
            --success: #27ae60;
            --danger: #c0392b;
            --bg: #f4f6f7;
            --card: #ffffff;
            --text: #2c3e50;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .main-container {
            width: 100%;
            max-width: 650px;
            background: var(--card);
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
        }
        h1 { font-size: 1.4rem; color: var(--primary); margin-top: 0; text-align: center; }
        .token-box {
            background: #ebf5fb;
            border: 1px solid #aed6f1;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .token-btn {
            display: inline-block;
            background: var(--primary);
            color: #fff;
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.85rem;
            margin-top: 5px;
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin: 8px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 0.95rem;
        }
        button.btn-primary {
            width: 100%;
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;
        }
        .nav-tabs { display: flex; gap: 10px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
        .tab-btn { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; background: #ecf0f1; color: #2c3e50; }
        .tab-btn.active { background: var(--primary); color: white; }
        
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9f9; }
        .badge { padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; color: white; }
        .badge-pending { background: var(--accent); }
        .badge-failed { background: var(--danger); }
        .badge-success { background: var(--success); }
        .btn-action { padding: 4px 10px; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold; text-decoration: none; font-size: 11px; }
    </style>
</head>
<body>

    <div class="main-container">
        <h1>📦 Convois Alliance V</h1>

        <!-- Zone de Connexion Token -->
        <div id="auth-section" class="token-box">
            <strong>1. Récupération du Token Fourmizzz :</strong><br>
            <a href="https://s5.fourmizzz.fr/api.php?getToken" target="_blank" class="token-btn">🔑 Cliquer ici pour obtenir mon Token</a>
            
            <br><br>
            <strong>2. Coller le Token ci-dessous :</strong>
            <input type="text" id="token-input" placeholder="Ex: 6ace5bb10f2a6">
            <button class="btn-primary" onclick="handleAuth()">Accéder aux Convois</button>
        </div>

        <!-- Dashboard principal (affiché après saisie du token) -->
        <div id="dashboard-section" style="display:none;">
            <div class="nav-tabs">
                <button id="tab-active-btn" class="tab-btn active" onclick="switchTab('active')">En cours</button>
                <button id="tab-history-btn" class="tab-btn" onclick="switchTab('history')">📜 Historique</button>
                <button class="tab-btn" style="margin-left:auto; background:#95a5a6; color:white;" onclick="logout()">Changer de Token</button>
            </div>

            <div id="content-area">Chargement...</div>
        </div>
    </div>

    <script>
        let currentToken = '';
        let activeTab = 'active';

        window.onload = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (token) {
                document.getElementById('token-input').value = token;
                handleAuth();
            }
        };

        function handleAuth() {
            const input = document.getElementById('token-input').value.trim();
            if (!input) return alert("Veuillez saisir un token Fourmizzz valide.");
            
            currentToken = input;
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('dashboard-section').style.display = 'block';
            
            loadTabContent();
        }

        function switchTab(tab) {
            activeTab = tab;
            document.getElementById('tab-active-btn').className = `tab-btn ${tab === 'active' ? 'active' : ''}`;
            document.getElementById('tab-history-btn').className = `tab-btn ${tab === 'history' ? 'active' : ''}`;
            loadTabContent();
        }

        async function loadTabContent() {
            const contentDiv = document.getElementById('content-area');
            contentDiv.innerHTML = "<p style='text-align:center;'>Vérification du token et chargement des données...</p>";

            const rpcEndpoint = activeTab === 'active' ? 'get_my_convoys' : 'get_my_convoy_history';

            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpcEndpoint}`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_token: currentToken })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Erreur de validation Supabase.");
                }

                if (activeTab === 'active') {
                    renderActiveConvoys(data);
                } else {
                    renderHistoryConvoys(data);
                }

            } catch (err) {
                alert("❌ Erreur : " + err.message);
                logout();
            }
        }

        function renderActiveConvoys(convoys) {
            const contentDiv = document.getElementById('content-area');
            const toSend = convoys.filter(c => c.is_sender);
            const toReceive = convoys.filter(c => !c.is_sender);

            let html = `<h3 style="color:var(--accent);">📤 Convois à envoyer</h3>`;
            html += renderTable(toSend, true);

            html += `<h3 style="color:var(--success); margin-top:20px;">📥 Convois à recevoir</h3>`;
            html += renderTable(toReceive, false);

            contentDiv.innerHTML = html;
        }

        function renderTable(list, isSender) {
            if (list.length === 0) return `<p style="color:#7f8c8d; font-style:italic;">Aucun convoi dans cette catégorie.</p>`;

            let html = `<table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Joueur</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        ${isSender ? '<th>Action</th>' : ''}
                    </tr>
                </thead>
                <tbody>`;

            list.forEach(c => {
                const target = isSender ? c.to_player_pseudo : c.from_player_pseudo;
                const targetId = isSender ? c.to_player_id : c.from_player_id;
                const isFailed = c.status === 'failed';
                
                const statusBadge = isFailed 
                    ? `<span class="badge badge-failed">⚠️ Échoué</span>`
                    : `<span class="badge badge-pending">En attente</span>`;

                const actionBtn = isSender ? `
                    <a href="https://s5.fourmizzz.fr/commerce.php?ID=${targetId}&auto_convoy_id=${c.id}&auto_amount=${c.amount}" 
                       target="_blank" 
                       class="btn-action" 
                       style="background:${isFailed ? 'var(--danger)' : 'var(--accent)'};">
                        ${isFailed ? '🔄 Réessayer' : '🚀 Envoyer'}
                    </a>
                ` : '';

                html += `<tr>
                    <td>${c.balance_date}</td>
                    <td><strong>${escapeHtml(target)}</strong></td>
                    <td><strong>${Number(c.amount).toLocaleString('fr-FR')}</strong> Bois</td>
                    <td>${statusBadge}</td>
                    ${isSender ? `<td>${actionBtn}</td>` : ''}
                </tr>`;
            });

            return html + `</tbody></table>`;
        }

        function renderHistoryConvoys(historyList) {
            const contentDiv = document.getElementById('content-area');
            if (historyList.length === 0) {
                contentDiv.innerHTML = `<p style="color:#7f8c8d; font-style:italic;">Aucun convoi complété récemment.</p>`;
                return;
            }

            let html = `<table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Partenaire</th>
                        <th>Montant</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>`;

            historyList.forEach(c => {
                const target = c.is_sender ? c.to_player_pseudo : c.from_player_pseudo;
                const typeText = c.is_sender ? '📤 Envoyé' : '📥 Reçu';

                html += `<tr>
                    <td>${c.balance_date}</td>
                    <td><strong>${typeText}</strong></td>
                    <td><strong>${escapeHtml(target)}</strong></td>
                    <td>${Number(c.amount).toLocaleString('fr-FR')} Bois</td>
                    <td><span class="badge badge-success">✅ Complété</span></td>
                </tr>`;
            });

            contentDiv.innerHTML = html + `</tbody></table>`;
        }

        function escapeHtml(str) {
            return str ? String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])) : '';
        }

        function logout() {
            currentToken = '';
            document.getElementById('token-input').value = '';
            document.getElementById('auth-section').style.display = 'block';
            document.getElementById('dashboard-section').style.display = 'none';
        }
    </script>
</body>
</html>
