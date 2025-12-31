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
  Settings,
  MapPin,
  Calendar,
  Shield,
  Users,
  Bell,
  BarChart3,
  Clock,
  Monitor,
  Palette,
  Globe,
  Database,
  Briefcase,
  Award,
  Target,
  FileText,
  Camera
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { authAPI } from '../../../services/api';

const ManagerSettings = () => {
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
    department: '',
    position: '',
    emergencyContact: '',
    bio: '',
    linkedin: '',
    website: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Team settings state
  const [teamSettings, setTeamSettings] = useState({
    autoAssignWorkOrders: true,
    teamNotifications: true,
    workOrderApprovalRequired: true,
    defaultWorkOrderPriority: 'medium',
    maxWorkOrdersPerTechnician: 5,
    teamReportFrequency: 'weekly',
    allowOvertimeApproval: true,
    requireTaskCompletion: true
  });

  // Dashboard preferences state
  const [dashboardPreferences, setDashboardPreferences] = useState({
    defaultView: 'overview',
    showTeamPerformance: true,
    showWorkOrderStats: true,
    showUpcomingDeadlines: true,
    showRecentActivity: true,
    refreshInterval: 30,
    chartType: 'line',
    theme: 'light',
    compactMode: false,
    showNotificationBadges: true
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
        department: user.department || '',
        position: user.position || 'Manager',
        emergencyContact: user.emergencyContact || '',
        bio: user.bio || '',
        linkedin: user.linkedin || '',
        website: user.website || ''
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

  const handleTeamSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you would make an API call to save team settings
      // For now, we'll simulate success
      setTimeout(() => {
        showMessage('success', 'Team settings updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      showMessage('error', 'Failed to update team settings');
      setLoading(false);
    }
  };

  const handleDashboardPreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you would make an API call to save dashboard preferences
      // For now, we'll simulate success
      setTimeout(() => {
        showMessage('success', 'Dashboard preferences updated successfully!');
        setLoading(false);
      }, 1000);
    } catch (error) {
      showMessage('error', 'Failed to update dashboard preferences');
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon, color = '#232249' }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 w-full text-left ${
        activeTab === id
          ? 'bg-[#232249] text-white shadow-xl'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg border border-gray-200'
      }`}
    >
      <Icon className={`h-5 w-5 ${activeTab === id ? 'text-white' : 'text-[#232249]'}`} />
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

  const SelectField = ({ label, icon: Icon, options, ...props }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <Icon className="h-4 w-4 text-[#232249]" />
        <span>{label}</span>
      </label>
      <select
        {...props}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

  const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[60px]">
      <div>
        <h4 className="font-semibold text-gray-900">{label}</h4>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 md:h-6 md:w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-slate-800' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 md:h-4 md:w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6 md:translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-8 space-y-4 md:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Settings className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                Manager Settings
              </h1>
              <p className="text-gray-600 mt-1 font-medium text-sm md:text-base">
                Configure your account, team settings, and dashboard preferences
              </p>
            </div>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-3">
            <TabButton id="profile" label="Profile Information" icon={User} />
            <TabButton id="security" label="Security & Password" icon={Shield} />
            <TabButton id="team" label="Team Settings" icon={Users} />
            <TabButton id="dashboard" label="Dashboard Preferences" icon={Monitor} />
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
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

                    <InputField
                      label="Department"
                      icon={Briefcase}
                      value={profileData.department}
                      onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                      placeholder="e.g., Facilities Management"
                    />

                    <InputField
                      label="Position"
                      icon={Award}
                      value={profileData.position}
                      onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                      placeholder="e.g., Operations Manager"
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
                    <InputField
                      label="LinkedIn Profile"
                      icon={Globe}
                      type="url"
                      value={profileData.linkedin}
                      onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />

                    <InputField
                      label="Website"
                      icon={Globe}
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-[#232249]" />
                      <span>Bio / About</span>
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell us about yourself, your experience, and management philosophy..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white resize-none"
                    />
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

            {/* Team Settings Tab */}
            {activeTab === 'team' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#232249]">Team Settings</h2>
                    <p className="text-gray-600">Configure team workflow and permissions</p>
                  </div>
                </div>

                <form onSubmit={handleTeamSettingsSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <ToggleSwitch
                      label="Auto-assign Work Orders"
                      description="Automatically assign new work orders to available technicians"
                      checked={teamSettings.autoAssignWorkOrders}
                      onChange={(value) => setTeamSettings({...teamSettings, autoAssignWorkOrders: value})}
                    />

                    <ToggleSwitch
                      label="Team Notifications"
                      description="Send notifications to team members for important updates"
                      checked={teamSettings.teamNotifications}
                      onChange={(value) => setTeamSettings({...teamSettings, teamNotifications: value})}
                    />

                    <ToggleSwitch
                      label="Work Order Approval Required"
                      description="Require manager approval before technicians can start work orders"
                      checked={teamSettings.workOrderApprovalRequired}
                      onChange={(value) => setTeamSettings({...teamSettings, workOrderApprovalRequired: value})}
                    />

                    <ToggleSwitch
                      label="Allow Overtime Approval"
                      description="Allow technicians to request overtime approval through the system"
                      checked={teamSettings.allowOvertimeApproval}
                      onChange={(value) => setTeamSettings({...teamSettings, allowOvertimeApproval: value})}
                    />

                    <ToggleSwitch
                      label="Require Task Completion"
                      description="Require technicians to mark all tasks complete before closing work orders"
                      checked={teamSettings.requireTaskCompletion}
                      onChange={(value) => setTeamSettings({...teamSettings, requireTaskCompletion: value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField
                      label="Default Work Order Priority"
                      icon={Target}
                      value={teamSettings.defaultWorkOrderPriority}
                      onChange={(e) => setTeamSettings({...teamSettings, defaultWorkOrderPriority: e.target.value})}
                      options={[
                        { value: 'low', label: 'Low Priority' },
                        { value: 'medium', label: 'Medium Priority' },
                        { value: 'high', label: 'High Priority' },
                        { value: 'critical', label: 'Critical Priority' }
                      ]}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Users className="h-4 w-4 text-[#232249]" />
                        <span>Max Work Orders per Technician</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={teamSettings.maxWorkOrdersPerTechnician}
                        onChange={(e) => setTeamSettings({...teamSettings, maxWorkOrdersPerTechnician: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white"
                      />
                    </div>

                    <SelectField
                      label="Team Report Frequency"
                      icon={BarChart3}
                      value={teamSettings.teamReportFrequency}
                      onChange={(e) => setTeamSettings({...teamSettings, teamReportFrequency: e.target.value})}
                      options={[
                        { value: 'daily', label: 'Daily Reports' },
                        { value: 'weekly', label: 'Weekly Reports' },
                        { value: 'monthly', label: 'Monthly Reports' },
                        { value: 'quarterly', label: 'Quarterly Reports' }
                      ]}
                    />
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-5 w-5" />
                      <span>{loading ? 'Saving...' : 'Save Team Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Dashboard Preferences Tab */}
            {activeTab === 'dashboard' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#232249]">Dashboard Preferences</h2>
                    <p className="text-gray-600">Customize your dashboard layout and appearance</p>
                  </div>
                </div>

                <form onSubmit={handleDashboardPreferencesSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <ToggleSwitch
                      label="Show Team Performance"
                      description="Display team performance metrics on dashboard"
                      checked={dashboardPreferences.showTeamPerformance}
                      onChange={(value) => setDashboardPreferences({...dashboardPreferences, showTeamPerformance: value})}
                    />

                    <ToggleSwitch
                      label="Show Work Order Statistics"
                      description="Display work order statistics and trends"
                      checked={dashboardPreferences.showWorkOrderStats}
                      onChange={(value) => setDashboardPreferences({...dashboardPreferences, showWorkOrderStats: value})}
                    />

                    <ToggleSwitch
                      label="Show Upcoming Deadlines"
                      description="Display upcoming work order deadlines"
                      checked={dashboardPreferences.showUpcomingDeadlines}
                      onChange={(value) => setDashboardPreferences({...dashboardPreferences, showUpcomingDeadlines: value})}
                    />

                    <ToggleSwitch
                      label="Show Recent Activity"
                      description="Display recent team activity feed"
                      checked={dashboardPreferences.showRecentActivity}
                      onChange={(value) => setDashboardPreferences({...dashboardPreferences, showRecentActivity: value})}
                    />

                    <ToggleSwitch
                      label="Compact Mode"
                      description="Use compact layout to show more information"
                      checked={dashboardPreferences.compactMode}
                      onChange={(value) => setDashboardPreferences({...dashboardPreferences, compactMode: value})}
                    />

                    <ToggleSwitch
                      label="Show Notification Badges"
                      description="Display notification badges on dashboard cards"
                      checked={dashboardPreferences.showNotificationBadges}
                      onChange={(value) => setDashboardPreferences({...dashboardPreferences, showNotificationBadges: value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField
                      label="Default Dashboard View"
                      icon={Monitor}
                      value={dashboardPreferences.defaultView}
                      onChange={(e) => setDashboardPreferences({...dashboardPreferences, defaultView: e.target.value})}
                      options={[
                        { value: 'overview', label: 'Overview' },
                        { value: 'team', label: 'Team Focus' },
                        { value: 'workorders', label: 'Work Orders Focus' },
                        { value: 'analytics', label: 'Analytics Focus' }
                      ]}
                    />

                    <SelectField
                      label="Chart Type"
                      icon={BarChart3}
                      value={dashboardPreferences.chartType}
                      onChange={(e) => setDashboardPreferences({...dashboardPreferences, chartType: e.target.value})}
                      options={[
                        { value: 'line', label: 'Line Charts' },
                        { value: 'bar', label: 'Bar Charts' },
                        { value: 'pie', label: 'Pie Charts' },
                        { value: 'mixed', label: 'Mixed Charts' }
                      ]}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-[#232249]" />
                        <span>Auto-refresh Interval (seconds)</span>
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        step="10"
                        value={dashboardPreferences.refreshInterval}
                        onChange={(e) => setDashboardPreferences({...dashboardPreferences, refreshInterval: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white"
                      />
                    </div>

                    <SelectField
                      label="Theme"
                      icon={Palette}
                      value={dashboardPreferences.theme}
                      onChange={(e) => setDashboardPreferences({...dashboardPreferences, theme: e.target.value})}
                      options={[
                        { value: 'light', label: 'Light Theme' },
                        { value: 'dark', label: 'Dark Theme' },
                        { value: 'auto', label: 'Auto (System)' }
                      ]}
                    />
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-5 w-5" />
                      <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerSettings;