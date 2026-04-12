const typeIcons = { rdv: '📅', consultation: '🩺', ordonnance: '💊', general: '📢', systeme: '⚙️' };

async function loadNotifications() {
  const container = document.getElementById('notif-list');
  try {
    const res    = await API.get('/api/notifications');
    const notifs = res.data || [];
    const unread = notifs.filter(n => !n.lu).length;

    document.getElementById('notif-count-text').textContent =
      unread ? `${unread} notification(s) non lue(s)` : 'Tout est lu';

    if (!notifs.length) {
      container.innerHTML = `<div class="empty-state" style="padding:3rem">
        <div class="empty-icon">🔔</div><p>Aucune notification</p></div>`;
      return;
    }

    container.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.lu ? '' : 'notif-unread'}" id="notif-${n.id}">
        <div class="notif-icon">${typeIcons[n.type] || '📢'}</div>
        <div class="notif-body">
          <div class="notif-title">${n.titre}</div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${formatDateTime(n.created_at)}</div>
        </div>
        <div class="notif-actions">
          ${!n.lu ? `<button class="btn btn-outline-primary btn-sm" onclick="marquerLue(${n.id})">✓ Lu</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteNotif(${n.id})">🗑️</button>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = `<div style="color:var(--danger);padding:1rem">${e.message}</div>`;
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
    Toast.success('Toutes les notifications marquées comme lues');
    loadNotifications();
    updateNotifBadge();
  } catch (e) { Toast.error(e.message); }
}

async function deleteNotif(id) {
  try {
    await API.del(`/api/notifications/${id}`);
    document.getElementById(`notif-${id}`)?.remove();
    if (!document.querySelector('[id^="notif-"]')) {
      document.getElementById('notif-list').innerHTML =
        `<div class="empty-state" style="padding:3rem"><div class="empty-icon">🔔</div><p>Aucune notification</p></div>`;
    }
    updateNotifBadge();
  } catch (e) { Toast.error(e.message); }
}

async function updateNotifBadge() {
  try {
    const res = await API.get('/api/notifications/non-lues/count');
    const count = res.data.count || 0;
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = count; badge.style.display = count ? 'flex' : 'none'; }
  } catch {}
}

loadNotifications();
