import axios from 'axios';

const LOCATION_API_BASE_URL = import.meta.env.VITE_LOCATION_API_URL || 'http://localhost:5004/api';

// Create axios instance for location management service
const locationAPI = axios.create({
  baseURL: LOCATION_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
locationAPI.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.metadata = { startTime: new Date() };
      return config;
    } catch (error) {
      console.error('Location API request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('Location API request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
locationAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      console.error('Location API network error:', error.message);
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection and try again.'
      });
    }
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle other errors
    if (error.response?.status >= 500) {
      console.error('Location API server error:', error.response.data?.message);
      error.message = 'Server error. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

// Location API functions
export const locationService = {
  // Location CRUD operations
  getLocations: (params = {}) => locationAPI.get('/locations', { params }),
  getLocationById: (id) => locationAPI.get(`/locations/${id}`),
  createLocation: (locationData) => locationAPI.post('/locations', locationData),
  updateLocation: (id, locationData) => locationAPI.put(`/locations/${id}`, locationData),
  deleteLocation: (id) => locationAPI.delete(`/locations/${id}`),
  
  // Location statistics
  getLocationStats: () => locationAPI.get('/locations/stats'),
  
  // Technician assignment
  assignTechnician: (locationId, technicianData) => 
    locationAPI.post(`/locations/${locationId}/assign-technician`, technicianData),
  removeTechnician: (locationId) => 
    locationAPI.post(`/locations/${locationId}/remove-technician`),
  getLocationsByTechnician: (technicianId) => 
    locationAPI.get(`/locations/technician/${technicianId}`),
  getAvailableLocations: () => locationAPI.get('/locations/available'),

  // Building operations
  getBuildings: (params = {}) => locationAPI.get('/buildings', { params }),
  getBuildingsByLocation: (locationId) => locationAPI.get(`/buildings/location/${locationId}`),
  getBuildingById: (id) => locationAPI.get(`/buildings/${id}`),
  createBuilding: (buildingData) => locationAPI.post('/buildings', buildingData),
  updateBuilding: (id, buildingData) => locationAPI.put(`/buildings/${id}`, buildingData),
  deleteBuilding: (id) => locationAPI.delete(`/buildings/${id}`),
  
  // Building statistics and special queries
  getBuildingStats: () => locationAPI.get('/buildings/stats'),
  getBuildingsWithConfinedSpaces: () => locationAPI.get('/buildings/with-confined-spaces'),
  
  // Confined spaces
  addConfinedSpace: (buildingId, spaceData) => 
    locationAPI.post(`/buildings/${buildingId}/confined-spaces`, spaceData),
  removeConfinedSpace: (buildingId, spaceId) => 
    locationAPI.delete(`/buildings/${buildingId}/confined-spaces/${spaceId}`)
};

// Technician assignment service (for getting technician list)
export const technicianAssignmentService = {
  getAllTechnicians: async () => {
    try {
      // This should call the auth service to get technicians
      const authAPI = axios.create({
        baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001/api',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const response = await authAPI.get('/users', {
        params: {
          role: 'technician',
          status: 'active'
        }
      });
      
      return {
        success: true,
        data: response.data?.data?.users || response.data?.users || []
      };
    } catch (error) {
      console.error('Error fetching technicians:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Failed to fetch technicians'
      };
    }
  }
};

export default locationService;