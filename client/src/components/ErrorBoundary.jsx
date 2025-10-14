import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to a logging service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRefresh = () => {
    // Reset the error boundary state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Refresh the page
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear error state and navigate to home
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Logo */}
            <div className="mb-8">
              <img src="/logo.jpg" alt="Confine App" className="w-24 h-24 mx-auto mb-4 object-contain" />
              <h1 className="text-2xl font-bold text-[#232249]">Confine App</h1>
            </div>

            {/* Error Icon */}
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h2>
              <p className="text-gray-600 text-lg mb-4">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </p>
              
              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left bg-gray-100 p-4 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-red-600 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-gray-700 overflow-auto">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={this.handleRefresh}
                className="w-full flex items-center justify-center px-6 py-3 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </button>
            </div>

            {/* Help Text */}
            <p className="mt-8 text-sm text-gray-500">
              If this error persists, please contact technical support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
