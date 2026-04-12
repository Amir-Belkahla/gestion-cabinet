let utilPage = 1;

function toggleRoleFields() {
  const role = document.getElementById('u-role').value;
  document.getElementById('medecin-fields').style.display = role === 'medecin' ? 'block' : 'none';
  document.getElementById('patient-fields').style.display = role === 'patient' ? 'block' : 'none';
}

async function loadUtilisateurs(page = 1) {
  utilPage = page;
  const tbody  = document.getElementById('util-tbody');
  const role   = document.getElementById('f-role').value;
  tbody.innerHTML = '<tr><td colspan="5"><div class="loading-overlay"><span class="spinner"></span></div></td></tr>';

  try {
    const params = { page, limit: 15 };
    if (role) params.role = role;
    const res   = await API.get('/api/utilisateurs', params);
    const users = res.data.data || [];
    const total = res.data.total;
    renderPag(total, 15, page);

    tbody.innerHTML = users.length ? users.map(u => `
      <tr>
        <td>${u.nom} ${u.prenom}</td>
        <td>${u.email}</td>
        <td>${badgeRole(u.role)}</td>
        <td><span class="badge ${u.actif ? 'badge-success' : 'badge-danger'}">${u.actif ? 'Actif' : 'Inactif'}</span></td>
        <td style="display:flex;gap:.35rem">
          <button class="btn btn-outline-primary btn-sm" onclick="editUtilisateur(${u.id})">✏️</button>
          <button class="btn btn-outline-${u.actif ? 'warning' : 'success'} btn-sm" onclick="toggleActif(${u.id})">${u.actif ? '⏸' : '▶'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUtilisateur(${u.id})">🗑️</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">👥</div><p>Aucun utilisateur</p></div></td></tr>';
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger);padding:1rem;text-align:center">${e.message}</td></tr>`;
  }
}

function renderPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const c = document.getElementById('pagination');
  if (pages <= 1) { c.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${page===1?'disabled':''} onclick="loadUtilisateurs(${page-1})">‹</button>`;
  for (let i = 1; i <= pages; i++) html += `<button class="page-btn ${i===page?'active':''}" onclick="loadUtilisateurs(${i})">${i}</button>`;
  html += `<button class="page-btn" ${page===pages?'disabled':''} onclick="loadUtilisateurs(${page+1})">›</button>`;
  c.innerHTML = html;
}

function openUtilModal(existing = null) {
  document.getElementById('util-id').value     = '';
  document.getElementById('u-nom').value       = '';
  document.getElementById('u-prenom').value    = '';
  document.getElementById('u-email').value     = '';
  document.getElementById('u-telephone').value = '';
  document.getElementById('u-role').value      = '';
  document.getElementById('u-mdp').value       = '';
  document.getElementById('u-specialite').value = '';
  document.getElementById('u-num-ordre').value  = '';
  document.getElementById('u-dob').value        = '';
  document.getElementById('u-sexe').value       = '';
  document.getElementById('u-adresse').value    = '';
  document.getElementById('util-modal-title').textContent = existing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur';
  document.getElementById('mdp-hint').style.display = existing ? 'inline' : 'none';
  document.getElementById('u-mdp').required = !existing;
  toggleRoleFields();

  if (existing) {
    document.getElementById('util-id').value     = existing.id;
    document.getElementById('u-nom').value       = existing.nom;
    document.getElementById('u-prenom').value    = existing.prenom;
    document.getElementById('u-email').value     = existing.email;
    document.getElementById('u-telephone').value = existing.telephone || '';
    document.getElementById('u-role').value      = existing.role;
    toggleRoleFields();
    if (existing.specialite)    document.getElementById('u-specialite').value  = existing.specialite;
    if (existing.numero_ordre)  document.getElementById('u-num-ordre').value   = existing.numero_ordre;
    if (existing.date_naissance) document.getElementById('u-dob').value        = existing.date_naissance;
    if (existing.sexe)           document.getElementById('u-sexe').value       = existing.sexe;
    if (existing.adresse)        document.getElementById('u-adresse').value    = existing.adresse;
  }
  document.getElementById('modal-util').classList.add('show');
}

function closeUtilModal(e) {
  if (e && e.target !== document.getElementById('modal-util')) return;
  document.getElementById('modal-util').classList.remove('show');
}

async function editUtilisateur(id) {
  try {
    const res = await API.get(`/api/utilisateurs/${id}`);
    openUtilModal(res.data);
  } catch (e) { Toast.error(e.message); }
}

async function saveUtilisateur() {
  const id   = document.getElementById('util-id').value;
  const role = document.getElementById('u-role').value;
  const mdp  = document.getElementById('u-mdp').value;

  const data = {
    nom:       document.getElementById('u-nom').value.trim(),
    prenom:    document.getElementById('u-prenom').value.trim(),
    email:     document.getElementById('u-email').value.trim(),
    telephone: document.getElementById('u-telephone').value.trim(),
    role,
  };
  if (mdp) data.mot_de_passe = mdp;

  if (role === 'medecin') {
    data.specialite   = document.getElementById('u-specialite').value.trim();
    data.numero_ordre = document.getElementById('u-num-ordre').value.trim();
  }
  if (role === 'patient') {
    data.date_naissance = document.getElementById('u-dob').value;
    data.sexe           = document.getElementById('u-sexe').value;
    data.adresse        = document.getElementById('u-adresse').value.trim();
  }

  try {
    if (id) {
      await API.put(`/api/utilisateurs/${id}`, data);
      Toast.success('Utilisateur mis à jour');
    } else {
      if (!mdp) { Toast.error('Mot de passe obligatoire'); return; }
      await API.post('/api/utilisateurs', data);
      Toast.success('Utilisateur créé');
    }
    closeUtilModal();
    loadUtilisateurs(utilPage);
  } catch (e) { Toast.error(e.message); }
}

async function toggleActif(id) {
  try {
    await API.patch(`/api/utilisateurs/${id}/toggle`, {});
    Toast.info('Statut modifié');
    loadUtilisateurs(utilPage);
  } catch (e) { Toast.error(e.message); }
}

async function deleteUtilisateur(id) {
  if (!confirmDialog('Supprimer cet utilisateur ?')) return;
  try {
    await API.del(`/api/utilisateurs/${id}`);
    Toast.success('Utilisateur supprimé');
    loadUtilisateurs(utilPage);
  } catch (e) { Toast.error(e.message); }
}

// Vérifier que l'utilisateur est admin
if (!Auth.can('admin')) {
  Toast.error('Accès refusé');
  location.href = 'dashboard.html';
} else {
  loadUtilisateurs();
}
