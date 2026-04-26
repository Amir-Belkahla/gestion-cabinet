/**
 * API client — Wrapper fetch vers le backend PHP
 */
const API_BASE = 'http://localhost/gestion_cabinet/backend';

const API = {
  async request(method, endpoint, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers, credentials: 'include' };
    if (data && method !== 'GET') opts.body = JSON.stringify(data);

    const url = API_BASE + endpoint;
    let res;

    try {
      res = await fetch(url, opts);
    } catch (e) {
      throw new Error('Impossible de contacter le serveur. Vérifiez qu\'XAMPP est démarré.');
    }

    // Tentative de refresh si 401
    if (res.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/refresh') {
      const refreshed = await API._tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
        res = await fetch(url, { method, headers, credentials: 'include', body: opts.body });
      } else {
        Auth.logout();
        return;
      }
    }

    let json;
    try { json = await res.json(); }
    catch { throw new Error('Réponse invalide du serveur.'); }

    if (!json.success) throw new Error(json.message || 'Erreur inconnue');
    return json;
  },

  async _tryRefresh() {
    const rt = localStorage.getItem('refresh_token');
    if (!rt) return false;
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success && json.data?.access_token) {
        localStorage.setItem('access_token', json.data.access_token);
        return true;
      }
    } catch {}
    return false;
  },

  get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', endpoint + (qs ? '?' + qs : ''));
  },
  post(endpoint, data)         { return this.request('POST',   endpoint, data); },
  put(endpoint, data)          { return this.request('PUT',    endpoint, data); },
  patch(endpoint, data = null) { return this.request('PATCH',  endpoint, data); },
  del(endpoint)                { return this.request('DELETE', endpoint); },
};

// ── Toast ─────────────────────────────────────────────────────
const Toast = {
  show(message, type = 'info', title = '') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const titles = { success: 'Succès', error: 'Erreur', info: 'Info', warning: 'Attention' };
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-body">
        <div class="toast-title">${title || titles[type]}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  info(msg)    { this.show(msg, 'info'); },
  warning(msg) { this.show(msg, 'warning'); },
};

// ── Helpers ───────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('fr-FR');
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function badgeStatut(statut) {
  return `<span class="badge badge-${statut}">${statut}</span>`;
}

function badgeRole(role) {
  return `<span class="badge badge-${role}">${role}</span>`;
}

function confirmDialog(msg) {
  return window.confirm(msg);
}
