let mapPlayersData = [], mapSelectedGroup = -1, mapSearchQuery = '';
let zoomLevel = 1, panX = 0, panY = 0, isDragging = false, dragStartX = 0, dragStartY = 0;
const GROUP_COLORS = ['#ff6f61', '#f4d03f', '#3aafa9', '#8ba888', '#e74c3c', '#9b59b6', '#3498db', '#f39c12', '#1abc9c', '#d35400'];

async function loadMapTab() {
    const sessionToken = localStorage.getItem('alliance_session_token');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_alliance_map_data`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_session_token: sessionToken }) });
        if (!res.ok) return logout();
        mapPlayersData = await res.json();
        const groupsSet = new Set(mapPlayersData.map(p => p.group_id).filter(g => g >= 0));
        renderMapUI(Array.from(groupsSet).sort((a, b) => a - b));
    } catch (e) { logout(); }
}

function renderMapUI(groups) {
    const contentDiv = document.getElementById('content-area');
    let filterButtons = `<button class="map-filter-btn ${mapSelectedGroup === -1 ? 'active' : ''}" onclick="setMapGroupFilter(-1)">🌐 Alliance entière</button>`;
    groups.forEach(g => {
        const color = g === 0 ? '#94a3b8' : GROUP_COLORS[(g - 1) % GROUP_COLORS.length];
        filterButtons += `<button class="map-filter-btn ${mapSelectedGroup === g ? 'active' : ''}" style="border-color:${color};" onclick="setMapGroupFilter(${g})">${g === 0 ? 'Hors-chaîne' : `Groupe #${g}`}</button>`;
    });

    contentDiv.innerHTML = `
        <div class="flex flex-col items-center w-full">
            <div class="flex items-center gap-3 mb-6 w-full max-w-3xl"><div class="w-12 h-12 bg-retro-avocado border-2 border-retro-slate rounded-full flex items-center justify-center text-white shadow-retro-sm text-xl"><i class="fa-solid fa-map"></i></div><h3 class="font-shrikhand text-2xl text-retro-slate m-0 leading-none">Cartographie</h3></div>
            <div class="map-controls"><input type="text" class="map-search" placeholder="🔍 Localiser un joueur..." value="${escapeHtml(mapSearchQuery)}" oninput="setMapSearch(this.value)"><div class="flex gap-2 flex-wrap justify-end">${filterButtons}</div></div>
            <div class="w-full max-w-3xl relative tv-screen">
                <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-retro-slate/10 z-10"></div>
                <canvas id="alliance-map" width="700" height="600" class="w-full h-auto cursor-grab active:cursor-grabbing"></canvas>
                <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-20"><button class="map-tool-btn" onclick="zoomMap(1.25)" title="Zoom Avant"><i class="fa-solid fa-magnifying-glass-plus text-base"></i></button><button class="map-tool-btn" onclick="zoomMap(0.8)" title="Zoom Arrière"><i class="fa-solid fa-magnifying-glass-minus text-base"></i></button><button class="map-tool-btn" onclick="resetMapTransform()" title="Recalibrer"><i class="fa-solid fa-compress text-base"></i></button></div>
                <div id="map-tooltip" class="absolute bg-[#f9f7f1] text-[#1d2d44] p-3 rounded-xl border-4 border-[#1d2d44] text-xs hidden z-30 shadow-retro pointer-events-none font-outfit font-bold"></div>
            </div>
            <div class="font-fredoka text-xs text-retro-slate/60 mt-4 font-bold uppercase tracking-wider"><i class="fa-solid fa-lightbulb text-retro-yellow"></i> Utilisez la molette pour zoomer et glissez la carte pour explorer.</div>
        </div>`;
    initMapCanvasEvents(); drawMap();
}

function setMapGroupFilter(groupId) { mapSelectedGroup = groupId; const groupsSet = new Set(mapPlayersData.map(p => p.group_id).filter(g => g >= 0)); renderMapUI(Array.from(groupsSet).sort((a, b) => a - b)); }
function setMapSearch(query) { mapSearchQuery = query.toLowerCase().trim(); drawMap(); }
function zoomMap(factor) { zoomLevel = Math.max(0.8, Math.min(zoomLevel * factor, 5)); drawMap(); }
function resetMapTransform() { zoomLevel = 1; panX = 0; panY = 0; drawMap(); }

function initMapCanvasEvents() {
    const canvas = document.getElementById('alliance-map'); const tooltip = document.getElementById('map-tooltip');
    if (!canvas) return;
    canvas.onwheel = (e) => { e.preventDefault(); zoomLevel = Math.max(0.8, Math.min(zoomLevel * (e.deltaY < 0 ? 1.15 : 0.85), 5)); drawMap(); };
    canvas.onmousedown = (e) => { isDragging = true; dragStartX = e.clientX - panX; dragStartY = e.clientY - panY; };
    window.onmousemove = (e) => {
        if (isDragging) { panX = e.clientX - dragStartX; panY = e.clientY - dragStartY; drawMap(); return; }
        if (canvas) {
            const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX; const mouseY = (e.clientY - rect.top) * scaleY;
            const found = mapPlayersData.find(p => { if (p._cx === undefined) return false; const dx = p._cx - mouseX; const dy = p._cy - mouseY; return (dx * dx + dy * dy) <= 120; });
            if (found && tooltip) {
                tooltip.style.display = 'block'; tooltip.style.left = `${(mouseX / scaleX) + 15}px`; tooltip.style.top = `${(mouseY / scaleY) - 10}px`;
                tooltip.innerHTML = `<div class="border-b-2 border-[#1d2d44] pb-1 mb-1"><strong class="font-fredoka text-sm text-[#ff6f61]">${escapeHtml(found.pseudo)}</strong></div>Groupe ${found.group_id === 0 ? 'Hors-chaîne' : `#${found.group_id}`}<br>Coords : (${found.x}, ${found.y})`;
            } else if (tooltip) tooltip.style.display = 'none';
        }
    };
    window.onmouseup = () => { isDragging = false; }; canvas.onmouseleave = () => { if (tooltip) tooltip.style.display = 'none'; };
}

function drawMap() {
    const canvas = document.getElementById('alliance-map'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
    let minX = 0, maxX = 100, minY = 0, maxY = 100; const padding = 70; const mapWidth = canvas.width - (padding * 2); const mapHeight = canvas.height - (padding * 2);
    ctx.save(); ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY); ctx.scale(zoomLevel, zoomLevel); ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.strokeStyle = 'rgba(29, 45, 68, 0.15)'; ctx.lineWidth = 1 / zoomLevel;
    for (let i = -canvas.width; i <= canvas.width * 2; i += 50) { ctx.beginPath(); ctx.moveTo(i, -canvas.height); ctx.lineTo(i, canvas.height * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-canvas.width, i); ctx.lineTo(canvas.width * 2, i); ctx.stroke(); }
    ctx.strokeStyle = '#1d2d44'; ctx.lineWidth = 3 / zoomLevel; ctx.strokeRect(padding - 15, padding - 15, mapWidth + 30, mapHeight + 30);
    ctx.fillStyle = '#1d2d44'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${Math.max(10, 13 / zoomLevel)}px 'Fredoka'`;
    for (let i = 0; i <= 4; i++) {
        const val = i * 25; const plotX = padding + mapWidth * (i / 4); const plotY = padding + mapHeight * (i / 4);
        ctx.fillText(val, plotX, padding - 28); ctx.fillText(val, plotX, padding + mapHeight + 28); ctx.fillText(val, padding - 38, plotY); ctx.fillText(val, padding + mapWidth + 38, plotY);
        ctx.beginPath(); ctx.moveTo(plotX, padding - 15); ctx.lineTo(plotX, padding - 5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(plotX, padding + mapHeight + 15); ctx.lineTo(plotX, padding + mapHeight + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padding - 15, plotY); ctx.lineTo(padding - 5, plotY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(padding + mapWidth + 15, plotY); ctx.lineTo(padding + mapWidth + 5, plotY); ctx.stroke();
    }
    const showLabels = (mapSelectedGroup !== -1) || (zoomLevel > 1.6) || (mapSearchQuery.length > 0); const drawnRects = []; 
    mapPlayersData.forEach(p => {
        const normX = padding + ((p.x - minX) / (maxX - minX)) * mapWidth; const normY = padding + ((p.y - minY) / (maxY - minY)) * mapHeight;
        const screenX = (normX - canvas.width / 2) * zoomLevel + canvas.width / 2 + panX; const screenY = (normY - canvas.height / 2) * zoomLevel + canvas.height / 2 + panY;
        p._cx = screenX; p._cy = screenY;
        const isHighlight = (mapSelectedGroup === -1 || p.group_id === mapSelectedGroup) && (mapSearchQuery === '' || p.pseudo.toLowerCase().includes(mapSearchQuery)); 
        ctx.beginPath(); ctx.arc(normX, normY, isHighlight ? 7 : 4, 0, Math.PI * 2); ctx.fillStyle = isHighlight ? (p.group_id > 0 ? GROUP_COLORS[(p.group_id - 1) % GROUP_COLORS.length] : '#94a3b8') : 'rgba(29, 45, 68, 0.1)'; ctx.fill(); 
        if (isHighlight) {
            ctx.strokeStyle = '#1d2d44'; ctx.lineWidth = 2.5 / zoomLevel; ctx.stroke();
            if (showLabels) { 
                ctx.font = `bold ${Math.max(10, 12 / zoomLevel)}px 'Fredoka'`; const tw = ctx.measureText(p.pseudo).width; const th = 14 / zoomLevel;
                const positions = [{x: normX + 12, y: normY, align: 'left', base: 'middle'}, {x: normX, y: normY + 14, align: 'center', base: 'top'}, {x: normX, y: normY - 14, align: 'center', base: 'bottom'}, {x: normX - 12, y: normY, align: 'right', base: 'middle'}];
                for (let pos of positions) {
                    let rx = pos.x, ry = pos.y; if (pos.align === 'center') rx -= tw/2; if (pos.align === 'right') rx -= tw; if (pos.base === 'middle') ry -= th/2; if (pos.base === 'bottom') ry -= th;
                    const rect = {x: rx - 2, y: ry - 2, w: tw + 4, h: th + 4}; let overlap = false;
                    for (let dr of drawnRects) { if (!(rect.x > dr.x + dr.w || rect.x + rect.w < dr.x || rect.y > dr.y + dr.h || rect.y + rect.h < dr.y)) { overlap = true; break; } }
                    if (!overlap) { ctx.textAlign = pos.align; ctx.textBaseline = pos.base; ctx.fillStyle = '#1d2d44'; ctx.strokeStyle = '#f2ead0'; ctx.lineWidth = 3 / zoomLevel; ctx.strokeText(p.pseudo, pos.x, pos.y); ctx.fillText(p.pseudo, pos.x, pos.y); drawnRects.push(rect); break; }
                }
            }
        }
    });
    ctx.restore();
}
