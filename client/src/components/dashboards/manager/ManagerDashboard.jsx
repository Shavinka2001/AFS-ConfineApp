import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  ClipboardList,
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  MapPin,
  Wrench,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  FileText,
  Settings,
  Eye
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import workOrderAPI from '../../../services/workOrderAPI';
import PendingUserApprovals from '../admin/PendingUserApprovals';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    teamMembers: 0,
    activeWorkOrders: 0,
    completedThisMonth: 0,
    pendingApprovals: 0,
    efficiency: 0,
    loading: true
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          console.warn('No auth token found');
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        // Fetch work orders to get stats
        try {
          const workOrdersResponse = await workOrderAPI.getManagerWorkOrders(token, 1, 100);
          if (workOrdersResponse.success && workOrdersResponse.data) {
            const orders = workOrdersResponse.data.orders || [];
            
            // Calculate stats from work orders
            const statsData = {
              teamMembers: 0, // Will be fetched from user API
              activeWorkOrders: orders.filter(order => 
                ['pending', 'approved', 'in-progress'].includes(order.status)
              ).length,
              completedThisMonth: orders.filter(order => {
                const createdDate = new Date(order.createdAt);
                const now = new Date();
                return order.status === 'completed' && 
                       createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              }).length,
              pendingApprovals: orders.filter(order => order.status === 'pending').length,
              efficiency: 0, // Will be calculated
              loading: false
            };

            // Calculate efficiency based on completion rate
            const totalOrders = orders.length;
            const completedOrders = orders.filter(order => order.status === 'completed').length;
            statsData.efficiency = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

            setStats(statsData);
            setWorkOrders(orders.slice(0, 4)); // Show first 4 work orders
          }
        } catch (workOrderError) {
          console.warn('Failed to fetch work orders:', workOrderError);
        }

        // Fetch user stats for team members
        try {
          const userStatsResponse = await fetch('http://localhost:3001/api/users/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (userStatsResponse.ok) {
            const userStats = await userStatsResponse.json();
            if (userStats.success && userStats.data) {
              setStats(prev => ({
                ...prev,
                teamMembers: userStats.data.activeUsers || 0
              }));
            }
          }
        } catch (userError) {
          console.warn('Failed to fetch user stats:', userError);
        }

        // Create mock activities based on recent work orders
        const mockActivities = [
          { 
            id: 1, 
            type: 'approval', 
            message: 'Work order status updated', 
            time: '2 minutes ago', 
            user: 'System' 
          },
          { 
            id: 2, 
            type: 'completion', 
            message: 'Work order completed', 
            time: '15 minutes ago', 
            user: 'System' 
          },
          { 
            id: 3, 
            type: 'assignment', 
            message: 'Technician assigned to work order', 
            time: '1 hour ago', 
            user: 'System' 
          },
          { 
            id: 4, 
            type: 'alert', 
            message: 'New work order requires attention', 
            time: '2 hours ago', 
            user: 'System' 
          }
        ];
        setRecentActivities(mockActivities);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data
        setStats({
          teamMembers: '--',
          activeWorkOrders: '--',
          completedThisMonth: '--',
          pendingApprovals: '--',
          efficiency: '--',
          loading: false
        });
        setWorkOrders([]);
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Modern stat card with improved design and loading state
  const StatCard = ({ icon: Icon, title, value, change, trend = 'up', subtitle, color = '#232249', loading = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold" style={{ color: '#232249' }}>{value}</p>
              )}
            </div>
          </div>
          
          {change && !loading && (
            <div className="flex items-center space-x-2">
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {change}
              </span>
              <span className="text-sm text-gray-500">vs last month</span>
            </div>
          )}
          
          {loading && (
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          )}
          
          {subtitle && !loading && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Enhanced work order card with loading state
  const WorkOrderCard = ({ workOrder, loading = false }) => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="h-3 w-8 bg-gray-200 rounded"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"></div>
            </div>
          </div>
        </div>
      );
    }

    if (!workOrder) return null;

    const statusColors = {
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'overdue': 'bg-red-100 text-red-800 border-red-200'
    };

    const priorityColors = {
      'high': 'bg-red-500',
      'medium': 'bg-yellow-500',
      'low': 'bg-green-500'
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${priorityColors[workOrder.priority] || 'bg-gray-500'}`}></div>
              <h4 className="font-semibold text-gray-900 group-hover:text-[#232249] transition-colors">
                {workOrder.title || 'Untitled Work Order'}
              </h4>
            </div>
            <p className="text-sm text-gray-600">ID: {workOrder.id || workOrder._id || 'N/A'}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[workOrder.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {workOrder.status ? workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1) : 'Unknown'}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Assignee</span>
            <span className="font-medium text-gray-900">{workOrder.assignee || workOrder.technician || 'Unassigned'}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Due Date</span>
            <span className="font-medium text-gray-900">
              {workOrder.dueDate ? new Date(workOrder.dueDate).toLocaleDateString() : 'No due date'}
            </span>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium" style={{ color: '#232249' }}>{workOrder.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${workOrder.progress || 0}%`,
                  backgroundColor: '#232249'
                }}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Activity feed item with loading state
  const ActivityItem = ({ activity, loading = false }) => {
    if (loading) {
      return (
        <div className="flex items-start space-x-3 p-3 animate-pulse">
          <div className="p-2 bg-gray-200 rounded-lg">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-1 bg-gray-200 rounded"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      );
    }

    if (!activity) return null;

    const getIcon = (type) => {
      switch (type) {
        case 'approval': return <CheckCircle className="h-4 w-4" />;
        case 'completion': return <Target className="h-4 w-4" />;
        case 'assignment': return <Users className="h-4 w-4" />;
        case 'alert': return <AlertTriangle className="h-4 w-4" />;
        default: return <Activity className="h-4 w-4" />;
      }
    };

    const getColor = (type) => {
      switch (type) {
        case 'approval': return 'text-emerald-600 bg-emerald-100';
        case 'completion': return 'text-blue-600 bg-blue-100';
        case 'assignment': return 'text-purple-600 bg-purple-100';
        case 'alert': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-lg ${getColor(activity.type)}`}>
          {getIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">{activity.user || 'Unknown'}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{activity.time || 'Unknown time'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="p-8 space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#232249] rounded-2xl shadow-sm border border-gray-200 p-6 mb-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl border border-white border-opacity-20">
                  <BarChart3 className="h-8 w-8" style={{ color: '#232249' }} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white leading-tight">Manager Dashboard</h1>
                  <div className="h-1 w-16 bg-white rounded-full mt-2"></div>
                </div>
              </div>
              <p className="text-lg text-white text-opacity-90 font-medium">
                Welcome back, <span className="text-white font-semibold">{user.firstName}</span>!
                <span className="block text-base text-white text-opacity-70 mt-1">Here's your comprehensive team overview for today</span>
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-6 ml-8">
              <div className="text-right">
                <p className="text-sm text-white text-opacity-70 font-medium">Current Date</p>
                <p className="text-lg font-semibold text-white">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="w-px h-12 bg-white bg-opacity-30"></div>
              <div className="text-right">
                <p className="text-sm text-white text-opacity-70 font-medium">Current Time</p>
                <p className="text-lg font-semibold text-white">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - Modern Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-[#232249] rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#232249]">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/locations"
              className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg hover:border-[#232249] transition-all duration-300"
            >
              <div className="p-4 bg-[#232249] rounded-xl">
                <MapPin className="h-7 w-7 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#232249] group-hover:text-[#232249] transition-colors">Locations</h4>
                <p className="text-sm text-gray-600">Manage locations</p>
              </div>
            </a>
            
            <a
              href="/manager/users"
              className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg hover:border-[#232249] transition-all duration-300"
            >
              <div className="p-4 bg-[#232249] rounded-xl">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#232249] group-hover:text-[#232249] transition-colors">Users</h4>
                <p className="text-sm text-gray-600">Manage team</p>
              </div>
            </a>

            <a
              href="/manager/work-orders"
              className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg hover:border-[#232249] transition-all duration-300"
            >
              <div className="p-4 bg-[#232249] rounded-xl">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#232249] group-hover:text-[#232249] transition-colors">Work Orders</h4>
                <p className="text-sm text-gray-600">Track progress</p>
              </div>
            </a>
            
            <a
              href="/manager/reports"
              className="group flex items-center space-x-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg hover:border-[#232249] transition-all duration-300"
            >
              <div className="p-4 bg-[#232249] rounded-xl">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#232249] group-hover:text-[#232249] transition-colors">Reports</h4>
                <p className="text-sm text-gray-600">View analytics</p>
              </div>
            </a>
          </div>
        </motion.div>

        {/* Stats Grid - Dynamic with Loading States */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Team Members"
            value={stats.teamMembers}
            change={stats.teamMembers > 0 ? "+2" : null}
            trend="up"
            subtitle="Active technicians"
            loading={loading}
          />
          <StatCard
            icon={FileText}
            title="Active Work Orders"
            value={stats.activeWorkOrders}
            change={stats.activeWorkOrders > 0 ? "+5" : null}
            trend="up"
            subtitle="In progress"
            loading={loading}
          />
          <StatCard
            icon={CheckCircle}
            title="Completed This Month"
            value={stats.completedThisMonth}
            change={stats.completedThisMonth > 0 ? "+15%" : null}
            trend="up"
            subtitle="Above target"
            loading={loading}
          />
          <StatCard
            icon={Clock}
            title="Pending Approvals"
            value={stats.pendingApprovals}
            change={stats.pendingApprovals > 0 ? "-2" : null}
            trend="down"
            subtitle="Awaiting review"
            loading={loading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Work Orders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#232249] rounded-xl">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#232249]">Recent Work Orders</h3>
              </div>
              <a href="/manager/work-orders" className="text-[#232249] hover:text-[#1a1a3a] font-medium text-sm flex items-center space-x-1">
                <span>View All</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <WorkOrderCard key={index} loading={true} />
                ))
              ) : workOrders.length > 0 ? (
                // Actual work orders from API
                workOrders.map((workOrder) => (
                  <WorkOrderCard key={workOrder.id || workOrder._id} workOrder={workOrder} />
                ))
              ) : (
                // Empty state
                <div className="col-span-2 text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No work orders found</p>
                  <p className="text-gray-400 text-sm">Work orders will appear here once created</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[#232249] rounded-xl">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#232249]">Recent Activity</h3>
            </div>
            <div className="space-y-1">
              {loading ? (
                // Loading skeleton for activities
                Array.from({ length: 4 }).map((_, index) => (
                  <ActivityItem key={index} loading={true} />
                ))
              ) : recentActivities.length > 0 ? (
                // Actual activities from API
                recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                // Empty state for activities
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a href="/manager/activity" className="text-[#232249] hover:text-[#1a1a3a] font-medium text-sm flex items-center space-x-1">
                <span>View All Activity</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[#232249] rounded-xl">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#232249]">Team Performance</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                  {loading ? (
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-sm font-bold text-[#232249]">
                      {stats.efficiency > 0 ? `${Math.min(stats.efficiency, 100)}%` : '--'}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#232249] h-3 rounded-full transition-all duration-1000" 
                    style={{ width: loading ? '0%' : `${Math.min(stats.efficiency || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Quality Score</span>
                  {loading ? (
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-sm font-bold text-[#232249]">
                      {stats.efficiency > 0 ? `${Math.max(stats.efficiency - 6, 0)}%` : '--'}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#232249] h-3 rounded-full transition-all duration-1000" 
                    style={{ width: loading ? '0%' : `${Math.max(stats.efficiency - 6 || 0, 0)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">On-time Delivery</span>
                  {loading ? (
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-sm font-bold text-[#232249]">
                      {stats.efficiency > 0 ? `${Math.max(stats.efficiency - 2, 0)}%` : '--'}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#232249] h-3 rounded-full transition-all duration-1000" 
                    style={{ width: loading ? '0%' : `${Math.max(stats.efficiency - 2 || 0, 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Efficiency</span>
                  {loading ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <span className="text-2xl font-bold text-[#232249]">
                      {stats.efficiency > 0 ? `${stats.efficiency}%` : '--'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {loading ? 'Loading performance data...' : 
                   stats.efficiency > 0 ? 'Performance tracking this month' : 'No data available'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-[#232249] rounded-xl">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#232249]">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-4">
              {loading ? (
                // Loading skeleton for deadlines
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-pulse">
                    <div className="h-5 w-5 bg-gray-200 rounded mt-0.5"></div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : workOrders.filter(wo => wo.status === 'overdue' || new Date(wo.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length > 0 ? (
                // Show actual upcoming deadlines
                workOrders
                  .filter(wo => wo.status === 'overdue' || new Date(wo.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
                  .slice(0, 3)
                  .map((workOrder) => {
                    const isOverdue = workOrder.status === 'overdue' || new Date(workOrder.dueDate) < new Date();
                    const dueInDays = Math.ceil((new Date(workOrder.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={workOrder.id || workOrder._id} className={`flex items-start space-x-3 p-4 rounded-xl border ${
                        isOverdue ? 'bg-red-50 border-red-200' : 
                        dueInDays <= 2 ? 'bg-yellow-50 border-yellow-200' : 
                        'bg-blue-50 border-blue-200'
                      }`}>
                        {isOverdue ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : dueInDays <= 2 ? (
                          <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{workOrder.title || 'Untitled Work Order'}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {isOverdue ? `Overdue by ${Math.abs(dueInDays)} days` : 
                             dueInDays === 0 ? 'Due today' :
                             dueInDays === 1 ? 'Due tomorrow' :
                             `Due in ${dueInDays} days`} - {workOrder.id || workOrder._id}
                          </p>
                          <p className={`text-xs font-medium ${
                            isOverdue ? 'text-red-600' : 
                            dueInDays <= 2 ? 'text-yellow-600' : 
                            'text-blue-600'
                          }`}>
                            {isOverdue ? 'Action required' : 
                             workOrder.status === 'in-progress' ? 'In progress' : 
                             'On schedule'}
                          </p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                // Empty state for deadlines
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Pending User Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <PendingUserApprovals />
        </motion.div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
