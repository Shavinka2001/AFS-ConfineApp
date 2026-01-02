import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Wrench,
  MapPin,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  ArrowUpRight,
  Loader,
  Calendar,
  Eye
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import workOrderAPI from '../../../services/workOrderAPI';

const ManagerDashboard = () => {
  const { user } = useAuth();
  
  // Centralized state management
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeWorkOrders: 0,
    pendingInspections: 0,
    totalLocations: 0,
    completedToday: 0,
    efficiency: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Authentication required');
        }

        // Parallel API calls for better performance
        const [workOrdersRes, userStatsRes] = await Promise.allSettled([
          workOrderAPI.getManagerWorkOrders(token, 1, 100),
          fetch('/api/auth/users/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        // Process work orders data
        let workOrdersData = [];
        let totalWorkOrderCount = 0;
        if (workOrdersRes.status === 'fulfilled' && workOrdersRes.value?.success) {
          workOrdersData = workOrdersRes.value.data.orders || [];
          // Use total count from API response, fallback to array length
          totalWorkOrderCount = workOrdersRes.value.data.total || workOrdersData.length;
        }

        // Process user stats data
        let userStatsData = null;
        if (userStatsRes.status === 'fulfilled' && userStatsRes.value.ok) {
          const userStatsJson = await userStatsRes.value.json();
          if (userStatsJson.success) {
            userStatsData = userStatsJson.data;
          }
        }

        // Calculate stats from work orders
        const today = new Date().setHours(0, 0, 0, 0);
        const completedToday = workOrdersData.filter(wo => 
          wo.status === 'completed' && 
          new Date(wo.updatedAt).setHours(0, 0, 0, 0) === today
        ).length;

        const pendingInspections = workOrdersData.filter(wo => 
          wo.status === 'pending' || wo.status === 'in-progress'
        ).length;

        const totalCompleted = workOrdersData.filter(wo => wo.status === 'completed').length;
        const efficiency = workOrdersData.length > 0 
          ? Math.round((totalCompleted / workOrdersData.length) * 100) 
          : 0;

        // Get unique locations count
        const uniqueLocations = new Set(workOrdersData.map(wo => wo.location || wo.building).filter(Boolean)).size;

        // Update stats
        setStats({
          totalUsers: userStatsData?.activeUsers || 0,
          activeWorkOrders: totalWorkOrderCount,
          pendingInspections,
          totalLocations: uniqueLocations,
          completedToday,
          efficiency
        });

        // Generate recent activities from work orders
        const activities = workOrdersData
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5)
          .map(wo => ({
            id: wo._id || wo.id,
            type: getActivityType(wo.status),
            message: getActivityMessage(wo),
            time: getRelativeTime(wo.updatedAt),
            user: wo.assignedTo || wo.technician || 'System',
            workOrderId: wo.workOrderId || wo._id
          }));

        setRecentActivities(activities);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper functions
  const getActivityType = (status) => {
    switch (status) {
      case 'completed': return 'completion';
      case 'in-progress': return 'assignment';
      case 'pending': return 'alert';
      default: return 'activity';
    }
  };

  const getActivityMessage = (workOrder) => {
    switch (workOrder.status) {
      case 'completed':
        return `Work order #${workOrder.workOrderId || 'N/A'} completed`;
      case 'in-progress':
        return `Work order #${workOrder.workOrderId || 'N/A'} in progress`;
      case 'pending':
        return `New work order #${workOrder.workOrderId || 'N/A'} requires attention`;
      default:
        return `Work order #${workOrder.workOrderId || 'N/A'} updated`;
    }
  };

  const getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  );

  // Stat Card Component (Mobile-First)
  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = '#232249' }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-300">
      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div 
              className="p-2.5 sm:p-3 rounded-xl"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color }} />
            </div>
            {trend && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#232249] mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );

  // Activity Item Component
  const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
      switch (type) {
        case 'completion': return <CheckCircle className="h-4 w-4" />;
        case 'assignment': return <Wrench className="h-4 w-4" />;
        case 'alert': return <AlertTriangle className="h-4 w-4" />;
        default: return <Activity className="h-4 w-4" />;
      }
    };

    const getColor = (type) => {
      switch (type) {
        case 'completion': return 'text-emerald-600 bg-emerald-100';
        case 'assignment': return 'text-blue-600 bg-blue-100';
        case 'alert': return 'text-yellow-600 bg-yellow-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-lg ${getColor(activity.type)} flex-shrink-0`}>
          {getIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{activity.message}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500 truncate">{activity.user}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{activity.time}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header Section - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#232249] to-[#2a2a5e] rounded-xl md:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                Manager Dashboard
              </h1>
              <p className="text-sm sm:text-base text-white/80">
                Welcome back, <span className="font-semibold">{user?.firstName || 'Manager'}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 text-white/90 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{currentTime.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-white/30"></div>
              <div className="flex items-center space-x-2 text-white/90 text-sm font-mono">
                <Clock className="h-4 w-4" />
                <span>{currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Failed to load dashboard data</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Stats Grid - Mobile First (1 -> 2 -> 4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            icon={Users}
            title="Active Users"
            value={stats.totalUsers}
            subtitle="Team members"
            trend={5}
            color="#3B82F6"
          />
          <StatCard
            icon={Wrench}
            title="Work Orders"
            value={stats.activeWorkOrders}
            subtitle="All orders"
            trend={8}
            color="#8B5CF6"
          />
          <StatCard
            icon={Clock}
            title="Pending"
            value={stats.pendingInspections}
            subtitle="Awaiting action"
            trend={-2}
            color="#F59E0B"
          />
          <StatCard
            icon={MapPin}
            title="Locations"
            value={stats.totalLocations}
            subtitle="Active sites"
            color="#10B981"
          />
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Section - Spans 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-[#232249]">Today's Overview</h3>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600">{loading ? '...' : stats.completedToday}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium mb-1">Efficiency</p>
                  <p className="text-2xl font-bold text-blue-600">{loading ? '...' : `${stats.efficiency}%`}</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity - Mobile: Cards, Desktop: Table */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-[#232249]" />
                  <h3 className="text-lg sm:text-xl font-semibold text-[#232249]">Recent Activity</h3>
                </div>
                <a 
                  href="/manager/activity"
                  className="text-sm text-[#232249] hover:underline flex items-center space-x-1 min-h-[44px] px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>View All</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-start space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block md:hidden space-y-2">
                    {recentActivities.map(activity => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Activity</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentActivities.map(activity => (
                          <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  activity.type === 'completion' ? 'bg-emerald-100 text-emerald-600' :
                                  activity.type === 'assignment' ? 'bg-blue-100 text-blue-600' :
                                  'bg-yellow-100 text-yellow-600'
                                }`}>
                                  {activity.type === 'completion' && <CheckCircle className="h-4 w-4" />}
                                  {activity.type === 'assignment' && <Wrench className="h-4 w-4" />}
                                  {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{activity.message}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{activity.user}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{activity.time}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.type === 'completion' ? 'bg-emerald-100 text-emerald-700' :
                                activity.type === 'assignment' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {activity.type === 'completion' ? 'Complete' :
                                 activity.type === 'assignment' ? 'In Progress' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#232249] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="/manager/work-orders"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group min-h-[44px]"
                >
                  <div className="flex items-center space-x-3">
                    <Wrench className="h-5 w-5 text-[#232249] group-hover:text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Work Orders</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </a>
                <a
                  href="/locations"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group min-h-[44px]"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-[#232249] group-hover:text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Locations</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </a>
                <a
                  href="/manager/users"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group min-h-[44px]"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-[#232249] group-hover:text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Team</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </a>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#232249] mb-4">Performance</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-semibold text-[#232249]">{stats.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Team Activity</span>
                      <span className="font-semibold text-[#232249]">{Math.min(stats.efficiency + 5, 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.efficiency + 5, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Response Time</span>
                      <span className="font-semibold text-[#232249]">{Math.max(stats.efficiency - 8, 70)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(stats.efficiency - 8, 70)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
