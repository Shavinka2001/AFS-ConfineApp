import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Wrench,
  Activity,
  BarChart3,
  Upload,
  FileSpreadsheet,
  Trash2,
  MoreVertical,
  TrendingUp,
  Database
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import AdminWorkOrdersTable from './AdminWorkOrdersTable';
import workOrderAPI from '../../../services/workOrderAPI';
import errorHandler from '../../../utils/errorHandler';
import { getImageUrl } from '../../../utils/imageUtils';
import { Toaster } from 'react-hot-toast';
import CSVImportModal from '../../ui/CSVImportModal';
import * as XLSX from 'xlsx';
import { exportWorkOrdersToExcel } from '../../../utils/excelExport';
import PDFDownloadButton from '../../ui/PDFDownloadButton';

// Consolidated PDF Generator - Groups similar confined spaces into single reports
const consolidateEntriesLocal = (entries) => {
  const consolidated = [];
  const groupMap = new Map();

  entries.forEach((entry, index) => {
    const groupKey = `${entry.building || 'N/A'}|||${entry.locationDescription || 'N/A'}|||${entry.spaceName || entry.confinedSpaceDescription || 'N/A'}`;
    
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey).push({ ...entry, originalIndex: index });
  });

  groupMap.forEach((group) => {
    if (group.length === 1) {
      const singleEntry = { ...group[0] };
      delete singleEntry.originalIndex;
      consolidated.push(singleEntry);
    } else {
      const consolidatedEntry = consolidateGroupLocal(group);
      consolidated.push(consolidatedEntry);
    }
  });

  return consolidated;
};

const consolidateGroupLocal = (group) => {
  const baseEntry = { ...group[0] };
  
  const uniqueIds = group.map(entry => entry.workOrderId || entry.uniqueId || entry._id?.slice(-4).padStart(4, '0') || 'N/A').filter(Boolean);
  const spaceNames = group.map(entry => entry.spaceName || entry.confinedSpaceNameOrId || entry.confinedSpaceDescription).filter(Boolean);
  
  const consolidateArrayField = (fieldName) => {
    const allValues = group.flatMap(entry => entry[fieldName] || []);
    return [...new Set(allValues)];
  };

  const consolidateTextField = (fieldName) => {
    const allValues = group.map(entry => entry[fieldName])
      .filter(val => {
        if (val === null || val === undefined) return false;
        const stringVal = String(val);
        return stringVal && stringVal !== 'N/A' && stringVal.trim() !== '';
      })
      .map(val => String(val));
    
    const uniqueValues = [...new Set(allValues)];
    return uniqueValues.length > 0 ? uniqueValues.join('. ') : 'N/A';
  };

  const consolidateBooleanField = (fieldName) => {
    return group.some(entry => entry[fieldName] === true);
  };

  const consolidateDateField = (fieldName) => {
    const dates = group.map(entry => entry[fieldName]).filter(Boolean);
    if (dates.length === 0) return null;
    return dates.sort((a, b) => new Date(b) - new Date(a))[0];
  };

  const consolidated = {
    ...baseEntry,
    
    workOrderId: uniqueIds.join(', '),
    uniqueId: uniqueIds.join(', '),
    spaceName: spaceNames.join(', '),
    confinedSpaceNameOrId: spaceNames.join(', '),
    
    surveyDate: consolidateDateField('surveyDate'),
    dateOfSurvey: consolidateDateField('dateOfSurvey') || consolidateDateField('surveyDate'),
    createdAt: consolidateDateField('createdAt'),
    
    technician: consolidateTextField('technician'),
    surveyors: consolidateArrayField('surveyors'),
    
    notes: consolidateTextField('notes'),
    entryRequirements: consolidateTextField('entryRequirements'),
    atmosphericHazardDescription: consolidateTextField('atmosphericHazardDescription'),
    engulfmentHazardDescription: consolidateTextField('engulfmentHazardDescription'),
    configurationHazardDescription: consolidateTextField('configurationHazardDescription'),
    otherHazardsDescription: consolidateTextField('otherHazardsDescription'),
    ppeList: consolidateTextField('ppeList'),
    
    isConfinedSpace: consolidateBooleanField('isConfinedSpace') || consolidateBooleanField('confinedSpace'),
    confinedSpace: consolidateBooleanField('confinedSpace') || consolidateBooleanField('isConfinedSpace'),
    permitRequired: consolidateBooleanField('permitRequired'),
    atmosphericHazard: consolidateBooleanField('atmosphericHazard'),
    engulfmentHazard: consolidateBooleanField('engulfmentHazard'),
    configurationHazard: consolidateBooleanField('configurationHazard'),
    otherRecognizedHazards: consolidateBooleanField('otherRecognizedHazards'),
    ppeRequired: consolidateBooleanField('ppeRequired'),
    forcedAirVentilationSufficient: consolidateBooleanField('forcedAirVentilationSufficient'),
    dedicatedAirMonitor: consolidateBooleanField('dedicatedAirMonitor') || consolidateBooleanField('dedicatedContinuousAirMonitor'),
    dedicatedContinuousAirMonitor: consolidateBooleanField('dedicatedContinuousAirMonitor') || consolidateBooleanField('dedicatedAirMonitor'),
    warningSignPosted: consolidateBooleanField('warningSignPosted'),
    otherPeopleWorkingNearSpace: consolidateBooleanField('otherPeopleWorkingNearSpace'),
    canOthersSeeIntoSpace: consolidateBooleanField('canOthersSeeIntoSpace'),
    contractorsEnterSpace: consolidateBooleanField('contractorsEnterSpace'),
    
    numberOfEntryPoints: consolidateTextField('numberOfEntryPoints'),
    
    imageUrls: consolidateArrayField('imageUrls'),
    images: consolidateArrayField('images'),
    pictures: consolidateArrayField('pictures'),
    
    _consolidated: true,
    _originalEntryCount: group.length,
    _originalIndexes: group.map(entry => entry.originalIndex),
    _consolidatedSpaceIds: spaceNames
  };

  return consolidated;
};

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getPriorityColor = (priority) => {
  const colors = {
    'low': 'text-green-700 bg-green-100 border-green-200',
    'medium': 'text-yellow-700 bg-yellow-100 border-yellow-200',
    'high': 'text-orange-700 bg-orange-100 border-orange-200',
    'critical': 'text-red-700 bg-red-100 border-red-200'
  };
  return colors[priority?.toLowerCase()] || 'text-gray-600 bg-gray-100 border-gray-200';
};

const getStatusColor = (status) => {
  const colors = {
    'draft': 'text-gray-700 bg-gray-100 border-gray-200',
    'pending': 'text-yellow-700 bg-yellow-100 border-yellow-200',
    'approved': 'text-blue-700 bg-blue-100 border-blue-200',
    'in-progress': 'text-purple-700 bg-purple-100 border-purple-200',
    'completed': 'text-green-700 bg-green-100 border-green-200',
    'cancelled': 'text-red-700 bg-red-100 border-red-200',
    'on-hold': 'text-orange-700 bg-orange-100 border-orange-200'
  };
  return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-100 border-gray-200';
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Clean Statistics Card Component
const StatCard = ({ title, value, icon: Icon, color, bgColor, borderColor, onClick }) => (
  <div 
    className={`group cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className={`bg-white rounded-xl shadow-sm border-2 ${borderColor} hover:shadow-md transition-all duration-200 p-4 md:p-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 md:p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 md:h-6 md:w-6 ${color}`} />
        </div>
        <div className="text-right">
          <div className="text-xl md:text-2xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
    </div>
  </div>
);

const AdminWorkOrders = () => {
  const { user } = useAuth();
  
  // State for data management
  const [workOrders, setWorkOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
  const [exportingExcel, setExportingExcel] = useState(false);

  // State for statistics
  const [stats, setStats] = useState({
    total: 0,
    confinedSpaces: 0,
    highPriority: 0,
    pendingApproval: 0
  });

  // Get unique values for filters
  const [technicians, setTechnicians] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch work orders
  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        errorHandler.handleError(null, 'Authentication required');
        return;
      }

      console.log('Fetching admin work orders...');
      
      const response = await workOrderAPI.getWorkOrders(token, {
        page: 1,
        limit: 1000,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });

      console.log('API Response:', response);
      
      if (response && response.success) {
        const orders = response.data?.orders || [];
        console.log('Work orders retrieved:', orders.length);
        
        if (orders && Array.isArray(orders)) {
          setWorkOrders(orders);
          setFilteredOrders(orders);
        } else {
          console.error('Invalid orders data:', orders);
          setWorkOrders([]);
          setFilteredOrders([]);
        }
        
        // Extract unique values for filters
        const uniqueTechnicians = [...new Set(orders.map(order => order.technician).filter(Boolean))];
        const uniqueBuildings = [...new Set(orders.map(order => order.building).filter(Boolean))];
        
        setTechnicians(uniqueTechnicians);
        setBuildings(uniqueBuildings);
        
        // Calculate basic stats from current data
        const basicStats = {
          total: orders.length,
          confinedSpaces: orders.filter(o => o.isConfinedSpace === true).length,
          highPriority: orders.filter(o => o.priority === 'high' || o.priority === 'critical').length,
          pendingApproval: orders.filter(o => o.status === 'pending').length,
        };
        setStats(basicStats);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  }, [sortConfig]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  // Handle search with debouncing
  const handleSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
    }, 500),
    []
  );

  // Filter and search functionality
  useEffect(() => {
    if (!workOrders || workOrders.length === 0) {
      setFilteredOrders([]);
      return;
    }
    
    let filtered = workOrders.filter(order => {
      const matchesSearch = !searchTerm || 
        (order?.spaceName?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.building?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.locationDescription?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.technician?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.workOrderId?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.uniqueId?.toLowerCase()?.includes(searchTerm.toLowerCase()));
      
      const matchesStatus = !statusFilter || order?.status === statusFilter;
      const matchesPriority = !priorityFilter || order?.priority === priorityFilter;
      const matchesTechnician = !technicianFilter || order?.technician === technicianFilter;
      const matchesBuilding = !buildingFilter || order?.building === buildingFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTechnician && matchesBuilding;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt' || sortConfig.key === 'surveyDate') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredOrders(filtered);
    
    // Calculate statistics for filtered data
    const filteredStats = {
      total: filtered.length,
      confinedSpaces: filtered.filter(o => o.isConfinedSpace === true).length,
      highPriority: filtered.filter(o => o.priority === 'high' || o.priority === 'critical').length,
      pendingApproval: filtered.filter(o => o.status === 'pending').length,
    };
    setStats(filteredStats);
  }, [workOrders, searchTerm, statusFilter, priorityFilter, technicianFilter, buildingFilter, sortConfig]);

  // Event handlers
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleUpdateOrder = async (orderId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Updating order:', orderId, updatedData);
      
      const response = await workOrderAPI.updateWorkOrder(token, orderId, updatedData);
      
      if (response.success) {
        // Refresh the work orders list
        await fetchWorkOrders();
        errorHandler.handleSuccess('Work order updated successfully');
        return true;
      } else {
        throw new Error(response.message || 'Failed to update work order');
      }
    } catch (error) {
      console.error('Error updating work order:', error);
      errorHandler.handleError(error, 'Failed to update work order');
      return false;
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const confirmed = window.confirm('Are you sure you want to delete this work order? This action cannot be undone.');
      if (!confirmed) return false;

      console.log('Deleting order:', orderId);
      
      const response = await workOrderAPI.deleteWorkOrder(token, orderId);
      
      if (response.success) {
        // Refresh the work orders list
        await fetchWorkOrders();
        errorHandler.handleSuccess('Work order deleted successfully');
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete work order');
      }
    } catch (error) {
      console.error('Error deleting work order:', error);
      errorHandler.handleError(error, 'Failed to delete work order');
      return false;
    }
  };

  const handleDeleteAllOrders = async () => {
    try {
      const confirmationPhrase = 'DELETE ALL WORK ORDERS';
      const userInput = window.prompt(
        `⚠️ WARNING: This will permanently delete ALL work orders!\n\nTo confirm, please type: ${confirmationPhrase}`
      );

      if (!userInput || userInput.trim().toUpperCase() !== confirmationPhrase) {
        errorHandler.handleWarning('Delete all operation cancelled');
        return false;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Deleting all work orders');
      
      // Send the uppercase version to match backend validation
      const response = await workOrderAPI.deleteAllWorkOrders(token, userInput.trim().toUpperCase());
      
      if (response.success) {
        // Refresh the work orders list
        await fetchWorkOrders();
        errorHandler.handleSuccess(`Successfully deleted ${response.data?.deletedCount || 'all'} work orders`);
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete work orders');
      }
    } catch (error) {
      console.error('Error deleting all work orders:', error);
      errorHandler.handleError(error, 'Failed to delete all work orders');
      return false;
    }
  };

  const handleRefresh = () => {
    fetchWorkOrders();
  };

  // Handle Excel export
  const handleExportToExcel = async () => {
    setExportingExcel(true);
    try {
      const dataToExport = filteredOrders.length > 0 ? filteredOrders : workOrders;
      
      if (dataToExport.length === 0) {
        alert('No data available to export');
        return;
      }

      const result = exportWorkOrdersToExcel(dataToExport, 'admin_confined_space_assessments');
      
      if (result.success) {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`Failed to export to Excel: ${error.message}`);
    } finally {
      setExportingExcel(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const handleCSVImport = async (csvData) => {
    try {
      setCsvImportLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Starting CSV import...');
      console.log('CSV data to import:', csvData);
      
      const response = await workOrderAPI.importCSVData(token, csvData);
      
      console.log('Import response:', response);
      
      if (response.success) {
        await fetchWorkOrders();
        setShowCSVImportModal(false);
        
        errorHandler.handleSuccess(
          `Successfully imported ${response.data?.results?.successful || 0} work orders`
        );
        
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
      errorHandler.handleError(error, 'Failed to import CSV');
      throw error;
    } finally {
      setCsvImportLoading(false);
    }
  };

  // Removed duplicate - using the comprehensive export function defined earlier

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[#232249] mx-auto" style={{ animationDuration: '1s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#232249] animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[#232249] font-bold text-xl">Loading Work Orders</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Fetching the latest work order data from the system...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative mb-8"
          >
            <div className="bg-red-50 rounded-full p-6 w-24 h-24 mx-auto border-4 border-red-100 shadow-lg">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            </div>
          </motion.div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-[#232249]">Unable to Load Data</h3>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => fetchWorkOrders()}
                className="bg-gradient-to-r from-[#232249] to-[#1a1a3a] text-white px-6 py-3 md:px-8 md:py-3 rounded-2xl hover:shadow-lg transition-all duration-300 font-semibold flex items-center justify-center gap-3 min-h-[44px] active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="bg-gray-100 text-gray-700 px-6 py-3 md:px-8 md:py-3 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-semibold min-h-[44px] active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
        <Toaster />
        
        {/* Compact Modern Header */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-[#232249] to-[#2d2d5f] rounded-2xl shadow-lg border border-gray-200/20">
            <div className="px-4 py-4 md:px-6 md:py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Left Side - Title */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-white/20">
                    <Database className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">
                      Work Orders Management
                    </h1>
                    <p className="text-white/70 text-sm">
                      Administrator dashboard for system-wide work orders
                    </p>
                  </div>
                </div>

                {/* Right Side - Live Time */}
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="bg-white/10 rounded-lg px-3 py-2 md:px-4 md:py-3 border border-white/20">
                    <div className="text-white/60 text-xs font-medium mb-1">Current Time</div>
                    <div className="text-white text-base md:text-lg font-bold font-mono">
                      {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 md:px-4 md:py-3 border border-white/20">
                    <div className="text-white/60 text-xs font-medium mb-1">Date</div>
                    <div className="text-white text-sm font-semibold">
                      {currentTime.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Essential Statistics Grid - 4 Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Work Orders"
            value={stats.total}
            icon={FileText}
            color="text-blue-700"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            onClick={() => setStatusFilter('')}
          />
          <StatCard
            title="Confined Spaces"
            value={stats.confinedSpaces}
            icon={AlertTriangle}
            color="text-red-700"
            bgColor="bg-red-50"
            borderColor="border-red-200"
            onClick={() => {}}
          />
          <StatCard
            title="High Priority"
            value={stats.highPriority}
            icon={Shield}
            color="text-orange-700"
            bgColor="bg-orange-50"
            borderColor="border-orange-200"
            onClick={() => setPriorityFilter('high')}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingApproval}
            icon={Clock}
            color="text-purple-700"
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
            onClick={() => setStatusFilter('pending')}
          />
        </div>

        {/* Modern Filters Interface */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="bg-[#232249] rounded-xl p-2">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-[#232249]">Search & Filter</h3>
              <p className="text-gray-500 text-sm">Find specific work orders</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-colors bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Filters */}
            {[
              { label: 'Status', value: statusFilter, setter: setStatusFilter, options: [
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]},
              { label: 'Priority', value: priorityFilter, setter: setPriorityFilter, options: [
                { value: '', label: 'All Priority' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' }
              ]},
              { label: 'Technician', value: technicianFilter, setter: setTechnicianFilter, options: [
                { value: '', label: 'All Tech' },
                ...technicians.map(tech => ({ value: tech, label: tech }))
              ]},
              { label: 'Building', value: buildingFilter, setter: setBuildingFilter, options: [
                { value: '', label: 'All Buildings' },
                ...buildings.map(building => ({ value: building, label: building }))
              ]}
            ].map((filter, index) => (
              <div key={filter.label}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.setter(e.target.value)}
                  className="w-full h-12 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-colors bg-gray-50 hover:bg-white"
                >
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Active Filters & Actions */}
          <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-100 md:flex-row md:items-center md:justify-between md:gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Results:</span>
              <span className="font-semibold text-[#232249]">{filteredOrders.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={() => setShowCSVImportModal(true)}
                className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
              <button
                onClick={handleExportToExcel}
                className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>
              <PDFDownloadButton
                workOrders={filteredOrders}
                type="multi"
                size="default"
                label="Download PDF"
                groupBy="building"
                className="border border-blue-200 active:scale-95"
              />
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-[#232249] text-white rounded-lg hover:bg-[#1a1a3a] transition-colors text-sm font-medium active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Work Orders Table */}
        <AdminWorkOrdersTable
          workOrders={filteredOrders}
          onView={handleView}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          onDeleteAllOrders={handleDeleteAllOrders}
          onSort={handleSort}
          sortConfig={sortConfig}
        />

        {/* CSV Import Modal */}
        <CSVImportModal
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onImport={handleCSVImport}
          isLoading={csvImportLoading}
        />

        {/* Premium Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            {/* Modal Container with Advanced Animations */}
            <div className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl md:rounded-[3rem] transform rotate-1 scale-105 opacity-50"></div>
              <div className="absolute inset-0 bg-white rounded-2xl md:rounded-[3rem] shadow-2xl"></div>
              
              {/* Modal Content */}
              <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-[3rem] shadow-2xl border border-gray-200/50 overflow-hidden">
                {/* Ultra-Modern Header */}
                <div className="relative bg-gradient-to-r from-[#232249] via-[#2d2d5f] to-[#232249] px-6 py-6 md:px-10 md:py-8">
                  {/* Floating Elements */}
                  <div className="absolute top-4 right-20 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute bottom-4 left-20 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
                  
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                        <div className="relative bg-white/15 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20">
                          <FileText className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl md:text-3xl font-black text-white mb-2">
                          Work Order Details
                        </h2>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                          <span className="text-white/90 text-base md:text-lg font-semibold">
                            {selectedOrder.workOrderId}
                          </span>
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full border border-white/30 w-fit">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white/80 text-sm font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={closeDetailModal}
                      className="relative group p-3 min-h-[44px] hover:bg-white/10 rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/40 active:scale-95 self-end md:self-auto"
                    >
                      <XCircle className="h-6 w-6 md:h-7 md:w-7 text-white/70 group-hover:text-white transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Content Area */}
                <div className="p-6 md:p-10 overflow-y-auto max-h-[calc(95vh-140px)] md:max-h-[calc(95vh-200px)]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                    {/* Left Column - Basic Information */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-[#232249] to-transparent rounded-full"></div>
                        <h3 className="text-lg md:text-2xl font-bold text-[#232249] flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                          <div className="p-2 md:p-3 bg-gradient-to-br from-[#232249] to-[#1a1a3a] rounded-2xl">
                            <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                          </div>
                          Basic Information
                        </h3>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-4 md:space-y-6 border border-gray-200/50 shadow-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {[
                              { label: 'Space Name', value: selectedOrder.spaceName },
                              { label: 'Building', value: selectedOrder.building },
                              { label: 'Technician', value: selectedOrder.technician },
                              { label: 'Survey Date', value: formatDate(selectedOrder.surveyDate) }
                            ].map((item, index) => (
                              <div key={index} className="group">
                                <span className="block text-sm font-bold text-[#232249] mb-2 md:mb-3 uppercase tracking-wider">
                                  {item.label}
                                </span>
                                <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 group-hover:border-[#232249]/30 transition-all duration-300 shadow-sm">
                                  <p className="text-gray-700 font-medium text-sm md:text-base">{item.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4">
                            <div className="group">
                              <span className="block text-sm font-bold text-[#232249] mb-2 md:mb-3 uppercase tracking-wider">Priority</span>
                              <span className={`inline-flex items-center px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm font-bold border-2 ${getPriorityColor(selectedOrder.priority)}`}>
                                {selectedOrder.priority}
                              </span>
                            </div>
                            <div className="group">
                              <span className="block text-sm font-bold text-[#232249] mb-2 md:mb-3 uppercase tracking-wider">Status</span>
                              <span className={`inline-flex items-center px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm font-bold border-2 ${getStatusColor(selectedOrder.status)}`}>
                                {selectedOrder.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="pt-2 md:pt-4">
                            <span className="block text-sm font-bold text-[#232249] mb-2 md:mb-3 uppercase tracking-wider">Location Description</span>
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                              <p className="text-gray-700 leading-relaxed text-sm md:text-base">{selectedOrder.locationDescription}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Safety Assessment */}
                    <div className="space-y-6 md:space-y-8">
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-green-500 to-transparent rounded-full"></div>
                        <h3 className="text-lg md:text-2xl font-bold text-[#232249] flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                          <div className="p-2 md:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                            <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
                          </div>
                          Safety Assessment
                        </h3>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-4 md:space-y-6 border border-gray-200/50 shadow-lg">
                          <div className="space-y-3 md:space-y-4">
                            {[
                              { label: 'Confined Space', value: selectedOrder.isConfinedSpace },
                              { label: 'Permit Required', value: selectedOrder.permitRequired },
                              { label: 'PPE Required', value: selectedOrder.ppeRequired },
                              { label: 'Air Monitor', value: selectedOrder.dedicatedAirMonitor },
                              { label: 'Warning Sign', value: selectedOrder.warningSignPosted }
                            ].map((item, index) => (
                              <div key={index} className="flex justify-between items-center p-3 md:p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#232249]/30 transition-all duration-300 shadow-sm group">
                                <span className="font-bold text-[#232249] group-hover:text-[#1a1a3a] transition-colors text-sm md:text-base">
                                  {item.label}:
                                </span>
                                <span className={`px-3 py-1 md:px-4 md:py-2 rounded-xl text-sm font-bold border-2 ${
                                  item.value 
                                    ? (item.label === 'Confined Space' || item.label === 'Permit Required') 
                                      ? 'bg-red-50 text-red-700 border-red-200' 
                                      : 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  {item.value ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes and Images Section */}
                  <div className="mt-8 md:mt-12 space-y-6 md:space-y-8">
                    {selectedOrder.notes && (
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-16 md:h-20 bg-gradient-to-b from-purple-500 to-transparent rounded-full"></div>
                        <h3 className="text-lg md:text-2xl font-bold text-[#232249] mb-4 md:mb-6 flex items-center gap-3 md:gap-4">
                          <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                            <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                          </div>
                          Additional Notes
                        </h3>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-purple-200/50 shadow-lg">
                          <p className="text-gray-700 leading-relaxed text-sm md:text-lg">{selectedOrder.notes}</p>
                        </div>
                      </div>
                    )}

                    {selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0 && (
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-16 md:h-20 bg-gradient-to-b from-blue-500 to-transparent rounded-full"></div>
                        <h3 className="text-lg md:text-2xl font-bold text-[#232249] mb-4 md:mb-6 flex items-center gap-3 md:gap-4">
                          <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                            <ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                          </div>
                          Assessment Images ({selectedOrder.imageUrls.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                          {selectedOrder.imageUrls.map((url, index) => (
                            <div key={index} className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                              <div className="relative bg-white rounded-2xl p-3 border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                <img
                                  src={getImageUrl(url)}
                                  alt={`Assessment ${index + 1}`}
                                  className="w-full h-24 md:h-32 object-cover rounded-xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminWorkOrders;
