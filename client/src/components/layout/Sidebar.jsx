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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isMobile]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobile && closeMobileMenu) {
        closeMobileMenu();
      }
    };

    if (isMobile) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobile, closeMobileMenu]);

  // Swipe gesture handlers for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    
    if (isLeftSwipe && isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
    setIsDragging(false);
  };

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
      {/* Mobile Backdrop Overlay - Enhanced */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => {
              if (closeMobileMenu) {
                closeMobileMenu();
              }
            }}
            onTouchStart={() => {
              if (closeMobileMenu) {
                closeMobileMenu();
              }
            }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md z-40"
            style={{ 
              touchAction: 'auto',
              WebkitTapHighlightColor: 'transparent',
              cursor: 'pointer'
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container - Enhanced Mobile */}
      <motion.div
        initial={isMobile ? { x: '-100%' } : false}
        animate={isMobile ? { x: 0 } : { width: isCollapsed ? 80 : 300 }}
        exit={isMobile ? { x: '-100%' } : undefined}
        transition={{ 
          duration: 0.35, 
          ease: [0.4, 0, 0.2, 1],
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        className={`bg-white shadow-2xl border-r border-gray-100 h-screen flex flex-col ${
          isMobile ? 'w-[85vw] max-w-[320px] fixed left-0 top-0 z-50' : ''
        }`}
        style={isMobile ? {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        } : {}}
      >
      {/* Header - Professional & Mobile-Responsive */}
      <div className="relative px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 border-b border-white/10 bg-gradient-to-br from-[#1a1a3e] via-[#232249] to-[#2a2a5e] shadow-2xl overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        
        {/* Content Container */}
        <div className="relative flex items-center justify-between gap-4">
          {/* Left Side: Logo & Brand */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                {/* Logo Container - Glass Morphism */}
                <motion.div 
                  className="relative h-12 w-12 sm:h-14 sm:w-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center ring-2 ring-white/20 shadow-xl flex-shrink-0 overflow-hidden"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Gradient Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                  <img 
                    src="/logo.jpg" 
                    alt="Confine Logo" 
                    className="relative h-9 w-9 sm:h-10 sm:w-10 object-contain drop-shadow-lg z-10"
                  />
                </motion.div>
                
                {/* Brand Text */}
                <div className="flex-1 min-w-0">
                  <motion.h1 
                    className="text-xl sm:text-2xl font-extrabold text-white truncate tracking-tight leading-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Confine
                  </motion.h1>
                  <motion.p 
                    className="text-xs sm:text-sm text-white/70 font-medium truncate mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Management System
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isMobile ? (
              /* Mobile: Close Button (X) */
              <motion.button
                type="button"
                onClick={() => {
                  if (closeMobileMenu) {
                    closeMobileMenu();
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (closeMobileMenu) {
                    closeMobileMenu();
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-xl transition-all duration-300 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center ring-2 ring-white/20 hover:ring-white/30 shadow-xl hover:shadow-2xl"
                aria-label="Close navigation menu"
              >
                {/* Button Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* X Icon with Rotation Animation */}
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <X className="h-6 w-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                </motion.div>
              </motion.button>
            ) : (
              /* Desktop: Collapse Toggle Button (Chevron) */
              <motion.button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-xl transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center ring-1 ring-white/20 hover:ring-white/30 shadow-lg hover:shadow-xl"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {/* Button Glow Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Chevron Icon with Smooth Transition */}
                <motion.div
                  animate={{ rotate: isCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-white drop-shadow-md" strokeWidth={2.5} />
                  ) : (
                    <ChevronLeft className="h-5 w-5 text-white drop-shadow-md" strokeWidth={2.5} />
                  )}
                </motion.div>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile - Enhanced Mobile */}
      <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
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
                  if (isMobile && closeMobileMenu) {
                    closeMobileMenu();
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group touch-manipulation relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-[#232249] to-[#2a2a5e] text-white shadow-xl shadow-[#232249]/20 scale-[1.02]'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-[#232249]/5 hover:to-[#232249]/10 hover:text-[#232249] active:scale-95 active:bg-[#232249]/15'
                } ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'}`}
              >
                {/* Icon Container - Enhanced */}
                <motion.div 
                  className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20 shadow-lg ring-2 ring-white/30' : 'bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-[#232249]/10 group-hover:to-[#232249]/5 shadow-sm'} transition-all duration-200 flex-shrink-0 relative overflow-hidden`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9, rotate: -5 }}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white drop-shadow-md' : 'text-[#232249] group-hover:text-[#232249]'} transition-all duration-200`} strokeWidth={2.5} />
                  
                  {/* Icon glow effect - Enhanced */}
                  {(isActive || hoveredItem === item.path) && (
                    <motion.div 
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/30 to-purple-400/30"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
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
                      
                      {/* Active indicator - Enhanced */}
                      {isActive && (
                        <motion.div
                          className="h-1 bg-gradient-to-r from-white/60 via-white to-white/60 rounded-full mt-1.5 shadow-lg shadow-white/20"
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: '100%', opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
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

      {/* Enhanced Logout Button - Premium Mobile */}
      <div className="p-4 sm:p-3 lg:p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <motion.button
          type="button"
          onClick={() => {
            handleLogout();
            if (isMobile && closeMobileMenu) {
              closeMobileMenu();
            }
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-3 w-full px-4 py-3.5 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-2xl transition-all duration-200 group hover:shadow-lg hover:shadow-red-500/10 touch-manipulation relative overflow-hidden ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'}`}
        >
          {/* Icon container - Enhanced */}
          <motion.div 
            className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-50 group-hover:from-red-200 group-hover:to-red-100 transition-all duration-200 flex-shrink-0 relative overflow-hidden shadow-sm group-hover:shadow-md"
            whileHover={{ scale: 1.1, rotate: -10 }}
            whileTap={{ scale: 0.9, rotate: 10 }}
          >
            <LogOut className="h-5 w-5 transition-all duration-200" strokeWidth={2.5} />
            
            {/* Icon glow effect - Animated */}
            <motion.div 
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-400/30 to-pink-400/30"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
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
