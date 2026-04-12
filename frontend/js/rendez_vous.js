let rdvPage = 1;

async function init() {
  // Date par défaut = aujourd'hui
  document.getElementById('filter-date').value = new Date().toISOString().split('T')[0];

  // Masquer sélection patient pour les patients
  if (Auth.can('patient')) {
    const pg = document.getElementById('patient-group');
    if (pg) pg.style.display = 'none';
    const filterMedWrap = document.getElementById('filter-medecin-wrap');
    if (filterMedWrap) filterMedWrap.style.display = 'none';
  }

  await loadMedecins();
  await loadRdv();
}

async function loadMedecins() {
  try {
    const res = await API.get('/api/medecins');
    const medecins = res.data || [];

    const sel = document.getElementById('filter-medecin');
    const rdvSel = document.getElementById('rdv-medecin');

    medecins.forEach(m => {
      const opt1 = new Option(`Dr ${m.nom_complet}${m.specialite ? ' ('+m.specialite+')' : ''}`, m.id);
      const opt2 = new Option(`Dr ${m.nom_complet}${m.specialite ? ' ('+m.specialite+')' : ''}`, m.id);
      if (sel) sel.appendChild(opt1);
      if (rdvSel) rdvSel.appendChild(opt2);
    });
  } catch {}
}

async function loadRdv(page = 1) {
  rdvPage = page;
  const tbody = document.getElementById('rdv-tbody');
  tbody.innerHTML = '<tr><td colspan="7"><div class="loading-overlay"><span class="spinner"></span></div></td></tr>';

  try {
    let res;
    const params = { page, limit: 15 };

    if (Auth.can('patient')) {
      res = await API.get('/api/rendez-vous/mes-rdv');
      const rdvs = res.data || [];
      renderRows(rdvs);
      return;
    }

    const date    = document.getElementById('filter-date').value;
    const medecin = document.getElementById('filter-medecin')?.value;
    const statut  = document.getElementById('filter-statut').value;

    if (date)    params.date = date;
    if (medecin) params.medecin_id = medecin;
    if (statut)  params.statut = statut;

    res = await API.get('/api/rendez-vous', params);
    const { data, total, limit } = res.data;
    renderRows(data);
    renderPag(total, limit, page);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);text-align:center;padding:1rem">${e.message}</td></tr>`;
  }
}

function renderRows(rdvs) {
  const tbody = document.getElementById('rdv-tbody');
  const isPatient = Auth.can('patient');

  tbody.innerHTML = rdvs.length ? rdvs.map(r => `
    <tr>
      <td>${formatDate(r.date_rdv)}</td>
      <td>${r.heure_debut}–${r.heure_fin}</td>
      <td>${isPatient ? '' : (r.patient_nom || '—')}</td>
      <td>Dr ${r.medecin_nom}<br><small class="text-muted">${r.specialite || ''}</small></td>
      <td>${r.motif || '—'}</td>
      <td>${badgeStatut(r.statut)}</td>
      <td style="display:flex;gap:.35rem;flex-wrap:wrap">
        ${Auth.can('admin','secretaire') && r.statut === 'planifie' ? `<button class="btn btn-success btn-sm" onclick="changeStatut(${r.id},'confirmer')">✓ Confirmer</button>` : ''}
        ${Auth.can('admin','medecin') && r.statut === 'confirme' ? `<button class="btn btn-info btn-sm" onclick="changeStatut(${r.id},'terminer')">✓ Terminer</button>` : ''}
        ${r.statut !== 'annule' && r.statut !== 'termine' ? `<button class="btn btn-danger btn-sm" onclick="annulerRdv(${r.id})">✕ Annuler</button>` : ''}
        ${Auth.can('admin','secretaire') ? `<button class="btn btn-outline-primary btn-sm" onclick="editRdv(${r.id})">✏️</button>` : ''}
        ${Auth.can('admin') ? `<button class="btn btn-ghost btn-sm" onclick="deleteRdv(${r.id})">🗑️</button>` : ''}
      </td>
    </tr>`).join('')
  : `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📅</div><p>Aucun rendez-vous</p></div></td></tr>`;
}

function renderPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const c = document.getElementById('pagination');
  if (pages <= 1) { c.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${page===1?'disabled':''} onclick="loadRdv(${page-1})">‹</button>`;
  for (let i = 1; i <= pages; i++) html += `<button class="page-btn ${i===page?'active':''}" onclick="loadRdv(${i})">${i}</button>`;
  html += `<button class="page-btn" ${page===pages?'disabled':''} onclick="loadRdv(${page+1})">›</button>`;
  c.innerHTML = html;
}

async function openRdvModal(rdv = null) {
  // Reset
  document.getElementById('rdv-id').value = '';
  document.getElementById('rdv-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('rdv-debut').value = '09:00';
  document.getElementById('rdv-fin').value = '09:30';
  document.getElementById('rdv-motif').value = '';
  document.getElementById('rdv-notes').value = '';
  document.getElementById('rdv-modal-title').textContent = rdv ? 'Modifier RDV' : 'Nouveau RDV';

  // Charger patients si non patient
  if (!Auth.can('patient')) {
    const rdvPatSel = document.getElementById('rdv-patient');
    rdvPatSel.innerHTML = '<option value="">Choisir…</option>';
    try {
      const res = await API.get('/api/patients', { limit: 100 });
      res.data.data.forEach(p => {
        rdvPatSel.appendChild(new Option(`${p.nom} ${p.prenom}`, p.id));
      });
    } catch {}
  }

  if (rdv) {
    document.getElementById('rdv-id').value = rdv.id;
    if (!Auth.can('patient')) document.getElementById('rdv-patient').value = rdv.patient_id;
    document.getElementById('rdv-medecin').value = rdv.medecin_id;
    document.getElementById('rdv-date').value  = rdv.date_rdv;
    document.getElementById('rdv-debut').value = rdv.heure_debut;
    document.getElementById('rdv-fin').value   = rdv.heure_fin;
    document.getElementById('rdv-motif').value = rdv.motif || '';
    document.getElementById('rdv-notes').value = rdv.notes || '';
  }

  document.getElementById('modal-rdv').classList.add('show');
}

function closeRdvModal(e) {
  if (e && e.target !== document.getElementById('modal-rdv')) return;
  document.getElementById('modal-rdv').classList.remove('show');
}

async function editRdv(id) {
  try {
    const res = await API.get(`/api/rendez-vous/${id}`);
    openRdvModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function saveRdv() {
  const id   = document.getElementById('rdv-id').value;
  const data = {
    patient_id:  Auth.can('patient') ? undefined : document.getElementById('rdv-patient').value,
    medecin_id:  document.getElementById('rdv-medecin').value,
    date_rdv:    document.getElementById('rdv-date').value,
    heure_debut: document.getElementById('rdv-debut').value,
    heure_fin:   document.getElementById('rdv-fin').value,
    motif:       document.getElementById('rdv-motif').value,
    notes:       document.getElementById('rdv-notes').value,
  };

  try {
    if (id) {
      await API.put(`/api/rendez-vous/${id}`, data);
      Toast.success('Rendez-vous mis à jour');
    } else {
      await API.post('/api/rendez-vous', data);
      Toast.success('Rendez-vous créé');
    }
    closeRdvModal();
    loadRdv(rdvPage);
  } catch (e) { Toast.error(e.message); }
}

async function changeStatut(id, action) {
  try {
    await API.patch(`/api/rendez-vous/${id}/${action}`);
    Toast.success('Statut mis à jour');
    loadRdv(rdvPage);
  } catch (e) { Toast.error(e.message); }
}

async function annulerRdv(id) {
  if (!confirmDialog('Annuler ce rendez-vous ?')) return;
  await changeStatut(id, 'annuler');
}

async function deleteRdv(id) {
  if (!confirmDialog('Supprimer définitivement ce rendez-vous ?')) return;
  try {
    await API.del(`/api/rendez-vous/${id}`);
    Toast.success('Rendez-vous supprimé');
    loadRdv(rdvPage);
  } catch (e) { Toast.error(e.message); }
}

init();
