let medRowCount = 0;

// Exposer les fonctions globalement
window.addMedRow = addMedRow;
window.loadOrdonnances = loadOrdonnances;
window.viewOrdonnance = viewOrdonnance;
window.openOrdModal = openOrdModal;
window.closeOrdModal = closeOrdModal;
window.saveOrdonnance = saveOrdonnance;
window.editOrdonnance = editOrdonnance;
window.deleteOrdonnance = deleteOrdonnance;

function addMedRow(data = {}) {
  medRowCount++;
  const id = medRowCount;
  const div = document.createElement('div');
  div.className = 'med-entry-row';
  div.id = `med-row-${id}`;
  div.innerHTML = `
    <input type="text" class="form-control" id="med-nom-${id}" value="${data.medicament_nom||''}" placeholder="Ex: Paracétamol" required>
    <input type="text" class="form-control" id="med-dos-${id}" value="${data.dosage||''}" placeholder="500mg">
    <input type="text" class="form-control" id="med-dur-${id}" value="${data.duree||''}" placeholder="7 jours">
    <input type="text" class="form-control" id="med-freq-${id}" value="${data.frequence||''}" placeholder="3x / j">
    <button type="button" class="btn-icon" style="color:var(--danger); border:none" onclick="document.getElementById('med-row-${id}').remove()">
        <i data-lucide="minus-circle" style="width:18px"></i>
    </button>`;
  document.getElementById('meds-tbody').appendChild(div);
  if (window.lucide) lucide.createIcons();
}

function collectMeds() {
  const rows = document.querySelectorAll('#meds-tbody .med-entry-row');
  return Array.from(rows).map(row => {
    const id = row.id.replace('med-row-', '');
    return {
      medicament_nom: document.getElementById(`med-nom-${id}`)?.value.trim() || '',
      dosage:         document.getElementById(`med-dos-${id}`)?.value.trim() || '',
      duree:          document.getElementById(`med-dur-${id}`)?.value.trim() || '',
      frequence:      document.getElementById(`med-freq-${id}`)?.value.trim() || '',
    };
  }).filter(m => m.medicament_nom);
}

async function loadOrdonnances() {
  const tbody = document.getElementById('ord-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:100px"><div class="spinner"></div></td></tr>';
  
  try {
    let rows = [];
    if (Auth.can('patient')) {
      const meRes  = await API.get('/api/auth/me');
      const patientId = meRes.data.patient_id;
      if (!patientId) { tbody.innerHTML = '<tr><td colspan="5">Profil patient introuvable</td></tr>'; return; }
      const res = await API.get(`/api/ordonnances/patient/${patientId}`);
      rows = res.data || [];
    } else {
      // Pour l'admin/médecin, on récupère via les patients ou une route dédiée si elle existe
      const pRes = await API.get('/api/patients', { limit: 200 });
      const patients = pRes.data.data || [];
      const all = [];
      for (const p of patients) {
        try {
          const r = await API.get(`/api/ordonnances/patient/${p.id}`);
          all.push(...(r.data || []));
        } catch {}
      }
      rows = all.sort((a, b) => new Date(b.date_ordonnance) - new Date(a.date_ordonnance));
    }

    tbody.innerHTML = rows.length ? rows.map(o => `
      <tr>
        <td>
            <div style="font-weight:600; color:var(--primary)">${formatDate(o.date_ordonnance)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">Dr ${o.medecin_nom || '—'}</div>
        </td>
        <td style="font-weight:600">${o.patient_nom || '—'}</td>
        <td>
            <span class="badge badge-info" style="font-size:0.7rem">
                <i data-lucide="package" style="width:10px; margin-right:3px"></i>
                ${o.medicaments_count ?? (o.medicaments ? o.medicaments.length : 0)} MÉDICAMENTS
            </span>
        </td>
        <td style="font-size:0.85rem; color:var(--text-muted)">${o.instructions ? o.instructions.substring(0,60) + '…' : '—'}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Voir l'ordonnance" onclick="viewOrdonnance(${o.id})">
                <i data-lucide="eye"></i>
            </button>
            ${Auth.can('medecin') ? `
                <button class="btn-icon" title="Modifier" onclick="editOrdonnance(${o.id})">
                    <i data-lucide="edit-2"></i>
                </button>` : ''}
            ${Auth.can('admin') ? `
                <button class="btn-icon" title="Supprimer" onclick="deleteOrdonnance(${o.id})" style="color:var(--danger)">
                    <i data-lucide="trash-2"></i>
                </button>` : ''}
          </div>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon"><i data-lucide="pill"></i></div><p>Aucune ordonnance trouvée</p></div></td></tr>';
    
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger);padding:1rem;text-align:center">${e.message}</td></tr>`;
  }
}

async function viewOrdonnance(id) {
  try {
    const res = await API.get(`/api/ordonnances/${id}`);
    const o = res.data;
    const meds = o.medicaments || [];
    
    document.getElementById('ord-view-body').innerHTML = `
      <div class="prescription-paper">
        <div class="presc-header">
            <div class="presc-brand">
                <i data-lucide="hospital"></i> MEDICALY
            </div>
            <div class="presc-doctor">
                <h4>Dr ${o.medecin_nom || 'Médecin Référent'}</h4>
                <p style="font-size:0.8rem">Béjaïa, Algérie</p>
            </div>
        </div>
        
        <div class="presc-patient-info">
            <div>
                <p style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#64748b">Patient</p>
                <p style="font-size:1.1rem; font-weight:700">${o.patient_nom || '—'}</p>
            </div>
            <div style="text-align:right">
                <p style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#64748b">Date d'émission</p>
                <p style="font-size:1rem; font-weight:600">${formatDate(o.date_ordonnance)}</p>
            </div>
        </div>

        <div class="presc-list">
            ${meds.length ? meds.map(m => `
                <div class="presc-item">
                    <div class="presc-item-name">${m.medicament_nom}</div>
                    <div class="presc-item-details">
                        ${m.dosage ? `Dosage : ${m.dosage}` : ''} 
                        ${m.frequence ? ` | Fréquence : ${m.frequence}` : ''}
                        ${m.duree ? ` | Durée : ${m.duree}` : ''}
                    </div>
                </div>`).join('') : '<p style="text-align:center; padding:20px; color:#94a3b8">Aucun médicament prescrit</p>'}
        </div>

        ${o.instructions ? `
        <div style="margin-top:20px">
            <p style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:10px">Conseils & Instructions</p>
            <p style="font-size:0.95rem; line-height:1.6; background:#f1f5f9; padding:15px; border-radius:8px">${o.instructions}</p>
        </div>` : ''}

        <div class="presc-footer">
            <p>Signature et Cachet</p>
            <div style="height:80px"></div>
            <p style="font-size:0.7rem">Medicaly - Système de Gestion de Cabinet Médical Premium</p>
        </div>
      </div>`;
      
    document.getElementById('modal-ord-view').classList.add('active');
    if (window.lucide) lucide.createIcons();
  } catch (e) { Toast.error(e.message); }
}

async function openOrdModal(existing = null) {
  const overlay = document.getElementById('modal-ord');
  if (!overlay) return;

  document.getElementById('ord-id').value     = '';
  document.getElementById('o-instructions').value = '';
  document.getElementById('o-date').value     = new Date().toISOString().slice(0,10);
  document.getElementById('meds-tbody').innerHTML = '';
  medRowCount = 0;
  document.getElementById('ord-modal-title').textContent = existing ? 'Modifier l\'Ordonnance' : 'Nouvelle Ordonnance';

  const patSel = document.getElementById('o-patient');
  if (patSel) {
    patSel.innerHTML = '<option value="">Choisir un patient…</option>';
    try {
        const res = await API.get('/api/patients', { limit: 200 });
        (res.data.data || []).forEach(p => patSel.appendChild(new Option(`${p.nom} ${p.prenom}`, p.id)));
        if (existing) patSel.value = existing.patient_id;
    } catch {}
  }

  if (existing) {
    document.getElementById('ord-id').value          = existing.id;
    document.getElementById('o-date').value          = existing.date_ordonnance || '';
    document.getElementById('o-instructions').value  = existing.instructions || '';
    (existing.medicaments || []).forEach(m => addMedRow(m));
  } else {
    addMedRow();
  }

  overlay.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeOrdModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.btn-icon')) return;
  document.getElementById('modal-ord').classList.remove('active');
}

async function editOrdonnance(id) {
  try {
    const res = await API.get(`/api/ordonnances/${id}`);
    openOrdModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function saveOrdonnance() {
  const id = document.getElementById('ord-id').value;
  const meds = collectMeds();
  const data = {
    patient_id:     document.getElementById('o-patient').value,
    date_ordonnance: document.getElementById('o-date').value,
    instructions:   document.getElementById('o-instructions').value,
    medicaments:    meds,
  };
  
  if (!data.patient_id) { Toast.error('Sélectionnez un patient'); return; }
  
  try {
    if (id) {
      await API.put(`/api/ordonnances/${id}`, data);
      Toast.success('Ordonnance mise à jour');
    } else {
      await API.post('/api/ordonnances', data);
      Toast.success('Ordonnance créée');
    }
    document.getElementById('modal-ord').classList.remove('active');
    loadOrdonnances();
  } catch (e) { Toast.error(e.message); }
}

async function deleteOrdonnance(id) {
  if (!confirmDialog('Supprimer cette ordonnance ?')) return;
  try {
    await API.del(`/api/ordonnances/${id}`);
    Toast.success('Ordonnance supprimée');
    loadOrdonnances();
  } catch (e) { Toast.error(e.message); }
}

loadOrdonnances();
