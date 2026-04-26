const typeConfig = {
    rdv: { icon: 'calendar', class: 'icon-rdv' },
    consultation: { icon: 'stethoscope', class: 'icon-consultation' },
    ordonnance: { icon: 'pill', class: 'icon-ordonnance' },
    general: { icon: 'info', class: 'icon-general' },
    systeme: { icon: 'settings', class: 'icon-systeme' }
};

// Exposer les fonctions
window.loadNotifications = loadNotifications;
window.marquerLue = marquerLue;
window.toutLire = toutLire;
window.deleteNotif = deleteNotif;

async function loadNotifications() {
  const container = document.getElementById('notif-list');
  const statusText = document.getElementById('notif-status-text');
  if (!container) return;

  try {
    const res    = await API.get('/api/notifications');
    const notifs = res.data || [];
    const unread = notifs.filter(n => !n.lu).length;

    if (statusText) {
      statusText.textContent = unread ? `${unread} notification(s) non lue(s)` : 'Toutes vos notifications ont été lues';
    }

    if (!notifs.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding:100px">
            <div class="empty-icon"><i data-lucide="bell-off"></i></div>
            <p>Vous n'avez aucune notification pour le moment.</p>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = notifs.map(n => {
      const config = typeConfig[n.type] || typeConfig.general;
      return `
      <div class="notif-card ${n.lu ? '' : 'unread'}" id="notif-${n.id}">
        ${!n.lu ? '<div class="unread-indicator"></div>' : ''}
        <div class="notif-icon-box ${config.class}">
          <i data-lucide="${config.icon}"></i>
        </div>
        <div class="notif-content">
          <div class="notif-title">${n.titre}</div>
          <div class="notif-message">${n.message}</div>
          <div class="notif-meta">
            <span><i data-lucide="clock" style="width:12px"></i> ${formatDateTime(n.created_at)}</span>
          </div>
        </div>
        <div class="action-btns">
          ${!n.lu ? `
            <button class="btn-icon" title="Marquer comme lu" onclick="marquerLue(${n.id})" style="color:var(--success)">
                <i data-lucide="check"></i>
            </button>` : ''}
          <button class="btn-icon" title="Supprimer" onclick="deleteNotif(${n.id})" style="color:var(--danger)">
              <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
  } catch (e) {
    container.innerHTML = `<div style="color:var(--danger);padding:2rem;text-align:center">${e.message}</div>`;
  }
}

async function marquerLue(id) {
  try {
    await API.patch(`/api/notifications/${id}/lue`, {});
    loadNotifications();
    updateNotifBadge();
  } catch (e) { Toast.error(e.message); }
}

async function toutLire() {
  try {
    await API.patch('/api/notifications/tout-lire', {});
    Toast.success('Notifications marquées comme lues');
    loadNotifications();
    updateNotifBadge();
  } catch (e) { Toast.error(e.message); }
}

async function deleteNotif(id) {
  try {
    await API.del(`/api/notifications/${id}`);
    const el = document.getElementById(`notif-${id}`);
    if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        setTimeout(() => {
            el.remove();
            if (!document.querySelector('.notif-card')) {
                loadNotifications();
            }
        }, 300);
    }
    updateNotifBadge();
  } catch (e) { Toast.error(e.message); }
}

async function updateNotifBadge() {
  try {
    const res = await API.get('/api/notifications/non-lues/count');
    const count = res.data.count || 0;
    const badge = document.getElementById('notif-badge');
    if (badge) { 
        badge.textContent = count; 
        badge.style.display = count ? 'flex' : 'none'; 
    }
  } catch {}
}

loadNotifications();
