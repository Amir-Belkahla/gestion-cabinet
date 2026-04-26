let rdvPage = 1;

// Exposer les fonctions globalement
window.loadRdv = loadRdv;
window.openRdvModal = openRdvModal;
window.closeRdvModal = closeRdvModal;
window.saveRdv = saveRdv;
window.editRdv = editRdv;
window.deleteRdv = deleteRdv;
window.changeStatut = changeStatut;
window.annulerRdv = annulerRdv;

async function init() {
  const filterDate = document.getElementById('filter-date');
  if (filterDate) filterDate.value = new Date().toISOString().split('T')[0];

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

    if (sel) {
        medecins.forEach(m => {
            const label = `Dr ${m.nom_complet}${m.specialite ? ' ('+m.specialite+')' : ''}`;
            sel.appendChild(new Option(label, m.id));
            if (rdvSel) rdvSel.appendChild(new Option(label, m.id));
        });
    }
  } catch {}
}

async function loadRdv(page = 1) {
  rdvPage = page;
  const tbody = document.getElementById('rdv-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:100px"><div class="spinner"></div></td></tr>';

  try {
    let res;
    const params = { page, limit: 15 };

    if (Auth.can('patient')) {
      res = await API.get('/api/rendez-vous/mes-rdv');
      renderRows(res.data || []);
      return;
    }

    const date    = document.getElementById('filter-date')?.value;
    const medecin = document.getElementById('filter-medecin')?.value;
    const statut  = document.getElementById('filter-statut')?.value;

    if (date)    params.date = date;
    if (medecin) params.medecin_id = medecin;
    if (statut)  params.statut = statut;

    res = await API.get('/api/rendez-vous', params);
    const result = res.data || {};
    renderRows(result.data || []);
    renderPag(result.total || 0, result.limit || 15, page);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);text-align:center;padding:1.5rem">${e.message}</td></tr>`;
  }
}

function renderRows(rdvs) {
  const tbody = document.getElementById('rdv-tbody');
  const isPatient = Auth.can('patient');

  tbody.innerHTML = rdvs.length ? rdvs.map(r => {
    const initials = isPatient ? '' : (r.patient_nom ? r.patient_nom.split(' ').map(n => n[0]).join('').toUpperCase() : '?');
    
    return `
    <tr>
      <td>
        <div class="rdv-time"><i data-lucide="clock" style="width:14px"></i> ${r.heure_debut} – ${r.heure_fin}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px">${formatDate(r.date_rdv)}</div>
      </td>
      <td>
        ${isPatient ? '<span class="text-muted">—</span>' : `
        <div class="patient-cell">
          <div class="patient-avatar">${initials}</div>
          <div style="font-weight:600">${r.patient_nom}</div>
        </div>`}
      </td>
      <td>
        <div style="font-weight:600">Dr ${r.medecin_nom}</div>
        <div style="font-size:0.8rem; color:var(--text-muted)">${r.specialite || ''}</div>
      </td>
      <td style="font-size:0.9rem">${r.motif || '<span class="text-muted">—</span>'}</td>
      <td>${badgeStatut(r.statut)}</td>
      <td>
        <div class="action-btns">
            ${Auth.can('admin','secretaire') && r.statut === 'planifie' ? `
                <button class="btn-icon" title="Confirmer" onclick="changeStatut(${r.id},'confirmer')" style="color:var(--success)">
                    <i data-lucide="check-circle"></i>
                </button>` : ''}
            ${Auth.can('admin','medecin') && r.statut === 'confirme' ? `
                <button class="btn-icon" title="Terminer" onclick="changeStatut(${r.id},'terminer')" style="color:var(--accent)">
                    <i data-lucide="check-square"></i>
                </button>` : ''}
            ${r.statut !== 'annule' && r.statut !== 'termine' ? `
                <button class="btn-icon" title="Annuler" onclick="annulerRdv(${r.id})" style="color:var(--warning)">
                    <i data-lucide="slash"></i>
                </button>` : ''}
            ${Auth.can('admin','secretaire') ? `
                <button class="btn-icon" title="Modifier" onclick="editRdv(${r.id})">
                    <i data-lucide="edit-2"></i>
                </button>` : ''}
            ${Auth.can('admin') ? `
                <button class="btn-icon" title="Supprimer" onclick="deleteRdv(${r.id})" style="color:var(--danger)">
                    <i data-lucide="trash-2"></i>
                </button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('')
  : `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon"><i data-lucide="calendar-x"></i></div><p>Aucun rendez-vous trouvé</p></div></td></tr>`;
  
  if (window.lucide) lucide.createIcons();
}

function renderPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const container = document.getElementById('pagination');
  if (!container || pages <= 1) { if(container) container.innerHTML = ''; return; }
  
  let html = `<button class="page-link" ${page===1?'disabled':''} onclick="loadRdv(${page-1})"><i data-lucide="chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-link ${i===page?'active':''}" onclick="loadRdv(${i})">${i}</button>`;
  }
  html += `<button class="page-link" ${page===pages?'disabled':''} onclick="loadRdv(${page+1})"><i data-lucide="chevron-right"></i></button>`;
  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

async function openRdvModal(rdv = null) {
  const overlay = document.getElementById('modal-rdv');
  if (!overlay) return;

  // Reset
  document.getElementById('rdv-id').value = '';
  document.getElementById('rdv-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('rdv-debut').value = '09:00';
  document.getElementById('rdv-fin').value = '09:30';
  document.getElementById('rdv-motif').value = '';
  document.getElementById('rdv-notes').value = '';
  document.getElementById('rdv-modal-title').textContent = rdv ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous';

  // Charger patients si non patient
  if (!Auth.can('patient')) {
    const rdvPatSel = document.getElementById('rdv-patient');
    if (rdvPatSel) {
        rdvPatSel.innerHTML = '<option value="">Choisir un patient…</option>';
        try {
          const res = await API.get('/api/patients', { limit: 100 });
          const patients = (res.data && res.data.data) ? res.data.data : [];
          patients.forEach(p => {
            rdvPatSel.appendChild(new Option(`${p.nom} ${p.prenom}`, p.id));
          });
          if (rdv) rdvPatSel.value = rdv.patient_id;
        } catch {}
    }
  }

  if (rdv) {
    document.getElementById('rdv-id').value = rdv.id;
    document.getElementById('rdv-medecin').value = rdv.medecin_id;
    document.getElementById('rdv-date').value  = rdv.date_rdv;
    document.getElementById('rdv-debut').value = rdv.heure_debut;
    document.getElementById('rdv-fin').value   = rdv.heure_fin;
    document.getElementById('rdv-motif').value = rdv.motif || '';
    document.getElementById('rdv-notes').value = rdv.notes || '';
  }

  overlay.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeRdvModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.btn-icon')) return;
  document.getElementById('modal-rdv').classList.remove('active');
}

async function editRdv(id) {
  try {
    const res = await API.get(`/api/rendez-vous/${id}`);
    openRdvModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function saveRdv() {
  const id = document.getElementById('rdv-id').value;
  const data = {
    patient_id:  Auth.can('patient') ? undefined : document.getElementById('rdv-patient').value,
    medecin_id:  document.getElementById('rdv-medecin').value,
    date_rdv:    document.getElementById('rdv-date').value,
    heure_debut: document.getElementById('rdv-debut').value,
    heure_fin:   document.getElementById('rdv-fin').value,
    motif:       document.getElementById('rdv-motif').value,
    notes:       document.getElementById('rdv-notes').value,
  };

  if ((!Auth.can('patient') && !data.patient_id) || !data.medecin_id || !data.date_rdv || !data.heure_debut) {
    Toast.error('Veuillez remplir les champs obligatoires');
    return;
  }

  try {
    if (id) {
      await API.put(`/api/rendez-vous/${id}`, data);
      Toast.success('Rendez-vous mis à jour');
    } else {
      await API.post('/api/rendez-vous', data);
      Toast.success('Rendez-vous créé');
    }
    document.getElementById('modal-rdv').classList.remove('active');
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

function badgeStatut(statut) {
  const config = {
      'planifie': { label: 'Planifié', class: 'info' },
      'confirme': { label: 'Confirmé', class: 'success' },
      'annule': { label: 'Annulé', class: 'danger' },
      'termine': { label: 'Terminé', class: 'success' },
      'en_attente': { label: 'En attente', class: 'warning' }
  };
  const s = config[statut] || { label: statut, class: 'info' };
  return `<span class="badge badge-${s.class}">${s.label}</span>`;
}

init();
