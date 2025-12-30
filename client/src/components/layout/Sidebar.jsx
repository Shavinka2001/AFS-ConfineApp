import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
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
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { technicianLocationService } from '../../services/technicianLocationService';
import workOrderAPI from '../../services/workOrderAPI';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile = false, closeMobileMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  
  // State for technician's assigned location and tasks
  const [assignedLocation, setAssignedLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTasksSection, setShowTasksSection] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState(null);

  // Swipe gesture handling for mobile
  const x = useMotionValue(0);
  const xInput = [-100, 0];
  const opacityOutput = [0, 1];
  const opacity = useTransform(x, xInput, opacityOutput);

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

  // Mobile swipe to close
  useEffect(() => {
    if (!isMobile || !sidebarRef.current) return;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!touchStartX.current) return;
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      const diffX = touchStartX.current - touchEndX;
      const diffY = touchStartY.current - touchEndY;
      
      // Only close if horizontal swipe is dominant
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
        closeMobileMenu();
      }
    };

    const handleTouchEnd = () => {
      touchStartX.current = 0;
      touchStartY.current = 0;
    };

    const sidebar = sidebarRef.current;
    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, closeMobileMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobile]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // No need to navigate here as logout function handles redirection
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigation as fallback
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
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
     >
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'none'
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        ref={sidebarRef}
        initial={isMobile ? { x: -100, opacity: 0 } : false}
        animate={isMobile ? { x: 0, opacity: 1 } : { width: isCollapsed ? 80 : 300 }}
        exit={isMobile ? { x: -100, opacity: 0 } : undefined}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 0.2 }
        }}
        className={`bg-white shadow-2xl h-screen flex flex-col ${
          isMobile 
            ? 'fixed left-0 top-0 z-50 w-[85vw] max-w-[320px] sm:w-80' 
            : 'border-r border-gray-100'
        }`}
        style={{
          WebkitTapHighlightColor: 'transparent',
          WebkitOverflowScrolling: 'touch'
        }}
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
        return 'f- Enhanced Mobile */}
      <div className="px-4 py-3 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-[#232249] to-[#1a1a3a] flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <motion.div 
                  className="h-11 w-11 sm:h-12 sm:w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30 shadow-lg flex-shrink-0"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img 
                    src="/logo.jpg" 
                    alt="Confine Logo" 
                    className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
                    loading="lazy"
                  />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                    Confine
                  </h1>
                  <p className="text-[10px] sm:text-xs text-white/70 font-medium truncate">
                    Management System
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {isMobile ? (
              <motion.button
                onClick={closeMobileMenu}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-white" strokeWidth={2.5} />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setIsCollapsed(!isCollapsed)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                classNa- Enhanced Mobile */}
      <div className="px-4 py-3 sm:p-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <motion.div 
            className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-[#232249] to-[#1a1a3a] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-[#232249]/10"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserCog className="h-6 w-6 sm:h-7 sm:w-7 text-white" strokeWidth={2} />
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm sm:text-base font-bold text-[#232249] truncate leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <motion.span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-[#232249] text-white shadow-sm"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
          Navigation Menu - Highly Optimized for Mobile */}
      <nav 
        className="flex-1 px-3 py-4 sm:py-5 space-y-1 overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#232249 transparent'
        }}
      
            {isMobile && (20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: isMobile ? index * 0.03 : index * 0.05, 
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
              onHoverStart={() => !isMobile && setHoveredItem(item.path)}
              onHoverEnd={() => !isMobile && setHoveredItem(null)}
            >
              <Link
                to={item.path}
                onClick={(e) => {
                  if (isMobile) {
                    setTouchFeedback(item.path);
                    setTimeout(() => {
                      setTouchFeedback(null);
                      closeMobileMenu();
                    }, 150);
                  }
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-[#232249] to-[#1a1a3a] text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                } min-h-[52px] ${touchFeedback === item.path ? 'scale-95' : ''}`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon Container */}
                <motion.div 
                  className={`p-2 rounded-xl ${
                    isActive 
                      ? 'bg-white/20 shadow-md' 
                      : 'bg-gray-100 group-hover:bg-[#232249]/10 group-active:bg-[#232249]/20'
                  } transition-all duration-200 flex-shrink-0`}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon 
                    className={`h-5 w-5 ${
                      isActive ? 'text-white' : 'text-[#232249]'
                    } transition-colors duration-200`}
                    strokeWidth={2}
                  />
                </motion.div>
                
                {/* Label */}
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 min-w-0"
                    >
                      <span className={`text-[13px] sm:text-sm font-semibold truncate block ${
                        isActive ? 'text-white' : 'text-gray-800'
                      }`}>
                        {item.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
                
                {/* Subtle hover effect */}
                {!isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#232249]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    initial={false] text-white mobile-shadow-xl ${!isMobile ? 'transform scale-105' : ''}`
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
          Logout Button - Mobile Optimized */}
      <div className="px-3 py-3 sm:p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white flex-shrink-0">
        <motion.button
          onClick={() => {
            handleLogout();
            if (isMobile) closeMobileMenu();
          }}
          disabled={isLoggingOut}
          whileHover={!isMobile ? { scale: 1.02 } : {}}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-3 w-full px-3 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 active:bg-red-100 rounded-xl transition-all duration-200 group relative overflow-hidden min-h-[52px] ${
            isLoggingOut ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
          aria-label="Logout"
        >
          {/* Icon container */}
          <motion.div 
            className="p-2 rounded-xl bg-red-100 group-hover:bg-red-200 group-active:bg-red-300 transition-all duration-200 flex-shrink-0"
            whileTap={{ rotate: -10 }}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
            ) : (
              <LogOut className="h-5 w-5" strokeWidth={2} />
            )}
          </motion.div>
          
          {/* Label */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 text-left"
              >
                <span className="text-[13px] sm:text-sm font-semibold block text-red-600">
                  {isLoggingOut ? 'Signing out...' : 'Logout'}
                </span>
                {!isLoggingOut && (
                  <span className="text-[11px] text-red-500/70 group-hover:text-red-600 transition-colors duration-200">
                    Sign out safely
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Subtle hover effect */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            initial={false}
          />
        </motion.button>
      </div>
      </motion.div>
    </ className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
  );
};

export default Sidebar;
