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
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import ManagerWorkOrdersTable from './ManagerWorkOrdersTable';
import workOrderAPI from '../../../services/workOrderAPI';
import errorHandler from '../../../utils/errorHandler';
import { Toaster } from 'react-hot-toast';
import CSVImportModal from '../../ui/CSVImportModal';
import * as XLSX from 'xlsx';

// Consolidated PDF Generator - Groups similar confined spaces into single reports
const consolidateEntriesLocal = (entries) => {
  const consolidated = [];
  const groupMap = new Map();

  // Group entries by building, location description, and confined space description
  entries.forEach((entry, index) => {
    const groupKey = `${entry.building || 'N/A'}|||${entry.locationDescription || 'N/A'}|||${entry.spaceName || entry.confinedSpaceDescription || 'N/A'}`;
    
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey).push({ ...entry, originalIndex: index });
  });

  // Process each group
  groupMap.forEach((group) => {
    if (group.length === 1) {
      // Single entry - use as is but clean up the originalIndex property
      const singleEntry = { ...group[0] };
      delete singleEntry.originalIndex; // Remove the temporary property
      consolidated.push(singleEntry);
    } else {
      // Multiple entries - consolidate them
      const consolidatedEntry = consolidateGroupLocal(group);
      consolidated.push(consolidatedEntry);
    }
  });

  return consolidated;
};

const consolidateGroupLocal = (group) => {
  // Use the first entry as the base
  const baseEntry = { ...group[0] };
  
  // Combine unique IDs and form numbers
  const uniqueIds = group.map(entry => entry.workOrderId || entry.uniqueId || entry._id?.slice(-4).padStart(4, '0') || 'N/A').filter(Boolean);
  const spaceNames = group.map(entry => entry.spaceName || entry.confinedSpaceNameOrId || entry.confinedSpaceDescription).filter(Boolean);
  
  // Consolidate arrays and combine unique values
  const consolidateArrayField = (fieldName) => {
    const allValues = group.flatMap(entry => entry[fieldName] || []);
    return [...new Set(allValues)];
  };

  // Consolidate text fields by combining unique non-empty values
  const consolidateTextField = (fieldName) => {
    const allValues = group.map(entry => entry[fieldName])
      .filter(val => {
        // Check if value exists and is not null/undefined
        if (val === null || val === undefined) return false;
        // Convert to string and check if it's meaningful
        const stringVal = String(val);
        return stringVal && stringVal !== 'N/A' && stringVal.trim() !== '';
      })
      .map(val => String(val)); // Ensure all values are strings
    
    const uniqueValues = [...new Set(allValues)];
    return uniqueValues.length > 0 ? uniqueValues.join('. ') : 'N/A';
  };

  // Consolidate boolean fields - true if any entry is true
  const consolidateBooleanField = (fieldName) => {
    return group.some(entry => entry[fieldName] === true);
  };

  // Consolidate dates - use the most recent
  const consolidateDateField = (fieldName) => {
    const dates = group.map(entry => entry[fieldName]).filter(Boolean);
    if (dates.length === 0) return null;
    return dates.sort((a, b) => new Date(b) - new Date(a))[0]; // Most recent first
  };

  // Create consolidated entry
  const consolidated = {
    ...baseEntry,
    
    // Combine unique identifiers
    workOrderId: uniqueIds.join(', '),
    uniqueId: uniqueIds.join(', '),
    spaceName: spaceNames.join(', '),
    confinedSpaceNameOrId: spaceNames.join(', '),
    
    // Keep the common fields as they are (building, locationDescription, spaceName)
    // These are the same across all entries in the group
    
    // Use most recent survey date
    surveyDate: consolidateDateField('surveyDate'),
    dateOfSurvey: consolidateDateField('dateOfSurvey') || consolidateDateField('surveyDate'),
    createdAt: consolidateDateField('createdAt'),
    
    // Combine all surveyors/technicians
    technician: consolidateTextField('technician'),
    surveyors: consolidateArrayField('surveyors'),
    
    // Consolidate text fields
    notes: consolidateTextField('notes'),
    entryRequirements: consolidateTextField('entryRequirements'),
    atmosphericHazardDescription: consolidateTextField('atmosphericHazardDescription'),
    engulfmentHazardDescription: consolidateTextField('engulfmentHazardDescription'),
    configurationHazardDescription: consolidateTextField('configurationHazardDescription'),
    otherHazardsDescription: consolidateTextField('otherHazardsDescription'),
    ppeList: consolidateTextField('ppeList'),
    
    // Consolidate boolean fields (true if any entry is true)
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
    
    // Consolidate numeric fields - use maximum or combine unique values
    numberOfEntryPoints: consolidateTextField('numberOfEntryPoints'),
    
    // Combine all images/pictures
    imageUrls: consolidateArrayField('imageUrls'),
    images: consolidateArrayField('images'),
    pictures: consolidateArrayField('pictures'),
    
    // Add metadata about consolidation
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
  return colors[priority] || 'text-gray-600 bg-gray-100 border-gray-200';
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
  return colors[status] || 'text-gray-600 bg-gray-100 border-gray-200';
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
  


  // State for pagination and advanced filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // State for statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    highPriority: 0
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

  // Fetch work orders with pagination and filters
  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        errorHandler.handleError(null, 'Authentication required');
        return;
      }
      
      // Debug token info
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', {
            userId: payload.id || payload.userId,
            role: payload.role,
            exp: new Date(payload.exp * 1000).toLocaleString()
          });
          
          // Check if token is expired
          if (payload.exp * 1000 < Date.now()) {
            console.error('Token is expired!');
            errorHandler.handleError(null, 'Your session has expired. Please login again.');
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        search: searchTerm,
        status: statusFilter !== '' ? statusFilter : undefined,
        priority: priorityFilter !== '' ? priorityFilter : undefined,
        dateFrom: dateRange.from || undefined,
        dateTo: dateRange.to || undefined,
      };

      console.log('Fetching work orders with params:', params);
      
      // Use the specialized manager function instead of the generic one
      const response = await workOrderAPI.getManagerWorkOrders(token);
      
      // Log the response for debugging
      console.log('API Response:', response);
      
      // The API response structure has changed - the data is directly in the response for success case
      if (response && response.success) {
        // Extract the orders from the correct path in the response
        const orders = response.data?.orders || [];
        console.log('Work orders retrieved:', orders.length, orders);
        
        if (orders && Array.isArray(orders)) {
          setWorkOrders(orders);
          setFilteredOrders(orders);
          setTotalPages(response.data?.pagination?.totalPages || response.data?.totalPages || 1);
          setTotalOrders(response.data?.pagination?.totalItems || response.data?.totalOrders || 0);
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
          pending: orders.filter(o => o.status === 'pending').length,
          inProgress: orders.filter(o => o.status === 'in-progress').length,
          completed: orders.filter(o => o.status === 'completed').length,
          highPriority: orders.filter(o => o.priority === 'high' || o.priority === 'critical').length,
        };
        setStats(basicStats);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortConfig.key, sortConfig.direction, searchTerm, statusFilter, priorityFilter, dateRange]);

  // Fetch comprehensive stats
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await workOrderAPI.getUserStats(token);
      console.log('Stats response:', response);
      
      // Handle the correct response structure
      if (response && response.success && response.data) {
        setStats(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch work order stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle search with debouncing
  const handleSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, 500),
    []
  );

  // Filter and search functionality
  useEffect(() => {
    console.log("Running filter effect, workOrders:", workOrders.length);
    
    // Make sure we have work orders to filter
    if (!workOrders || workOrders.length === 0) {
      setFilteredOrders([]);
      return;
    }
    
    let filtered = workOrders.filter(order => {
      // Safely handle null/undefined values with optional chaining
      const matchesSearch = !searchTerm || 
        (order?.spaceName?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.building?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.locationDescription?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.technician?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
        (order?.workOrderId?.toLowerCase()?.includes(searchTerm.toLowerCase()));
      
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
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
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
    const stats = {
      total: filtered.length,
      pending: filtered.filter(o => o.status === 'pending').length,
      approved: filtered.filter(o => o.status === 'approved').length,
      inProgress: filtered.filter(o => o.status === 'in-progress').length,
      completed: filtered.filter(o => o.status === 'completed').length,
      rejected: filtered.filter(o => o.status === 'cancelled' || o.status === 'rejected').length,
      highPriority: filtered.filter(o => o.priority === 'high' || o.priority === 'critical').length
    };
    setStats(stats);
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const confirmed = await errorHandler.confirmAction(
        `Are you sure you want to change the status to ${newStatus}?`,
        'Update Status'
      );
      
      if (!confirmed) return;

      const response = await workOrderAPI.updateWorkOrderStatus(token, orderId, newStatus);
      
      if (response.success) {
        // Update local state
        const updatedOrders = workOrders.map(order => 
          (order.id || order._id) === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        );
        
        setWorkOrders(updatedOrders);
        errorHandler.handleSuccess(`Order status updated to ${newStatus}`);
        fetchStats();
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update order status');
    }
  };

  const handleRefresh = () => {
    fetchWorkOrders();
    fetchStats();
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  // Export functionality
  const handleExportToCSV = () => {
    const csvHeaders = [
      'Work Order ID',
      'Space Name',
      'Building',
      'Location Description',
      'Confined Space Description',
      'Technician',
      'Priority',
      'Status',
      'Survey Date',
      'Created Date',
      'Confined Space',
      'Permit Required',
      'Entry Requirements',
      'Atmospheric Hazard',
      'Atmospheric Hazard Description',
      'Engulfment Hazard',
      'Engulfment Hazard Description',
      'Configuration Hazard',
      'Configuration Hazard Description',
      'Other Hazards',
      'Other Hazards Description',
      'PPE Required',
      'PPE List',
      'Forced Air Ventilation Sufficient',
      'Air Monitor Required',
      'Warning Sign Posted',
      'Number of Entry Points',
      'Other People Working Near Space',
      'Can Others See Into Space',
      'Contractors Enter Space',
      'Images',
      'Notes'
    ].join(',');

    const csvData = filteredOrders.map(order => [
      `"${order.workOrderId || ''}"`,
      `"${order.spaceName || ''}"`,
      `"${order.building || ''}"`,
      `"${order.locationDescription || ''}"`,
      `"${order.confinedSpaceDescription || ''}"`,
      `"${order.technician || ''}"`,
      `"${order.priority || ''}"`,
      `"${order.status || ''}"`,
      `"${order.surveyDate ? formatDate(order.surveyDate) : ''}"`,
      `"${order.createdAt ? formatDate(order.createdAt) : ''}"`,
      `"${order.isConfinedSpace ? 'Yes' : 'No'}"`,
      `"${order.permitRequired ? 'Yes' : 'No'}"`,
      `"${order.entryRequirements || ''}"`,
      `"${order.atmosphericHazard ? 'Yes' : 'No'}"`,
      `"${order.atmosphericHazardDescription || ''}"`,
      `"${order.engulfmentHazard ? 'Yes' : 'No'}"`,
      `"${order.engulfmentHazardDescription || ''}"`,
      `"${order.configurationHazard ? 'Yes' : 'No'}"`,
      `"${order.configurationHazardDescription || ''}"`,
      `"${order.otherRecognizedHazards ? 'Yes' : 'No'}"`,
      `"${order.otherHazardsDescription || ''}"`,
      `"${order.ppeRequired ? 'Yes' : 'No'}"`,
      `"${order.ppeList || ''}"`,
      `"${order.forcedAirVentilationSufficient ? 'Yes' : 'No'}"`,
      `"${order.dedicatedAirMonitor ? 'Yes' : 'No'}"`,
      `"${order.warningSignPosted ? 'Yes' : 'No'}"`,
      `"${order.numberOfEntryPoints || ''}"`,
      `"${order.otherPeopleWorkingNearSpace ? 'Yes' : 'No'}"`,
      `"${order.canOthersSeeIntoSpace ? 'Yes' : 'No'}"`,
      `"${order.contractorsEnterSpace ? 'Yes' : 'No'}"`,
      `"${(order.imageUrls && order.imageUrls.length > 0) ? order.imageUrls.join('; ') : ''}"`,
      `"${(order.notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvData.map(row => row)].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `work-orders-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadPDF = async (order) => {
    try {
      setDownloadingPdf(order.id || order._id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Generate and download PDF
      const result = await workOrderAPI.generateWorkOrderPDF(token, order, 'pdf');
      
      if (result.success) {
        errorHandler.handleSuccess('PDF generated and downloaded successfully');
      } else {
        throw new Error('PDF generation failed');
      }
      
    } catch (error) {
      errorHandler.handleError(error, 'Failed to download PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Handle Consolidated PDF Download
  const handleDownloadConsolidatedPDFs = async () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      errorHandler.handleError(null, 'No work orders available to consolidate');
      return;
    }

    try {
      // Consolidate entries first
      const consolidatedEntries = consolidateEntriesLocal(filteredOrders);
      
      console.log(`Original entries: ${filteredOrders.length}`);
      console.log(`Consolidated entries: ${consolidatedEntries.length}`);
      
      // Create a single consolidated PDF containing all entries
      const consolidatedReport = {
        _isConsolidatedReport: true,
        _totalOriginalEntries: filteredOrders.length,
        _totalConsolidatedEntries: consolidatedEntries.length,
        _savedReports: filteredOrders.length - consolidatedEntries.length,
        _generatedAt: new Date().toISOString(),
        consolidatedEntries: consolidatedEntries,
        // Use metadata from the first entry as base
        ...consolidatedEntries[0],
        // Override with consolidated report title
        workOrderId: `CONSOLIDATED-REPORT-${new Date().toISOString().split('T')[0]}`,
        uniqueId: `CONSOLIDATED-REPORT-${new Date().toISOString().split('T')[0]}`,
        spaceName: `Consolidated Report (${consolidatedEntries.length} entries)`,
        building: 'Multiple Buildings',
        locationDescription: `Consolidated assessment report containing ${consolidatedEntries.length} entries from ${filteredOrders.length} original assessments`
      };

      // Generate single consolidated PDF
      await handleDownloadPDF(consolidatedReport);
      
      errorHandler.handleSuccess(`Generated consolidated PDF with ${consolidatedEntries.length} entries from ${filteredOrders.length} original assessments`);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to generate consolidated PDF');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      errorHandler.handleWarning('Please select work orders to perform bulk action');
      return;
    }

    const confirmed = await errorHandler.confirmAction(
      `Are you sure you want to ${action} ${selectedOrders.length} selected work order(s)?`,
      'Bulk Action'
    );

    if (!confirmed) return;

    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        errorHandler.handleError(null, 'Authentication required');
        return;
      }

      if (action === 'delete') {
        const promises = selectedOrders.map(orderId => 
          workOrderAPI.deleteWorkOrder(token, orderId)
        );
        await Promise.all(promises);
      } else {
        // Bulk status update
        await workOrderAPI.bulkUpdateStatus(token, selectedOrders, action, `Bulk ${action} by manager`);
      }

      errorHandler.handleSuccess(`Bulk ${action} completed successfully`);
      setSelectedOrders([]);
      fetchWorkOrders();
      fetchStats();
    } catch (error) {
      errorHandler.handleError(error, `Failed to perform bulk ${action}`);
    } finally {
      setBulkActionLoading(false);
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

      console.log('Starting CSV import...');
      console.log('CSV data to import:', csvData);
      
      const response = await workOrderAPI.importCSVData(token, csvData);
      
      console.log('Import response:', response);
      
      if (response.success) {
        // Refresh the data to show imported orders
        await fetchWorkOrders();
        await fetchStats();
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
        errorHandler.handleError(null, 'No work orders to export');
        return;
      }

      // Prepare data for Excel export
      const exportData = filteredOrders.map(order => ({
        'Work Order ID': order.workOrderId || order.uniqueId || 'N/A',
        'Space Name': order.spaceName || 'N/A',
        'Building': order.building || 'N/A',
        'Location Description': order.locationDescription || 'N/A',
        'Confined Space Description': order.confinedSpaceDescription || 'N/A',
        'Technician': order.technician || 'N/A',
        'Priority': order.priority || 'N/A',
        'Status': order.status || 'N/A',
        'Survey Date': order.surveyDate ? new Date(order.surveyDate).toLocaleDateString() : 'N/A',
        'Created Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
        'Confined Space': order.isConfinedSpace ? 'Yes' : 'No',
        'Permit Required': order.permitRequired ? 'Yes' : 'No',
        'Entry Requirements': order.entryRequirements || 'N/A',
        'Atmospheric Hazard': order.atmosphericHazard ? 'Yes' : 'No',
        'Atmospheric Hazard Description': order.atmosphericHazardDescription || 'N/A',
        'Engulfment Hazard': order.engulfmentHazard ? 'Yes' : 'No',
        'Engulfment Hazard Description': order.engulfmentHazardDescription || 'N/A',
        'Configuration Hazard': order.configurationHazard ? 'Yes' : 'No',
        'Configuration Hazard Description': order.configurationHazardDescription || 'N/A',
        'Other Hazards': order.otherRecognizedHazards ? 'Yes' : 'No',
        'Other Hazards Description': order.otherHazardsDescription || 'N/A',
        'PPE Required': order.ppeRequired ? 'Yes' : 'No',
        'PPE List': order.ppeList || 'N/A',
        'Forced Air Ventilation Sufficient': order.forcedAirVentilationSufficient ? 'Yes' : 'No',
        'Air Monitor Required': order.dedicatedAirMonitor ? 'Yes' : 'No',
        'Warning Sign Posted': order.warningSignPosted ? 'Yes' : 'No',
        'Number of Entry Points': order.numberOfEntryPoints || 'N/A',
        'Other People Working Near Space': order.otherPeopleWorkingNearSpace ? 'Yes' : 'No',
        'Can Others See Into Space': order.canOthersSeeIntoSpace ? 'Yes' : 'No',
        'Contractors Enter Space': order.contractorsEnterSpace ? 'Yes' : 'No',
        'Images': order.imageUrls ? order.imageUrls.length : 0,
        'Notes': order.notes || 'N/A'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Work Orders');
      
      // Generate filename with current date
      const fileName = `work-orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, fileName);
      
      console.log(`Exported ${exportData.length} work orders to ${fileName}`);
      errorHandler.handleSuccess(`Exported ${exportData.length} work orders to Excel`);
      
    } catch (error) {
      console.error('Export error:', error);
      errorHandler.handleError(error, 'Failed to export to Excel');
    }
  };

  // Handle Bulk Import
  const handleBulkImport = async (csvData) => {
    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log(`Importing ${csvData.length} work orders from CSV`);
      console.log('CSV Data preview:', csvData.slice(0, 2)); // Log first 2 rows for debugging
      
      const result = await workOrderAPI.bulkImportOrders(token, csvData);
      
      if (result.success) {
        console.log('Bulk import successful:', result);
        
        // Clear any existing errors
        setError(null);
        
        // Refresh the data to show newly imported orders
        console.log('Refreshing data after successful import...');
        await fetchWorkOrders();
        await fetchStats();
        
        // Show success message
        if (result.data?.results) {
          const { successful, failed, total } = result.data.results;
          console.log(`Import completed: ${successful}/${total} successful, ${failed} failed`);
        }
        
        return result;
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Error in bulk import:', error);
      throw error;
    } finally {
      setImporting(false);
    }
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

  if (loading && workOrders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading work orders...</p>
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
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-[#232249]">Connection Error</h3>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            <div className="pt-4">
              <button
                onClick={() => fetchWorkOrders()}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <Toaster />
        
        {/* Compact Modern Header */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-[#232249] to-[#2d2d5f] rounded-2xl shadow-lg border border-gray-200/20">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                {/* Left Side - Title */}
                <div className="flex items-center gap-4">
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Work Orders Management
                    </h1>
                    <p className="text-white/70 text-sm">
                      Manager dashboard for work orders
                    </p>
                  </div>
                </div>

                {/* Right Side - Live Time */}
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded-lg px-4 py-3 border border-white/20">
                    <div className="text-white/60 text-xs font-medium mb-1">Current Time</div>
                    <div className="text-white text-lg font-bold font-mono">
                      {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-3 border border-white/20">
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

        {/* Clean Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={FileText}
            color="text-blue-700"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            onClick={() => setStatusFilter('')}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-amber-700"
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
            onClick={() => setStatusFilter('pending')}
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="text-cyan-700"
            bgColor="bg-cyan-50"
            borderColor="border-cyan-200"
            onClick={() => setStatusFilter('approved')}
          />
          <StatCard
            title="Active"
            value={stats.inProgress}
            icon={Activity}
            color="text-purple-700"
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
            onClick={() => setStatusFilter('in-progress')}
          />
          <StatCard
            title="Done"
            value={stats.completed}
            icon={CheckCircle}
            color="text-green-700"
            bgColor="bg-green-50"
            borderColor="border-green-200"
            onClick={() => setStatusFilter('completed')}
          />
          <StatCard
            title="High Priority"
            value={stats.highPriority}
            icon={AlertTriangle}
            color="text-red-700"
            bgColor="bg-red-50"
            borderColor="border-red-200"
            onClick={() => setPriorityFilter('high')}
          />
        </div>

        {/* Modern Filters Interface */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#232249] rounded-xl p-2">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#232249]">Search & Filter</h3>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-colors bg-gray-50 hover:bg-white"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-colors bg-gray-50 hover:bg-white"
                >
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Active Filters & Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Results:</span>
              <span className="font-semibold text-[#232249]">{filteredOrders.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCSVImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <Upload className="w-4 h-4" />
                Import Excel
              </button>
              <button
                onClick={handleExportToExcel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={handleDownloadConsolidatedPDFs}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Consolidated PDF
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#1a1a3a] transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Work Orders Table */}
        <ManagerWorkOrdersTable
          workOrders={filteredOrders}
          onView={handleView}
          onStatusUpdate={handleStatusUpdate}
          onDownloadPDF={handleDownloadPDF}
          onCreateOrder={() => setShowCreateModal(true)}
          onUpdateOrder={(order) => {
            setSelectedOrder(order);
            setShowEditModal(true);
          }}
          onDeleteOrder={async (orderId) => {
            const confirmed = await errorHandler.confirmAction(
              'Are you sure you want to delete this work order? This action cannot be undone.',
              'Delete Work Order'
            );

            if (!confirmed) return;

            try {
              const token = localStorage.getItem('token');
              if (!token) {
                errorHandler.handleError(null, 'Authentication required');
                return;
              }

              await workOrderAPI.deleteWorkOrder(token, orderId);
              errorHandler.handleSuccess('Work order deleted successfully');
              fetchWorkOrders();
              fetchStats();
            } catch (error) {
              errorHandler.handleError(error, 'Failed to delete work order');
            }
          }}
          onDeleteAllOrders={async (confirmPhrase) => {
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                errorHandler.handleError(null, 'Authentication required');
                return;
              }

              console.log('Manager: Attempting to delete all work orders...');
              await workOrderAPI.deleteAllWorkOrders(token, confirmPhrase);
              
              errorHandler.handleSuccess('All work orders deleted successfully');
              
              // Refresh data
              fetchWorkOrders();
              fetchStats();
            } catch (error) {
              errorHandler.handleError(error, 'Failed to delete all work orders');
              throw error; // Re-throw to let the table component handle it
            }
          }}
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
            <div className="relative max-w-7xl w-full max-h-[95vh] overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white rounded-[3rem] transform rotate-1 scale-105 opacity-50"></div>
              <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl"></div>
              
              {/* Modal Content */}
              <div className="relative bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-gray-200/50 overflow-hidden">
                {/* Ultra-Modern Header */}
                <div className="relative bg-gradient-to-r from-[#232249] via-[#2d2d5f] to-[#232249] px-10 py-8">
                  {/* Floating Elements */}
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

                {/* Enhanced Content Area */}
                <div className="p-10 overflow-y-auto max-h-[calc(95vh-140px)]">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* Left Column - Basic Information */}
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

                    {/* Right Column - Safety Assessment */}
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

                  {/* Notes and Images Section */}
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
                                  src={url}
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
