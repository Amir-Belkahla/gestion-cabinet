/**
 * Auth — Gestion de session utilisateur
 */
const Auth = {
  saveSession(data) {
    localStorage.setItem('access_token',  data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  getRole() {
    return this.getUser()?.role || null;
  },

  isLoggedIn() {
    return !!localStorage.getItem('access_token');
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  can(...roles) {
    return roles.includes(this.getRole());
  },

  logout() {
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      API.post('/api/auth/logout', { refresh_token: rt }).catch(() => {});
    }
    localStorage.clear();
    window.location.href = 'index.html';
  },

  async refreshMe() {
    try {
      const res = await API.get('/api/auth/me');
      const user = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch { return null; }
  }
};
