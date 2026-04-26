let utilPage = 1;

// Exposer les fonctions globalement
window.loadUtilisateurs = loadUtilisateurs;
window.openUtilModal = openUtilModal;
window.closeUtilModal = closeUtilModal;
window.saveUtilisateur = saveUtilisateur;
window.editUtilisateur = editUtilisateur;
window.deleteUtilisateur = deleteUtilisateur;
window.toggleActif = toggleActif;
window.toggleRoleFields = toggleRoleFields;

function toggleRoleFields() {
  const roleEl = document.getElementById('u-role');
  if (!roleEl) return;
  const role = roleEl.value;
  
  const medFields = document.getElementById('medecin-fields');
  const patFields = document.getElementById('patient-fields');
  
  if (medFields) medFields.style.display = role === 'medecin' ? 'block' : 'none';
  if (patFields) patFields.style.display = role === 'patient' ? 'block' : 'none';
}

async function loadUtilisateurs(page = 1) {
  utilPage = page;
  const tbody  = document.getElementById('util-tbody');
  if (!tbody) return;

  const roleSelect = document.getElementById('f-role');
  const role = roleSelect ? roleSelect.value : '';
  
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:100px"><div class="spinner"></div></td></tr>';

  try {
    const params = { page, limit: 15 };
    if (role) params.role = role;
    const res   = await API.get('/api/utilisateurs', params);
    const result = res.data || {};
    const users = result.data || [];
    const total = result.total || 0;
    
    renderPag(total, 15, page);

    tbody.innerHTML = users.length ? users.map(u => `
      <tr>
        <td>
            <div style="font-weight:700; color:var(--primary)">${u.nom} ${u.prenom}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">ID: #${u.id}</div>
        </td>
        <td>
            <div style="font-size:0.9rem">${u.email}</div>
            <div style="font-size:0.8rem; color:var(--text-muted)">${u.telephone || 'N/A'}</div>
        </td>
        <td>${badgeRole(u.role)}</td>
        <td>
            <div class="user-status">
                <span class="status-dot ${u.actif ? 'status-active' : 'status-inactive'}"></span>
                ${u.actif ? 'Actif' : 'Inactif'}
            </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Modifier" onclick="editUtilisateur(${u.id})">
                <i data-lucide="edit-2"></i>
            </button>
            <button class="btn-icon" title="${u.actif ? 'Désactiver' : 'Activer'}" onclick="toggleActif(${u.id})" style="color:${u.actif ? 'var(--warning)' : 'var(--success)'}">
                <i data-lucide="${u.actif ? 'user-minus' : 'user-check'}"></i>
            </button>
            <button class="btn-icon" title="Supprimer" onclick="deleteUtilisateur(${u.id})" style="color:var(--danger)">
                <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon"><i data-lucide="users"></i></div><p>Aucun membre trouvé</p></div></td></tr>';
    
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger);padding:1rem;text-align:center">${e.message}</td></tr>`;
  }
}

function badgeRole(role) {
    const roles = {
        'admin':      { label: 'Admin', class: 'role-admin', icon: 'shield-check' },
        'medecin':    { label: 'Médecin', class: 'role-medecin', icon: 'stethoscope' },
        'secretaire': { label: 'Secrétaire', class: 'role-secretaire', icon: 'clipboard' },
        'patient':    { label: 'Patient', class: 'role-patient', icon: 'user' }
    };
    const r = roles[role] || { label: role, class: 'role-patient', icon: 'user' };
    return `<span class="role-badge ${r.class}"><i data-lucide="${r.icon}" style="width:12px"></i> ${r.label}</span>`;
}

function renderPag(total, limit, page) {
  const pages = Math.ceil(total / limit);
  const container = document.getElementById('pagination');
  if (!container || pages <= 1) { if(container) container.innerHTML = ''; return; }
  
  let html = `<button class="page-link" ${page===1?'disabled':''} onclick="loadUtilisateurs(${page-1})"><i data-lucide="chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-link ${i===page?'active':''}" onclick="loadUtilisateurs(${i})">${i}</button>`;
  }
  html += `<button class="page-link" ${page===pages?'disabled':''} onclick="loadUtilisateurs(${page+1})"><i data-lucide="chevron-right"></i></button>`;
  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function openUtilModal(existing = null) {
  const overlay = document.getElementById('modal-util');
  if (!overlay) return;

  document.getElementById('util-id').value     = '';
  document.getElementById('u-nom').value       = '';
  document.getElementById('u-prenom').value    = '';
  document.getElementById('u-email').value     = '';
  document.getElementById('u-telephone').value = '';
  document.getElementById('u-role').value      = '';
  document.getElementById('u-mdp').value       = '';
  
  const specEl = document.getElementById('u-specialite');
  const ordEl = document.getElementById('u-num-ordre');
  const dobEl = document.getElementById('u-dob');
  const sexeEl = document.getElementById('u-sexe');
  const addrEl = document.getElementById('u-adresse');
  
  if (specEl) specEl.value = '';
  if (ordEl) ordEl.value = '';
  if (dobEl) dobEl.value = '';
  if (sexeEl) sexeEl.value = '';
  if (addrEl) addrEl.value = '';

  document.getElementById('util-modal-title').textContent = existing ? 'Modifier le Membre' : 'Ajouter un Membre';
  const hint = document.getElementById('mdp-hint');
  if (hint) hint.style.display = existing ? 'inline' : 'none';
  
  if (existing) {
    document.getElementById('util-id').value     = existing.id;
    document.getElementById('u-nom').value       = existing.nom || '';
    document.getElementById('u-prenom').value    = existing.prenom || '';
    document.getElementById('u-email').value     = existing.email || '';
    document.getElementById('u-telephone').value = existing.telephone || '';
    document.getElementById('u-role').value      = existing.role || '';
    toggleRoleFields();
    if (existing.specialite && specEl)    specEl.value  = existing.specialite;
    if (existing.numero_ordre && ordEl)   ordEl.value   = existing.numero_ordre;
    if (existing.date_naissance && dobEl) dobEl.value   = existing.date_naissance;
    if (existing.sexe && sexeEl)           sexeEl.value  = existing.sexe;
    if (existing.adresse && addrEl)        addrEl.value  = existing.adresse;
  }
  
  overlay.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeUtilModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.btn-icon')) return;
  document.getElementById('modal-util').classList.remove('active');
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
      Toast.success('Membre mis à jour');
    } else {
      if (!mdp) { Toast.error('Mot de passe obligatoire'); return; }
      await API.post('/api/utilisateurs', data);
      Toast.success('Membre ajouté avec succès');
    }
    document.getElementById('modal-util').classList.remove('active');
    loadUtilisateurs(utilPage);
  } catch (e) { Toast.error(e.message); }
}

async function toggleActif(id) {
  try {
    await API.patch(`/api/utilisateurs/${id}/toggle`, {});
    Toast.info('Statut utilisateur mis à jour');
    loadUtilisateurs(utilPage);
  } catch (e) { Toast.error(e.message); }
}

async function deleteUtilisateur(id) {
  if (!confirmDialog('Supprimer définitivement cet utilisateur ?')) return;
  try {
    await API.del(`/api/utilisateurs/${id}`);
    Toast.success('Utilisateur supprimé');
    loadUtilisateurs(utilPage);
  } catch (e) { Toast.error(e.message); }
}

// Sécurité Admin
if (!Auth.can('admin')) {
  Toast.error('Accès refusé - Administration uniquement');
  location.href = 'dashboard.html';
} else {
  loadUtilisateurs();
}
