let currentUserId = null;

async function loadProfil() {
  try {
    const res  = await API.get('/api/auth/me');
    const user = res.data;
    currentUserId = user.id;
    document.getElementById('p-nom').value       = user.nom        || '';
    document.getElementById('p-prenom').value    = user.prenom     || '';
    document.getElementById('p-email').value     = user.email      || '';
    document.getElementById('p-telephone').value = user.telephone  || '';
    document.getElementById('p-role').value      = user.role       || '';
  } catch (e) { Toast.error(e.message); }
}

async function saveProfil() {
  const data = {
    nom:       document.getElementById('p-nom').value.trim(),
    prenom:    document.getElementById('p-prenom').value.trim(),
    email:     document.getElementById('p-email').value.trim(),
    telephone: document.getElementById('p-telephone').value.trim(),
  };
  try {
    await API.put(`/api/utilisateurs/${currentUserId}`, data);
    // Mettre à jour le nom affiché
    const stored = Auth.getUser();
    if (stored) {
      stored.nom    = data.nom;
      stored.prenom = data.prenom;
      stored.email  = data.email;
      localStorage.setItem('user', JSON.stringify(stored));
    }
    Toast.success('Profil mis à jour');
    // Rafraîchir l'affichage sidebar
    document.getElementById('sb-user-name').textContent = `${data.nom} ${data.prenom}`;
    document.getElementById('sb-user-avatar').textContent = data.nom.charAt(0).toUpperCase();
    document.getElementById('top-user-name').textContent = `${data.nom} ${data.prenom}`;
  } catch (e) { Toast.error(e.message); }
}

async function changeMdp() {
  const ancien  = document.getElementById('p-old-mdp').value;
  const nouveau = document.getElementById('p-new-mdp').value;
  const confirm = document.getElementById('p-confirm-mdp').value;

  if (!ancien || !nouveau) { Toast.error('Remplissez tous les champs'); return; }
  if (nouveau !== confirm)  { Toast.error('Les mots de passe ne correspondent pas'); return; }
  if (nouveau.length < 6)   { Toast.error('Le mot de passe doit contenir au moins 6 caractères'); return; }

  try {
    await API.post('/api/auth/change-password', {
      ancien_mot_de_passe: ancien,
      nouveau_mot_de_passe: nouveau,
    });
    Toast.success('Mot de passe modifié avec succès');
    document.getElementById('p-old-mdp').value    = '';
    document.getElementById('p-new-mdp').value    = '';
    document.getElementById('p-confirm-mdp').value = '';
  } catch (e) { Toast.error(e.message); }
}

loadProfil();
