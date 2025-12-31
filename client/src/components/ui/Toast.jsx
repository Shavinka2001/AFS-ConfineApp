import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          bg: 'bg-white',
          border: 'border-green-500',
          text: 'text-gray-900'
        };
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          bg: 'bg-white',
          border: 'border-red-500',
          text: 'text-gray-900'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          bg: 'bg-white',
          border: 'border-yellow-500',
          text: 'text-gray-900'
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5 text-blue-600" />,
          bg: 'bg-white',
          border: 'border-blue-500',
          text: 'text-gray-900'
        };
      default:
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          bg: 'bg-white',
          border: 'border-green-500',
          text: 'text-gray-900'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${config.bg} border-l-4 ${config.border} rounded-lg shadow-lg p-4 animate-slide-in`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.text}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;