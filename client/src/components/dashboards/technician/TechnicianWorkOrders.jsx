import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Component imports
import StatCard from './workOrders/StatCard';
import SearchAndFilters from './workOrders/SearchAndFilters';
import WorkOrderTable from './workOrders/WorkOrderTable';
import ViewModal from './workOrders/ViewModal';
import EditModal from './workOrders/EditModal';

// Import PDF generator
import { generateInspectionFormPDF } from './workOrders/PDFGenerator';

// Import API service
import workOrderAPI from '../../../services/workOrderAPI';

const TechnicianWorkOrders = () => {
  const { user } = useAuth();
  
  // State for data management
  const [inspectionForms, setInspectionForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Fetch work orders from MongoDB via API
        console.log('Fetching work orders from MongoDB...');
        const response = await workOrderAPI.getWorkOrders(token, {
          page: 1,
          limit: 100, // Get more records initially
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

        console.log('API Response:', response);
        
        if (response.success && response.data) {
          const mongoOrders = response.data.orders || [];
          console.log('MongoDB Orders:', mongoOrders);
          
          // Transform MongoDB data to match the expected format
          const transformedOrders = mongoOrders.map(order => ({
            id: order._id || order.id,
            spaceName: order.spaceName,
            building: order.building,
            location: order.locationDescription,
            locationDescription: order.locationDescription,
            entrySupervisor: order.technician,
            technician: order.technician,
            priority: order.priority,
            status: order.status,
            submittedAt: order.surveyDate || order.createdAt,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            lastModified: order.updatedAt || order.createdAt,
            notes: order.notes,
            images: order.imageUrls || [],
            // Include all original data for detailed view
            ...order
          }));

          setInspectionForms(transformedOrders);
          setFilteredForms(transformedOrders);
          setError(null);
          
          console.log('Successfully loaded', transformedOrders.length, 'work orders from MongoDB');
        } else {
          console.warn('No data received from API, falling back to localStorage');
          // Fallback to localStorage if API fails
          const savedForms = localStorage.getItem('inspectionForms');
          const forms = savedForms ? JSON.parse(savedForms) : [];
          setInspectionForms(forms);
          setFilteredForms(forms);
        }
        
      } catch (err) {
        console.error('Error loading work orders from MongoDB:', err);
        setError(`Failed to load work orders: ${err.message}`);
        
        // Fallback to localStorage on error
        try {
          const savedForms = localStorage.getItem('inspectionForms');
          const forms = savedForms ? JSON.parse(savedForms) : [];
          setInspectionForms(forms);
          setFilteredForms(forms);
          console.log('Loaded', forms.length, 'forms from localStorage as fallback');
        } catch (localErr) {
          console.error('Error loading from localStorage:', localErr);
          setInspectionForms([]);
          setFilteredForms([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Listen for localStorage changes to refresh data when new forms are submitted
  useEffect(() => {
    const handleStorageChange = () => {
      const savedForms = localStorage.getItem('inspectionForms');
      const forms = savedForms ? JSON.parse(savedForms) : [];
      setInspectionForms(forms);
    };

    // Listen for storage events (when localStorage is updated from other tabs/components)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    window.addEventListener('localStorageUpdate', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleStorageChange);
    };
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = inspectionForms.filter(form => {
      const matchesSearch = (form.spaceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (form.building || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (form.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (form.entrySupervisor || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || form.status === statusFilter;
      const matchesPriority = !priorityFilter || form.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'submittedAt' || sortConfig.key === 'lastModified') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredForms(filtered);
  }, [inspectionForms, searchTerm, statusFilter, priorityFilter, sortConfig]);

  // Utility functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date for display
  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4" />;
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Event handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleView = (form) => {
    setSelectedForm(form);
    setShowDetailModal(true);
  };

  const handleEdit = (form) => {
    setEditingForm({...form});
    setShowEditModal(true);
  };

  const handleDelete = (formId) => {
    if (window.confirm('Are you sure you want to delete this inspection form?')) {
      const updatedForms = inspectionForms.filter(form => form.id !== formId);
      setInspectionForms(updatedForms);
      
      // Save to localStorage
      try {
        localStorage.setItem('inspectionForms', JSON.stringify(updatedForms));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  };

  const handleDownloadPDF = async (form) => {
    setDownloadingPdf(form.id);
    try {
      const doc = await generateInspectionFormPDF(form, true);
      doc.save(`inspection-form-${form.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedForm(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingForm(null);
  };

  const handleUpdateForm = async (updatedFormData) => {
    if (!updatedFormData) {
      console.error('No form data provided for update');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Updating work order:', updatedFormData);

      // Call the API to update the work order in MongoDB (correct parameter order)
      const response = await workOrderAPI.updateWorkOrder(token, updatedFormData.id, updatedFormData);
      
      if (response.success) {
        console.log('Work order updated successfully:', response.data);
        
        // Update local state with the updated data from server
        const updatedForms = inspectionForms.map(form => 
          form.id === updatedFormData.id 
            ? { ...response.data, lastModified: new Date().toISOString() }
            : form
        );
        
        setInspectionForms(updatedForms);
        setFilteredForms(updatedForms.filter(form => {
          const matchesSearch = !searchTerm || 
            form.spaceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.technician?.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = !statusFilter || form.status === statusFilter;
          const matchesPriority = !priorityFilter || form.priority === priorityFilter;
          
          return matchesSearch && matchesStatus && matchesPriority;
        }));
        
        closeEditModal();
      } else {
        throw new Error(response.message || 'Failed to update work order');
      }
    } catch (error) {
      console.error('Error updating work order:', error);
      setError(error.message || 'Failed to update work order');
      // Don't close the modal on error so user can retry
    }
  };

  // Statistics
  const stats = {
    total: inspectionForms.length,
    approved: inspectionForms.filter(f => f.status === 'Approved').length,
    pending: inspectionForms.filter(f => f.status === 'Pending').length,
    rejected: inspectionForms.filter(f => f.status === 'Rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#232249] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inspection forms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#232249] mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Professional Header */}
        <div className="relative bg-gradient-to-r from-[#232249] via-[#2a2a5a] to-[#232249] rounded-xl shadow-2xl mb-8 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          {/* Header Content */}
          <div className="relative z-10 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              {/* Left Side - Title and Description */}
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mr-4">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Work Orders Management
                    </h1>
                    <div className="flex items-center text-blue-100">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Confined Space Inspection & Safety Protocol System</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
                  Monitor and manage confined space inspection forms, track safety protocols, 
                  and ensure regulatory compliance across all work order activities.
                </p>
              </div>

              {/* Right Side - Time Display */}
              <div className="mt-6 lg:mt-0 lg:ml-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <Clock className="w-5 h-5 text-blue-200 mr-2" />
                      <span className="text-blue-200 text-sm font-medium">Current Time</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-blue-200 text-sm">
                      {formatDisplayDate(currentTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Forms"
          value={stats.total}
          icon={Package}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={FileText}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={AlertTriangle}
        />
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />

      {/* Work Orders Table */}
      <WorkOrderTable
        workOrders={filteredForms}
        onView={handleView}
        onEdit={handleEdit}
        onStatusUpdate={async (formId, status) => {
          try {
            const token = localStorage.getItem('token');
            if (token) {
              // Update via API first - ensure status is lowercase
              await workOrderAPI.updateWorkOrderStatus(token, formId, status.toLowerCase());
              console.log(`Status updated to ${status} for work order ${formId}`);
            }
          } catch (err) {
            console.error('Failed to update status via API:', err);
          }
          
          // Update local state regardless - use the status as provided by the component
          const updatedForms = inspectionForms.map(form => 
            form.id === formId 
              ? { ...form, status: status.toLowerCase(), lastModified: new Date().toISOString() }
              : form
          );
          setInspectionForms(updatedForms);
          
          // Also update localStorage as backup
          try {
            localStorage.setItem('inspectionForms', JSON.stringify(updatedForms));
          } catch (err) {
            console.error('Failed to save to localStorage:', err);
          }
        }}
      />

      {/* View Modal */}
      <ViewModal
        showDetailModal={showDetailModal}
        selectedForm={selectedForm}
        closeDetailModal={closeDetailModal}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
        getStatusIcon={getStatusIcon}
        downloadPDF={handleDownloadPDF}
        downloadingPdf={downloadingPdf}
      />

      {/* Edit Modal */}
      <EditModal
        showEditModal={showEditModal}
        editingForm={editingForm}
        setEditingForm={setEditingForm}
        closeEditModal={closeEditModal}
        handleUpdateForm={handleUpdateForm}
        formatDate={formatDate}
      />
      </div>
    </div>
  );
};

export default TechnicianWorkOrders;
