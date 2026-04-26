let consultPage = 1;

// Exposer les fonctions globalement
window.loadConsultations = loadConsultations;
window.openConsultModal = openConsultModal;
window.closeConsultModal = closeConsultModal;
window.saveConsultation = saveConsultation;
window.editConsultation = editConsultation;
window.deleteConsultation = deleteConsultation;

async function loadConsultations(page = 1) {
  consultPage = page;
  const container = document.getElementById('consultations-list');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:100px"><div class="spinner"></div></div>';

  try {
    const isPatient = Auth.can('patient');
    let rows = [];
    let total = 0;

    if (isPatient) {
      const meRes = await API.get('/api/auth/me');
      const patientId = meRes.data.patient_id;
      if (!patientId) {
        container.innerHTML = '<div class="empty-state"><p>Profil patient non trouvé</p></div>';
        return;
      }
      const res = await API.get(`/api/consultations/patient/${patientId}`);
      rows  = res.data || [];
      total = rows.length;
    } else {
      const res = await API.get('/api/consultations', { page, limit: 15 });
      rows  = res.data.data || [];
      total = res.data.total || 0;
      renderPag(total, 15, page);
    }

    container.innerHTML = rows.length ? rows.map(c => `
      <div class="consult-card">
        <div class="consult-header">
          <div>
            <div class="consult-patient">${c.patient_nom}</div>
            <div class="consult-date">
                <i data-lucide="calendar" style="width:14px"></i> ${formatDateTime(c.date_consultation)}
                <span style="margin:0 10px; opacity:0.3">|</span>
                <i data-lucide="user" style="width:14px"></i> Dr ${c.medecin_nom}
            </div>
          </div>
          <div class="action-btns">
            ${Auth.can('medecin') ? `
                <button class="btn-icon" title="Modifier" onclick="editConsultation(${c.id})">
                    <i data-lucide="edit-2"></i>
                </button>` : ''}
            ${Auth.can('admin') ? `
                <button class="btn-icon" title="Supprimer" onclick="deleteConsultation(${c.id})" style="color:var(--danger)">
                    <i data-lucide="trash-2"></i>
                </button>` : ''}
          </div>
        </div>
        <div class="consult-body">
          <div class="consult-info-block">
            <label>Symptômes</label>
            <p>${c.symptomes || '<span class="text-muted">Aucun symptôme renseigné</span>'}</p>
          </div>
          <div class="consult-info-block">
            <label>Diagnostic</label>
            <p style="font-weight:600; color:var(--primary)">${c.diagnostic || '<span class="text-muted">En attente de diagnostic</span>'}</p>
          </div>
        </div>
        ${c.notes ? `
        <div class="consult-info-block" style="margin-top:15px; padding-top:15px; border-top:1px solid #f1f5f9">
            <label>Notes Additionnelles</label>
            <p style="font-style:italic; font-size:0.9rem">${c.notes}</p>
        </div>` : ''}
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon"><i data-lucide="stethoscope"></i></div><p>Aucune consultation trouvée</p></div>';

    if (window.lucide) lucide.createIcons();
  } catch (e) {
    container.innerHTML = `<div style="color:var(--danger);text-align:center;padding:3rem">${e.message}</div>`;
  }
}

function renderPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const c = document.getElementById('pagination');
  if (!c || pages <= 1) { if(c) c.innerHTML = ''; return; }
  
  let html = `<button class="page-link" ${page===1?'disabled':''} onclick="loadConsultations(${page-1})"><i data-lucide="chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) html += `<button class="page-link ${i===page?'active':''}" onclick="loadConsultations(${i})">${i}</button>`;
  html += `<button class="page-link" ${page===pages?'disabled':''} onclick="loadConsultations(${page+1})"><i data-lucide="chevron-right"></i></button>`;
  c.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

async function openConsultModal(existing = null) {
  const overlay = document.getElementById('modal-consult');
  if (!overlay) return;

  document.getElementById('consult-id').value = '';
  document.getElementById('c-symptomes').value = '';
  document.getElementById('c-diagnostic').value = '';
  document.getElementById('c-notes').value = '';
  document.getElementById('c-date').value = new Date().toISOString().slice(0,16);
  document.getElementById('consult-modal-title').textContent = existing ? 'Modifier la Consultation' : 'Nouvelle Consultation';

  // Charger patients
  const patSel = document.getElementById('c-patient');
  if (patSel) {
    patSel.innerHTML = '<option value="">Choisir un patient…</option>';
    try {
      const res = await API.get('/api/patients', { limit: 100 });
      (res.data.data || []).forEach(p => patSel.appendChild(new Option(`${p.nom} ${p.prenom}`, p.id)));
      if (existing) patSel.value = existing.patient_id;
    } catch {}
  }

  if (existing) {
    document.getElementById('consult-id').value      = existing.id;
    document.getElementById('c-date').value          = existing.date_consultation?.replace(' ','T').slice(0,16) || '';
    document.getElementById('c-symptomes').value     = existing.symptomes || '';
    document.getElementById('c-diagnostic').value    = existing.diagnostic || '';
    document.getElementById('c-notes').value         = existing.notes || '';
    // Pour le RDV, on pourrait aussi charger la liste si besoin
  }

  overlay.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeConsultModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.btn-icon')) return;
  document.getElementById('modal-consult').classList.remove('active');
}

async function editConsultation(id) {
  try {
    const res = await API.get(`/api/consultations/${id}`);
    openConsultModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function saveConsultation() {
  const id = document.getElementById('consult-id').value;
  const data = {
    patient_id:         document.getElementById('c-patient').value,
    rendez_vous_id:     document.getElementById('c-rdv')?.value || null,
    date_consultation:  document.getElementById('c-date').value.replace('T',' '),
    symptomes:          document.getElementById('c-symptomes').value,
    diagnostic:         document.getElementById('c-diagnostic').value,
    notes:              document.getElementById('c-notes').value,
  };

  if (!data.patient_id || !data.date_consultation) {
    Toast.error('Veuillez remplir les champs obligatoires');
    return;
  }

  try {
    if (id) {
      await API.put(`/api/consultations/${id}`, data);
      Toast.success('Consultation mise à jour');
    } else {
      await API.post('/api/consultations', data);
      Toast.success('Consultation enregistrée');
    }
    document.getElementById('modal-consult').classList.remove('active');
    loadConsultations(consultPage);
  } catch (e) { Toast.error(e.message); }
}

async function deleteConsultation(id) {
  if (!confirmDialog('Supprimer cette consultation ?')) return;
  try {
    await API.del(`/api/consultations/${id}`);
    Toast.success('Consultation supprimée');
    loadConsultations(consultPage);
  } catch (e) { Toast.error(e.message); }
}

loadConsultations();
