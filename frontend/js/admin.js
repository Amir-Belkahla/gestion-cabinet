let logPage = 1;
let debounceTimer = null;

// Exposer les fonctions
window.showTab = showTab;
window.loadLogs = loadLogs;
window.loadParams = loadParams;
window.saveParam = saveParam;
window.debounce = debounce;

function debounce(fn, delay) {
  return () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(fn, delay); };
}

function showTab(name) {
  // Update Buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`btn-tab-${name}`);
  if (btn) btn.classList.add('active');

  // Update Content
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  const content = document.getElementById(`tab-${name}`);
  if (content) content.style.display = 'block';

  if (name === 'logs')   loadLogs();
  if (name === 'params') loadParams();
  
  if (window.lucide) lucide.createIcons();
}

async function loadLogs(page = 1) {
  logPage = page;
  const tbody  = document.getElementById('log-tbody');
  if (!tbody) return;

  const action = document.getElementById('f-log-action')?.value.trim();
  const date   = document.getElementById('f-log-date')?.value;
  
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:100px"><div class="spinner"></div></td></tr>';

  try {
    const params = { page, limit: 20 };
    if (action) params.action = action;
    if (date)   params.date   = date;
    
    const res   = await API.get('/api/admin/logs', params);
    const result = res.data || {};
    const logs  = result.data || [];
    const total = result.total || 0;

    const totalText = document.getElementById('log-total-text');
    if (totalText) totalText.textContent = `${total} entrée(s) trouvée(s)`;
    
    renderLogPag(total, 20, page);

    tbody.innerHTML = logs.length ? logs.map(l => `
      <tr>
        <td style="white-space:nowrap; font-weight:600; color:var(--primary)">${formatDateTime(l.created_at)}</td>
        <td>
            <div style="font-weight:600">${l.utilisateur_nom ? l.utilisateur_nom + ' ' + l.utilisateur_prenom : 'Système'}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">User ID: ${l.utilisateur_id || '—'}</div>
        </td>
        <td><span class="log-action-badge">${l.action}</span></td>
        <td style="font-size:0.85rem">${l.table_concernee || '<span class="text-muted">—</span>'}</td>
        <td style="font-family:monospace; font-size:0.8rem">${l.adresse_ip || '—'}</td>
        <td>
            <div style="font-size:0.8rem; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title="${l.details || ''}">
                ${l.details || '—'}
            </div>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon"><i data-lucide="database"></i></div><p>Aucun journal trouvé</p></div></td></tr>';
    
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);padding:1.5rem;text-align:center">${e.message}</td></tr>`;
  }
}

function renderLogPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const container = document.getElementById('log-pag');
  if (!container || pages <= 1) { if(container) container.innerHTML = ''; return; }
  
  let html = `<button class="page-link" ${page===1?'disabled':''} onclick="loadLogs(${page-1})"><i data-lucide="chevron-left"></i></button>`;
  for (let i = 1; i <= Math.min(pages, 10); i++) {
    html += `<button class="page-link ${i===page?'active':''}" onclick="loadLogs(${i})">${i}</button>`;
  }
  if (pages > 10) html += `<span style="padding:0 10px">...</span><button class="page-link" onclick="loadLogs(${pages})">${pages}</button>`;
  html += `<button class="page-link" ${page===pages?'disabled':''} onclick="loadLogs(${page+1})"><i data-lucide="chevron-right"></i></button>`;
  
  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

async function loadParams() {
  const container = document.getElementById('params-list');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:100px"><div class="spinner"></div></div>';

  try {
    const res    = await API.get('/api/admin/parametres');
    const params = res.data || [];
    
    if (!params.length) { 
        container.innerHTML = '<div class="empty-state" style="padding:100px"><p>Aucun paramètre configuré</p></div>'; 
        return; 
    }

    container.innerHTML = params.map(p => `
      <div class="param-item" id="param-${p.cle}">
        <div class="param-label">
          <h4>${p.cle}</h4>
          <p>${p.description || 'Paramètre de configuration système'}</p>
        </div>
        <div class="param-input">
          <input type="text" id="param-val-${p.cle}" class="form-control" value="${p.valeur||''}" placeholder="Valeur...">
        </div>
        <div class="param-action">
          <button class="btn btn-primary btn-sm" onclick="saveParam('${p.cle}')">
            <i data-lucide="save" style="width:16px"></i> Mettre à jour
          </button>
        </div>
      </div>`).join('');
      
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    container.innerHTML = `<div style="color:var(--danger);padding:3rem;text-align:center">${e.message}</div>`;
  }
}

async function saveParam(cle) {
  const input = document.getElementById(`param-val-${cle}`);
  if (!input) return;
  const val = input.value;
  try {
    await API.put(`/api/admin/parametres/${encodeURIComponent(cle)}`, { valeur: val });
    Toast.success(`Configuration "${cle}" enregistrée`);
  } catch (e) { Toast.error(e.message); }
}

// Sécurité Admin
if (!Auth.can('admin')) {
  Toast.error('Accès réservé aux administrateurs');
  location.href = 'dashboard.html';
} else {
  loadLogs();
}
