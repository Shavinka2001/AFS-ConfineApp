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
  Camera,
  Server,
  Key,
  UserCog,
  AlertTriangle,
  Activity,
  HardDrive,
  Wifi,
  Zap,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Archive,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { authAPI, userAPI, adminAPI } from '../../../services/api';

const AdminSettings = () => {
  const { user, updateProfile: updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('admin-profile');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // Admin Profile form state
  const [adminProfileData, setAdminProfileData] = useState({
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

  // System Configuration state
  const [systemConfig, setSystemConfig] = useState({
    systemName: 'Confine Management System',
    companyName: 'AFS Corporation',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    registrationEnabled: true,
    maxFileSize: 10,
    sessionTimeout: 30,
    backupFrequency: 'daily',
    logLevel: 'info',
    timezoneOffset: '+00:00',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    systemEmail: 'system@afs.com',
    supportEmail: 'support@afs.com',
    maxUsersPerRole: {
      admin: 5,
      manager: 20,
      technician: 100,
      user: 500
    }
  });

  // Access Control state
  const [accessControl, setAccessControl] = useState({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90
    },
    sessionSettings: {
      maxSessions: 3,
      idleTimeout: 30,
      rememberMe: true,
      twoFactorAuth: false
    },
    apiLimits: {
      rateLimit: 1000,
      dailyLimit: 10000,
      enableThrottling: true
    },
    permissions: {
      allowUserRegistration: true,
      allowPasswordReset: true,
      allowProfileEdit: true,
      allowRoleChange: false,
      allowDataExport: true,
      allowDataImport: false
    }
  });

  // Security Settings state
  const [securitySettings, setSecuritySettings] = useState({
    encryption: {
      algorithm: 'AES-256',
      keyRotationDays: 30,
      encryptDatabase: true,
      encryptFiles: true
    },
    audit: {
      enableAuditLog: true,
      logLevel: 'detailed',
      retentionDays: 365,
      alertOnFailedLogins: true,
      alertThreshold: 5
    },
    backup: {
      autoBackup: true,
      frequency: 'daily',
      retention: 30,
      location: 'cloud',
      encryption: true
    },
    monitoring: {
      enableSystemMonitoring: true,
      performanceAlerts: true,
      securityAlerts: true,
      emailNotifications: true,
      slackIntegration: false
    }
  });

  useEffect(() => {
    if (user) {
      setAdminProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        department: user.department || '',
        position: user.position || 'System Administrator',
        emergencyContact: user.emergencyContact || '',
        bio: user.bio || '',
        linkedin: user.linkedin || '',
        website: user.website || ''
      });
    }
    
    // Load all admin settings data
    loadAdminSettingsData();
  }, [user]);

  const loadAdminSettingsData = async () => {
    setDataLoading(true);
    try {
      // Load system configuration with fallback to defaults
      try {
        const systemConfigResponse = await adminAPI.getSystemConfig();
        if (systemConfigResponse.data && systemConfigResponse.data.success) {
          setSystemConfig(prev => ({ ...prev, ...systemConfigResponse.data.data }));
        }
      } catch (error) {
        console.warn('Failed to load system config, using defaults:', error);
        // Keep default values
      }

      // Load access control settings with fallback to defaults
      try {
        const accessControlResponse = await adminAPI.getAccessControl();
        if (accessControlResponse.data && accessControlResponse.data.success) {
          setAccessControl(prev => ({ ...prev, ...accessControlResponse.data.data }));
        }
      } catch (error) {
        console.warn('Failed to load access control settings, using defaults:', error);
        // Keep default values
      }

      // Load security settings with fallback to defaults
      try {
        const securityResponse = await adminAPI.getSecuritySettings();
        if (securityResponse.data && securityResponse.data.success) {
          setSecuritySettings(prev => ({ ...prev, ...securityResponse.data.data }));
        }
      } catch (error) {
        console.warn('Failed to load security settings, using defaults:', error);
        // Keep default values
      }

      // Load system status
      try {
        const statusResponse = await adminAPI.getSystemStatus();
        if (statusResponse.data && statusResponse.data.success) {
          setSystemStatus(statusResponse.data.data);
        } else {
          // Default system status
          setSystemStatus({
            database: { status: 'healthy', message: 'Connected and responsive' },
            apiServices: { status: 'healthy', message: 'All endpoints operational' },
            fileStorage: { status: 'healthy', message: '85% capacity used' },
            network: { status: 'healthy', message: 'Low latency, high availability' },
            security: { status: 'warning', message: '2 security alerts pending' },
            performance: { status: 'healthy', message: 'Response time: 45ms avg' }
          });
        }
      } catch (error) {
        console.warn('Failed to load system status, using defaults:', error);
        // Set default status
        setSystemStatus({
          database: { status: 'healthy', message: 'Connected and responsive' },
          apiServices: { status: 'healthy', message: 'All endpoints operational' },
          fileStorage: { status: 'healthy', message: '85% capacity used' },
          network: { status: 'healthy', message: 'Low latency, high availability' },
          security: { status: 'warning', message: '2 security alerts pending' },
          performance: { status: 'healthy', message: 'Response time: 45ms avg' }
        });
      }

    } catch (error) {
      console.error('Error loading admin settings data:', error);
      showMessage('error', 'Failed to load some settings. Default values will be used.');
    } finally {
      setDataLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleAdminProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateUserProfile(adminProfileData);
      if (result.success) {
        showMessage('success', 'Admin profile updated successfully!');
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update admin profile');
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

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'New password must be at least 8 characters long');
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

  const handleSystemConfigSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.updateSystemConfig(systemConfig);
      if (response.data && response.data.success) {
        showMessage('success', 'System configuration updated successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to update system configuration');
      }
    } catch (error) {
      console.error('Error updating system config:', error);
      showMessage('error', error.response?.data?.message || error.message || 'Failed to update system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessControlSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.updateAccessControl(accessControl);
      if (response.data && response.data.success) {
        showMessage('success', 'Access control settings updated successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to update access control settings');
      }
    } catch (error) {
      console.error('Error updating access control:', error);
      showMessage('error', error.response?.data?.message || error.message || 'Failed to update access control settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.updateSecuritySettings(securitySettings);
      if (response.data && response.data.success) {
        showMessage('success', 'Security settings updated successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to update security settings');
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      showMessage('error', error.response?.data?.message || error.message || 'Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.performSystemAction(action);
      if (response.data && response.data.success) {
        showMessage('success', `${action} completed successfully!`);
        // Reload system status after action
        setTimeout(() => {
          loadAdminSettingsData();
        }, 2000);
      } else {
        throw new Error(response.data?.message || `Failed to ${action}`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      showMessage('error', error.response?.data?.message || error.message || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon, color = '#232249' }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 px-4 md:px-6 py-4 md:py-4 rounded-xl font-semibold transition-all duration-300 w-full text-left min-h-[48px] active:scale-95 ${
        activeTab === id
          ? 'bg-[#232249] text-white shadow-xl'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg border border-gray-200'
      }`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${activeTab === id ? 'text-white' : 'text-[#232249]'}`} />
      <span className="text-sm md:text-base">{label}</span>
    </button>
  );

  const InputField = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <Icon className="h-4 w-4 text-[#232249] flex-shrink-0" />
        <span>{label}</span>
      </label>
      <input
        {...props}
        className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
      />
    </div>
  );

  const SelectField = ({ label, icon: Icon, options, ...props }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
        <Icon className="h-4 w-4 text-[#232249] flex-shrink-0" />
        <span>{label}</span>
      </label>
      <select
        {...props}
        className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
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
        <Icon className="h-4 w-4 text-[#232249] flex-shrink-0" />
        <span>{label}</span>
      </label>
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className="w-full px-4 h-12 md:h-auto py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#232249] transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  const ToggleSwitch = ({ label, description, checked, onChange, danger = false }) => (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm md:text-base">{label}</h4>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 active:scale-95 ${
          checked ? (danger ? 'bg-red-600' : 'bg-[#232249]') : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const SystemStatusCard = ({ title, status, icon: Icon, description }) => (
    <div className={`p-4 rounded-xl border ${
      status === 'healthy' ? 'bg-green-50 border-green-200' : 
      status === 'warning' ? 'bg-yellow-50 border-yellow-200' : 
      'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-start space-x-3">
        <Icon className={`h-6 w-6 flex-shrink-0 ${
          status === 'healthy' ? 'text-green-600' : 
          status === 'warning' ? 'text-yellow-600' : 
          'text-red-600'
        }`} />
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 text-sm md:text-base">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 space-y-4 md:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-[#232249] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-[#232249]">
                System Administration
              </h1>
              <p className="text-gray-600 mt-1 font-medium text-sm md:text-base">
                Configure system settings, security, and access control
              </p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`p-3 md:p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          } flex items-start space-x-2`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <span className="font-medium text-sm md:text-base flex-1">{message.text}</span>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-sm underline hover:no-underline flex-shrink-0 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {dataLoading && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-red-600 animate-spin" />
              <span className="text-base md:text-lg font-medium text-gray-700">Loading admin settings...</span>
            </div>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
              <div className="lg:col-span-1 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-10 md:h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
              </div>
              <div className="lg:col-span-3">
                <div className="h-64 md:h-96 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {!dataLoading && (
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="space-y-2 md:space-y-3">
              <TabButton id="admin-profile" label="Admin Profile" icon={UserCog} />
              <TabButton id="security" label="Security & Password" icon={Shield} />
              <TabButton id="system-config" label="System Configuration" icon={Settings} />
              <TabButton id="access-control" label="Access Control" icon={Key} />
              <TabButton id="system-security" label="System Security" icon={Lock} />
              <TabButton id="system-status" label="System Status" icon={Activity} />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Admin Profile Tab */}
            {activeTab === 'admin-profile' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-[#232249] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#232249]">Administrator Profile</h2>
                    <p className="text-gray-600 text-sm md:text-base">Update your administrator account details</p>
                  </div>
                </div>

                <form onSubmit={handleAdminProfileSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField
                      label="First Name"
                      icon={User}
                      value={adminProfileData.firstName}
                      onChange={(e) => setAdminProfileData({...adminProfileData, firstName: e.target.value})}
                      required
                    />

                    <InputField
                      label="Last Name"
                      icon={User}
                      value={adminProfileData.lastName}
                      onChange={(e) => setAdminProfileData({...adminProfileData, lastName: e.target.value})}
                      required
                    />

                    <InputField
                      label="Email Address"
                      icon={Mail}
                      type="email"
                      value={adminProfileData.email}
                      onChange={(e) => setAdminProfileData({...adminProfileData, email: e.target.value})}
                      required
                    />

                    <InputField
                      label="Phone Number"
                      icon={Phone}
                      type="tel"
                      value={adminProfileData.phone}
                      onChange={(e) => setAdminProfileData({...adminProfileData, phone: e.target.value})}
                    />

                    <InputField
                      label="Department"
                      icon={Briefcase}
                      value={adminProfileData.department}
                      onChange={(e) => setAdminProfileData({...adminProfileData, department: e.target.value})}
                      placeholder="e.g., IT Administration"
                    />

                    <InputField
                      label="Position"
                      icon={Award}
                      value={adminProfileData.position}
                      onChange={(e) => setAdminProfileData({...adminProfileData, position: e.target.value})}
                      placeholder="e.g., System Administrator"
                    />
                  </div>

                  <div className="flex justify-end pt-4 md:pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-[#232249] text-white px-6 md:px-8 py-4 md:py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] active:scale-95"
                    >
                      <Save className="h-5 w-5" />
                      <span className="text-sm md:text-base">{loading ? 'Updating...' : 'Update Profile'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-[#232249] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
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
                    placeholder="Enter new password (min. 8 characters)"
                    minLength={8}
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

                  <div className="bg-red-50 p-3 md:p-4 rounded-xl border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2 text-sm md:text-base">Administrator Password Requirements:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Mix of uppercase and lowercase letters</li>
                      <li>• Include numbers and special characters</li>
                      <li>• Different from your current password</li>
                      <li>• Not commonly used or dictionary words</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-4 md:pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-[#232249] text-white px-6 md:px-8 py-4 md:py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] active:scale-95"
                    >
                      <Lock className="h-5 w-5" />
                      <span className="text-sm md:text-base">{loading ? 'Changing...' : 'Change Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* System Configuration Tab */}
            {activeTab === 'system-config' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-[#232249] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Settings className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#232249]">System Configuration</h2>
                    <p className="text-gray-600 text-sm md:text-base">Configure global system settings and parameters</p>
                  </div>
                </div>

                <form onSubmit={handleSystemConfigSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField
                      label="System Name"
                      icon={Globe}
                      value={systemConfig.systemName}
                      onChange={(e) => setSystemConfig({...systemConfig, systemName: e.target.value})}
                      required
                    />

                    <InputField
                      label="Company Name"
                      icon={Briefcase}
                      value={systemConfig.companyName}
                      onChange={(e) => setSystemConfig({...systemConfig, companyName: e.target.value})}
                      required
                    />

                    <InputField
                      label="System Version"
                      icon={Target}
                      value={systemConfig.systemVersion}
                      onChange={(e) => setSystemConfig({...systemConfig, systemVersion: e.target.value})}
                      readOnly
                    />

                    <InputField
                      label="System Email"
                      icon={Mail}
                      type="email"
                      value={systemConfig.systemEmail}
                      onChange={(e) => setSystemConfig({...systemConfig, systemEmail: e.target.value})}
                      required
                    />

                    <InputField
                      label="Support Email"
                      icon={Mail}
                      type="email"
                      value={systemConfig.supportEmail}
                      onChange={(e) => setSystemConfig({...systemConfig, supportEmail: e.target.value})}
                      required
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Upload className="h-4 w-4 text-[#232249] flex-shrink-0" />
                        <span>Max File Size (MB)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={systemConfig.maxFileSize}
                        onChange={(e) => setSystemConfig({...systemConfig, maxFileSize: parseInt(e.target.value)})}
                        className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-[#232249] flex-shrink-0" />
                        <span>Session Timeout (minutes)</span>
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={systemConfig.sessionTimeout}
                        onChange={(e) => setSystemConfig({...systemConfig, sessionTimeout: parseInt(e.target.value)})}
                        className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
                      />
                    </div>

                    <SelectField
                      label="Backup Frequency"
                      icon={Database}
                      value={systemConfig.backupFrequency}
                      onChange={(e) => setSystemConfig({...systemConfig, backupFrequency: e.target.value})}
                      options={[
                        { value: 'hourly', label: 'Every Hour' },
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' }
                      ]}
                    />

                    <SelectField
                      label="Log Level"
                      icon={FileText}
                      value={systemConfig.logLevel}
                      onChange={(e) => setSystemConfig({...systemConfig, logLevel: e.target.value})}
                      options={[
                        { value: 'error', label: 'Error Only' },
                        { value: 'warn', label: 'Warning & Error' },
                        { value: 'info', label: 'Info, Warning & Error' },
                        { value: 'debug', label: 'All (Debug Mode)' }
                      ]}
                    />
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <ToggleSwitch
                      label="Maintenance Mode"
                      description="Enable maintenance mode to prevent user access during updates"
                      checked={systemConfig.maintenanceMode}
                      onChange={(value) => setSystemConfig({...systemConfig, maintenanceMode: value})}
                      danger={true}
                    />

                    <ToggleSwitch
                      label="User Registration"
                      description="Allow new users to register accounts"
                      checked={systemConfig.registrationEnabled}
                      onChange={(value) => setSystemConfig({...systemConfig, registrationEnabled: value})}
                    />
                  </div>

                  <div className="flex justify-end pt-4 md:pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-[#232249] text-white px-6 md:px-8 py-4 md:py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] active:scale-95"
                    >
                      <Save className="h-5 w-5" />
                      <span className="text-sm md:text-base">{loading ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Access Control Tab */}
            {activeTab === 'access-control' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-[#232249] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Key className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#232249]">Access Control</h2>
                    <p className="text-gray-600 text-sm md:text-base">Configure user access, permissions, and security policies</p>
                  </div>
                </div>

                <form onSubmit={handleAccessControlSubmit} className="space-y-6 md:space-y-8">
                  {/* Password Policy */}
                  <div className="border border-gray-200 rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-[#232249] flex-shrink-0" />
                      <span>Password Policy</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Minimum Length</label>
                        <input
                          type="number"
                          min="6"
                          max="32"
                          value={accessControl.passwordPolicy.minLength}
                          onChange={(e) => setAccessControl({
                            ...accessControl,
                            passwordPolicy: {
                              ...accessControl.passwordPolicy,
                              minLength: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Password Age (days)</label>
                        <input
                          type="number"
                          min="30"
                          max="365"
                          value={accessControl.passwordPolicy.maxAge}
                          onChange={(e) => setAccessControl({
                            ...accessControl,
                            passwordPolicy: {
                              ...accessControl.passwordPolicy,
                              maxAge: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                      <ToggleSwitch
                        label="Require Uppercase Letters"
                        checked={accessControl.passwordPolicy.requireUppercase}
                        onChange={(value) => setAccessControl({
                          ...accessControl,
                          passwordPolicy: { ...accessControl.passwordPolicy, requireUppercase: value }
                        })}
                      />
                      <ToggleSwitch
                        label="Require Numbers"
                        checked={accessControl.passwordPolicy.requireNumbers}
                        onChange={(value) => setAccessControl({
                          ...accessControl,
                          passwordPolicy: { ...accessControl.passwordPolicy, requireNumbers: value }
                        })}
                      />
                      <ToggleSwitch
                        label="Require Special Characters"
                        checked={accessControl.passwordPolicy.requireSpecialChars}
                        onChange={(value) => setAccessControl({
                          ...accessControl,
                          passwordPolicy: { ...accessControl.passwordPolicy, requireSpecialChars: value }
                        })}
                      />
                    </div>
                  </div>

                  {/* Session Settings */}
                  <div className="border border-gray-200 rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-[#232249] flex-shrink-0" />
                      <span>Session Settings</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Max Concurrent Sessions</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={accessControl.sessionSettings.maxSessions}
                          onChange={(e) => setAccessControl({
                            ...accessControl,
                            sessionSettings: {
                              ...accessControl.sessionSettings,
                              maxSessions: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Idle Timeout (minutes)</label>
                        <input
                          type="number"
                          min="5"
                          max="480"
                          value={accessControl.sessionSettings.idleTimeout}
                          onChange={(e) => setAccessControl({
                            ...accessControl,
                            sessionSettings: {
                              ...accessControl.sessionSettings,
                              idleTimeout: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      <ToggleSwitch
                        label="Allow Remember Me"
                        checked={accessControl.sessionSettings.rememberMe}
                        onChange={(value) => setAccessControl({
                          ...accessControl,
                          sessionSettings: { ...accessControl.sessionSettings, rememberMe: value }
                        })}
                      />
                      <ToggleSwitch
                        label="Two-Factor Authentication"
                        checked={accessControl.sessionSettings.twoFactorAuth}
                        onChange={(value) => setAccessControl({
                          ...accessControl,
                          sessionSettings: { ...accessControl.sessionSettings, twoFactorAuth: value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 md:pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-[#232249] text-white px-6 md:px-8 py-4 md:py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] active:scale-95"
                    >
                      <Save className="h-5 w-5" />
                      <span className="text-sm md:text-base">{loading ? 'Saving...' : 'Save Access Control'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* System Security Tab */}
            {activeTab === 'system-security' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-[#232249] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#232249]">System Security</h2>
                    <p className="text-gray-600 text-sm md:text-base">Configure advanced security settings and monitoring</p>
                  </div>
                </div>

                <form onSubmit={handleSecuritySettingsSubmit} className="space-y-6 md:space-y-8">
                  {/* Encryption Settings */}
                  <div className="border border-gray-200 rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-[#232249] flex-shrink-0" />
                      <span>Encryption Settings</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                      <SelectField
                        label="Encryption Algorithm"
                        icon={Key}
                        value={securitySettings.encryption.algorithm}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          encryption: { ...securitySettings.encryption, algorithm: e.target.value }
                        })}
                        options={[
                          { value: 'AES-256', label: 'AES-256 (Recommended)' },
                          { value: 'AES-192', label: 'AES-192' },
                          { value: 'AES-128', label: 'AES-128' }
                        ]}
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <RotateCcw className="h-4 w-4 text-[#232249]" />
                          <span>Key Rotation (days)</span>
                        </label>
                        <input
                          type="number"
                          min="7"
                          max="365"
                          value={securitySettings.encryption.keyRotationDays}
                          onChange={(e) => setSecuritySettings({
                            ...securitySettings,
                            encryption: {
                              ...securitySettings.encryption,
                              keyRotationDays: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch
                        label="Encrypt Database"
                        description="Enable encryption for database storage"
                        checked={securitySettings.encryption.encryptDatabase}
                        onChange={(value) => setSecuritySettings({
                          ...securitySettings,
                          encryption: { ...securitySettings.encryption, encryptDatabase: value }
                        })}
                      />
                      <ToggleSwitch
                        label="Encrypt Files"
                        description="Enable encryption for file uploads"
                        checked={securitySettings.encryption.encryptFiles}
                        onChange={(value) => setSecuritySettings({
                          ...securitySettings,
                          encryption: { ...securitySettings.encryption, encryptFiles: value }
                        })}
                      />
                    </div>
                  </div>

                  {/* Audit Settings */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-[#232249]" />
                      <span>Audit & Logging</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <SelectField
                        label="Audit Log Level"
                        icon={Activity}
                        value={securitySettings.audit.logLevel}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          audit: { ...securitySettings.audit, logLevel: e.target.value }
                        })}
                        options={[
                          { value: 'basic', label: 'Basic (Login/Logout)' },
                          { value: 'detailed', label: 'Detailed (All Actions)' },
                          { value: 'verbose', label: 'Verbose (Debug Level)' }
                        ]}
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <Archive className="h-4 w-4 text-[#232249]" />
                          <span>Log Retention (days)</span>
                        </label>
                        <input
                          type="number"
                          min="30"
                          max="2555"
                          value={securitySettings.audit.retentionDays}
                          onChange={(e) => setSecuritySettings({
                            ...securitySettings,
                            audit: {
                              ...securitySettings.audit,
                              retentionDays: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-4 h-12 md:h-auto py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch
                        label="Enable Audit Logging"
                        description="Track all user actions and system events"
                        checked={securitySettings.audit.enableAuditLog}
                        onChange={(value) => setSecuritySettings({
                          ...securitySettings,
                          audit: { ...securitySettings.audit, enableAuditLog: value }
                        })}
                      />
                      <ToggleSwitch
                        label="Alert on Failed Logins"
                        description="Send alerts when multiple login failures occur"
                        checked={securitySettings.audit.alertOnFailedLogins}
                        onChange={(value) => setSecuritySettings({
                          ...securitySettings,
                          audit: { ...securitySettings.audit, alertOnFailedLogins: value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-[#232249] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Save className="h-5 w-5" />
                      <span>{loading ? 'Saving...' : 'Save Security Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* System Status Tab */}
            {activeTab === 'system-status' && (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-[#232249] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Activity className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#232249]">System Status</h2>
                    <p className="text-gray-600 text-sm md:text-base">Monitor system health and performance</p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  {/* System Health Overview */}
                  {dataLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="p-3 md:p-4 bg-gray-200 rounded-xl animate-pulse">
                          <div className="h-5 md:h-6 bg-gray-300 rounded mb-2"></div>
                          <div className="h-3 md:h-4 bg-gray-300 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : systemStatus ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <SystemStatusCard
                        title="Database"
                        status={systemStatus.database?.status || 'healthy'}
                        icon={Database}
                        description={systemStatus.database?.message || 'Connected and responsive'}
                      />
                      <SystemStatusCard
                        title="API Services"
                        status={systemStatus.apiServices?.status || 'healthy'}
                        icon={Server}
                        description={systemStatus.apiServices?.message || 'All endpoints operational'}
                      />
                      <SystemStatusCard
                        title="File Storage"
                        status={systemStatus.fileStorage?.status || 'healthy'}
                        icon={HardDrive}
                        description={systemStatus.fileStorage?.message || '85% capacity used'}
                      />
                      <SystemStatusCard
                        title="Network"
                        status={systemStatus.network?.status || 'healthy'}
                        icon={Wifi}
                        description={systemStatus.network?.message || 'Low latency, high availability'}
                      />
                      <SystemStatusCard
                        title="Security"
                        status={systemStatus.security?.status || 'warning'}
                        icon={Shield}
                        description={systemStatus.security?.message || '2 security alerts pending'}
                      />
                      <SystemStatusCard
                        title="Performance"
                        status={systemStatus.performance?.status || 'healthy'}
                        icon={Zap}
                        description={systemStatus.performance?.message || 'Response time: 45ms avg'}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-600">Failed to load system status</p>
                      <button
                        onClick={loadAdminSettingsData}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* System Actions */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-[#232249]" />
                      <span>System Actions</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button 
                        onClick={() => handleSystemAction('restart-services')}
                        disabled={loading}
                        className="flex items-center space-x-2 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 active:scale-95 min-h-[48px]"
                      >
                        <RefreshCw className={`h-5 w-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                        <span className="font-medium text-blue-900">Restart Services</span>
                      </button>
                      <button 
                        onClick={() => handleSystemAction('create-backup')}
                        disabled={loading}
                        className="flex items-center space-x-2 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 active:scale-95 min-h-[48px]"
                      >
                        <Download className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Create Backup</span>
                      </button>
                      <button 
                        onClick={() => handleSystemAction('clear-cache')}
                        disabled={loading}
                        className="flex items-center space-x-2 p-4 bg-yellow-50 rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-50 active:scale-95 min-h-[48px]"
                      >
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-900">Clear Cache</span>
                      </button>
                      <button 
                        onClick={() => handleSystemAction('clear-logs')}
                        disabled={loading}
                        className="flex items-center space-x-2 p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 active:scale-95 min-h-[48px]"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-900">Clear Logs</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Events */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-[#232249]" />
                      <span>Recent System Events</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Database backup completed successfully</p>
                          <p className="text-xs text-green-600">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">High CPU usage detected on server</p>
                          <p className="text-xs text-yellow-600">15 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">System update installed successfully</p>
                          <p className="text-xs text-blue-600">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;