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
  HelpCircle,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import workOrderAPI from '../../../services/workOrderAPI';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    confinedSpaces: 0,
    recentOrders: 0
  });

  const handleLogout = () => {
    logout();
  };

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
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const stats = {
            total: orders.length,
            confinedSpaces: orders.filter(order => order.isConfinedSpace === true).length,
            recentOrders: orders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo).length
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
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending':
      default:
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'in-progress':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'pending':
      default:
        return 'border-amber-200 bg-amber-50 text-amber-700';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-slate-600 animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">Loading Dashboard</h2>
                <p className="text-slate-600">Please wait while we fetch your information...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-xl font-semibold text-slate-900">Error Loading Dashboard</h2>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchUserData}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors duration-200 font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
                  <p className="text-white/70 text-sm">Welcome back, {user?.firstName || user?.name || 'User'}!</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchUserData}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-200 font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Essential Stats Cards - User Focused */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Confined Spaces</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.confinedSpaces}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium uppercase tracking-wide">Recent Orders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.recentOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Work Orders</h2>
              </div>
              <div className="text-sm text-slate-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
                Latest {Math.min(workOrders.length, 10)}
              </div>
            </div>
          </div>

          <div className="p-6">
            {workOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Work Orders Yet</h3>
                <p className="text-slate-600">Your work orders will appear here once they're assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workOrders.slice(0, 10).map((order) => (
                  <div key={order._id} className="bg-slate-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold text-slate-900">{order.title || `Work Order #${order.workOrderId || order._id?.slice(-6)}`}</h3>
                          <p className="text-sm text-slate-600">{order.description || 'No description available'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Created</p>
                          <p className="text-sm font-medium text-slate-900">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Notifications</h3>
              <p className="text-slate-600 text-sm mb-4">Stay updated with your work orders</p>
              <button className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium">
                View Notifications
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Reports</h3>
              <p className="text-slate-600 text-sm mb-4">Download your work order reports</p>
              <button className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium">
                Download Reports
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Help & Support</h3>
              <p className="text-slate-600 text-sm mb-4">Get help with using the system</p>
              <button className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium">
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