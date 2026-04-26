let currentPage = 1;
let searchTimer = null;

// Exposer les fonctions globalement explicitement
window.openModal = openModal;
window.closeModal = closeModal;
window.savePatient = savePatient;
window.editPatient = editPatient;
window.deletePatient = deletePatient;
window.viewDossier = viewDossier;
window.closeDossier = closeDossier;
window.onSearch = onSearch;

async function loadPatients(page = 1) {
  currentPage = page;
  const searchInput = document.getElementById('search-input');
  const search = searchInput ? searchInput.value.trim() : '';
  const tbody  = document.getElementById('table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:100px"><div class="spinner"></div></td></tr>';

  try {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    const res = await API.get('/api/patients', params);
    
    // Structure de réponse attendue: res.data = { data: [], total: X, limit: Y }
    const result = res.data || {};
    const data = result.data || [];
    const total = result.total || 0;
    const limit = result.limit || 15;

    tbody.innerHTML = data.length ? data.map(p => {
      const fullName = `${p.nom} ${p.prenom}`.replace(/'/g, "\\'");
      return `
      <tr>
        <td>
          <div style="font-weight:600; color:var(--primary)">${p.nom} ${p.prenom}</div>
        </td>
        <td>${formatDate(p.date_naissance)}</td>
        <td>
          <span class="badge ${p.sexe === 'M' ? 'badge-info' : 'badge-warning'}" style="text-transform:none">
            ${p.sexe === 'M' ? 'Homme' : 'Femme'}
          </span>
        </td>
        <td style="font-size:0.85rem">${p.telephone || '—'}</td>
        <td style="font-size:0.85rem; color:var(--text-muted)">${p.email || '—'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Dossier Médical" onclick="viewDossier(${p.id}, '${fullName}')">
                <i data-lucide="folder-open"></i>
            </button>
            ${Auth.can('admin','secretaire') ? `
                <button class="btn-icon" title="Modifier" onclick="editPatient(${p.id})">
                    <i data-lucide="edit-3"></i>
                </button>` : ''}
            ${Auth.can('admin') ? `
                <button class="btn-icon" title="Supprimer" onclick="deletePatient(${p.id})" style="color:var(--danger)">
                    <i data-lucide="trash-2"></i>
                </button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('')
    : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon"><i data-lucide="user-x"></i></div><p>Aucun patient trouvé</p></div></td></tr>';

    if (window.lucide) lucide.createIcons();
    renderPagination(total, limit, page);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);text-align:center;padding:1.5rem">${e.message}</td></tr>`;
  }
}

function renderPagination(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const container = document.getElementById('pagination');
  if (!container || pages <= 1) { if(container) container.innerHTML = ''; return; }
  
  let html = `<button class="page-link" ${page===1?'disabled':''} onclick="loadPatients(${page-1})"><i data-lucide="chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-link ${i===page?'active':''}" onclick="loadPatients(${i})">${i}</button>`;
  }
  html += `<button class="page-link" ${page===pages?'disabled':''} onclick="loadPatients(${page+1})"><i data-lucide="chevron-right"></i></button>`;
  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadPatients(1), 400);
}

function openModal(patient = null) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  // Reset form
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
    document.getElementById('p-nom').value          = patient.nom || '';
    document.getElementById('p-prenom').value       = patient.prenom || '';
    document.getElementById('p-dob').value          = patient.date_naissance || '';
    document.getElementById('p-sexe').value         = patient.sexe || 'M';
    document.getElementById('p-tel').value          = patient.telephone || '';
    document.getElementById('p-email').value        = patient.email || '';
    document.getElementById('p-adresse').value      = patient.adresse || '';
    document.getElementById('p-sanguin').value      = patient.groupe_sanguin || '';
    document.getElementById('p-allergies').value    = patient.allergies || '';
    document.getElementById('p-antecedents').value  = patient.antecedents || '';
  }

  overlay.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-overlay').classList.remove('active');
}

async function editPatient(id) {
  try {
    const res = await API.get(`/api/patients/${id}`);
    openModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function savePatient() {
  const id = document.getElementById('patient-id').value;
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

  if (!data.nom || !data.prenom || !data.date_naissance) {
    Toast.error('Veuillez remplir les champs obligatoires');
    return;
  }

  const btn = document.getElementById('btn-save');
  if (btn) btn.disabled = true;

  try {
    if (id) {
      await API.put(`/api/patients/${id}`, data);
      Toast.success('Patient mis à jour');
    } else {
      await API.post('/api/patients', data);
      Toast.success('Patient ajouté');
    }
    document.getElementById('modal-overlay').classList.remove('active');
    loadPatients(currentPage);
  } catch (e) {
    Toast.error(e.message);
  } finally {
    if (btn) btn.disabled = false;
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
  const overlay = document.getElementById('modal-dossier');
  if (!overlay) return;

  document.getElementById('dossier-nom').textContent = nom;
  document.getElementById('dossier-content').innerHTML = '<div style="text-align:center;padding:50px"><div class="spinner"></div></div>';
  overlay.classList.add('active');
  if (window.lucide) lucide.createIcons();

  try {
    const res = await API.get(`/api/dossiers-medicaux/${id}`);
    const { patient, dossier, consultations, ordonnances } = res.data;

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

      <h4 style="margin-bottom:.75rem">🩺 Consultations (${consultations ? consultations.length : 0})</h4>
      ${consultations && consultations.length ? consultations.map(c => `
        <div class="card mb-1" style="margin-bottom:.75rem">
          <div class="card-body" style="padding:15px">
            <div style="display:flex;justify-content:space-between">
              <strong>${formatDateTime(c.date_consultation)}</strong>
              <span class="text-muted">Dr ${c.medecin_nom}</span>
            </div>
            ${c.symptomes ? `<div class="mt-1"><strong>Symptômes :</strong> ${c.symptomes}</div>` : ''}
            ${c.diagnostic ? `<div><strong>Diagnostic :</strong> ${c.diagnostic}</div>` : ''}
          </div>
        </div>`).join('') : '<p class="text-muted">Aucune consultation</p>'}

      <h4 style="margin:1rem 0 .75rem">💊 Ordonnances (${ordonnances ? ordonnances.length : 0})</h4>
      ${ordonnances && ordonnances.length ? ordonnances.map(o => `
        <div class="card" style="margin-bottom:.75rem">
          <div class="card-body" style="padding:15px">
            <strong>${formatDate(o.date_ordonnance)}</strong> — Dr ${o.medecin_nom}
            <ul style="margin:.5rem 0 0 1.2rem">
              ${(o.medicaments || []).map(m => `<li>${m.nom_medicament}${m.dosage ? ' — '+m.dosage : ''}${m.frequence ? ', '+m.frequence : ''}</li>`).join('')}
            </ul>
          </div>
        </div>`).join('') : '<p class="text-muted">Aucune ordonnance</p>'}`;
  } catch (e) {
    document.getElementById('dossier-content').innerHTML = `<p style="color:var(--danger);text-align:center">${e.message}</p>`;
  }
}

function closeDossier(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-dossier').classList.remove('active');
}

// Initialisation
loadPatients();
