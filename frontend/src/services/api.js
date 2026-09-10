const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getToken() {
  return localStorage.getItem('pontoflow_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('pontoflow_token', token);
  } else {
    localStorage.removeItem('pontoflow_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('pontoflow_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('pontoflow_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('pontoflow_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Sessão expirada
      setToken(null);
      setStoredUser(null);
      window.dispatchEvent(new Event('pontoflow_logout'));
    }
    const error = new Error(data.error || 'Erro na requisição');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (login, senha) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, senha })
    }),
    register: (userData) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    getMe: () => request('/auth/me'),
    updateSchedule: (schedule) => request('/auth/schedule', {
      method: 'PUT',
      body: JSON.stringify(schedule)
    }),
    updateProfile: (profileData) => request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  },
  notifications: {
    getConfig: () => request('/notifications/config'),
    subscribe: (subscription) => request('/notifications/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription)
    }),
    updatePreferences: (preferences) => request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    })
  },
  ponto: {
    getToday: () => request('/ponto/today'),
    bater: (tipo, observacao = '') => request('/ponto/bater', {
      method: 'POST',
      body: JSON.stringify({ tipo, observacao })
    }),
    registrarTag: (tagData) => request('/ponto/registrar-tag', {
      method: 'POST',
      body: JSON.stringify(tagData)
    })
  },
  marcadores: {
    list: () => request('/marcadores'),
    create: (data) => request('/marcadores', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/marcadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`/marcadores/${id}`, {
      method: 'DELETE'
    })
  },
  relatorios: {
    get: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/relatorios?${query}`);
    }
  }
};
