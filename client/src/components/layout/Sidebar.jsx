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

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile = false, closeMobileMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for technician's assigned location and tasks
  const [assignedLocation, setAssignedLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTasksSection, setShowTasksSection] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch technician's location and tasks if user is a technician
  useEffect(() => {
    if (user?.role === 'technician') {
      fetchTechnicianData();
    }
  }, [user]);

  // Auto-close mobile menu when route changes
  useEffect(() => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  }, [location.pathname, isMobile, closeMobileMenu]);

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
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            style={{ touchAction: 'none' }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 80 : (isMobile ? 280 : 300) }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`bg-white shadow-2xl border-r border-gray-100 h-screen flex flex-col ${
          isMobile ? 'w-full sm:w-280 fixed left-0 top-0 z-50' : ''
        }`}
      >
      {/* Header */}
      <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-r from-[#232249] to-[#232249]/90">
        <div className="flex items-center justify-between gap-3">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
              >
                <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30 shadow-lg flex-shrink-0">
                  <img 
                    src="/logo.jpg" 
                    alt="Logo" 
                    className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">Confine</h1>
                  <p className="text-xs text-white/80 font-medium truncate">Management System</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {isMobile && (
              <button
                onClick={closeMobileMenu}
                className="p-2.5 sm:p-2 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm lg:hidden touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5 sm:h-5 sm:w-5 text-white" />
              </button>
            )}
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2.5 sm:p-2 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-white" />
                ) : (
                  <ChevronLeft className="h-5 w-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 sm:h-13 sm:w-13 lg:h-14 lg:w-14 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-[#232249]/20">
            <UserCog className="h-6 w-6 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
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
                <p className="text-sm sm:text-sm font-bold text-[#232249] truncate">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#232249] text-white">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Navigation Menu with Mobile Optimization */}
      <nav className="flex-1 px-3 sm:px-3 lg:px-4 py-4 sm:py-5 lg:py-6 space-y-1.5 sm:space-y-2 overflow-y-auto swipeable-y">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
              onHoverStart={() => setHoveredItem(item.path)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <Link
                to={item.path}
                onClick={() => {
                  if (isMobile) {
                    closeMobileMenu();
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 group touch-manipulation relative overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-r from-[#232249] to-[#1a1a3a] text-white mobile-shadow-xl ${!isMobile ? 'transform scale-105' : ''}`
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-[#232249]/10 hover:to-[#232249]/5 hover:text-[#232249] hover:mobile-shadow-lg active:bg-[#232249]/20'
                } min-h-[48px]`} // Consistent 48px min-height for mobile touch
              >
                {/* Icon Container */}
                <motion.div 
                  className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${isActive ? 'bg-white/20 shadow-lg' : 'bg-gray-100 group-hover:bg-[#232249]/10'} transition-all duration-300 flex-shrink-0 relative overflow-hidden`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#232249] group-hover:text-[#232249]'} transition-all duration-300`} />
                  
                  {/* Icon glow effect */}
                  {(isActive || hoveredItem === item.path) && (
                    <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-50"></div>
                  )}
                </motion.div>
                
                {/* Label with smooth animation */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0"
                    >
                      <span className="text-sm font-semibold truncate block">
                        {item.label}
                      </span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          className="h-0.5 bg-white/50 rounded-full mt-1"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Hover ripple effect */}
                {hoveredItem === item.path && !isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#232249]/5 to-[#232249]/10"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                
                {/* Active background animation */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Technician Tasks Section removed: Assigned Location tab hidden for technicians */}

      {/* Enhanced Logout Button with Mobile Optimization */}
      <div className="p-3 sm:p-3 lg:p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.button
          onClick={() => {
            handleLogout();
            if (isMobile) closeMobileMenu();
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 w-full px-3 py-2.5 sm:py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-xl sm:rounded-2xl transition-all duration-300 group hover:mobile-shadow-lg touch-manipulation relative overflow-hidden min-h-[48px]"
        >
          {/* Icon container with enhanced effects */}
          <motion.div 
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-red-100 group-hover:bg-red-200 transition-all duration-300 flex-shrink-0 relative overflow-hidden"
            whileHover={{ scale: 1.1, rotate: -5 }}
          >
            <LogOut className="h-5 w-5 transition-all duration-300" />
            
            {/* Icon glow effect */}
            <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.div>
          
          {/* Label with enhanced animation */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 text-left"
              >
                <span className="text-sm font-semibold block">
                  Logout
                </span>
                <span className="text-xs text-red-500/70 group-hover:text-red-600 transition-colors duration-300">
                  Sign out safely
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Hover ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        </motion.button>
      </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
