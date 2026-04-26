let currentUserId = null;

// Exposer les fonctions globalement
window.loadProfil = loadProfil;
window.saveProfil = saveProfil;
window.changeMdp = changeMdp;

async function loadProfil() {
  try {
    const res  = await API.get('/api/auth/me');
    const user = res.data;
    currentUserId = user.id;
    
    // Remplir les champs
    const nomEl = document.getElementById('p-nom');
    const prenomEl = document.getElementById('p-prenom');
    const emailEl = document.getElementById('p-email');
    const telEl = document.getElementById('p-telephone');
    const fullNameEl = document.getElementById('p-full-name');
    const roleTextEl = document.getElementById('p-role-text');
    const avatarCircleEl = document.getElementById('p-avatar-circle');

    if (nomEl) nomEl.value = user.nom || '';
    if (prenomEl) prenomEl.value = user.prenom || '';
    if (emailEl) emailEl.value = user.email || '';
    if (telEl) telEl.value = user.telephone || '';
    
    if (fullNameEl) fullNameEl.textContent = `${user.prenom} ${user.nom}`;
    if (roleTextEl) roleTextEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (avatarCircleEl) avatarCircleEl.textContent = user.nom.charAt(0).toUpperCase();

    if (window.lucide) lucide.createIcons();
  } catch (e) { Toast.error(e.message); }
}

async function saveProfil() {
  const nom = document.getElementById('p-nom').value.trim();
  const prenom = document.getElementById('p-prenom').value.trim();
  const email = document.getElementById('p-email').value.trim();
  const telephone = document.getElementById('p-telephone').value.trim();

  if (!nom || !prenom || !email) {
    Toast.error('Veuillez remplir les champs obligatoires');
    return;
  }

  const data = { nom, prenom, email, telephone };

  try {
    await API.put(`/api/utilisateurs/${currentUserId}`, data);
    
    // Mettre à jour le stockage local
    const stored = Auth.getUser();
    if (stored) {
      stored.nom    = nom;
      stored.prenom = prenom;
      stored.email  = email;
      localStorage.setItem('user', JSON.stringify(stored));
    }
    
    Toast.success('Profil mis à jour avec succès');
    
    // Mettre à jour l'interface
    document.getElementById('p-full-name').textContent = `${prenom} ${nom}`;
    document.getElementById('p-avatar-circle').textContent = nom.charAt(0).toUpperCase();
    
    // Mettre à jour Sidebar
    const sbName = document.getElementById('sb-user-name');
    const sbAvatar = document.getElementById('sb-user-avatar');
    const topName = document.getElementById('top-user-name');
    
    if (sbName) sbName.textContent = `${nom} ${prenom}`;
    if (sbAvatar) sbAvatar.textContent = nom.charAt(0).toUpperCase();
    if (topName) topName.textContent = prenom;

  } catch (e) { Toast.error(e.message); }
}

async function changeMdp() {
  const ancien  = document.getElementById('p-old-mdp').value;
  const nouveau = document.getElementById('p-new-mdp').value;
  const confirm = document.getElementById('p-confirm-mdp').value;

  if (!ancien || !nouveau) { Toast.error('Veuillez saisir votre mot de passe actuel et le nouveau'); return; }
  if (nouveau !== confirm)  { Toast.error('Les nouveaux mots de passe ne correspondent pas'); return; }
  if (nouveau.length < 6)   { Toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères'); return; }

  try {
    await API.post('/api/auth/change-password', {
      ancien_mot_de_passe: ancien,
      nouveau_mot_de_passe: nouveau,
    });
    Toast.success('Mot de passe modifié avec succès');
    
    // Reset champs
    document.getElementById('p-old-mdp').value    = '';
    document.getElementById('p-new-mdp').value    = '';
    document.getElementById('p-confirm-mdp').value = '';
  } catch (e) { Toast.error(e.message); }
}

// Initialisation
loadProfil();
