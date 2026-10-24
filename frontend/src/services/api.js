const PRODUCTION_API_URL = 'https://finlearn-backend-hagq.onrender.com/api/v1';
const DEV_API_URL = 'http://localhost:5000/api/v1';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? PRODUCTION_API_URL : DEV_API_URL)
).replace(/\/+$/, '');

const BASE_URL = API_BASE_URL;

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Attach token if present in localStorage or memory
    const token = localStorage.getItem('finlearn_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.code = data.code || 'API_ERROR';
        error.errors = data.errors || [];
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error('Unable to connect to the FinLearn server. Please verify your connection or backend status.');
        networkError.code = 'NETWORK_ERROR';
        networkError.status = 0;
        throw networkError;
      }
      throw err;
    }
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Health check helper
  async checkHealth() {
    return this.get('/health');
  }
}

export const api = new ApiService(BASE_URL);
export default api;
