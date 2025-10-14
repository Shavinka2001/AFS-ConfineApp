// Work Order API Service
const API_BASE_URL = import.meta.env.VITE_WORKORDER_API_URL || 'http://localhost:3012/api';

class WorkOrderAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    try {
      const responseData = await response.json();
      console.log('API Response Data:', responseData);
      
      // For debugging - examine the structure
      if (responseData.data && responseData.data.orders) {
        console.log('Orders found in responseData.data.orders:', responseData.data.orders.length);
      } else if (responseData.orders) {
        console.log('Orders found directly in responseData.orders:', responseData.orders.length);
      } else {
        console.log('No orders found in response');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error parsing response JSON:', error);
      throw new Error('Invalid response format from server');
    }
  }

  // Get all work orders with filtering and pagination
  async getWorkOrders(token, params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${this.baseURL}/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Fetching work orders from URL:', url);
    
    try {
      // Validate token before sending the request
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Making API request with token for role:', payload.role);
          
          if (payload.exp * 1000 < Date.now()) {
            console.error('Token is expired! Will likely get auth error.');
          }
        }
      } catch (e) {
        console.warn('Could not parse token:', e);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token)
      });
  
      const result = await this.handleResponse(response);
      
      // Check if we received orders data
      if (result.data && Array.isArray(result.data.orders)) {
        console.log(`Successfully retrieved ${result.data.orders.length} work orders`);
      } else if (result.data && !result.data.orders) {
        console.warn('API response has data but no orders array:', result.data);
      } else {
        console.warn('Unexpected API response structure:', result);
        
        // Try the test endpoint as a fallback
        console.log('Trying test endpoint...');
        try {
          const testResponse = await fetch(`${this.baseURL}/orders/test`, {
            method: 'GET'
          });
          const testResult = await testResponse.json();
          console.log('Test endpoint response:', testResult);
          
          // If test endpoint returns data, use that
          if (testResult.success && testResult.data && testResult.data.orders) {
            return {
              success: true,
              data: {
                orders: testResult.data.orders,
                pagination: {
                  currentPage: 1,
                  totalPages: 1,
                  totalItems: testResult.data.orders.length,
                  itemsPerPage: testResult.data.orders.length
                }
              }
            };
          }
        } catch (testErr) {
          console.error('Test endpoint failed:', testErr);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching work orders:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        error: error.message,
        data: {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10
          }
        }
      };
    }
  }

  // Get a single work order by ID
  async getWorkOrderById(token, id) {
    const response = await fetch(`${this.baseURL}/orders/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token)
    });

    return this.handleResponse(response);
  }

  // Create a new work order
  async createWorkOrder(token, workOrderData) {
    const response = await fetch(`${this.baseURL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(workOrderData)
    });

    return this.handleResponse(response);
  }

  // Update an existing work order
  async updateWorkOrder(token, id, updateData) {
    const response = await fetch(`${this.baseURL}/orders/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updateData)
    });

    return this.handleResponse(response);
  }

  // Update work order status
  async updateWorkOrderStatus(token, id, status, comments = '') {
    const response = await fetch(`${this.baseURL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ status, comments })
    });

    return this.handleResponse(response);
  }

  // Delete a work order
  async deleteWorkOrder(token, id) {
    const response = await fetch(`${this.baseURL}/orders/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token)
    });

    return this.handleResponse(response);
  }

  // Get user statistics
  async getUserStats(token) {
    try {
      console.log('Fetching user stats');
      const response = await fetch(`${this.baseURL}/orders/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(token)
      });
  
      const result = await this.handleResponse(response);
      console.log('User stats result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return a default structure in case of error
      return { 
        success: false, 
        error: error.message,
        data: {
          total: 0,
          pending: 0,
          approved: 0,
          inProgress: 0,
          completed: 0
        }
      };
    }
  }

  // Bulk update work order statuses
  async bulkUpdateStatus(token, orderIds, status, comments = '') {
    const response = await fetch(`${this.baseURL}/orders/bulk/status`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ orderIds, status, comments })
    });

    return this.handleResponse(response);
  }

  // Upload work order documents/images
  async uploadFiles(token, workOrderId, files) {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });
    formData.append('workOrderId', workOrderId);

    const response = await fetch(`${this.baseURL}/orders/${workOrderId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData
    });

    return this.handleResponse(response);
  }

  // Download work order report using client-side PDF generation
  async generateWorkOrderPDF(token, workOrder, format = 'pdf') {
    // Import the PDF generator dynamically
    const { default: WorkOrderPDFGenerator } = await import('../utils/WorkOrderPDFGenerator.js');
    
    try {
      const pdfGenerator = new WorkOrderPDFGenerator();
      const result = await pdfGenerator.generatePDF(workOrder);
      return result;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate ${format.toUpperCase()}: ${error.message}`);
    }
  }

  // Search work orders
  async searchWorkOrders(token, searchTerm, filters = {}) {
    const params = {
      search: searchTerm,
      ...filters
    };

    return this.getWorkOrders(token, params);
  }

  // Get work orders by status
  async getWorkOrdersByStatus(token, status, page = 1, limit = 10) {
    return this.getWorkOrders(token, { status, page, limit });
  }

  // Get work orders by priority
  async getWorkOrdersByPriority(token, priority, page = 1, limit = 10) {
    return this.getWorkOrders(token, { priority, page, limit });
  }

  // Get recent work orders
  async getRecentWorkOrders(token, limit = 10) {
    return this.getWorkOrders(token, { 
      sortBy: 'createdAt', 
      sortOrder: 'desc', 
      limit 
    });
  }

  // Get work orders for a date range
  async getWorkOrdersByDateRange(token, dateFrom, dateTo, page = 1, limit = 10) {
    return this.getWorkOrders(token, { 
      dateFrom, 
      dateTo, 
      page, 
      limit,
      sortBy: 'dateOfSurvey',
      sortOrder: 'asc'
    });
  }

  // Get work orders for today
  async getTodaysWorkOrders(token) {
    const today = new Date().toISOString().split('T')[0];
    return this.getWorkOrdersByDateRange(token, today, today);
  }
  
  // Special function for manager to get all work orders
  async getManagerWorkOrders(token, page = 1, limit = 50) {
    console.log('Getting all work orders for manager');
    const url = `${this.baseURL}/orders?page=${page}&limit=${limit}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching manager work orders:', error);
      return {
        success: false,
        data: { orders: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0 } }
      };
    }
  }

  // Get overdue work orders
  async getOverdueWorkOrders(token) {
    const today = new Date().toISOString().split('T')[0];
    return this.getWorkOrders(token, { 
      dateTo: today,
      status: 'pending,approved,in-progress',
      sortBy: 'dateOfSurvey',
      sortOrder: 'asc'
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Create and export a singleton instance
const workOrderAPI = new WorkOrderAPI();

export default workOrderAPI;

// Named exports for specific functionalities
export {
  WorkOrderAPI,
  workOrderAPI
};

// Export status constants
export const WORK_ORDER_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on-hold'
};

export const WORK_ORDER_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Utility functions
export const formatWorkOrderId = (order) => {
  return order.formattedId || `WO-${order.uniqueId || 'DRAFT'}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case WORK_ORDER_STATUSES.DRAFT:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case WORK_ORDER_STATUSES.PENDING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case WORK_ORDER_STATUSES.APPROVED:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case WORK_ORDER_STATUSES.IN_PROGRESS:
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case WORK_ORDER_STATUSES.COMPLETED:
      return 'bg-green-100 text-green-800 border-green-200';
    case WORK_ORDER_STATUSES.CANCELLED:
      return 'bg-red-100 text-red-800 border-red-200';
    case WORK_ORDER_STATUSES.ON_HOLD:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case WORK_ORDER_PRIORITIES.LOW:
      return 'bg-green-100 text-green-800 border-green-200';
    case WORK_ORDER_PRIORITIES.MEDIUM:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case WORK_ORDER_PRIORITIES.HIGH:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case WORK_ORDER_PRIORITIES.CRITICAL:
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
