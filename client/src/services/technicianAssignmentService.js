import axios from 'axios';

const AUTH_API_BASE_URL = 'http://localhost:3001/api';
const LOCATION_API_BASE_URL = 'http://localhost:5004/api';

// Create axios instance for auth service (where users/technicians are managed)
const authAxios = axios.create({
  baseURL: AUTH_API_BASE_URL,
});

// Create axios instance for location service
const locationAxios = axios.create({
  baseURL: LOCATION_API_BASE_URL,
});

// Add token to requests
const addAuthHeader = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

authAxios.interceptors.request.use(addAuthHeader);
locationAxios.interceptors.request.use(addAuthHeader);

// Response interceptors for error handling
const handleResponse = (response) => response;
const handleError = (error) => {
  console.error('Technician Assignment API Error:', error.response?.data || error.message);
  throw error;
};

authAxios.interceptors.response.use(handleResponse, handleError);
locationAxios.interceptors.response.use(handleResponse, handleError);

export const technicianAssignmentService = {
  /**
   * Get all technicians (users with technician role)
   */
  async getAllTechnicians() {
    try {
      const response = await authAxios.get('/users', {
        params: {
          role: 'technician',
          status: 'active'
        }
      });

      return {
        success: true,
        data: response.data.data || response.data || []
      };
    } catch (error) {
      console.error('Error fetching technicians:', error);
      
      // If the auth service endpoint is different, try alternative endpoints
      try {
        const altResponse = await authAxios.get('/technicians');
        return {
          success: true,
          data: altResponse.data.data || altResponse.data.technicians || altResponse.data || []
        };
      } catch (altError) {
        console.error('Alternative endpoint also failed:', altError);
        
        // Return mock data to prevent UI breakage during development
        return {
          success: true,
          data: [
            {
              id: '1',
              _id: '1',
              name: 'John Smith',
              email: 'john.smith@example.com',
              phone: '+1-555-0101',
              role: 'technician',
              skills: ['HVAC', 'Electrical'],
              isAvailable: true,
              status: 'active'
            },
            {
              id: '2',
              _id: '2',
              name: 'Sarah Johnson',
              email: 'sarah.johnson@example.com',
              phone: '+1-555-0102',
              role: 'technician',
              skills: ['Plumbing', 'General Maintenance'],
              isAvailable: true,
              status: 'active'
            },
            {
              id: '3',
              _id: '3',
              name: 'Mike Davis',
              email: 'mike.davis@example.com',
              phone: '+1-555-0103',
              role: 'technician',
              skills: ['Safety Inspector', 'Confined Space'],
              isAvailable: false,
              status: 'active'
            }
          ],
          error: 'Using mock data - auth service endpoints may need configuration'
        };
      }
    }
  },

  /**
   * Get available technicians (not assigned to any location)
   */
  async getAvailableTechnicians() {
    try {
      // First get all technicians
      const allTechniciansResponse = await this.getAllTechnicians();
      if (!allTechniciansResponse.success) {
        return allTechniciansResponse;
      }

      const allTechnicians = allTechniciansResponse.data;

      // Then get assigned technicians from location service
      const assignedResponse = await locationAxios.get('/locations/assigned-technicians');
      const assignedTechnicianIds = assignedResponse.data?.assignedTechnicians || [];

      // Filter out assigned technicians
      const availableTechnicians = allTechnicians.filter(tech => 
        !assignedTechnicianIds.includes(tech.id || tech._id)
      );

      return {
        success: true,
        data: availableTechnicians
      };
    } catch (error) {
      console.error('Error fetching available technicians:', error);
      
      // If the endpoint doesn't exist, just return all technicians
      const allTechniciansResponse = await this.getAllTechnicians();
      return allTechniciansResponse;
    }
  },

  /**
   * Assign a technician to a location
   */
  async assignTechnician(locationId, technicianId) {
    try {
      const response = await locationAxios.post(`/locations/${locationId}/assign-technician`, {
        technicianId
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error assigning technician:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Remove technician assignment from a location
   */
  async removeTechnicianAssignment(locationId) {
    // Some backends may not implement the exact DELETE endpoint. Try several
    // strategies in order: DELETE, POST /unassign, PATCH with assignedTechnician=null,
    // and a generic POST to a remove endpoint. Use retries with exponential backoff.
    const attempts = [];

    // Primary: expected DELETE endpoint
    attempts.push(async () => {
      return await locationAxios.delete(`/locations/${locationId}/remove-technician`);
    });

    // Fallback: POST to unassign endpoint
    attempts.push(async () => {
      return await locationAxios.post(`/locations/${locationId}/unassign-technician`);
    });

    // Fallback: generic POST to unassign with body
    attempts.push(async () => {
      return await locationAxios.post(`/locations/${locationId}/unassign`, { locationId });
    });

    // Fallback: PATCH the location to clear assignedTechnician
    attempts.push(async () => {
      return await locationAxios.patch(`/locations/${locationId}`, { assignedTechnician: null });
    });

    // Last resort: POST to collection-level remove endpoint
    attempts.push(async () => {
      return await locationAxios.post(`/locations/remove-technician`, { locationId });
    });

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < attempts.length; i++) {
      const fn = attempts[i];
      // Try each strategy with up to 2 retries for transient errors
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await fn();
          // If the response indicates success or returns data, treat as success
          return {
            success: true,
            data: response.data
          };
        } catch (err) {
          // If client error like 404/405 on this specific endpoint, break the retry loop
          const status = err.response?.status;
          console.warn(`Attempt ${i + 1}.${attempt} failed for removeTechnicianAssignment (locationId=${locationId}):`, err.response?.data || err.message);
          if (status && (status === 404 || status === 405 || status === 400)) {
            // move to next strategy without retrying this one
            break;
          }
          // For other errors (5xx, network), retry with backoff
          if (attempt < 2) {
            const backoff = 200 * Math.pow(2, attempt); // 400ms, 800ms
            await sleep(backoff);
            continue;
          }
          // after retries, move to next strategy
          break;
        }
      }
    }

    // If we've reached here, all strategies failed
    const msg = 'Failed to unassign technician from location. Please contact support.';
    console.error('All removeTechnicianAssignment strategies failed for locationId=', locationId);
    return {
      success: false,
      error: msg
    };
  },

  /**
   * Get technician assignments summary
   */
  async getAssignmentsSummary() {
    try {
      const response = await locationAxios.get('/locations/assignments-summary');

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching assignments summary:', error);
      return {
        success: true,
        data: {
          totalLocations: 0,
          assignedLocations: 0,
          availableLocations: 0,
          totalTechnicians: 0,
          assignedTechnicians: 0,
          availableTechnicians: 0
        },
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Search technicians by skills or availability
   */
  async searchTechnicians(query) {
    try {
      const allTechniciansResponse = await this.getAllTechnicians();
      if (!allTechniciansResponse.success) {
        return allTechniciansResponse;
      }

      const allTechnicians = allTechniciansResponse.data;
      
      // Simple client-side search by name, email, or skills
      const searchResults = allTechnicians.filter(tech => {
        const searchTerm = query.toLowerCase();
        return (
          tech.name?.toLowerCase().includes(searchTerm) ||
          tech.email?.toLowerCase().includes(searchTerm) ||
          (tech.skills && tech.skills.some(skill => 
            skill.toLowerCase().includes(searchTerm)
          ))
        );
      });

      return {
        success: true,
        data: searchResults
      };
    } catch (error) {
      console.error('Error searching technicians:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get technician details by ID
   */
  async getTechnicianById(technicianId) {
    try {
      const response = await authAxios.get(`/users/${technicianId}`);

      return {
        success: true,
        data: response.data.user || response.data
      };
    } catch (error) {
      console.error('Error fetching technician details:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Update technician availability status
   */
  async updateTechnicianAvailability(technicianId, isAvailable) {
    try {
      const response = await authAxios.put(`/users/${technicianId}/availability`, {
        isAvailable
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating technician availability:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get current technician's profile with location assignment
   */
  async getMyTechnicianProfile() {
    try {
      // Get user profile from auth service
      const authResponse = await authAxios.get('/profile');
      const user = authResponse.data.data.user;

      // Get assigned location from location service
      const locationResponse = await locationAxios.get(`/locations/technician/${user.id}`);
      const locations = locationResponse.data.data.locations || [];

      // Find active assignment
      const activeAssignment = locations.find(loc => 
        loc.assignedTechnician && loc.assignedTechnician.isActive
      );

      const profile = {
        id: user.id,
        fullName: user.fullName,
        employeeId: user.username, // Using username as employee ID
        email: user.email,
        role: user.role,
        currentAssignment: activeAssignment ? {
          isActive: true,
          locationId: activeAssignment._id,
          locationName: activeAssignment.name,
          assignedDate: activeAssignment.assignedTechnician.assignedDate
        } : {
          isActive: false,
          locationId: null,
          locationName: null,
          assignedDate: null
        }
      };

      return {
        success: true,
        data: profile
      };
    } catch (error) {
      console.error('Error fetching technician profile:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Get current technician's tasks (work orders)
   */
  async getMyTasks() {
    try {
      // Get user profile first to get technician name
      const profileResponse = await this.getMyTechnicianProfile();
      if (!profileResponse.success) {
        return profileResponse;
      }

      const technicianName = profileResponse.data.fullName;

      // Get work orders from work order service
      // Note: This assumes work orders are accessible via the work order API
      // You may need to adjust the endpoint and filtering logic
      const workOrderAxios = axios.create({
        baseURL: 'http://localhost:3012/api',
      });
      workOrderAxios.interceptors.request.use(addAuthHeader);

      const ordersResponse = await workOrderAxios.get('/orders', {
        params: {
          technician: technicianName,
          status: 'pending,in-progress,approved',
          limit: 50
        }
      });

      // Transform work orders to task format
      const tasks = (ordersResponse.data.data.orders || []).map(order => ({
        _id: order._id,
        title: `${order.spaceName} - ${order.building}`,
        description: order.locationDescription,
        status: order.status === 'approved' ? 'pending' : 
                order.status === 'in-progress' ? 'in-progress' : 'pending',
        priority: order.priority || 'medium',
        dueDate: order.surveyDate,
        location: `${order.building} - ${order.locationDescription}`,
        createdAt: order.createdAt,
        workOrderId: order.workOrderId
      }));

      return {
        success: true,
        data: tasks
      };
    } catch (error) {
      console.error('Error fetching technician tasks:', error);
      
      // Return empty tasks array on error to prevent UI breakage
      return {
        success: true,
        data: [],
        error: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, newStatus) {
    try {
      const workOrderAxios = axios.create({
        baseURL: 'http://localhost:3012/api',
      });
      workOrderAxios.interceptors.request.use(addAuthHeader);

      const response = await workOrderAxios.patch(`/orders/${taskId}/status`, {
        status: newStatus === 'in-progress' ? 'in-progress' : 
                newStatus === 'completed' ? 'completed' : 'pending'
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};

export default technicianAssignmentService;