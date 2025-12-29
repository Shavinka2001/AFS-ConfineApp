import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  Edit,
  Download,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Building,
  Shield,
  ImageIcon,
  RefreshCw,
  Plus,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import AdminWorkOrdersTable from './AdminWorkOrdersTable';
import workOrderAPI from '../../../services/workOrderAPI';
import CSVImportModal from '../../ui/CSVImportModal';
import * as XLSX from 'xlsx';

// Enhanced Mobile-Responsive AdminWorkOrders with Smooth Animations
const AdminWorkOrders = () => {
  const { user } = useAuth();
  
  // Animation refs and controls
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const filtersRef = useRef(null);
  const tableRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.2 });
  const filtersInView = useInView(filtersRef, { once: true, amount: 0.3 });
  const tableInView = useInView(tableRef, { once: true, amount: 0.1 });
  const headerControls = useAnimation();
  const statsControls = useAnimation();
  
  // State for data management
  const [workOrders, setWorkOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  
  // Mobile animation states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // State for statistics
  const [stats, setStats] = useState({
    total: 0,
    confinedSpaces: 0,
    safetyIssues: 0
  });

  // Get unique values for filters
  const [technicians, setTechnicians] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // Animation effects
  useEffect(() => {
    if (headerInView) {
      headerControls.start({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: "easeOut"
        }
      });
    }
  }, [headerInView, headerControls]);

  useEffect(() => {
    if (statsInView) {
      statsControls.start({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.8,
          ease: "easeOut",
          staggerChildren: 0.1
        }
      });
    }
  }, [statsInView, statsControls]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data on component mount and refresh
  const loadData = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('=== ADMIN DASHBOARD DEBUG INFO ===');
      console.log('Admin dashboard - Loading work orders...');
      console.log('User info:', user);
      console.log('Token exists:', !!token);
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await workOrderAPI.getWorkOrders(token, {
        page: 1,
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('=== API RESPONSE DEBUG ===');
      console.log('Raw API Response:', response);
      
      let mongoOrders = [];
      
      // Handle various response formats
      if (response && response.success === false) {
        // API returned an error
        console.error('API returned error:', response.error || response.message);
        setError(response.error || response.message || 'Failed to load work orders');
        setWorkOrders([]);
        setFilteredOrders([]);
        calculateStats([]);
        return;
      }
      
      if (response && response.success && response.data) {
        mongoOrders = response.data.orders || response.data || [];
      } else if (response && Array.isArray(response)) {
        mongoOrders = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        mongoOrders = response.data;
      } else if (response && response.orders && Array.isArray(response.orders)) {
        mongoOrders = response.orders;
      } else {
        console.warn('Unexpected API response format:', response);
        mongoOrders = [];
      }
      
      console.log('=== ORDER PROCESSING DEBUG ===');
      console.log('Mongo Orders count:', mongoOrders.length);
      console.log('Sample order:', mongoOrders[0]);
      
      const transformedOrders = mongoOrders.map(order => ({
        ...order,
        id: order._id || order.id,
        workOrderId: order.workOrderId || order.uniqueId || `WO-${String(order._id || order.id).slice(-6)}`,
        entrySupervisor: order.technician,
        location: order.locationDescription,
        submittedAt: order.createdAt
      }));

      console.log('Transformed orders:', transformedOrders.length);
      
      setWorkOrders(transformedOrders);
      setFilteredOrders(transformedOrders);
      
      const uniqueTechnicians = [...new Set(transformedOrders.map(order => order.technician).filter(Boolean))];
      const uniqueBuildings = [...new Set(transformedOrders.map(order => order.building).filter(Boolean))];
      
      setTechnicians(uniqueTechnicians);
      setBuildings(uniqueBuildings);
      
      calculateStats(transformedOrders);
      setError(null);
      console.log('Successfully loaded', transformedOrders.length, 'work orders for admin');
      
    } catch (err) {
      console.error('Error loading work orders for admin:', err);
      console.error('Error stack:', err.stack);
      setError(`Failed to load work orders: ${err.message}`);
      setWorkOrders([]);
      setFilteredOrders([]);
      calculateStats([]);
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Calculate statistics
  const calculateStats = (orders) => {
    const stats = {
      total: orders.length,
      confinedSpaces: orders.filter(order => order.isConfinedSpace || order.confinedSpace).length,
      safetyIssues: orders.filter(order => 
        order.atmosphericHazard || 
        order.engulfmentHazard || 
        order.configurationHazard || 
        order.otherRecognizedHazards
      ).length
    };
    setStats(stats);
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = workOrders.filter(order => {
      const matchesSearch = 
        (order.spaceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.building || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.technician || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.uniqueId || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = !priorityFilter || order.priority === priorityFilter;
      const matchesTechnician = !technicianFilter || order.technician === technicianFilter;
      const matchesBuilding = !buildingFilter || order.building === buildingFilter;
      
      return matchesSearch && matchesPriority && matchesTechnician && matchesBuilding;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredOrders(filtered);
    calculateStats(filtered);
  }, [workOrders, searchTerm, priorityFilter, technicianFilter, buildingFilter, sortConfig]);

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'text-green-700 bg-green-100',
      'medium': 'text-yellow-700 bg-yellow-100',
      'high': 'text-orange-700 bg-orange-100',
      'critical': 'text-red-700 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  // Event handlers
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleRefresh = () => {
    loadData(false);
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const handleDownloadPDF = async (order) => {
    try {
      setDownloadingPdf(order.id || order._id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const result = await workOrderAPI.generateWorkOrderPDF(token, order, 'pdf');
      
      if (result.success) {
        console.log('PDF generated and downloaded successfully:', result.fileName);
      } else {
        throw new Error('PDF generation failed');
      }
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError(`Failed to download PDF: ${error.message}`);
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Handle CSV Import
  const handleCSVImport = async (csvData) => {
    try {
      setCsvImportLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await workOrderAPI.importCSVData(token, csvData);
      
      if (response.success) {
        await loadData();
        setShowCSVImportModal(false);
        
        return {
          success: true,
          message: `Successfully imported ${response.data?.results?.successful || 0} work orders`,
          data: response.data
        };
      } else {
        throw new Error(response.message || 'Import failed');
      }
    } catch (error) {
      console.error('CSV import error:', error);
      throw error;
    } finally {
      setCsvImportLoading(false);
    }
  };

  // Handle Excel Export
  const handleExportToExcel = () => {
    try {
      if (!filteredOrders || filteredOrders.length === 0) {
        setError('No work orders to export');
        return;
      }

      const exportData = filteredOrders.map(order => ({
        'Work Order ID': order.workOrderId || order.uniqueId || 'N/A',
        'Space Name': order.spaceName || 'N/A',
        'Building': order.building || 'N/A',
        'Location Description': order.locationDescription || 'N/A',
        'Confined Space Description': order.confinedSpaceDescription || 'N/A',
        'Technician': order.technician || 'N/A',
        'Priority': order.priority || 'N/A',
        'Survey Date': order.surveyDate ? new Date(order.surveyDate).toLocaleDateString() : 'N/A',
        'Created Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
        'Confined Space': order.isConfinedSpace ? 'Yes' : 'No',
        'Permit Required': order.permitRequired ? 'Yes' : 'No',
        'Entry Requirements': order.entryRequirements || 'N/A',
        'Notes': order.notes || 'N/A'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      XLSX.utils.book_append_sheet(wb, ws, 'Work Orders');
      
      const fileName = `work-orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      
      console.log(`Exported ${exportData.length} work orders to ${fileName}`);
      
    } catch (error) {
      console.error('Export error:', error);
      setError(`Failed to export: ${error.message}`);
    }
  };

  // Enhanced Mobile-Responsive Statistics Card Component with Better Text Handling
  const StatCard = ({ title, value, icon: Icon, color, bgColor, borderColor, onClick, index }) => {
    const cardRef = useRef(null);
    const cardInView = useInView(cardRef, { once: true, amount: 0.3 });
    
    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={cardInView ? { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            duration: 0.5,
            delay: index * 0.1,
            ease: "easeOut"
          }
        } : {}}
        whileHover={{ 
          scale: 1.02, 
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setHoveredStat(index)}
        onHoverEnd={() => setHoveredStat(null)}
        className={`group ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
        onClick={onClick}
      >
        <div className={`bg-white rounded-xl lg:rounded-2xl shadow-lg border-2 ${borderColor} hover:shadow-xl transition-all duration-300 p-3 sm:p-4 lg:p-6 min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] relative overflow-hidden`}>
          {/* Background Animation */}
          <motion.div
            className={`absolute inset-0 ${bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            initial={{ scale: 0, borderRadius: '50%' }}
            animate={hoveredStat === index ? { 
              scale: 2, 
              borderRadius: '1rem',
              transition: { duration: 0.6, ease: "easeOut" }
            } : {}}
          />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Top Section - Icon and Value */}
            <div className="flex items-start justify-between gap-2">
              <motion.div 
                className={`p-2 rounded-lg ${bgColor} shadow-sm relative overflow-hidden flex-shrink-0`}
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color} relative z-10`} />
                
                {/* Icon glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ scale: 0 }}
                  animate={hoveredStat === index ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
              
              <div className="text-right flex-grow min-w-0">
                <motion.div 
                  className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-tight"
                  initial={{ scale: 1 }}
                  animate={{ 
                    scale: hoveredStat === index ? 1.05 : 1,
                    color: hoveredStat === index ? color.replace('text-', '#') : '#111827'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {value}
                </motion.div>
              </div>
            </div>
            
            {/* Bottom Section - Title */}
            <div className="mt-2">
              <motion.div 
                className="text-xs sm:text-sm font-semibold text-gray-600 leading-tight break-words"
                animate={{ 
                  color: hoveredStat === index ? color.replace('text-', '#') : '#6b7280'
                }}
                transition={{ duration: 0.3 }}
                style={{ 
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  overflowWrap: 'break-word'
                }}
              >
                {title}
              </motion.div>
            </div>
          </div>
          
          {/* Hover ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-br from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 pointer-events-none"
            initial={{ scale: 0, rotate: 0 }}
            animate={hoveredStat === index ? { 
              scale: 1, 
              rotate: 180,
              transition: { duration: 0.8, ease: "easeOut" }
            } : {}}
          />
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[#232249] mx-auto" style={{ animationDuration: '1s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-[#232249] rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[#232249] font-bold text-xl">Loading Work Orders</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Fetching the latest assessment data and preparing your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="bg-red-50 rounded-full p-6 w-24 h-24 mx-auto border-4 border-red-100 shadow-lg">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-[#232249]">Connection Error</h3>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            <div className="pt-4">
              <button
                onClick={() => loadData()}
                className="bg-gradient-to-r from-[#232249] to-[#1a1a3a] text-white px-8 py-3 rounded-2xl hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-3 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-2 sm:p-4 md:p-6 lg:p-8" style={{
      paddingTop: 'max(env(safe-area-inset-top), 8px)',
      paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      paddingLeft: 'max(env(safe-area-inset-left), 8px)',
      paddingRight: 'max(env(safe-area-inset-right), 8px)'
    }}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        
        {/* Debug Info Banner - Remove after fixing */}
        {filteredOrders.length === 0 && !error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Diagnostic Information</h3>
                <div className="mt-2 text-sm text-yellow-700 space-y-1">
                  <p>• API URL: {import.meta.env.VITE_WORKORDER_API_URL || 'Not configured'}</p>
                  <p>• User Role: {user?.role || 'Not loaded'}</p>
                  <p>• Token Present: {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
                  <p>• Work Orders Count: {workOrders.length}</p>
                  <p>• Filtered Orders Count: {filteredOrders.length}</p>
                  <p className="font-semibold mt-2">
                    {workOrders.length === 0 
                      ? 'No work orders found in database. Please create some work orders first.' 
                      : 'Work orders loaded but filtered out. Check your filter settings.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    console.log('=== FULL DIAGNOSTIC INFO ===');
                    console.log('User:', user);
                    console.log('Work Orders:', workOrders);
                    console.log('Filtered Orders:', filteredOrders);
                    console.log('Stats:', stats);
                    console.log('API Base URL:', import.meta.env.VITE_WORKORDER_API_URL);
                  }}
                  className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  Log Full Debug Info to Console
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Enhanced Mobile-First Responsive Header with Smooth Animations */}
        <motion.div 
          ref={headerRef}
          initial={{ opacity: 0, y: -50 }}
          animate={headerControls}
          className="relative overflow-hidden touch-manipulation"
        >
          <div className="bg-gradient-to-r from-[#232249] via-[#2d2d5f] to-[#232249] rounded-2xl sm:rounded-3xl mobile-shadow-2xl border border-gray-200/20 relative overflow-hidden">
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear'
              }}
              style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                backgroundSize: '100px 100px'
              }}
            />
            
            <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
              <div className="flex flex-col gap-6 sm:gap-4">
                {/* Top Row - Title and Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20 shrink-0 relative overflow-hidden"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10" />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                    <div className="min-w-0">
                      <motion.h1 
                        className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                      >
                        Work Orders
                      </motion.h1>
                      <motion.p 
                        className="text-white/70 text-sm sm:text-base mt-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                      >
                        Assessment Dashboard
                      </motion.p>
                    </div>
                  </div>
                  
                  {/* Mobile Menu Indicator */}
                  <motion.div 
                    className="sm:hidden bg-white/10 rounded-xl px-3 py-2 border border-white/20"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </motion.div>
                </div>

                {/* Bottom Row - Time Info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-x-auto swipeable-x">
                    <motion.div 
                      className="bg-white/10 rounded-xl px-4 py-3 border border-white/20 flex-shrink-0 min-w-0 backdrop-blur-sm"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-white/60 text-xs font-medium mb-1">Current Time</div>
                      <motion.div 
                        className="text-white text-lg sm:text-xl font-bold font-mono"
                        animate={{ 
                          textShadow: ['0 0 5px rgba(255,255,255,0.3)', '0 0 10px rgba(255,255,255,0.6)', '0 0 5px rgba(255,255,255,0.3)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {formatTime(currentTime)}
                      </motion.div>
                    </motion.div>
                    <motion.div 
                      className="bg-white/10 rounded-xl px-4 py-3 border border-white/20 flex-shrink-0 min-w-0 backdrop-blur-sm"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-white/60 text-xs font-medium mb-1">Date</div>
                      <div className="text-white text-sm sm:text-base font-semibold">
                        {currentTime.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Status Indicator */}
                  <motion.div 
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm"
                    whileHover={{ scale: 1.05 }}
                    animate={{ 
                      boxShadow: ['0 0 10px rgba(34,34,73,0.3)', '0 0 20px rgba(34,34,73,0.6)', '0 0 10px rgba(34,34,73,0.3)']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-sm font-medium">Live</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Mobile-Responsive Statistics Grid with 3 Key Metrics */}
        <motion.div 
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto"
          animate={statsControls}
          initial={{ opacity: 0, y: 50 }}
        >
          {[
            { 
              title: "Total Work Orders", 
              value: stats.total, 
              icon: FileText, 
              color: "text-blue-700", 
              bgColor: "bg-blue-50", 
              borderColor: "border-blue-200" 
            },
            { 
              title: "Confined Spaces", 
              value: stats.confinedSpaces, 
              icon: AlertTriangle, 
              color: "text-red-700", 
              bgColor: "bg-red-50", 
              borderColor: "border-red-200" 
            },
            { 
              title: "Safety Issues", 
              value: stats.safetyIssues, 
              icon: Shield, 
              color: "text-orange-700", 
              bgColor: "bg-orange-50", 
              borderColor: "border-orange-200" 
            }
          ].map((stat, index) => (
            <StatCard key={stat.title} {...stat} index={index} />
          ))}
        </motion.div>

        {/* Enhanced Mobile-First Filters Interface with Smooth Animations */}
        <motion.div 
          ref={filtersRef}
          initial={{ opacity: 0, y: 50 }}
          animate={filtersInView ? {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.6,
              ease: "easeOut"
            }
          } : {}}
          className="bg-white rounded-2xl sm:rounded-3xl mobile-shadow-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 touch-manipulation relative overflow-hidden"
        >
          {/* Background gradient animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#232249]/5 via-transparent to-blue-500/5 opacity-0"
            animate={{
              opacity: [0, 0.3, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Section Header */}
          <motion.div 
            className="flex items-center gap-3 mb-6 sm:mb-8 relative z-10"
            initial={{ opacity: 0, x: -30 }}
            animate={filtersInView ? {
              opacity: 1,
              x: 0,
              transition: {
                delay: 0.2,
                duration: 0.5
              }
            } : {}}
          >
            <motion.div 
              className="bg-gradient-to-br from-[#232249] to-[#1a1a3a] rounded-xl p-3 mobile-shadow-lg relative overflow-hidden"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Search className="w-5 h-5 text-white relative z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.h3 
                className="text-xl sm:text-2xl font-bold text-[#232249] truncate"
                initial={{ opacity: 0, y: -10 }}
                animate={filtersInView ? {
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.4,
                    duration: 0.5
                  }
                } : {}}
              >
                Search & Filter
              </motion.h3>
              <motion.p 
                className="text-gray-500 text-sm sm:text-base mt-1"
                initial={{ opacity: 0, y: -10 }}
                animate={filtersInView ? {
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.6,
                    duration: 0.5
                  }
                } : {}}
              >
                Find and filter work orders
              </motion.p>
            </div>
          </motion.div>
          
          {/* Enhanced Search and Filter Grid with Smooth Animations */}
          <div className="space-y-6 relative z-10">
            {/* Search Bar - Full Width with Enhanced Animations */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={filtersInView ? {
                opacity: 1,
                x: 0,
                transition: {
                  delay: 0.8,
                  duration: 0.6
                }
              } : {}}
            >
              <motion.label 
                className="block text-sm font-bold text-[#232249] mb-3 uppercase tracking-wide"
                animate={{
                  color: isSearchFocused ? '#1a1a3a' : '#232249'
                }}
                transition={{ duration: 0.3 }}
              >
                Search Work Orders
              </motion.label>
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  animate={{
                    scale: isSearchFocused ? 1.2 : 1,
                    color: isSearchFocused ? '#232249' : '#9ca3af'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Search className="h-5 w-5" />
                </motion.div>
                
                <motion.input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search by space name, building, location..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-gray-50 hover:bg-white text-sm sm:text-base shadow-inner"
                  style={{ 
                    minHeight: '44px', // iOS minimum touch target
                    fontSize: '16px' // Prevent zoom on iOS
                  }}
                  whileFocus={{ 
                    scale: 1.01,
                    boxShadow: '0 0 0 4px rgba(35, 34, 73, 0.1)'
                  }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Search input glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#232249]/10 to-blue-500/10 opacity-0 pointer-events-none"
                  animate={{
                    opacity: isSearchFocused ? 1 : 0,
                    scale: isSearchFocused ? 1.05 : 1
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>

            {/* Action Buttons Section */}
            <div className="flex flex-col gap-4 mt-8 pt-6 border-t-2 border-gray-100">
              {/* Results Counter */}
              <div className="flex items-center justify-center sm:justify-start gap-3 p-4 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 rounded-2xl border border-[#232249]/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#232249] rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-700">Showing Results:</span>
                  <span className="font-bold text-[#232249] text-lg">{filteredOrders.length}</span>
                  <span className="text-gray-500">of {workOrders.length}</span>
                </div>
              </div>

              {/* Enhanced Action Buttons Grid with Better Mobile Layout */}
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={filtersInView ? {
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 1.2,
                    duration: 0.6,
                    staggerChildren: 0.1
                  }
                } : {}}
              >
                {[
                  {
                    label: "Import Excel",
                    shortLabel: "Import",
                    icon: Upload,
                    onClick: () => setShowCSVImportModal(true),
                    colors: "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
                    gradient: "from-blue-500/10 to-blue-600/20"
                  },
                  {
                    label: "Export Excel",
                    shortLabel: "Export",
                    icon: FileSpreadsheet,
                    onClick: handleExportToExcel,
                    colors: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300",
                    gradient: "from-emerald-500/10 to-emerald-600/20"
                  },
                  {
                    label: "PDF Report",
                    shortLabel: "PDF",
                    icon: FileText,
                    onClick: () => console.log('PDF Report'),
                    colors: "text-green-700 bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300",
                    gradient: "from-green-500/10 to-green-600/20"
                  },
                  {
                    label: "Refresh Data",
                    shortLabel: "Refresh",
                    icon: RefreshCw,
                    onClick: () => {
                      setIsRefreshing(true);
                      handleRefresh();
                      setTimeout(() => setIsRefreshing(false), 1000);
                    },
                    colors: "bg-gradient-to-r from-[#232249] to-[#1a1a3a] text-white",
                    gradient: "from-[#232249]/20 to-purple-500/20",
                    isSpecial: true
                  }
                ].map((button, index) => (
                  <motion.button
                    key={button.label}
                    onClick={button.onClick}
                    className={`flex flex-col items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl lg:rounded-2xl transition-all duration-300 border-2 shadow-md hover:shadow-lg group relative overflow-hidden ${
                      button.isSpecial ? button.colors : button.colors
                    }`}
                    style={{ minHeight: '60px' }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -1,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={filtersInView ? {
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: 1.4 + (index * 0.1),
                        duration: 0.5
                      }
                    } : {}}
                  >
                    {/* Background gradient animation */}
                    <motion.div
                      className={`absolute inset-0 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br ${button.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      initial={{ scale: 0, rotate: 0 }}
                      whileHover={{ 
                        scale: 1, 
                        rotate: 180,
                        transition: { duration: 0.6, ease: "easeOut" }
                      }}
                    />
                    
                    <motion.div
                      className="relative z-10 flex flex-col items-center justify-center gap-1 sm:gap-2"
                    >
                      <motion.div
                        whileHover={{ 
                          scale: 1.1, 
                          rotate: button.label === "Refresh Data" ? 180 : 5 
                        }}
                        animate={isRefreshing && button.label === "Refresh Data" ? {
                          rotate: 360,
                          transition: {
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                          }
                        } : {}}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <button.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.div>
                      <span className="text-center text-xs sm:text-sm font-medium leading-tight relative z-10 break-words">
                        <span className="sm:hidden">{button.shortLabel}</span>
                        <span className="hidden sm:inline">{button.label}</span>
                      </span>
                    </motion.div>
                    
                    {/* Ripple effect on tap */}
                    <motion.div
                      className="absolute inset-0 rounded-lg sm:rounded-xl lg:rounded-2xl bg-white/20 opacity-0 pointer-events-none"
                      whileTap={{
                        opacity: [0, 0.5, 0],
                        scale: [0.8, 1.2, 1],
                        transition: { duration: 0.4 }
                      }}
                    />
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Work Orders Table with Animation */}
        <motion.div
          ref={tableRef}
          initial={{ opacity: 0, y: 50 }}
          animate={tableInView ? {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              ease: "easeOut"
            }
          } : {}}
        >
          <AdminWorkOrdersTable
            workOrders={filteredOrders}
            onView={handleView}
            onDownloadPDF={handleDownloadPDF}
            onCreateOrder={() => console.log('Create Order')}
            onUpdateOrder={() => console.log('Update Order')}
            onDeleteOrder={() => console.log('Delete Order')}
            onDeleteAllOrders={() => console.log('Delete All Orders')}
          />
        </motion.div>

        {/* CSV Import Modal */}
        <CSVImportModal
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onImport={handleCSVImport}
          isLoading={csvImportLoading}
        />

        {/* Enhanced Mobile-Responsive Detail Modal with Smooth Animations */}
        <AnimatePresence>
          {showDetailModal && selectedOrder && (
            <motion.div 
              className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 safe-area-inset-top safe-area-inset-bottom overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeDetailModal();
                }
              }}
            >
              {/* Modal Container */}
              <motion.div 
                className="relative w-full max-w-7xl mx-auto"
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.4
                }}
              >
                {/* Modal Content */}
                <div className="relative bg-white rounded-none sm:rounded-3xl mobile-shadow-2xl border-0 sm:border border-gray-200/50 overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[95vh]">
                  {/* Enhanced Mobile-First Header */}
                  <motion.div 
                    className="bg-gradient-to-r from-[#232249] via-[#2d2d5f] to-[#232249] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 mobile-shadow-lg relative overflow-hidden z-10"
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      {/* Left Side - Icon and Title */}
                      <motion.div 
                        className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                      >
                        <motion.div 
                          className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/20 shrink-0 relative overflow-hidden"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white relative z-10" />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <motion.h2 
                            className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white truncate"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                          >
                            Work Order Details
                          </motion.h2>
                          <motion.div 
                            className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                          >
                            <span className="text-white/90 text-sm sm:text-base lg:text-lg font-semibold truncate">
                              {selectedOrder.workOrderId}
                            </span>
                            <motion.div 
                              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-white/20 rounded-full border border-white/30 shrink-0 backdrop-blur-sm"
                              animate={{ 
                                scale: [1, 1.05, 1],
                                boxShadow: ['0 0 10px rgba(74, 222, 128, 0.3)', '0 0 20px rgba(74, 222, 128, 0.6)', '0 0 10px rgba(74, 222, 128, 0.3)']
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-white/80 text-xs sm:text-sm font-medium">Active</span>
                            </motion.div>
                          </motion.div>
                        </div>
                      </motion.div>
                      
                      {/* Enhanced Close Button */}
                      <motion.button
                        onClick={closeDetailModal}
                        className="bg-white/10 hover:bg-white/20 rounded-xl p-2 sm:p-3 transition-all duration-300 border border-white/20 hover:border-white/40 touch-manipulation shrink-0 relative overflow-hidden group"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                      >
                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white/70 group-hover:text-white transition-colors relative z-10" />
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Enhanced Content Area - Mobile Scrollable with Smooth Animations */}
                  <motion.div 
                    className="p-4 sm:p-6 lg:p-10 overflow-y-auto swipeable-y"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                      <div className="text-center py-20">
                        <h3 className="text-xl font-bold text-gray-600 mb-4">Work Order Content</h3>
                        <p className="text-gray-500">Work Order ID: {selectedOrder.workOrderId}</p>
                        <p className="text-gray-500 mt-2">Space: {selectedOrder.spaceName}</p>
                        <p className="text-gray-500 mt-2">Building: {selectedOrder.building}</p>
                        <p className="text-gray-500 mt-2">Technician: {selectedOrder.technician}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminWorkOrders;