import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Camera,
  MapPin,
  Calendar,
  Shield
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { authAPI } from '../../../services/api';

const TechnicianSettings = () => {
  const { user, updateProfile: updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    specializations: '',
    certifications: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        emergencyContact: user.emergencyContact || '',
        specializations: user.specializations || '',
        certifications: user.certifications || ''
      });
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(profileData);
      
      // Update the user context using the updateProfile function
      const result = await updateUserProfile(profileData);
      if (result.success) {
        showMessage('success', 'Profile updated successfully!');
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center justify-center space-x-2 px-4 py-3 md:px-6 rounded-xl font-semibold transition-all duration-200 text-sm md:text-base ${
        activeTab === id
          ? 'bg-[#232249] text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="h-4 w-4 md:h-5 md:w-5" />
      <span>{label}</span>
    </button>
  );

  const InputField = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <Icon className="h-4 w-4 text-[#232249]" />
        <span>{label}</span>
      </label>
      <input
        {...props}
        className="w-full px-3 py-3 md:px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-sm md:text-base"
      />
    </div>
  );

  const PasswordField = ({ label, icon: Icon, showPassword, setShowPassword, ...props }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <Icon className="h-4 w-4 text-[#232249]" />
        <span>{label}</span>
      </label>
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className="w-full px-3 py-3 pr-12 md:px-4 md:pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-sm md:text-base"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#232249] transition-colors p-1"
        >
          {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
        <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-[#232249]/60 mt-1 font-medium text-sm md:text-base">
          Manage your profile information and security settings
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-3 md:p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        } flex items-center space-x-2 md:space-x-3`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          )}
          <span className="font-medium text-sm md:text-base">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <TabButton id="profile" label="Profile Information" icon={User} />
        <TabButton id="security" label="Security & Password" icon={Shield} />
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#232249]">Profile Information</h2>
              <p className="text-gray-600 text-sm md:text-base">Update your personal details and contact information</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <InputField
                label="First Name"
                icon={User}
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                required
              />

              <InputField
                label="Last Name"
                icon={User}
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                required
              />

              <InputField
                label="Email Address"
                icon={Mail}
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                required
              />

              <InputField
                label="Phone Number"
                icon={Phone}
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              />

              <InputField
                label="Date of Birth"
                icon={Calendar}
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
              />

              <InputField
                label="Emergency Contact"
                icon={Phone}
                type="tel"
                value={profileData.emergencyContact}
                onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                placeholder="Emergency contact number"
              />
            </div>

            <InputField
              label="Address"
              icon={MapPin}
              value={profileData.address}
              onChange={(e) => setProfileData({...profileData, address: e.target.value})}
              placeholder="Your current address"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-[#232249]" />
                  <span>Specializations</span>
                </label>
                <textarea
                  value={profileData.specializations}
                  onChange={(e) => setProfileData({...profileData, specializations: e.target.value})}
                  placeholder="HVAC, Electrical, Plumbing, etc."
                  rows={3}
                  className="w-full px-3 py-3 md:px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white resize-none text-sm md:text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-[#232249]" />
                  <span>Certifications</span>
                </label>
                <textarea
                  value={profileData.certifications}
                  onChange={(e) => setProfileData({...profileData, certifications: e.target.value})}
                  placeholder="List your professional certifications"
                  rows={3}
                  className="w-full px-3 py-3 md:px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white resize-none text-sm md:text-base"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 md:pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-6 py-3 md:px-8 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                <Save className="h-4 w-4 md:h-5 md:w-5" />
                <span>{loading ? 'Updating...' : 'Update Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#232249]">Security Settings</h2>
              <p className="text-gray-600 text-sm md:text-base">Update your password and security preferences</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 md:space-y-6 max-w-md">
            <PasswordField
              label="Current Password"
              icon={Lock}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              showPassword={showCurrentPassword}
              setShowPassword={setShowCurrentPassword}
              required
              placeholder="Enter your current password"
            />

            <PasswordField
              label="New Password"
              icon={Lock}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              showPassword={showNewPassword}
              setShowPassword={setShowNewPassword}
              required
              placeholder="Enter new password (min. 6 characters)"
              minLength={6}
            />

            <PasswordField
              label="Confirm New Password"
              icon={Lock}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              showPassword={showConfirmPassword}
              setShowPassword={setShowConfirmPassword}
              required
              placeholder="Confirm your new password"
            />

            <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 text-sm md:text-base">Password Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Mix of uppercase and lowercase letters (recommended)</li>
                <li>• Include numbers and special characters (recommended)</li>
                <li>• Different from your current password</li>
              </ul>
            </div>

            <div className="flex justify-end pt-4 md:pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 md:px-8 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                <Lock className="h-4 w-4 md:h-5 md:w-5" />
                <span>{loading ? 'Changing...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TechnicianSettings;
