/**
 * app.js — Bootstrap commun à toutes les pages protégées
 * À inclure après api.js et auth.js
 */

(async function () {
  // Vérifier la session
  if (!Auth.requireLogin()) return;

  const user = Auth.getUser();

  // ── Sidebar active link ───────────────────────────────────────
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    if (window.location.pathname.includes(item.dataset.page)) {
      item.classList.add('active');
    }
  });

  // ── User info dans sidebar ────────────────────────────────────
  const nameEl = document.getElementById('sb-user-name');
  const roleEl = document.getElementById('sb-user-role');
  const avatarEl = document.getElementById('sb-user-avatar');
  const topNameEl = document.getElementById('top-user-name');

  if (user) {
    const initials = (user.nom?.[0] || '') + (user.prenom?.[0] || '');
    if (nameEl) nameEl.textContent = `${user.prenom} ${user.nom}`;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) avatarEl.textContent = initials.toUpperCase();
    if (topNameEl) topNameEl.textContent = `${user.prenom} ${user.nom}`;
  }

  // ── Masquer éléments selon rôle ───────────────────────────────
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(',').map(r => r.trim());
    if (!Auth.can(...roles)) el.style.display = 'none';
  });

  // ── Notifications badge ───────────────────────────────────────
  const badge = document.getElementById('notif-badge');
  if (badge) {
    try {
      const res = await API.get('/api/notifications/non-lues/count');
      const count = res.data?.count || 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    } catch {}
  }
})();

function logout() {
  if (confirmDialog('Voulez-vous vraiment vous déconnecter ?')) {
    Auth.logout();
  }
}
