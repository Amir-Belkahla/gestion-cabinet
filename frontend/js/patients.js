let currentPage = 1;
let searchTimer = null;

async function loadPatients(page = 1) {
  currentPage = page;
  const search = document.getElementById('search-input').value.trim();
  const tbody  = document.getElementById('table-body');
  tbody.innerHTML = '<tr><td colspan="6"><div class="loading-overlay"><span class="spinner"></span></div></td></tr>';

  try {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    const res   = await API.get('/api/patients', params);
    const { data, total, limit } = res.data;

    tbody.innerHTML = data.length ? data.map(p => `
      <tr>
        <td><strong>${p.nom} ${p.prenom}</strong></td>
        <td>${formatDate(p.date_naissance)}</td>
        <td>${p.sexe === 'M' ? '♂ Homme' : '♀ Femme'}</td>
        <td>${p.telephone || '—'}</td>
        <td>${p.email || '—'}</td>
        <td style="display:flex;gap:.4rem;flex-wrap:wrap">
          <button class="btn btn-info btn-sm" onclick="viewDossier(${p.id},'${p.nom} ${p.prenom}')">📂 Dossier</button>
          ${Auth.can('admin','secretaire') ? `<button class="btn btn-outline-primary btn-sm" onclick="editPatient(${p.id})">✏️</button>` : ''}
          ${Auth.can('admin') ? `<button class="btn btn-danger btn-sm" onclick="deletePatient(${p.id})">🗑️</button>` : ''}
        </td>
      </tr>`).join('')
    : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👤</div><p>Aucun patient trouvé</p></div></td></tr>';

    renderPagination(total, limit, page);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);text-align:center;padding:1.5rem">${e.message}</td></tr>`;
  }
}

function renderPagination(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const container = document.getElementById('pagination');
  if (pages <= 1) { container.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${page===1?'disabled':''} onclick="loadPatients(${page-1})">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i===page?'active':''}" onclick="loadPatients(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${page===pages?'disabled':''} onclick="loadPatients(${page+1})">›</button>`;
  container.innerHTML = html;
}

function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadPatients(1), 400);
}

function openModal(patient = null) {
  document.getElementById('patient-id').value = '';
  document.getElementById('p-nom').value = '';
  document.getElementById('p-prenom').value = '';
  document.getElementById('p-dob').value = '';
  document.getElementById('p-sexe').value = 'M';
  document.getElementById('p-tel').value = '';
  document.getElementById('p-email').value = '';
  document.getElementById('p-adresse').value = '';
  document.getElementById('p-sanguin').value = '';
  document.getElementById('p-allergies').value = '';
  document.getElementById('p-antecedents').value = '';
  document.getElementById('modal-title').textContent = patient ? 'Modifier Patient' : 'Nouveau Patient';

  if (patient) {
    document.getElementById('patient-id').value     = patient.id;
    document.getElementById('p-nom').value          = patient.nom;
    document.getElementById('p-prenom').value       = patient.prenom;
    document.getElementById('p-dob').value          = patient.date_naissance;
    document.getElementById('p-sexe').value         = patient.sexe;
    document.getElementById('p-tel').value          = patient.telephone || '';
    document.getElementById('p-email').value        = patient.email || '';
    document.getElementById('p-adresse').value      = patient.adresse || '';
    document.getElementById('p-sanguin').value      = patient.groupe_sanguin || '';
    document.getElementById('p-allergies').value    = patient.allergies || '';
    document.getElementById('p-antecedents').value  = patient.antecedents || '';
  }

  document.getElementById('modal-overlay').classList.add('show');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('show');
}

async function editPatient(id) {
  try {
    const res = await API.get(`/api/patients/${id}`);
    openModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function savePatient() {
  const id   = document.getElementById('patient-id').value;
  const data = {
    nom:            document.getElementById('p-nom').value,
    prenom:         document.getElementById('p-prenom').value,
    date_naissance: document.getElementById('p-dob').value,
    sexe:           document.getElementById('p-sexe').value,
    telephone:      document.getElementById('p-tel').value,
    email:          document.getElementById('p-email').value,
    adresse:        document.getElementById('p-adresse').value,
    groupe_sanguin: document.getElementById('p-sanguin').value,
    allergies:      document.getElementById('p-allergies').value,
    antecedents:    document.getElementById('p-antecedents').value,
  };

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  try {
    if (id) {
      await API.put(`/api/patients/${id}`, data);
      Toast.success('Patient mis à jour');
    } else {
      await API.post('/api/patients', data);
      Toast.success('Patient ajouté');
    }
    document.getElementById('modal-overlay').classList.remove('show');
    loadPatients(currentPage);
  } catch (e) {
    Toast.error(e.message);
  } finally {
    btn.disabled = false;
  }
}

async function deletePatient(id) {
  if (!confirmDialog('Supprimer ce patient ? Cette action est irréversible.')) return;
  try {
    await API.del(`/api/patients/${id}`);
    Toast.success('Patient supprimé');
    loadPatients(currentPage);
  } catch (e) { Toast.error(e.message); }
}

async function viewDossier(id, nom) {
  document.getElementById('dossier-nom').textContent = nom;
  document.getElementById('dossier-content').innerHTML = '<div class="loading-overlay"><span class="spinner"></span></div>';
  document.getElementById('modal-dossier').classList.add('show');

  try {
    const res = await API.get(`/api/dossiers-medicaux/${id}`);
    const { patient, dossier, consultations, ordonnances, rendez_vous } = res.data;

    document.getElementById('dossier-content').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div><strong>Né(e) le :</strong> ${formatDate(patient.date_naissance)}</div>
        <div><strong>Sexe :</strong> ${patient.sexe === 'M' ? 'Homme' : 'Femme'}</div>
        <div><strong>Téléphone :</strong> ${patient.telephone || '—'}</div>
        <div><strong>Groupe sanguin :</strong> ${patient.groupe_sanguin || '—'}</div>
        <div><strong>Allergies :</strong> ${patient.allergies || '—'}</div>
        <div><strong>Antécédents :</strong> ${patient.antecedents || '—'}</div>
      </div>

      ${dossier?.notes_generales ? `<div class="card mb-2"><div class="card-header"><h3>📝 Notes générales</h3></div><div class="card-body">${dossier.notes_generales}</div></div>` : ''}

      <h4 style="margin-bottom:.75rem">🩺 Consultations (${consultations.length})</h4>
      ${consultations.length ? consultations.map(c => `
        <div class="card mb-1" style="margin-bottom:.75rem">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between">
              <strong>${formatDateTime(c.date_consultation)}</strong>
              <span class="text-muted">Dr ${c.medecin_nom}</span>
            </div>
            ${c.symptomes ? `<div class="mt-1"><strong>Symptômes :</strong> ${c.symptomes}</div>` : ''}
            ${c.diagnostic ? `<div><strong>Diagnostic :</strong> ${c.diagnostic}</div>` : ''}
          </div>
        </div>`).join('') : '<p class="text-muted">Aucune consultation</p>'}

      <h4 style="margin:1rem 0 .75rem">💊 Ordonnances (${ordonnances.length})</h4>
      ${ordonnances.length ? ordonnances.map(o => `
        <div class="card" style="margin-bottom:.75rem">
          <div class="card-body">
            <strong>${formatDate(o.date_ordonnance)}</strong> — Dr ${o.medecin_nom}
            <ul style="margin:.5rem 0 0 1.2rem">
              ${(o.medicaments || []).map(m => `<li>${m.nom_medicament}${m.dosage ? ' — '+m.dosage : ''}${m.frequence ? ', '+m.frequence : ''}</li>`).join('')}
            </ul>
          </div>
        </div>`).join('') : '<p class="text-muted">Aucune ordonnance</p>'}`;
  } catch (e) {
    document.getElementById('dossier-content').innerHTML = `<p style="color:var(--danger)">${e.message}</p>`;
  }
}

function closeDossier(e) {
  if (e && e.target !== document.getElementById('modal-dossier')) return;
  document.getElementById('modal-dossier').classList.remove('show');
}

loadPatients();
