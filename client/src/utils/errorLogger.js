// Error logging utility
export class ErrorLogger {
  static log(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo);
    }

    // In production, you would send this to your logging service
    // Example: sendToLoggingService(errorInfo);
    
    return errorInfo;
  }

  static logAuthError(error, operation) {
    return this.log(error, {
      type: 'authentication',
      operation,
      user: localStorage.getItem('user') ? 'authenticated' : 'anonymous',
    });
  }

  static logAPIError(error, endpoint, method = 'GET') {
    return this.log(error, {
      type: 'api',
      endpoint,
      method,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
  }

  static logUIError(error, component, action) {
    return this.log(error, {
      type: 'ui',
      component,
      action,
    });
  }
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  ErrorLogger.log(event.reason, {
    type: 'unhandled_promise_rejection',
  });
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  ErrorLogger.log(event.error, {
    type: 'javascript_error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

export default ErrorLogger;
