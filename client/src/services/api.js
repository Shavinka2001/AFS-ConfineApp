import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api/auth',
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Validate token format
        if (token && typeof token === 'string' && token.length > 0) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() };
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection and try again.'
      });
    }
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Only redirect if not already on login page to prevent infinite redirects
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 errors (forbidden)
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data?.message);
      // Redirect to unauthorized page if not already there
      if (window.location.pathname !== '/unauthorized') {
        window.location.href = '/unauthorized';
      }
    }
    
    // Handle 500+ errors (server errors)
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data?.message);
      error.message = 'Server error. Please try again later.';
    }
    
    // Handle 404 errors
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.response.data?.message);
      error.message = 'Resource not found.';
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// User management API functions
export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get('/users/stats'),
  changeUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.put(`/users/${id}/toggle-status`),
  
  // User approval functions
  getPendingUsers: (params) => api.get('/users/pending', { params }),
  approveUser: (id) => api.put(`/users/${id}/approve`),
  rejectUser: (id, reason) => api.put(`/users/${id}/reject`, { reason }),
};

// Admin settings API functions
export const adminAPI = {
  // System configuration
  getSystemConfig: () => api.get('/admin/system-config'),
  updateSystemConfig: (config) => api.put('/admin/system-config', config),
  
  // Access control
  getAccessControl: () => api.get('/admin/access-control'),
  updateAccessControl: (settings) => api.put('/admin/access-control', settings),
  
  // Security settings
  getSecuritySettings: () => api.get('/admin/security-settings'),
  updateSecuritySettings: (settings) => api.put('/admin/security-settings', settings),
  
  // System status
  getSystemStatus: () => api.get('/admin/system-status'),
  performSystemAction: (action) => api.post('/admin/system-action', { action }),
  
  // System monitoring
  getSystemMetrics: () => api.get('/admin/system-metrics'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  
  // Backup and restore
  createBackup: () => api.post('/admin/backup'),
  getBackups: () => api.get('/admin/backups'),
  restoreBackup: (backupId) => api.post(`/admin/restore/${backupId}`),
  
  // User management for admin
  getUsersWithDetails: (params) => api.get('/admin/users', { params }),
  suspendUser: (userId) => api.put(`/admin/users/${userId}/suspend`),
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`),
  resetUserPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`),
};

// Activity API endpoints
export const activityAPI = {
  getRecentActivities: (limit = 10) => api.get(`/activity/recent?limit=${limit}`),
  getActivityStats: (days = 30) => api.get(`/activity/stats?days=${days}`),
  getSystemHealth: () => api.get('/activity/system-health')
};

export default api;
