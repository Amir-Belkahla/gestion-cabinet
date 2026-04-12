let consultPage = 1;

async function loadConsultations(page = 1) {
  consultPage = page;
  const tbody = document.getElementById('consult-tbody');
  tbody.innerHTML = '<tr><td colspan="6"><div class="loading-overlay"><span class="spinner"></span></div></td></tr>';

  try {
    const isPatient = Auth.can('patient');
    let rows = [];
    let total = 0;

    if (isPatient) {
      const user = Auth.getUser();
      // Récupérer l'ID patient depuis /me
      const meRes = await API.get('/api/auth/me');
      const patientId = meRes.data.patient_id;
      if (!patientId) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Profil patient non trouvé</p></div></td></tr>';
        return;
      }
      const res = await API.get(`/api/consultations/patient/${patientId}`);
      rows  = res.data || [];
      total = rows.length;
    } else {
      const res = await API.get('/api/consultations', { page, limit: 15 });
      rows  = res.data.data || [];
      total = res.data.total;
      renderPag(total, 15, page);
    }

    tbody.innerHTML = rows.length ? rows.map(c => `
      <tr>
        <td>${formatDateTime(c.date_consultation)}</td>
        <td>${c.patient_nom}</td>
        <td>Dr ${c.medecin_nom}</td>
        <td>${c.symptomes ? c.symptomes.substring(0,60)+'…' : '—'}</td>
        <td>${c.diagnostic ? c.diagnostic.substring(0,60)+'…' : '—'}</td>
        <td style="display:flex;gap:.35rem">
          ${Auth.can('medecin') ? `<button class="btn btn-outline-primary btn-sm" onclick="editConsultation(${c.id})">✏️</button>` : ''}
          ${Auth.can('admin') ? `<button class="btn btn-danger btn-sm" onclick="deleteConsultation(${c.id})">🗑️</button>` : ''}
        </td>
      </tr>`).join('')
    : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🩺</div><p>Aucune consultation</p></div></td></tr>';

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);text-align:center;padding:1rem">${e.message}</td></tr>`;
  }
}

function renderPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const c = document.getElementById('pagination');
  if (pages <= 1) { c.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${page===1?'disabled':''} onclick="loadConsultations(${page-1})">‹</button>`;
  for (let i = 1; i <= pages; i++) html += `<button class="page-btn ${i===page?'active':''}" onclick="loadConsultations(${i})">${i}</button>`;
  html += `<button class="page-btn" ${page===pages?'disabled':''} onclick="loadConsultations(${page+1})">›</button>`;
  c.innerHTML = html;
}

async function openConsultModal(existing = null) {
  document.getElementById('consult-id').value = '';
  document.getElementById('c-symptomes').value = '';
  document.getElementById('c-diagnostic').value = '';
  document.getElementById('c-notes').value = '';
  document.getElementById('c-date').value = new Date().toISOString().slice(0,16);
  document.getElementById('c-rdv').innerHTML = '<option value="">Aucun</option>';
  document.getElementById('consult-modal-title').textContent = existing ? 'Modifier Consultation' : 'Nouvelle Consultation';

  // Charger patients
  const patSel = document.getElementById('c-patient');
  patSel.innerHTML = '<option value="">Choisir…</option>';
  try {
    const res = await API.get('/api/patients', { limit: 100 });
    res.data.data.forEach(p => patSel.appendChild(new Option(`${p.nom} ${p.prenom}`, p.id)));
  } catch {}

  if (existing) {
    document.getElementById('consult-id').value      = existing.id;
    document.getElementById('c-patient').value       = existing.patient_id;
    document.getElementById('c-date').value          = existing.date_consultation?.replace(' ','T').slice(0,16) || '';
    document.getElementById('c-symptomes').value     = existing.symptomes || '';
    document.getElementById('c-diagnostic').value    = existing.diagnostic || '';
    document.getElementById('c-notes').value         = existing.notes || '';
    if (existing.rendez_vous_id) document.getElementById('c-rdv').value = existing.rendez_vous_id;
  }

  document.getElementById('modal-consult').classList.add('show');
}

function closeConsultModal(e) {
  if (e && e.target !== document.getElementById('modal-consult')) return;
  document.getElementById('modal-consult').classList.remove('show');
}

async function editConsultation(id) {
  try {
    const res = await API.get(`/api/consultations/${id}`);
    openConsultModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function saveConsultation() {
  const id   = document.getElementById('consult-id').value;
  const data = {
    patient_id:         document.getElementById('c-patient').value,
    rendez_vous_id:     document.getElementById('c-rdv').value || null,
    date_consultation:  document.getElementById('c-date').value.replace('T',' '),
    symptomes:          document.getElementById('c-symptomes').value,
    diagnostic:         document.getElementById('c-diagnostic').value,
    notes:              document.getElementById('c-notes').value,
  };

  try {
    if (id) {
      await API.put(`/api/consultations/${id}`, data);
      Toast.success('Consultation mise à jour');
    } else {
      await API.post('/api/consultations', data);
      Toast.success('Consultation enregistrée');
    }
    closeConsultModal();
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
