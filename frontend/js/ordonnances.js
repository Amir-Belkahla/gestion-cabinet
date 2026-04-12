let medRowCount = 0;

function addMedRow(data = {}) {
  medRowCount++;
  const id = medRowCount;
  const tr = document.createElement('tr');
  tr.id = `med-row-${id}`;
  tr.innerHTML = `
    <td style="padding:.25rem"><input type="text" class="form-control form-control-sm" id="med-nom-${id}" value="${data.medicament_nom||''}" placeholder="Médicament" required></td>
    <td style="padding:.25rem"><input type="text" class="form-control form-control-sm" id="med-dos-${id}" value="${data.dosage||''}" placeholder="500mg"></td>
    <td style="padding:.25rem"><input type="text" class="form-control form-control-sm" id="med-dur-${id}" value="${data.duree||''}" placeholder="7 jours"></td>
    <td style="padding:.25rem"><input type="text" class="form-control form-control-sm" id="med-freq-${id}" value="${data.frequence||''}" placeholder="3×/jour"></td>
    <td style="padding:.25rem;text-align:center"><button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('med-row-${id}').remove()">✕</button></td>`;
  document.getElementById('meds-tbody').appendChild(tr);
}

function collectMeds() {
  const rows = document.querySelectorAll('#meds-tbody tr');
  return Array.from(rows).map(tr => {
    const id = tr.id.replace('med-row-', '');
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
  tbody.innerHTML = '<tr><td colspan="5"><div class="loading-overlay"><span class="spinner"></span></div></td></tr>';
  try {
    let rows = [];
    if (Auth.can('patient')) {
      const meRes  = await API.get('/api/auth/me');
      const patientId = meRes.data.patient_id;
      if (!patientId) { tbody.innerHTML = '<tr><td colspan="5">Profil patient introuvable</td></tr>'; return; }
      const res = await API.get(`/api/ordonnances/patient/${patientId}`);
      rows = res.data || [];
    } else {
      // Admin / médecin : itérer sur les patients
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
        <td>${formatDate(o.date_ordonnance)}</td>
        <td>${o.patient_nom || '—'}</td>
        <td><span class="badge badge-info">${o.medicaments_count ?? '—'} méd.</span></td>
        <td>${o.instructions ? o.instructions.substring(0,60) + '…' : '—'}</td>
        <td style="display:flex;gap:.35rem">
          <button class="btn btn-outline-primary btn-sm" onclick="viewOrdonnance(${o.id})">👁️</button>
          ${Auth.can('medecin') ? `<button class="btn btn-outline-primary btn-sm" onclick="editOrdonnance(${o.id})">✏️</button>` : ''}
          ${Auth.can('admin')   ? `<button class="btn btn-danger btn-sm" onclick="deleteOrdonnance(${o.id})">🗑️</button>` : ''}
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">💊</div><p>Aucune ordonnance</p></div></td></tr>';
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
      <p><strong>Patient :</strong> ${o.patient_nom || '—'}</p>
      <p><strong>Date :</strong> ${formatDate(o.date_emission)}</p>
      <p><strong>Instructions :</strong> ${o.instructions || '—'}</p>
      <h5 style="margin-top:1rem">Médicaments</h5>
      ${meds.length ? `<table style="width:100%;border-collapse:collapse">
        <thead><tr style="font-size:.8rem;color:var(--text-light)">
          <th style="padding:.4rem;text-align:left">Nom</th>
          <th style="padding:.4rem;text-align:left">Dosage</th>
          <th style="padding:.4rem;text-align:left">Durée</th>
          <th style="padding:.4rem;text-align:left">Fréquence</th>
        </tr></thead>
        <tbody>${meds.map(m => `<tr>
          <td style="padding:.35rem">${m.medicament_nom}</td>
          <td style="padding:.35rem">${m.dosage||'—'}</td>
          <td style="padding:.35rem">${m.duree||'—'}</td>
          <td style="padding:.35rem">${m.frequence||'—'}</td>
        </tr>`).join('')}</tbody>
      </table>` : '<p>Aucun médicament</p>'}`;
    document.getElementById('modal-ord-view').classList.add('show');
  } catch (e) { Toast.error(e.message); }
}

async function openOrdModal(existing = null) {
  document.getElementById('ord-id').value     = '';
  document.getElementById('o-instructions').value = '';
  document.getElementById('o-date').value     = new Date().toISOString().slice(0,10);
  document.getElementById('meds-tbody').innerHTML = '';
  medRowCount = 0;
  document.getElementById('ord-modal-title').textContent = existing ? 'Modifier Ordonnance' : 'Nouvelle Ordonnance';

  const patSel = document.getElementById('o-patient');
  patSel.innerHTML = '<option value="">Choisir…</option>';
  try {
    const res = await API.get('/api/patients', { limit: 200 });
    res.data.data.forEach(p => patSel.appendChild(new Option(`${p.nom} ${p.prenom}`, p.id)));
  } catch {}

  if (existing) {
    document.getElementById('ord-id').value          = existing.id;
    document.getElementById('o-patient').value       = existing.patient_id;
    document.getElementById('o-date').value          = existing.date_ordonnance || '';
    document.getElementById('o-instructions').value  = existing.instructions || '';
    (existing.medicaments || []).forEach(m => addMedRow(m));
  } else {
    addMedRow();
  }

  document.getElementById('modal-ord').classList.add('show');
}

function closeOrdModal(e) {
  if (e && e.target !== document.getElementById('modal-ord')) return;
  document.getElementById('modal-ord').classList.remove('show');
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
    closeOrdModal();
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
