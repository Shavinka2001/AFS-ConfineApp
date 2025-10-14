import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Shield,
  BarChart3,
  FileText,
  Bell,
  Wrench,
  ClipboardList,
  Calendar,
  MessageSquare,
  Database,
  Activity,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Map,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { technicianLocationService } from '../../services/technicianLocationService';
import workOrderAPI from '../../services/workOrderAPI';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for technician's assigned location and tasks
  const [assignedLocation, setAssignedLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTasksSection, setShowTasksSection] = useState(false);

  // Fetch technician's location and tasks if user is a technician
  useEffect(() => {
    if (user?.role === 'technician') {
      fetchTechnicianData();
    }
  }, [user]);

  const fetchTechnicianData = async () => {
    try {
      setTasksLoading(true);
      
      // Fetch assigned location
      try {
        const locationResponse = await technicianLocationService.getMyLocation();
        if (locationResponse.data) {
          setAssignedLocation(locationResponse.data);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
      
      // Fetch work orders (tasks) for technician
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const workOrdersResponse = await workOrderAPI.getWorkOrders(token, {
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });
          
          if (workOrdersResponse.success) {
            setWorkOrders(workOrdersResponse.data?.orders || []);
          }
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
      }
      
      // Also try to fetch generic tasks if available
      try {
        const tasksResponse = await technicianLocationService.getMyTasks();
        if (tasksResponse.data) {
          setTasks(tasksResponse.data);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    } catch (error) {
      console.error('Error fetching technician data:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // No need to navigate here as logout function handles redirection
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigation as fallback
      navigate('/login');
    }
  };

  const handleViewMap = () => {
    try {
      if (!assignedLocation) {
        alert('No assigned location found. Please contact your manager.');
        return;
      }
      // Navigate to location map view
      navigate('/technician/location-map', { 
        state: { location: assignedLocation } 
      });
    } catch (error) {
      console.error('Error navigating to map:', error);
      alert('Failed to open location map. Please try again.');
    }
  };

  const handleAddInspection = () => {
    try {
      if (!assignedLocation) {
        alert('No assigned location found. Please contact your manager.');
        return;
      }
      // Navigate to inspection form
      navigate('/technician/inspection-forms', { 
        state: { location: assignedLocation } 
      });
    } catch (error) {
      console.error('Error navigating to inspection form:', error);
      alert('Failed to open inspection form. Please try again.');
    }
  };

  const handleCloseWorkOrder = async () => {
    try {
      if (!workOrders || workOrders.length === 0) {
        alert('No active work orders to close');
        return;
      }

      // Find the most recent in-progress work order
      const activeOrder = workOrders.find(order => 
        order.status === 'in-progress' || order.status === 'approved'
      );

      if (!activeOrder) {
        alert('No active work orders found');
        return;
      }

      const confirmMessage = `Close work order "${activeOrder.spaceName || activeOrder.building || activeOrder._id}"?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication error. Please log in again.');
        navigate('/login');
        return;
      }

      // Show loading state
      const originalText = 'Closing work order...';
      alert(originalText); // Simple loading indicator

      await workOrderAPI.updateWorkOrderStatus(token, activeOrder._id, 'completed', 'Closed by technician');
      
      // Refresh work orders
      await fetchTechnicianData();
      alert('Work order closed successfully');
    } catch (error) {
      console.error('Error closing work order:', error);
      
      let errorMessage = 'Failed to close work order';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        navigate('/login');
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to close this work order.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Work order not found.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: `/${user.role}/dashboard` },
      { icon: MapPin, label: 'Locations', path: '/locations' },
      { icon: Activity, label: 'Activity', path: `/${user.role}/activity` },
      { icon: Bell, label: 'Notifications', path: `/${user.role}/notifications` },
    ];

    // Base items without locations for technicians
    const technicianBaseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: `/${user.role}/dashboard` },
      { icon: Activity, label: 'Activity', path: `/${user.role}/activity` },
      { icon: Bell, label: 'Notifications', path: `/${user.role}/notifications` },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { icon: Wrench, label: 'Work Orders', path: '/admin/work-orders' },
          { icon: Users, label: 'User Management', path: '/admin/users' },
          { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
          { icon: Shield, label: 'Security', path: '/admin/security' },
          { icon: Database, label: 'System Logs', path: '/admin/logs' },
          { icon: Settings, label: 'System Settings', path: '/admin/settings' },
        ];
      case 'manager':
        return [
          ...baseItems,
          { icon: Users, label: 'User Management', path: '/manager/users' },
          { icon: Wrench, label: 'Work Orders', path: '/manager/work-orders' },
          { icon: Users, label: 'Team Management', path: '/manager/team' },
          { icon: BarChart3, label: 'Reports', path: '/manager/reports' },
          { icon: ClipboardList, label: 'Projects', path: '/manager/projects' },
          { icon: Calendar, label: 'Schedule', path: '/manager/schedule' },
          { icon: FileText, label: 'Documents', path: '/manager/documents' },
          { icon: Settings, label: 'Settings', path: '/manager/settings' },
        ];
      case 'technician':
        return [
          ...technicianBaseItems,
          { icon: Wrench, label: 'Work Orders', path: '/technician/work-orders' },
          { icon: FileText, label: 'Inspection Forms', path: '/technician/inspection-forms' },
          { icon: ClipboardList, label: 'Tasks', path: '/technician/tasks' },
          { icon: Calendar, label: 'Schedule', path: '/technician/schedule' },
          { icon: MessageSquare, label: 'Messages', path: '/technician/messages' },
          { icon: BarChart3, label: 'Reports', path: '/technician/reports' },
          { icon: Settings, label: 'Settings', path: '/technician/settings' },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const getRoleColor = () => {
    switch (user.role) {
      case 'admin':
        return 'from-red-600 to-pink-600';
      case 'manager':
        return 'from-purple-600 to-indigo-600';
      case 'technician':
        return 'from-blue-600 to-cyan-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'technician':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 300 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`bg-white shadow-2xl border-r border-gray-100 h-screen fixed left-0 top-0 z-40 flex flex-col`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#232249] to-[#232249]/90">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-4"
              >
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                  <img 
                    src="/logo.jpg" 
                    alt="Logo" 
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Confine</h1>
                  <p className="text-xs text-white/80 font-medium">Management System</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 text-white" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center space-x-4">
          <div className={`h-14 w-14 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-[#232249]/20`}>
            <UserCog className="h-7 w-7 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-bold text-[#232249] truncate">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#232249] text-white`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? `bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white shadow-xl transform scale-105`
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-[#232249]/10 hover:to-[#232249]/5 hover:text-[#232249] hover:shadow-lg'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-[#232249]/10'} transition-all duration-300`}>
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#232249] group-hover:text-[#232249]'}`} />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-semibold"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Technician Tasks Section removed: Assigned Location tab hidden for technicians */}

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-4 w-full px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-xl transition-all duration-300 group hover:shadow-lg"
        >
          <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-all duration-300">
            <LogOut className="h-5 w-5 flex-shrink-0" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-semibold"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
