let logPage = 1;
let debounceTimer = null;

function debounce(fn, delay) {
  return () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(fn, delay); };
}

function showTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.getElementById(`tab-${name}`).style.display = 'block';
  event.currentTarget.classList.add('active');
  if (name === 'logs')   loadLogs();
  if (name === 'params') loadParams();
}

async function loadLogs(page = 1) {
  logPage = page;
  const tbody  = document.getElementById('log-tbody');
  const action = document.getElementById('f-log-action').value.trim();
  const date   = document.getElementById('f-log-date').value;
  tbody.innerHTML = '<tr><td colspan="6"><div class="loading-overlay"><span class="spinner"></span></div></td></tr>';

  try {
    const params = { page, limit: 20 };
    if (action) params.action = action;
    if (date)   params.date   = date;
    const res   = await API.get('/api/admin/logs', params);
    const logs  = res.data.data || [];
    const total = res.data.total;
    document.getElementById('log-total-text').textContent = `${total} entrée(s)`;
    renderLogPag(total, 20, page);

    tbody.innerHTML = logs.length ? logs.map(l => `
      <tr>
        <td style="white-space:nowrap">${formatDateTime(l.created_at)}</td>
        <td>${l.utilisateur_nom ? l.utilisateur_nom + ' ' + l.utilisateur_prenom : '—'}</td>
        <td><code>${l.action}</code></td>
        <td>${l.table_concernee || '—'}</td>
        <td style="font-size:.8rem">${l.adresse_ip || '—'}</td>
        <td style="font-size:.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.details || '—'}</td>
      </tr>`).join('')
    : '<tr><td colspan="6"><div class="empty-state"><p>Aucun log</p></div></td></tr>';
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);padding:1rem">${e.message}</td></tr>`;
  }
}

function renderLogPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const c = document.getElementById('log-pag');
  if (pages <= 1) { c.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${page===1?'disabled':''} onclick="loadLogs(${page-1})">‹</button>`;
  for (let i = 1; i <= Math.min(pages, 10); i++) html += `<button class="page-btn ${i===page?'active':''}" onclick="loadLogs(${i})">${i}</button>`;
  html += `<button class="page-btn" ${page===pages?'disabled':''} onclick="loadLogs(${page+1})">›</button>`;
  c.innerHTML = html;
}

async function loadParams() {
  const container = document.getElementById('params-list');
  try {
    const res    = await API.get('/api/admin/parametres');
    const params = res.data || [];
    if (!params.length) { container.innerHTML = '<p>Aucun paramètre</p>'; return; }
    container.innerHTML = params.map(p => `
      <div class="param-row" id="param-${p.cle}" style="display:flex;align-items:center;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--border)">
        <div style="flex:0 0 220px">
          <div style="font-weight:600;font-size:.9rem">${p.cle}</div>
          ${p.description ? `<div style="font-size:.8rem;color:var(--text-light)">${p.description}</div>` : ''}
        </div>
        <input type="text" id="param-val-${p.cle}" class="form-control" value="${p.valeur||''}" style="flex:1">
        <button class="btn btn-outline-primary btn-sm" onclick="saveParam('${p.cle}')">💾</button>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`;
  }
}

async function saveParam(cle) {
  const val = document.getElementById(`param-val-${cle}`).value;
  try {
    await API.put(`/api/admin/parametres/${encodeURIComponent(cle)}`, { valeur: val });
    Toast.success(`Paramètre "${cle}" mis à jour`);
  } catch (e) { Toast.error(e.message); }
}

// Vérifier admin
if (!Auth.can('admin')) {
  Toast.error('Accès réservé aux administrateurs');
  location.href = 'dashboard.html';
} else {
  loadLogs();
}
