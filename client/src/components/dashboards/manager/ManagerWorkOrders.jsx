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
import ManagerWorkOrdersTable from './ManagerWorkOrdersTable';
import workOrderAPI from '../../../services/workOrderAPI';
import errorHandler from '../../../utils/errorHandler';
import { Toaster } from 'react-hot-toast';
import CSVImportModal from '../../ui/CSVImportModal';
import * as XLSX from 'xlsx';
import { exportWorkOrdersToExcel } from '../../../utils/excelExport';
import PDFDownloadButton from '../../ui/PDFDownloadButton';
import { getImageUrl } from '../../../utils/imageUtils';

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

// Clean Statistics Card Component
const StatCard = ({ title, value, icon: Icon, color, bgColor, borderColor, onClick }) => (
  <div 
    className={`group cursor-pointer transition-all duration-200 hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className={`bg-white rounded-xl shadow-sm border-2 ${borderColor} hover:shadow-md transition-all duration-200 p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
    </div>
  </div>
);

const ManagerWorkOrders = () => {
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

      console.log('Fetching manager work orders...');
      
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
          
          // Extract unique technicians and buildings
          const uniqueTechnicians = [...new Set(orders.map(order => order.technician).filter(Boolean))];
          const uniqueBuildings = [...new Set(orders.map(order => order.building).filter(Boolean))];
          
          setTechnicians(uniqueTechnicians);
          setBuildings(uniqueBuildings);
          
          // Calculate statistics
          const newStats = {
            total: orders.length,
            confinedSpaces: orders.filter(order => 
              order.isConfinedSpace || order.confinedSpace
            ).length,
            highPriority: orders.filter(order => 
              order.priority === 'high' || order.priority === 'critical'
            ).length,
            pendingApproval: orders.filter(order => 
              order.status === 'pending' || order.status === 'submitted'
            ).length
          };
          
          setStats(newStats);
        } else {
          console.error('Invalid orders data:', orders);
          setWorkOrders([]);
          setFilteredOrders([]);
        }
      } else {
        throw new Error(response?.message || 'Failed to fetch work orders');
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      setError(error.message);
      errorHandler.handleError(error, 'Failed to fetch work orders');
      setWorkOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, [sortConfig]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...workOrders];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        (order.workOrderId?.toLowerCase().includes(searchLower)) ||
        (order.uniqueId?.toLowerCase().includes(searchLower)) ||
        (order.spaceName?.toLowerCase().includes(searchLower)) ||
        (order.confinedSpaceDescription?.toLowerCase().includes(searchLower)) ||
        (order.building?.toLowerCase().includes(searchLower)) ||
        (order.locationDescription?.toLowerCase().includes(searchLower)) ||
        (order.technician?.toLowerCase().includes(searchLower)) ||
        (order.notes?.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }

    // Technician filter
    if (technicianFilter) {
      filtered = filtered.filter(order => order.technician === technicianFilter);
    }

    // Building filter
    if (buildingFilter) {
      filtered = filtered.filter(order => order.building === buildingFilter);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, priorityFilter, technicianFilter, buildingFilter, workOrders]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
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

  const handleDeleteAllOrders = async (confirmPhrase) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Deleting all orders with confirmation:', confirmPhrase);
      
      const response = await workOrderAPI.deleteAllWorkOrders(token, confirmPhrase);
      
      if (response.success) {
        await fetchWorkOrders();
        errorHandler.handleSuccess(
          `Successfully deleted ${response.data?.deletedCount || 0} work orders`
        );
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete all work orders');
      }
    } catch (error) {
      console.error('Error deleting all work orders:', error);
      errorHandler.handleError(error, 'Failed to delete all work orders');
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchWorkOrders();
  };

  const handleExportToExcel = async () => {
    setExportingExcel(true);
    try {
      const dataToExport = filteredOrders.length > 0 ? filteredOrders : workOrders;
      
      if (dataToExport.length === 0) {
        alert('No data available to export');
        return;
      }

      const result = exportWorkOrdersToExcel(dataToExport, 'manager_confined_space_assessments');
      
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#232249]"></div>
            <p className="text-sm text-gray-600">Loading work orders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-8 max-w-md">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h2>
              <p className="text-sm text-gray-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Toaster position="top-right" />
      
      <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-8 space-y-6">
        {/* Header Section - Clean & Professional */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#232249] rounded-2xl shadow-lg p-6 md:p-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
            {/* Title & Breadcrumb */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span>Manager</span>
                  <span>/</span>
                  <span className="text-white font-medium">Work Orders</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Work Orders Management
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-white/30 rounded-full"></div>
                <div className="flex items-center gap-2 font-mono">
                  <Clock className="h-4 w-4" />
                  <span>{currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/40 transition-all duration-200 text-white font-medium text-sm flex-1 sm:flex-initial"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Work Orders"
              value={stats.total}
              icon={Package}
              color="text-blue-600"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
              }}
            />
            <StatCard
              title="Confined Spaces"
              value={stats.confinedSpaces}
              icon={AlertTriangle}
              color="text-red-600"
              bgColor="bg-red-50"
              borderColor="border-red-200"
            />
            <StatCard
              title="High Priority"
              value={stats.highPriority}
              icon={Clock}
              color="text-orange-600"
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              onClick={() => setPriorityFilter('high')}
            />
            <StatCard
              title="Pending Approval"
              value={stats.pendingApproval}
              icon={FileText}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
              borderColor="border-yellow-200"
              onClick={() => setStatusFilter('pending')}
            />
          </div>

        {/* Search and Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search work orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#232249] focus:ring-2 focus:ring-[#232249]/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#232249] focus:ring-2 focus:ring-[#232249]/20 transition-all outline-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#232249] focus:ring-2 focus:ring-[#232249]/20 transition-all outline-none cursor-pointer"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Technician Filter */}
            <div>
              <select
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#232249] focus:ring-2 focus:ring-[#232249]/20 transition-all outline-none cursor-pointer"
              >
                <option value="">All Technicians</option>
                {technicians.map((tech, idx) => (
                  <option key={idx} value={tech}>{tech}</option>
                ))}
              </select>
            </div>

            {/* Building Filter */}
            <div>
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#232249] focus:ring-2 focus:ring-[#232249]/20 transition-all outline-none cursor-pointer"
              >
                <option value="">All Buildings</option>
                {buildings.map((building, idx) => (
                  <option key={idx} value={building}>{building}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters & Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Results:</span>
              <span className="font-semibold text-[#232249]">{filteredOrders.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={() => setShowCSVImportModal(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-3 min-h-[48px] text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <Upload className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </button>
              <button
                onClick={handleExportToExcel}
                className="flex items-center gap-2 px-3 md:px-4 py-3 min-h-[48px] text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
              >
                <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Export</span>
              </button>
              <PDFDownloadButton
                workOrders={filteredOrders}
                type="multi"
                size="default"
                label="Download PDF"
                groupBy="building"
                className="border border-blue-200 min-h-[48px] py-3"
              />
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 md:px-4 py-3 min-h-[48px] bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Work Orders Table */}
        <ManagerWorkOrdersTable
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
            <div className="relative max-w-7xl w-full max-h-[95vh] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white rounded-[3rem] transform rotate-1 scale-105 opacity-50"></div>
              <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl"></div>
              
              <div className="relative bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-gray-200/50 overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#232249] via-[#2d2d5f] to-[#232249] px-10 py-8">
                  <div className="absolute top-4 right-20 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute bottom-4 left-20 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                        <div className="relative bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white mb-2">
                          Work Order Details
                        </h2>
                        <div className="flex items-center gap-4">
                          <span className="text-white/90 text-lg font-semibold">
                            {selectedOrder.workOrderId}
                          </span>
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full border border-white/30">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white/80 text-sm font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={closeDetailModal}
                      className="relative group p-3 hover:bg-white/10 rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/40"
                    >
                      <XCircle className="h-7 w-7 text-white/70 group-hover:text-white transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-10 overflow-y-auto max-h-[calc(95vh-140px)]">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* Left Column */}
                    <div className="space-y-8">
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-[#232249] to-transparent rounded-full"></div>
                        <h3 className="text-2xl font-bold text-[#232249] flex items-center gap-4 mb-6">
                          <div className="p-3 bg-gradient-to-br from-[#232249] to-[#1a1a3a] rounded-2xl">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          Basic Information
                        </h3>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-8 space-y-6 border border-gray-200/50 shadow-lg">
                          <div className="grid grid-cols-2 gap-6">
                            {[
                              { label: 'Space Name', value: selectedOrder.spaceName },
                              { label: 'Building', value: selectedOrder.building },
                              { label: 'Technician', value: selectedOrder.technician },
                              { label: 'Survey Date', value: formatDate(selectedOrder.surveyDate) }
                            ].map((item, index) => (
                              <div key={index} className="group">
                                <span className="block text-sm font-bold text-[#232249] mb-3 uppercase tracking-wider">
                                  {item.label}
                                </span>
                                <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 group-hover:border-[#232249]/30 transition-all duration-300 shadow-sm">
                                  <p className="text-gray-700 font-medium">{item.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="group">
                              <span className="block text-sm font-bold text-[#232249] mb-3 uppercase tracking-wider">Priority</span>
                              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 ${getPriorityColor(selectedOrder.priority)}`}>
                                {selectedOrder.priority}
                              </span>
                            </div>
                            <div className="group">
                              <span className="block text-sm font-bold text-[#232249] mb-3 uppercase tracking-wider">Status</span>
                              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusColor(selectedOrder.status)}`}>
                                {selectedOrder.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="pt-4">
                            <span className="block text-sm font-bold text-[#232249] mb-3 uppercase tracking-wider">Location Description</span>
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                              <p className="text-gray-700 leading-relaxed">{selectedOrder.locationDescription}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-green-500 to-transparent rounded-full"></div>
                        <h3 className="text-2xl font-bold text-[#232249] flex items-center gap-4 mb-6">
                          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          Safety Assessment
                        </h3>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-8 space-y-6 border border-gray-200/50 shadow-lg">
                          <div className="space-y-4">
                            {[
                              { label: 'Confined Space', value: selectedOrder.isConfinedSpace },
                              { label: 'Permit Required', value: selectedOrder.permitRequired },
                              { label: 'PPE Required', value: selectedOrder.ppeRequired },
                              { label: 'Air Monitor', value: selectedOrder.dedicatedAirMonitor },
                              { label: 'Warning Sign', value: selectedOrder.warningSignPosted }
                            ].map((item, index) => (
                              <div key={index} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#232249]/30 transition-all duration-300 shadow-sm group">
                                <span className="font-bold text-[#232249] group-hover:text-[#1a1a3a] transition-colors">
                                  {item.label}:
                                </span>
                                <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${
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

                  {/* Notes and Images */}
                  <div className="mt-12 space-y-8">
                    {selectedOrder.notes && (
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-20 bg-gradient-to-b from-purple-500 to-transparent rounded-full"></div>
                        <h3 className="text-2xl font-bold text-[#232249] mb-6 flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          Additional Notes
                        </h3>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-3xl p-8 border border-purple-200/50 shadow-lg">
                          <p className="text-gray-700 leading-relaxed text-lg">{selectedOrder.notes}</p>
                        </div>
                      </div>
                    )}

                    {selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0 && (
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-20 bg-gradient-to-b from-blue-500 to-transparent rounded-full"></div>
                        <h3 className="text-2xl font-bold text-[#232249] mb-6 flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                          Assessment Images ({selectedOrder.imageUrls.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {selectedOrder.imageUrls.map((url, index) => (
                            <div key={index} className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                              <div className="relative bg-white rounded-2xl p-3 border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                <img
                                  src={getImageUrl(url)}
                                  alt={`Assessment ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-xl"
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

export default ManagerWorkOrders;
