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
      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
        activeTab === id
          ? 'bg-[#232249] text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="h-5 w-5" />
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
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white"
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
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#232249] transition-colors"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-gray-600 mt-1 font-medium">
          Manage your profile information and security settings
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        } flex items-center space-x-2`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4">
        <TabButton id="profile" label="Profile Information" icon={User} />
        <TabButton id="security" label="Security & Password" icon={Shield} />
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#232249]">Profile Information</h2>
              <p className="text-gray-600">Update your personal details and contact information</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white resize-none"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? 'Updating...' : 'Update Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#232249]">Security Settings</h2>
              <p className="text-gray-600">Update your password and security preferences</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
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

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Password Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Mix of uppercase and lowercase letters (recommended)</li>
                <li>• Include numbers and special characters (recommended)</li>
                <li>• Different from your current password</li>
              </ul>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="h-5 w-5" />
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
