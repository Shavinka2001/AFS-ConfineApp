import React, { useState, useEffect } from 'react';
import {
  User,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  BarChart3,
  RefreshCw,
  Eye,
  Download,
  Bell,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import workOrderAPI from '../../../services/workOrderAPI';

const UserDashboard = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user's work orders
      const token = localStorage.getItem('token');
      if (token) {
        const response = await workOrderAPI.getWorkOrders(token, {
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        if (response.success) {
          const orders = response.data?.orders || [];
          setWorkOrders(orders);

          // Calculate stats
          const stats = {
            total: orders.length,
            pending: orders.filter(order => order.status === 'pending').length,
            inProgress: orders.filter(order => order.status === 'in-progress').length,
            completed: orders.filter(order => order.status === 'completed').length
          };
          setStats(stats);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-[#232249]" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-[#232249]" />;
      case 'pending':
      default:
        return <AlertCircle className="h-5 w-5 text-[#232249]" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'border-[#232249]/30 bg-[#232249]/5 text-[#232249]';
      case 'in-progress':
        return 'border-[#232249]/30 bg-[#232249]/5 text-[#232249]';
      case 'pending':
      default:
        return 'border-[#232249]/30 bg-[#232249]/5 text-[#232249]';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#232249]/20 p-16 hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-3xl flex items-center justify-center shadow-xl">
                  <RefreshCw className="h-12 w-12 text-[#232249] animate-spin" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">Loading Your Dashboard</h2>
                <p className="text-[#232249]/60 font-medium text-lg">Please wait while we fetch your information...</p>
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <div className="w-2 h-2 bg-[#232249]/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#232249]/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[#232249]/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#232249]/20 p-16 hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center shadow-xl">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <X className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">Error Loading Dashboard</h2>
                <p className="text-red-600 font-medium text-lg leading-relaxed">{error}</p>
                <div className="pt-4">
                  <button
                    onClick={fetchUserData}
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-2xl hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
                  >
                    <RefreshCw className="h-6 w-6" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
          <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 p-6 border-b border-[#232249]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#232249] via-[#232249]/90 to-[#232249]/70 bg-clip-text text-transparent">My Dashboard</h1>
                  <p className="text-[#232249]/60 text-sm font-medium">Welcome back, {user?.name || 'User'}! Here's your work overview.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-white/80 px-3 py-2 rounded-lg border border-[#232249]/20 shadow-sm">
                  <div className="w-2 h-2 bg-[#232249] rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-[#232249]">Active User</span>
                </div>
                <button
                  onClick={fetchUserData}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-lg hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#232249]/60 text-sm font-medium uppercase tracking-wide">Total Work Orders</p>
                <p className="text-3xl font-bold text-[#232249] mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-[#232249]" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#232249]/60 text-sm font-medium uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-[#232249] mt-2">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-[#232249]" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#232249]/60 text-sm font-medium uppercase tracking-wide">In Progress</p>
                <p className="text-3xl font-bold text-[#232249] mt-2">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-[#232249]" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#232249]/60 text-sm font-medium uppercase tracking-wide">Completed</p>
                <p className="text-3xl font-bold text-[#232249] mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-[#232249]" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
          <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 p-6 border-b border-[#232249]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-lg flex items-center justify-center shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">Recent Work Orders</h2>
              </div>
              <div className="text-sm text-[#232249]/70 bg-white/80 px-3 py-1 rounded-lg border border-[#232249]/20">
                Showing latest {Math.min(workOrders.length, 10)}
              </div>
            </div>
          </div>

          <div className="p-6">
            {workOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText className="h-8 w-8 text-[#232249]/60" />
                </div>
                <h3 className="text-xl font-bold text-[#232249] mb-2">No Work Orders Yet</h3>
                <p className="text-[#232249]/70">Your work orders will appear here once they're assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workOrders.slice(0, 10).map((order) => (
                  <div key={order._id} className="bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 rounded-xl border border-[#232249]/20 hover:border-[#232249]/30 transition-all duration-300 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-bold text-[#232249]">{order.title || `Work Order #${order.workOrderId || order._id?.slice(-6)}`}</h3>
                          <p className="text-sm text-[#232249]/70">{order.description || 'No description available'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-[#232249]/60">Created</p>
                          <p className="text-sm font-semibold text-[#232249]">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Bell className="h-8 w-8 text-[#232249]" />
              </div>
              <h3 className="text-lg font-bold text-[#232249] mb-2">Notifications</h3>
              <p className="text-[#232249]/70 text-sm mb-4">Stay updated with your work orders</p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-lg hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm">
                View Notifications
              </button>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Download className="h-8 w-8 text-[#232249]" />
              </div>
              <h3 className="text-lg font-bold text-[#232249] mb-2">Reports</h3>
              <p className="text-[#232249]/70 text-sm mb-4">Download your work order reports</p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-lg hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm">
                Download Reports
              </button>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <HelpCircle className="h-8 w-8 text-[#232249]" />
              </div>
              <h3 className="text-lg font-bold text-[#232249] mb-2">Help & Support</h3>
              <p className="text-[#232249]/70 text-sm mb-4">Get help with using the system</p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-lg hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;