import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock, AlertCircle, LogIn, User, Zap, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear any stale auth data when component mounts
  React.useEffect(() => {
    // Clear any stale auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      const from = location.state?.from?.pathname || getDashboardRoute(result.user.role);
      navigate(from, { replace: true });
    }
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'technician':
        return '/technician/dashboard';
      default:
        return '/user/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl shadow-xl flex items-center justify-center">
              <img src="/logo.jpg" alt="Confine App" className="w-16 h-16 object-contain rounded-xl" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Sign In Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 tracking-wide text-[#232249]">Welcome Back</h2>
          <p className="text-gray-600 text-base">Sign in to your account to continue</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`mb-4 p-4 border rounded-lg ${
            error.includes('pending approval') || error.includes('PENDING_APPROVAL') 
              ? 'bg-amber-50 border-amber-200' 
              : error.includes('rejected') || error.includes('ACCOUNT_REJECTED')
              ? 'bg-orange-50 border-orange-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              <div className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                error.includes('pending approval') || error.includes('PENDING_APPROVAL') 
                  ? 'text-amber-500' 
                  : error.includes('rejected') || error.includes('ACCOUNT_REJECTED')
                  ? 'text-orange-500'
                  : 'text-red-500'
              }`}>
                {error.includes('pending approval') || error.includes('PENDING_APPROVAL') ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                ) : error.includes('rejected') || error.includes('ACCOUNT_REJECTED') ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  error.includes('pending approval') || error.includes('PENDING_APPROVAL') 
                    ? 'text-amber-700' 
                    : error.includes('rejected') || error.includes('ACCOUNT_REJECTED')
                    ? 'text-orange-700'
                    : 'text-red-700'
                }`}>
                  {error.includes('pending approval') || error.includes('PENDING_APPROVAL') 
                    ? 'Account Pending Approval'
                    : error.includes('rejected') || error.includes('ACCOUNT_REJECTED')
                    ? 'Account Access Denied'
                    : 'Login Failed'
                  }
                </p>
                <p className={`text-xs mt-1 ${
                  error.includes('pending approval') || error.includes('PENDING_APPROVAL') 
                    ? 'text-amber-600' 
                    : error.includes('rejected') || error.includes('ACCOUNT_REJECTED')
                    ? 'text-orange-600'
                    : 'text-red-600'
                }`}>
                  {error.includes('pending approval') || error.includes('PENDING_APPROVAL') 
                    ? 'Your account is being reviewed by an administrator. You will receive an email notification once approved.'
                    : error.includes('rejected') || error.includes('ACCOUNT_REJECTED')
                    ? 'Your account application has been declined. Please contact support for more information.'
                    : error
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-[#232249]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" style={{color: focusedField === 'email' ? '#232249' : undefined}} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`w-full pl-10 pr-3 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                    transition-all duration-200 focus:outline-none focus:ring-3 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                      : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                  }`}
                  placeholder="Enter your email address"
                  onFocus={(e) => {
                    setFocusedField('email');
                  }}
                  onBlur={(e) => {
                    setFocusedField('');
                  }}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2 text-[#232249]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" style={{color: focusedField === 'password' ? '#232249' : undefined}} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                    transition-all duration-200 focus:outline-none focus:ring-3 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                      : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                  }`}
                  placeholder="Enter your password"
                  onFocus={(e) => {
                    setFocusedField('password');
                  }}
                  onBlur={(e) => {
                    setFocusedField('');
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400 hover:text-[#232249]" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400 hover:text-[#232249]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between py-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#232249] focus:ring-[#232249]/20"
                />
                <span className="ml-2 text-sm text-gray-600 font-medium">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#232249] hover:text-[#232249]/80 transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white text-base transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#232249] hover:bg-[#232249]/90 hover:shadow-md transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">Don't have an account?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="w-full flex items-center justify-center py-3 px-6 border-2 border-[#232249] rounded-lg font-bold text-base text-[#232249] hover:bg-[#232249] hover:text-white transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <User className="w-4 h-4 mr-2" />
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
