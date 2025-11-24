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
  Plus,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import AdminWorkOrdersTable from './AdminWorkOrdersTable';
import workOrderAPI from '../../../services/workOrderAPI';
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

const AdminWorkOrders = () => {
  const { user } = useAuth();
  
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
      pending: 0,
      approved: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0
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

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
    loadData(false); // Refresh without showing loading indicator
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

      // Prepare data for Excel export
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
      
    } catch (error) {
      console.error('Export error:', error);
      setError(`Failed to export: ${error.message}`);
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



  // Handle Delete All Orders
  const handleDeleteAllOrders = async (confirmPhrase) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Debug token info
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('DeleteAll: Using token with payload:', payload);
          console.log('User role from token:', payload.role);
          console.log('User role from context:', user?.role);
          console.log('Required roles: admin, manager');
        }
      } catch (e) {
        console.warn('Could not decode token for debugging:', e);
      }

      // Also check current user context
      console.log('Current user from context:', user);

      // Test auth first
      console.log('Testing auth endpoint first...');
      try {
        const authTest = await workOrderAPI.testAuth(token);
        console.log('Auth test result:', authTest);
      } catch (authError) {
        console.error('Auth test failed:', authError);
      }
      
      console.log('Attempting to delete all work orders...');
      const response = await workOrderAPI.deleteAllWorkOrders(token, confirmPhrase);
      
      if (response.success) {
        // Clear all local state
        setWorkOrders([]);
        setFilteredOrders([]);
        calculateStats([]);
        
        console.log('Successfully deleted all work orders');
        setError(null);
        
        // Reload data to confirm deletion
        setTimeout(() => {
          loadData();
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to delete all work orders');
      }
    } catch (error) {
      console.error('Error deleting all orders:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error; // Re-throw to let the table component handle it
    }
  };

  // Mobile-Responsive Statistics Card Component
  const StatCard = ({ title, value, icon: Icon, color, bgColor, borderColor, onClick }) => (
    <div 
      className={`group transition-all duration-300 hover:scale-105 touch-manipulation ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`bg-white rounded-2xl shadow-lg border-2 ${borderColor} hover:shadow-xl transition-all duration-300 p-4 sm:p-5 lg:p-6 min-h-[100px] sm:min-h-[120px]`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
          {/* Icon and Value Row */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-3">
            <div className={`p-2 sm:p-3 rounded-xl ${bgColor} shadow-sm`}>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
            </div>
            <div className="text-right sm:text-left">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{value}</div>
            </div>
          </div>
          
          {/* Title Row */}
          <div className="sm:flex-1">
            <div className="text-xs sm:text-sm font-semibold text-gray-600 text-center sm:text-right truncate">
              {title}
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-3 sm:p-4 md:p-6 lg:p-8 safe-area-inset-top safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Mobile-First Responsive Header */}
        <div className="relative overflow-hidden touch-manipulation">
          <div className="bg-gradient-to-r from-[#232249] to-[#2d2d5f] rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/20">
            <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
              <div className="flex flex-col gap-6 sm:gap-4">
                {/* Top Row - Title and Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20 shrink-0">
                      <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                        Work Orders
                      </h1>
                      <p className="text-white/70 text-sm sm:text-base mt-1">
                        Assessment Dashboard
                      </p>
                    </div>
                  </div>
                  
                  {/* Mobile Menu Indicator */}
                  <div className="sm:hidden bg-white/10 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Bottom Row - Time Info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-x-auto">
                    <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20 flex-shrink-0 min-w-0">
                      <div className="text-white/60 text-xs font-medium mb-1">Current Time</div>
                      <div className="text-white text-lg sm:text-xl font-bold font-mono">
                        {formatTime(currentTime)}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20 flex-shrink-0 min-w-0">
                      <div className="text-white/60 text-xs font-medium mb-1">Date</div>
                      <div className="text-white text-sm sm:text-base font-semibold">
                        {currentTime.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl border border-white/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-sm font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Responsive Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Total Orders"
            value={stats.total}
            icon={FileText}
            color="text-blue-700"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-amber-700"
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="text-cyan-700"
            bgColor="bg-cyan-50"
            borderColor="border-cyan-200"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Package}
            color="text-purple-700"
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="text-green-700"
            bgColor="bg-green-50"
            borderColor="border-green-200"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="text-red-700"
            bgColor="bg-red-50"
            borderColor="border-red-200"
          />
        </div>

        {/* Mobile-First Filters Interface */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:p-8 touch-manipulation">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-[#232249] to-[#1a1a3a] rounded-xl p-3 shadow-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl sm:text-2xl font-bold text-[#232249] truncate">Search & Filter</h3>
              <p className="text-gray-500 text-sm sm:text-base mt-1">Find and filter work orders</p>
            </div>
          </div>
          
          {/* Search and Filter Grid */}
          <div className="space-y-6">
            {/* Search Bar - Full Width */}
            <div>
              <label className="block text-sm font-bold text-[#232249] mb-3 uppercase tracking-wide">
                Search Work Orders
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by space name, building, location, technician..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 bg-gray-50 hover:bg-white text-base touch-manipulation shadow-inner"
                />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { 
                  label: 'Priority Level', 
                  value: priorityFilter, 
                  setter: setPriorityFilter, 
                  icon: AlertTriangle,
                  options: [
                    { value: '', label: 'All Priority Levels' },
                    { value: 'low', label: 'Low Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'high', label: 'High Priority' },
                    { value: 'critical', label: 'Critical Priority' }
                  ]
                },
                { 
                  label: 'Technician', 
                  value: technicianFilter, 
                  setter: setTechnicianFilter,
                  icon: User,
                  options: [
                    { value: '', label: 'All Technicians' },
                    ...technicians.map(tech => ({ value: tech, label: tech }))
                  ]
                },
                { 
                  label: 'Building', 
                  value: buildingFilter, 
                  setter: setBuildingFilter,
                  icon: Building,
                  options: [
                    { value: '', label: 'All Buildings' },
                    ...buildings.map(building => ({ value: building, label: building }))
                  ]
                }
              ].map((filter, index) => (
                <div key={filter.label} className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#232249] mb-3 uppercase tracking-wide">
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </label>
                  <div className="relative">
                    <select
                      value={filter.value}
                      onChange={(e) => filter.setter(e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 bg-gray-50 hover:bg-white text-base appearance-none cursor-pointer touch-manipulation shadow-inner group-hover:border-gray-300"
                    >
                      {filter.options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Summary & Action Buttons */}
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

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <button
                onClick={() => setShowCSVImportModal(true)}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-4 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 touch-manipulation shadow-lg hover:shadow-xl group"
              >
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-center">Import Excel</span>
              </button>
              
              <button
                onClick={handleExportToExcel}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-4 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all duration-300 border-2 border-emerald-200 hover:border-emerald-300 touch-manipulation shadow-lg hover:shadow-xl group"
              >
                <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-center">Export Excel</span>
              </button>
              
              <button
                onClick={handleDownloadConsolidatedPDFs}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-4 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-2xl transition-all duration-300 border-2 border-green-200 hover:border-green-300 touch-manipulation shadow-lg hover:shadow-xl group"
              >
                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-center">PDF Report</span>
              </button>
              
              <button
                onClick={handleRefresh}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-[#232249] to-[#1a1a3a] text-white rounded-2xl hover:shadow-xl transition-all duration-300 text-sm font-semibold touch-manipulation shadow-lg group"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-center">Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Work Orders Table */}
        <AdminWorkOrdersTable
          workOrders={filteredOrders}
          onView={handleView}
          onDownloadPDF={handleDownloadPDF}
          onCreateOrder={handleCreateOrder}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          onDeleteAllOrders={handleDeleteAllOrders}
        />

        {/* CSV Import Modal */}
        <CSVImportModal
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onImport={handleCSVImport}
          isLoading={csvImportLoading}
        />

        {/* Mobile-Responsive Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 safe-area-inset-top safe-area-inset-bottom overflow-y-auto">
            {/* Modal Container */}
            <div className="relative w-full max-w-7xl mx-auto">
              {/* Modal Content */}
              <div className="relative bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-gray-200/50 overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[95vh]">
                {/* Mobile-First Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-[#232249] via-[#2d2d5f] to-[#232249] px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left Side - Icon and Title */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/20 shrink-0">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white truncate">
                          Work Order Details
                        </h2>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                          <span className="text-white/90 text-sm sm:text-base lg:text-lg font-semibold truncate">
                            {selectedOrder.workOrderId}
                          </span>
                          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-white/20 rounded-full border border-white/30 shrink-0">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-white/80 text-xs sm:text-sm font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={closeDetailModal}
                      className="bg-white/10 hover:bg-white/20 rounded-xl p-2 sm:p-3 transition-all duration-300 border border-white/20 hover:border-white/40 touch-manipulation shrink-0"
                    >
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white/70 hover:text-white transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Content Area - Mobile Scrollable */}
                <div className="p-4 sm:p-6 lg:p-10 overflow-y-auto">
                  <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                    {/* Mobile-First Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                      {/* Basic Information Column */}
                      <div className="space-y-6 sm:space-y-8">
                        <div className="relative">
                          <div className="absolute -left-2 sm:-left-4 top-0 w-1 h-full bg-gradient-to-b from-[#232249] to-transparent rounded-full"></div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#232249] flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="p-2 sm:p-3 bg-gradient-to-br from-[#232249] to-[#1a1a3a] rounded-xl sm:rounded-2xl">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                            </div>
                            Basic Information
                          </h3>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 border border-gray-200/50 shadow-lg">
                            {/* Mobile-Stacked Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              {[
                                { label: 'Space Name', value: selectedOrder.spaceName },
                                { label: 'Building', value: selectedOrder.building },
                                { label: 'Technician', value: selectedOrder.technician },
                                { label: 'Survey Date', value: formatDate(selectedOrder.surveyDate) }
                              ].map((item, index) => (
                                <div key={index} className="group">
                                  <span className="block text-xs sm:text-sm font-bold text-[#232249] mb-2 sm:mb-3 uppercase tracking-wider">
                                    {item.label}
                                  </span>
                                  <div className="bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 group-hover:border-[#232249]/30 transition-all duration-300 shadow-sm">
                                    <p className="text-gray-700 font-medium text-sm sm:text-base break-words">{item.value || 'N/A'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Priority Badge */}
                            <div className="pt-4 border-t border-gray-200">
                              <span className="block text-xs sm:text-sm font-bold text-[#232249] mb-2 sm:mb-3 uppercase tracking-wider">Priority Level</span>
                              <span className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 ${getPriorityColor(selectedOrder.priority)}`}>
                                {selectedOrder.priority || 'Not Set'}
                              </span>
                            </div>
                            
                            {/* Location Description */}
                            <div className="pt-4 border-t border-gray-200">
                              <span className="block text-xs sm:text-sm font-bold text-[#232249] mb-2 sm:mb-3 uppercase tracking-wider">Location Description</span>
                              <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                                <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">{selectedOrder.locationDescription || 'No description provided'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Safety Assessment Column */}
                      <div className="space-y-6 sm:space-y-8">
                        <div className="relative">
                          <div className="absolute -left-2 sm:-left-4 top-0 w-1 h-full bg-gradient-to-b from-green-500 to-transparent rounded-full"></div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#232249] flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl">
                              <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                            </div>
                            Safety Assessment
                          </h3>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 border border-gray-200/50 shadow-lg">
                            {[
                              { label: 'Confined Space', value: selectedOrder.isConfinedSpace },
                              { label: 'Permit Required', value: selectedOrder.permitRequired },
                              { label: 'PPE Required', value: selectedOrder.ppeRequired },
                              { label: 'Air Monitor', value: selectedOrder.dedicatedAirMonitor },
                              { label: 'Warning Sign', value: selectedOrder.warningSignPosted }
                            ].map((item, index) => (
                              <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-[#232249]/30 transition-all duration-300 shadow-sm group">
                                <span className="font-bold text-[#232249] group-hover:text-[#1a1a3a] transition-colors text-sm sm:text-base">
                                  {item.label}:
                                </span>
                                <span className={`inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border-2 ${
                                  item.value 
                                    ? (item.label === 'Confined Space' || item.label === 'Permit Required') 
                                      ? 'bg-red-50 text-red-700 border-red-200' 
                                      : 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                } self-start sm:self-center`}>
                                  {item.value ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes Section - Full Width */}
                    {selectedOrder.notes && (
                      <div className="relative">
                        <div className="absolute -left-2 sm:-left-4 top-0 w-1 h-20 bg-gradient-to-b from-purple-500 to-transparent rounded-full"></div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#232249] mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                          </div>
                          Additional Notes
                        </h3>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-purple-200/50 shadow-lg">
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg break-words">{selectedOrder.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Images Section - Mobile Responsive Grid */}
                    {selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0 && (
                      <div className="relative">
                        <div className="absolute -left-2 sm:-left-4 top-0 w-1 h-20 bg-gradient-to-b from-blue-500 to-transparent rounded-full"></div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#232249] mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl">
                            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                          </div>
                          Assessment Images ({selectedOrder.imageUrls.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                          {selectedOrder.imageUrls.map((url, index) => (
                            <div key={index} className="group relative touch-manipulation">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                              <div className="relative bg-white rounded-2xl p-2 sm:p-3 border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                <img
                                  src={url}
                                  alt={`Assessment ${index + 1}`}
                                  className="w-full h-32 sm:h-40 lg:h-32 object-cover rounded-xl cursor-pointer"
                                  onClick={() => window.open(url, '_blank')}
                                />
                                <div className="absolute inset-2 sm:inset-3 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                                  <span className="text-white text-xs font-medium">Tap to enlarge</span>
                                </div>
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
