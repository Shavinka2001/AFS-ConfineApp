import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import AdminWorkOrdersTable from './AdminWorkOrdersTable';

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

// Import API service
import workOrderAPI from '../../../services/workOrderAPI';

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

  // State for statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0
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
      console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch all work orders from the API
      console.log('Calling workOrderAPI.getWorkOrders...');
      console.log('API URL:', import.meta.env.VITE_WORKORDER_API_URL || 'http://localhost:3012/api');
      
      const response = await workOrderAPI.getWorkOrders(token, {
        page: 1,
        limit: 1000, // Get all records for admin
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('=== API RESPONSE DEBUG ===');
      console.log('Raw API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'No response');
      
      // Handle different possible response formats
      let mongoOrders = [];
      
      if (response && response.success && response.data) {
        // Format 1: { success: true, data: { orders: [...] } }
        mongoOrders = response.data.orders || response.data || [];
      } else if (response && Array.isArray(response)) {
        // Format 2: Direct array response
        mongoOrders = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Format 3: { data: [...] }
        mongoOrders = response.data;
      } else if (response && response.orders && Array.isArray(response.orders)) {
        // Format 4: { orders: [...] }
        mongoOrders = response.orders;
      } else {
        console.warn('Unexpected API response format:', response);
        mongoOrders = [];
      }
      
      console.log('=== ORDER PROCESSING DEBUG ===');
      console.log('Mongo Orders count:', mongoOrders.length);
      console.log('First order sample:', mongoOrders[0]);
      
      // Transform the orders for display compatibility
      const transformedOrders = mongoOrders.map(order => ({
        ...order,
        // Ensure consistent ID field
        id: order._id || order.id,
        // Add display fields for table compatibility
        workOrderId: order.workOrderId || order.uniqueId || `WO-${String(order._id || order.id).slice(-6)}`,
        entrySupervisor: order.technician,
        location: order.locationDescription,
        submittedAt: order.createdAt
      }));

      console.log('=== FINAL RESULT DEBUG ===');
      console.log('Transformed orders count:', transformedOrders.length);
      console.log('First transformed order:', transformedOrders[0]);
      
      setWorkOrders(transformedOrders);
      setFilteredOrders(transformedOrders);
      
      // Extract unique values for filters
      const uniqueTechnicians = [...new Set(transformedOrders.map(order => order.technician).filter(Boolean))];
      const uniqueBuildings = [...new Set(transformedOrders.map(order => order.building).filter(Boolean))];
      
      setTechnicians(uniqueTechnicians);
      setBuildings(uniqueBuildings);
      
      // Calculate statistics
      calculateStats(transformedOrders);
      
      setError(null);
      console.log('Successfully loaded', transformedOrders.length, 'work orders for admin');
      
    } catch (err) {
      console.error('Error loading work orders for admin:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      setError(`Failed to load work orders: ${err.message}`);
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
      pending: orders.filter(o => o.status === 'pending').length,
      approved: orders.filter(o => o.status === 'approved').length,
      inProgress: orders.filter(o => o.status === 'in-progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      rejected: orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length
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
      
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesPriority = !priorityFilter || order.priority === priorityFilter;
      const matchesTechnician = !technicianFilter || order.technician === technicianFilter;
      const matchesBuilding = !buildingFilter || order.building === buildingFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesTechnician && matchesBuilding;
    });

    // Apply sorting
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
  }, [workOrders, searchTerm, statusFilter, priorityFilter, technicianFilter, buildingFilter, sortConfig]);

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

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'text-gray-600 bg-gray-100',
      'pending': 'text-yellow-700 bg-yellow-100',
      'approved': 'text-blue-700 bg-blue-100',
      'in-progress': 'text-indigo-700 bg-indigo-100',
      'completed': 'text-green-700 bg-green-100',
      'cancelled': 'text-red-700 bg-red-100',
      'on-hold': 'text-orange-700 bg-orange-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <Package className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log(`Updating order ${orderId} status to ${newStatus}`);
      
      const response = await workOrderAPI.updateWorkOrderStatus(token, orderId, newStatus);
      
      if (response.success) {
        // Update local state
        const updatedOrders = workOrders.map(order => 
          (order.id || order._id) === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        );
        
        setWorkOrders(updatedOrders);
        calculateStats(updatedOrders);
        
        console.log(`Successfully updated order ${orderId} status to ${newStatus}`);
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(`Failed to update status: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    loadData(false); // Refresh without showing loading indicator
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
      'Location',
      'Technician',
      'Priority',
      'Status',
      'Survey Date',
      'Created Date',
      'Confined Space',
      'Permit Required',
      'Atmospheric Hazard',
      'Engulfment Hazard',
      'Configuration Hazard',
      'Other Hazards',
      'PPE Required',
      'Air Monitor Required',
      'Warning Sign Posted',
      'Notes'
    ].join(',');

    const csvData = filteredOrders.map(order => [
      `"${order.workOrderId || ''}"`,
      `"${order.spaceName || ''}"`,
      `"${order.building || ''}"`,
      `"${order.locationDescription || ''}"`,
      `"${order.technician || ''}"`,
      `"${order.priority || ''}"`,
      `"${order.status || ''}"`,
      `"${order.surveyDate ? new Date(order.surveyDate).toLocaleDateString() : ''}"`,
      `"${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}"`,
      `"${order.isConfinedSpace ? 'Yes' : 'No'}"`,
      `"${order.permitRequired ? 'Yes' : 'No'}"`,
      `"${order.atmosphericHazard ? 'Yes' : 'No'}"`,
      `"${order.engulfmentHazard ? 'Yes' : 'No'}"`,
      `"${order.configurationHazard ? 'Yes' : 'No'}"`,
      `"${order.otherRecognizedHazards ? 'Yes' : 'No'}"`,
      `"${order.ppeRequired ? 'Yes' : 'No'}"`,
      `"${order.dedicatedAirMonitor ? 'Yes' : 'No'}"`,
      `"${order.warningSignPosted ? 'Yes' : 'No'}"`,
      `"${(order.notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvData.map(row => row)].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `confined-space-assessments-${new Date().toISOString().split('T')[0]}.csv`);
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

      // Use client-side PDF generation
      const result = await workOrderAPI.generateWorkOrderPDF(token, order, 'pdf');
      
      if (result.success) {
        // PDF is automatically downloaded by the generator
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

  // Handle Consolidated PDF Download
  const handleDownloadConsolidatedPDFs = async () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      setError('No work orders available to consolidate. Please add some work orders first.');
      return;
    }

    try {
      // Consolidate entries first
      const consolidatedEntries = consolidateEntriesLocal(filteredOrders);
      
      console.log(`Original entries: ${filteredOrders.length}`);
      console.log(`Consolidated entries: ${consolidatedEntries.length}`);
      console.log(`Saved ${filteredOrders.length - consolidatedEntries.length} duplicate reports`);
      
      // Log details about each entry
      consolidatedEntries.forEach((entry, index) => {
        if (entry._consolidated) {
          console.log(`Entry ${index + 1}: CONSOLIDATED - ${entry.building} (${entry._originalEntryCount} entries combined)`);
        } else {
          console.log(`Entry ${index + 1}: INDIVIDUAL - ${entry.building} - ${entry.spaceName}`);
        }
      });

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

      console.log(`Generating single consolidated PDF with ${consolidatedEntries.length} entries...`);
      
      // Generate single consolidated PDF
      await handleDownloadPDF(consolidatedReport);
      
      console.log(`Successfully generated consolidated PDF with ${consolidatedEntries.length} entries`);
      
      // Show success message
      setError(null);
      alert(`Generated 1 consolidated PDF containing ${consolidatedEntries.length} entries from ${filteredOrders.length} original assessments`);
      
    } catch (error) {
      console.error('Error generating consolidated PDF:', error);
      setError(`Failed to generate consolidated PDF: ${error.message}`);
    }
  };

  // Handle Create Order
  const handleCreateOrder = () => {
    console.log('Create order clicked');
    // You can implement navigation to create form or open a modal
    // For now, just show a message
    setError('Create order functionality - redirect to create form');
  };

  // Handle Update Order
  const handleUpdateOrder = async (orderId, updatedData) => {
    try {
      if (typeof orderId === 'object') {
        // If first parameter is order object (for compatibility)
        console.log('Update order clicked:', orderId);
        setSelectedOrder(orderId);
        setShowDetailModal(true);
        return;
      }

      // Handle actual update with ID and data
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      setLoading(true);
      const response = await workOrderAPI.updateWorkOrder(token, orderId, updatedData);
      
      if (response.success) {
        // Update the workOrders state with the updated order
        setWorkOrders(prev => prev.map(order => 
          (order._id === orderId || order.uniqueId === orderId) 
            ? { ...order, ...updatedData }
            : order
        ));
        
        // Show success message
        alert('Work order updated successfully!');
      } else {
        setError('Failed to update work order: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating work order:', error);
      setError('Failed to update work order: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Order
  const handleDeleteOrder = async (orderId) => {
    try {
      if (!confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log(`Attempting to delete order with ID: ${orderId}`);
      
      // Find the full order object to get all possible ID fields
      const orderToDelete = workOrders.find(order => 
        (order.id || order._id) === orderId || 
        order.uniqueId === orderId || 
        order.internalId === orderId ||
        order.workOrderId === orderId
      );
      
      if (!orderToDelete) {
        throw new Error('Order not found in local data');
      }
      
      console.log('Full order object:', orderToDelete);
      console.log('Trying to delete with MongoDB _id:', orderToDelete._id || orderToDelete.id);
      
      // Try with the MongoDB _id first (most reliable)
      const deleteId = orderToDelete._id || orderToDelete.id || orderId;
      const response = await workOrderAPI.deleteWorkOrder(token, deleteId);
      
      if (response.success) {
        // Remove from local state using all possible ID matches
        const updatedOrders = workOrders.filter(order => 
          (order.id || order._id) !== orderId &&
          (order.id || order._id) !== deleteId &&
          order.uniqueId !== orderId &&
          order.internalId !== orderId &&
          order.workOrderId !== orderId
        );
        
        setWorkOrders(updatedOrders);
        calculateStats(updatedOrders);
        
        console.log(`Successfully deleted order ${deleteId}`);
        setError(null); // Clear any previous errors
        
        // Show success message
        alert('Work order deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete work order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      console.error('Full error object:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'Work order not found. It may have already been deleted or you may not have permission to delete it.';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'You do not have permission to delete this work order.';
      }
      
      setError(`Failed to delete work order: ${errorMessage}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Outer Ring */}
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 mx-auto"></div>
            {/* Inner Ring */}
            <div className="absolute inset-0 animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[#232249] mx-auto" style={{ animationDuration: '1s' }}></div>
            {/* Center Dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-[#232249] rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[#232249] font-bold text-xl">Loading Work Orders</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Fetching the latest assessment data and preparing your dashboard...
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-[#232249] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#232249] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-[#232249] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
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
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
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
                      Confined space assessment dashboard
                    </p>
                  </div>
                </div>

                {/* Right Side - Live Time */}
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded-lg px-4 py-3 border border-white/20">
                    <div className="text-white/60 text-xs font-medium mb-1">Current Time</div>
                    <div className="text-white text-lg font-bold font-mono">
                      {formatTime(currentTime)}
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
            icon={Package}
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
            title="Cancelled"
            value={stats.rejected}
            icon={XCircle}
            color="text-red-700"
            bgColor="bg-red-50"
            borderColor="border-red-200"
            onClick={() => setStatusFilter('cancelled')}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={handleExportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#232249] hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
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
        <AdminWorkOrdersTable
          workOrders={filteredOrders}
          onView={handleView}
          onStatusUpdate={handleStatusUpdate}
          onDownloadPDF={handleDownloadPDF}
          onCreateOrder={handleCreateOrder}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
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

export default AdminWorkOrders;
