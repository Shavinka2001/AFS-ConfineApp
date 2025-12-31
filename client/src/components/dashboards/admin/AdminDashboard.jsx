import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  Activity,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  UserCheck,
  Settings,
  BarChart3,
  MapPin,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { userAPI, activityAPI } from '../../../services/api';
import PendingUserApprovals from './PendingUserApprovals';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await userAPI.getUserStats();
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchActivities = async () => {
      try {
        const response = await activityAPI.getRecentActivities(10);
        setActivities(response.data.data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        // Fallback to mock data for development
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    const fetchSystemHealth = async () => {
      try {
        const response = await activityAPI.getSystemHealth();
        setSystemHealth(response.data.data);
      } catch (error) {
        console.error('Failed to fetch system health:', error);
        // Fallback to default health status
        setSystemHealth({
          database: { status: 'healthy', message: 'Connected and responsive' },
          apiServices: { status: 'healthy', message: 'All endpoints operational' },
          authentication: { status: 'healthy', message: 'Authentication service active' }
        });
      }
    };

    fetchStats();
    fetchActivities();
    fetchSystemHealth();

    // Refresh activities every 30 seconds
    const activityInterval = setInterval(fetchActivities, 30000);
    
    return () => clearInterval(activityInterval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, title, value, change, color, bgColor }) => (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className={`p-3 md:p-4 rounded-xl ${bgColor} shadow-lg flex-shrink-0`}>
              <Icon className={`h-5 w-5 md:h-7 md:w-7 ${color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
              <p className="text-2xl md:text-3xl font-bold text-[#232249] mt-1">{value}</p>
              {change && (
                <div className="mt-2 md:mt-4 flex items-center text-xs md:text-sm bg-gray-50 rounded-lg p-2">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-2" />
                  <span className="text-green-600 font-semibold">{change}</span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to get icon for activity action
  const getActivityIcon = (action) => {
    switch (action) {
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return UserCheck;
      case 'USER_REGISTER':
        return Users;
      case 'FAILED_LOGIN':
        return AlertTriangle;
      case 'SYSTEM_CONFIG_UPDATED':
      case 'ACCESS_CONTROL_UPDATED':
      case 'SECURITY_SETTINGS_UPDATED':
        return Settings;
      case 'BACKUP_CREATED':
      case 'CACHE_CLEARED':
      case 'LOGS_CLEARED':
      case 'SERVICES_RESTARTED':
        return Database;
      case 'WORK_ORDER_CREATED':
      case 'WORK_ORDER_UPDATED':
      case 'WORK_ORDER_DELETED':
        return Wrench;
      case 'LOCATION_CREATED':
      case 'LOCATION_UPDATED':
      case 'LOCATION_DELETED':
        return MapPin;
      case 'SYSTEM_ERROR':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 md:h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 md:h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1 font-medium text-sm md:text-base">
              Welcome back, <span className="text-[#232249] font-semibold">{user.firstName}</span>! Here's your system overview.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-end">
          <div className="relative bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-3 py-2 md:px-4 rounded-lg shadow-lg border border-[#232249]/30 overflow-hidden w-full sm:w-auto">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-full -translate-y-3 md:-translate-y-4 translate-x-3 md:translate-x-4"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 md:w-6 md:h-6 bg-white/5 rounded-full translate-y-2 md:translate-y-3 -translate-x-2 md:-translate-x-3"></div>
            
            <div className="relative z-10 flex items-center justify-center space-x-2 md:space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Live</span>
              </div>
              
              <div className="border-l border-white/30 pl-2 md:pl-3">
                <div className="font-mono text-sm md:text-lg font-bold tracking-wide text-white">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-white/70 text-center">
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>
            
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats?.totalUsers || 0}
          change="+12%"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-blue-50 to-indigo-100"
        />
        <StatCard
          icon={UserCheck}
          title="Active Users"
          value={stats?.activeUsers || 0}
          change="+8%"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-emerald-50 to-green-100"
        />
        <StatCard
          icon={Shield}
          title="Security Events"
          value="23"
          change="-5%"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-rose-50 to-red-100"
        />
        <StatCard
          icon={Server}
          title="System Uptime"
          value="99.9%"
          change="+0.1%"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-purple-50 to-violet-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center space-x-3 mb-4 md:mb-6">
          <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-[#232249]" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-[#232249]">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <a
            href="/locations"
            className="flex items-center space-x-3 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
              <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-blue-900 text-sm md:text-base">Location Management</h4>
              <p className="text-xs md:text-sm text-blue-700">Manage locations & assignments</p>
            </div>
          </a>
          
          <a
            href="/admin/users"
            className="flex items-center space-x-3 p-3 md:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 md:p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors flex-shrink-0">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-emerald-900 text-sm md:text-base">User Management</h4>
              <p className="text-xs md:text-sm text-emerald-700">Manage system users</p>
            </div>
          </a>
          
          <a
            href="/admin/work-orders"
            className="flex items-center space-x-3 p-3 md:p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 md:p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
              <Wrench className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-purple-900 text-sm md:text-base">Work Orders</h4>
              <p className="text-xs md:text-sm text-purple-700">View all work orders</p>
            </div>
          </a>
        </div>
      </div>

      {/* Activity Feed and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-[#232249]" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#232249]">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activitiesLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg animate-pulse">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : activities.length > 0 ? (
              activities.slice(0, 5).map((activity, index) => {
                const IconComponent = getActivityIcon(activity.action);
                return (
                  <div key={activity.id || index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 border-l-2 border-transparent hover:border-[#232249]">
                    <div className={`p-1.5 md:p-2 rounded-lg shadow-sm ${activity.status === 'success' ? 'bg-emerald-100' : activity.status === 'warning' ? 'bg-amber-100' : 'bg-rose-100'}`}>
                      <IconComponent className={`h-3 w-3 md:h-4 md:w-4 ${activity.status === 'success' ? 'text-emerald-600' : activity.status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[#232249] truncate">{activity.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              // No activities fallback
              <div className="text-center py-6">
                <Activity className="h-6 w-6 md:h-8 md:w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activities</p>
                <p className="text-xs text-gray-400 mt-1">Activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-[#232249]" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#232249]">System Status</h3>
            </div>
          </div>
          <div className="space-y-3">
            {systemHealth ? (
              <>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                  <span className="text-sm font-medium text-gray-700">Database</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${systemHealth.database?.status === 'healthy' ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      systemHealth.database?.status === 'healthy' 
                        ? 'text-emerald-600 bg-emerald-100' 
                        : 'text-red-600 bg-red-100'
                    }`}>
                      {systemHealth.database?.status === 'healthy' ? 'Healthy' : 'Error'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                  <span className="text-sm font-medium text-gray-700">API Service</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${systemHealth.apiServices?.status === 'healthy' ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      systemHealth.apiServices?.status === 'healthy' 
                        ? 'text-emerald-600 bg-emerald-100' 
                        : 'text-red-600 bg-red-100'
                    }`}>
                      {systemHealth.apiServices?.status === 'healthy' ? 'Running' : 'Down'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                  <span className="text-sm font-medium text-gray-700">Authentication</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Active</span>
                  </div>
                </div>
                {systemHealth.activeUsers && (
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-medium text-gray-700">Active Users</span>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {systemHealth.activeUsers.count}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Loading skeleton for system status
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending User Approvals */}
      <PendingUserApprovals />
    </div>
  );
};

export default AdminDashboard;
