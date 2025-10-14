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
import { userAPI } from '../../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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

    fetchStats();
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
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-xl ${bgColor} shadow-lg`}>
              <Icon className={`h-7 w-7 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-bold text-[#232249] mt-1">{value}</p>
            </div>
          </div>
          {change && (
            <div className="mt-4 flex items-center text-sm bg-gray-50 rounded-lg p-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-600 font-semibold">{change}</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ActivityCard = ({ icon: Icon, title, description, time, status }) => (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200 border-l-4 border-transparent hover:border-[#232249]">
      <div className={`p-3 rounded-xl shadow-md ${status === 'success' ? 'bg-emerald-100' : status === 'warning' ? 'bg-amber-100' : 'bg-rose-100'}`}>
        <Icon className={`h-5 w-5 ${status === 'success' ? 'text-emerald-600' : status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[#232249]">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <p className="text-xs text-gray-500 mt-2 font-medium">{time}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1 font-medium">
              Welcome back, <span className="text-[#232249] font-semibold">{user.firstName}</span>! Here's your system overview.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-4 py-2 rounded-lg shadow-lg border border-[#232249]/30 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -translate-y-4 translate-x-4"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-white/5 rounded-full translate-y-3 -translate-x-3"></div>
            
            <div className="relative z-10 flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Live</span>
              </div>
              
              <div className="border-l border-white/30 pl-3">
                <div className="font-mono text-lg font-bold tracking-wide text-white">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
            <Settings className="h-6 w-6 text-[#232249]" />
          </div>
          <h3 className="text-xl font-bold text-[#232249]">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/locations"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Location Management</h4>
              <p className="text-sm text-blue-700">Manage locations & assignments</p>
            </div>
          </a>
          
          <a
            href="/admin/users"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900">User Management</h4>
              <p className="text-sm text-emerald-700">Manage system users</p>
            </div>
          </a>
          
          <a
            href="/admin/work-orders"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Wrench className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">Work Orders</h4>
              <p className="text-sm text-purple-700">View all work orders</p>
            </div>
          </a>
        </div>
      </div>

      {/* Activity Feed and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
                <Activity className="h-6 w-6 text-[#232249]" />
              </div>
              <h3 className="text-xl font-bold text-[#232249]">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-3">
            <ActivityCard
              icon={UserCheck}
              title="New User Registration"
              description="John Doe registered as a technician"
              time="5 minutes ago"
              status="success"
            />
            <ActivityCard
              icon={AlertTriangle}
              title="Security Alert"
              description="Failed login attempts detected"
              time="15 minutes ago"
              status="warning"
            />
            <ActivityCard
              icon={Settings}
              title="System Update"
              description="Database backup completed successfully"
              time="1 hour ago"
              status="success"
            />
            <ActivityCard
              icon={Database}
              title="Performance Alert"
              description="High CPU usage detected on server"
              time="2 hours ago"
              status="error"
            />
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-[#232249]" />
              </div>
              <h3 className="text-xl font-bold text-[#232249]">System Status</h3>
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <span className="text-sm font-semibold text-gray-700">Database</span>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <span className="text-sm font-semibold text-gray-700">API Service</span>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Running</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <span className="text-sm font-semibold text-gray-700">Authentication</span>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
              <span className="text-sm font-semibold text-gray-700">Background Jobs</span>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">Processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
