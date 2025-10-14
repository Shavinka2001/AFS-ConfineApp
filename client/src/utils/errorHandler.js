import { toast } from 'react-hot-toast';

// Enhanced error handler utility with comprehensive error handling
export class ErrorHandler {
  constructor() {
    this.defaultMessages = {
      network: 'Network error. Please check your connection and try again.',
      unauthorized: 'You are not authorized to perform this action.',
      forbidden: 'Access denied. You do not have permission to perform this action.',
      notFound: 'The requested resource was not found.',
      server: 'Server error. Please try again later.',
      validation: 'Please check your input and try again.',
      timeout: 'Request timed out. Please try again.',
      default: 'An unexpected error occurred. Please try again.',
    };
  }

  // Extract meaningful error message from error object
  extractErrorMessage(error) {
    if (!error) return this.defaultMessages.default;

    // Network error
    if (!error.response && error.code === 'ECONNABORTED') {
      return this.defaultMessages.timeout;
    }

    if (!error.response) {
      return this.defaultMessages.network;
    }

    const { status, data } = error.response;

    // Check for specific error messages in response
    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.join(', ');
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        return data?.details || this.defaultMessages.validation;
      case 401:
        return this.defaultMessages.unauthorized;
      case 403:
        return this.defaultMessages.forbidden;
      case 404:
        return this.defaultMessages.notFound;
      case 422:
        return this.extractValidationErrors(data);
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
      case 502:
      case 503:
      case 504:
        return this.defaultMessages.server;
      default:
        return this.defaultMessages.default;
    }
  }

  // Extract validation errors from response
  extractValidationErrors(data) {
    if (data?.validationErrors) {
      const errors = Object.values(data.validationErrors).flat();
      return errors.length > 0 ? errors.join(', ') : this.defaultMessages.validation;
    }

    if (data?.details && typeof data.details === 'object') {
      const errors = Object.values(data.details).flat();
      return errors.length > 0 ? errors.join(', ') : this.defaultMessages.validation;
    }

    return this.defaultMessages.validation;
  }

  // Handle error with toast notification
  handleError(error, customMessage = null, options = {}) {
    const message = customMessage || this.extractErrorMessage(error);
    
    console.error('Error details:', {
      error,
      message,
      timestamp: new Date().toISOString(),
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    // Show toast notification
    toast.error(message, {
      duration: options.duration || 5000,
      position: options.position || 'top-right',
      style: {
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        color: '#DC2626',
        ...options.style,
      },
    });

    return { success: false, message, error };
  }

  // Handle success with toast notification
  handleSuccess(message, options = {}) {
    toast.success(message, {
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      style: {
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        color: '#16A34A',
        ...options.style,
      },
    });

    return { success: true, message };
  }

  // Handle warning with toast notification
  handleWarning(message, options = {}) {
    toast(message, {
      icon: '⚠️',
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      style: {
        background: '#FFFBEB',
        border: '1px solid #FED7AA',
        color: '#D97706',
        ...options.style,
      },
    });

    return { success: true, message, type: 'warning' };
  }

  // Handle info with toast notification
  handleInfo(message, options = {}) {
    toast(message, {
      icon: 'ℹ️',
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      style: {
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        color: '#2563EB',
        ...options.style,
      },
    });

    return { success: true, message, type: 'info' };
  }

  // Async error handler for API calls
  async handleAsyncOperation(operation, errorMessage = null, successMessage = null) {
    try {
      const result = await operation();
      
      if (successMessage) {
        this.handleSuccess(successMessage);
      }
      
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error, errorMessage);
    }
  }

  // Validate required fields
  validateRequired(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`${field} is required`);
      }
    });

    if (errors.length > 0) {
      const message = errors.join(', ');
      this.handleError(null, message);
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      this.handleError(null, 'Please enter a valid email address');
    }
    
    return isValid;
  }

  // Validate password strength
  validatePassword(password, minLength = 8) {
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      const message = errors.join(', ');
      this.handleError(null, message);
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  // Confirm action with user
  async confirmAction(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      resolve(confirmed);
    });
  }

  // Log error for debugging
  logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        name: error?.name,
      },
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('Error Log:', errorLog);
    
    // In production, you might want to send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
    
    return errorLog;
  }
}

// Create and export singleton instance
export const errorHandler = new ErrorHandler();

// Export commonly used methods for convenience
export const {
  handleError,
  handleSuccess,
  handleWarning,
  handleInfo,
  handleAsyncOperation,
  validateRequired,
  validateEmail,
  validatePassword,
  confirmAction,
  logError,
} = errorHandler;

// Export utility functions
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default errorHandler;