import axios from 'axios';

// Create axios instance for location service
const locationAxios = axios.create({
  baseURL: '/api/location',
});

// Create axios instance for auth service
const authAxios = axios.create({
  baseURL: '/api/auth',
});

// Add token to requests
locationAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptors for error handling
const handleResponse = (response) => response;
const handleError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  throw error;
};

locationAxios.interceptors.response.use(handleResponse, handleError);
authAxios.interceptors.response.use(handleResponse, handleError);

export const technicianLocationService = {
  /**
   * Get the current technician's assigned location
   */
  async getMyLocation() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('No user data found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.id) {
        throw new Error('No user ID found');
      }

      // Try to get location assigned to this technician
      const response = await locationAxios.get(`/locations/technician/${user.id}`);
      
      // Response structure: { success: true, data: { locations: [...] } }
      const locations = response.data?.data?.locations || [];
      
      // Find the active assignment (technician should only have one active assignment)
      const activeLocation = locations.find(loc => 
        loc.assignedTechnician && loc.assignedTechnician.isActive
      );
      
      return {
        success: true,
        data: activeLocation || null
      };
    } catch (error) {
      console.error('Error fetching technician location:', error);
      
      // Return null data but success true so components don't break
      return {
        success: true,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get tasks/activities for the current technician
   * This is a placeholder implementation - you can enhance it based on your needs
   */
  async getMyTasks() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('No user data found');
      }
      
      const user = JSON.parse(userStr);
      if (!user.id) {
        throw new Error('No user ID found');
      }

      // For now, return a basic task structure
      // You can enhance this to call actual task endpoints when available
      const mockTasks = [
        {
          id: 1,
          title: 'Safety Inspection',
          status: 'pending',
          priority: 'high',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          type: 'inspection'
        },
        {
          id: 2,
          title: 'Equipment Check',
          status: 'in-progress',
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          type: 'maintenance'
        },
        {
          id: 3,
          title: 'Report Submission',
          status: 'completed',
          priority: 'low',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          type: 'documentation'
        }
      ];

      return {
        success: true,
        data: mockTasks
      };
    } catch (error) {
      console.error('Error fetching technician tasks:', error);
      
      return {
        success: true,
        data: [],
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get technician statistics and summary
   */
  async getMyStats() {
    try {
      // This could integrate with actual statistics endpoints
      const stats = {
        totalTasks: 12,
        completedTasks: 8,
        pendingTasks: 3,
        inProgressTasks: 1,
        locationsAssigned: 1,
        completionRate: Math.round((8 / 12) * 100)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching technician stats:', error);
      
      return {
        success: true,
        data: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          locationsAssigned: 0,
          completionRate: 0
        },
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Update technician availability status
   */
  async updateAvailability(isAvailable) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('No user data found');
      }
      
      const user = JSON.parse(userStr);
      
      // This would call an actual endpoint to update technician status
      const response = await authAxios.put(`/technicians/${user.id}/availability`, {
        isAvailable
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating availability:', error);
      
      // For now, just return success to prevent UI breakage
      return {
        success: true,
        data: { isAvailable },
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get upcoming schedule/assignments
   */
  async getMySchedule() {
    try {
      // Placeholder implementation for schedule
      const schedule = [
        {
          id: 1,
          title: 'Morning Safety Check',
          startTime: '09:00',
          endTime: '10:00',
          date: new Date().toISOString().split('T')[0],
          type: 'inspection',
          location: 'Main Building'
        },
        {
          id: 2,
          title: 'Equipment Maintenance',
          startTime: '14:00',
          endTime: '16:00',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'maintenance',
          location: 'Warehouse A'
        }
      ];

      return {
        success: true,
        data: schedule
      };
    } catch (error) {
      console.error('Error fetching schedule:', error);
      
      return {
        success: true,
        data: [],
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Remove own location assignment (technician self-remove)
   */
  async removeMyAssignment() {
    try {
      const response = await locationAxios.post('/locations/my-location/self-remove');
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error removing assignment:', error);
      
      throw {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to remove assignment'
      };
    }
  }
};

export default technicianLocationService;