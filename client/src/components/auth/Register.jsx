import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
  username: yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  department: yup.string(),
  phone: yup.string(),
  specializations: yup.string(),
  certifications: yup.string(),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });

  // Clear error when user starts typing
  const handleInputChange = () => {
    if (error) {
      clearError();
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    const { confirmPassword, ...userData } = data;
    // Set default role to 'user' if not provided
    userData.role = 'user';
    console.log('Sending userData to register:', userData);
    const result = await registerUser(userData);
    console.log('Registration result:', result);
    if (result.success) {
      if (result.data?.requiresApproval) {
        setSuccessMessage('Registration successful! Your account is pending approval from an administrator. You will receive an email notification once approved.');
        // Don't redirect for pending approval accounts
        setTimeout(() => {
          navigate('/login');
        }, 5000); // Longer delay to let user read the message
      } else {
        setSuccessMessage(result.message || 'Registration successful!');
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-2xl">
        {/* Logo and Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="relative mb-3 sm:mb-4 inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl shadow-xl flex items-center justify-center">
              <img src="/logo.jpg" alt="Confine App" className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Sign Up Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 tracking-wide text-[#232249]">Create Account</h2>
          <p className="text-gray-600 text-sm sm:text-base">Join our secure platform today</p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start">
              <div className="w-6 h-6 mr-3 mt-0.5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-emerald-700 text-sm font-medium mb-1">{successMessage}</p>
                {successMessage.includes('pending approval') ? (
                  <p className="text-emerald-600 text-xs">You will be redirected to the login page in a few seconds...</p>
                ) : (
                  <p className="text-emerald-600 text-xs">Redirecting to login page...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Register Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            onChange={handleInputChange}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold mb-2 text-[#232249]">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('firstName')}
                    type="text"
                    className={`w-full pl-10 pr-3 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                      transition-all duration-200 focus:outline-none focus:ring-3 ${
                      errors.firstName 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                    }`}
                    placeholder="First name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold mb-2 text-[#232249]">
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className={`w-full px-3 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                    transition-all duration-200 focus:outline-none focus:ring-3 ${
                    errors.lastName 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                      : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                  }`}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold mb-2 text-[#232249]">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('username')}
                    type="text"
                    className={`w-full pl-10 pr-3 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                      transition-all duration-200 focus:outline-none focus:ring-3 ${
                      errors.username 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                    }`}
                    placeholder="e.g., kavindu_shavinka"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-[#232249]">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className={`w-full pl-10 pr-3 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                      transition-all duration-200 focus:outline-none focus:ring-3 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-semibold mb-2 text-[#232249]">
                Department <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                {...register('department')}
                type="text"
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 
                  transition-all duration-200 focus:outline-none focus:ring-3 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10"
                placeholder="Enter your department"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 text-[#232249]">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                      transition-all duration-200 focus:outline-none focus:ring-3 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                    }`}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-[#232249]" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-[#232249]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-[#232249]">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 
                      transition-all duration-200 focus:outline-none focus:ring-3 ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 focus:border-[#232249] focus:ring-[#232249]/10'
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-[#232249]" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-[#232249]" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

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
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
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
                <span className="px-3 bg-white text-gray-500 font-medium">Already have an account?</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="w-full flex items-center justify-center py-3 px-6 border-2 border-[#232249] rounded-lg font-bold text-base text-[#232249] hover:bg-[#232249] hover:text-white transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <User className="w-4 h-4 mr-2" />
            Sign In Instead
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

export default Register;
