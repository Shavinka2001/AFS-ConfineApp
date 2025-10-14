import React, { useState } from 'react';
import {
  Eye,
  Edit,
  Check,
  X,
  Pause,
  Play,
  Download,
  Calendar,
  Clock,
  User,
  MapPin,
  Building,
  AlertTriangle,
  Shield,
  FileText,
  ImageIcon,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Save,
  XCircle
} from 'lucide-react';

// Import the new comprehensive edit form
import AdminEditWorkOrderForm from './AdminEditWorkOrderForm';

// Consolidated PDF Generator - Groups similar confined spaces into single reports
const consolidateEntries = (entries) => {
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
      const consolidatedEntry = consolidateGroup(group);
      consolidated.push(consolidatedEntry);
    }
  });

  return consolidated;
};

const consolidateGroup = (group) => {
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

const AdminWorkOrdersTable = ({ 
  workOrders = [], 
  onView, 
  onStatusUpdate,
  onDownloadPDF,
  onUpdateOrder,
  onDeleteOrder
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Auto-hide notification after 6 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800 border-gray-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'approved': 'bg-blue-100 text-blue-800 border-blue-200',
      'in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'on-hold': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'critical': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStatusActions = (order) => {
    const currentStatus = order.status;
    const actions = [];

    if (currentStatus === 'pending') {
      actions.push(
        <button
          key="approve"
          onClick={() => onStatusUpdate(order.id || order._id, 'approved')}
          className="flex items-center px-3 py-2 text-sm text-[#232249] hover:bg-gray-50 rounded-lg transition-colors font-medium w-full text-left"
        >
          <Check className="w-4 h-4 mr-2" />
          Approve
        </button>,
        <button
          key="reject"
          onClick={() => onStatusUpdate(order.id || order._id, 'cancelled')}
          className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium w-full text-left"
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </button>
      );
    }

    if (currentStatus === 'approved') {
      actions.push(
        <button
          key="start"
          onClick={() => onStatusUpdate(order.id || order._id, 'in-progress')}
          className="flex items-center px-3 py-2 text-sm text-[#232249] hover:bg-gray-50 rounded-lg transition-colors font-medium w-full text-left"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Work
        </button>
      );
    }

    if (currentStatus === 'in-progress') {
      actions.push(
        <button
          key="complete"
          onClick={() => onStatusUpdate(order.id || order._id, 'completed')}
          className="flex items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium w-full text-left"
        >
          <Check className="w-4 h-4 mr-2" />
          Complete
        </button>,
        <button
          key="hold"
          onClick={() => onStatusUpdate(order.id || order._id, 'on-hold')}
          className="flex items-center px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium w-full text-left"
        >
          <Pause className="w-4 h-4 mr-2" />
          Put on Hold
        </button>
      );
    }

    if (currentStatus === 'on-hold') {
      actions.push(
        <button
          key="resume"
          onClick={() => onStatusUpdate(order.id || order._id, 'in-progress')}
          className="flex items-center px-3 py-2 text-sm text-[#232249] hover:bg-gray-50 rounded-lg transition-colors font-medium w-full text-left"
        >
          <Play className="w-4 h-4 mr-2" />
          Resume
        </button>
      );
    }

    return actions;
  };

  // Handle Edit Order
  const handleEditOrder = (order) => {
    if (onUpdateOrder) {
      setEditingOrder(order);
    } else {
      console.warn('No onUpdateOrder handler provided');
      alert('Edit functionality not implemented yet');
    }
  };

  // Handle Save Edit
  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingOrder(null);
  };

  // Handle Delete Order
  const handleDeleteOrder = (orderId) => {
    if (onDeleteOrder) {
      setDeleteConfirmId(orderId);
    } else {
      console.warn('No onDeleteOrder handler provided');
      alert('Delete functionality not implemented yet');
    }
  };

  // Handle Consolidated PDF Download
  const handleDownloadConsolidatedPDFs = async () => {
    if (!workOrders || workOrders.length === 0) {
      setNotification({
        type: 'error',
        title: 'No Work Orders Available',
        message: 'No work orders available to consolidate. Please add some work orders first.'
      });
      return;
    }

    if (!onDownloadPDF) {
      setNotification({
        type: 'error',
        title: 'Feature Not Available',
        message: 'PDF download functionality not available. Please contact support.'
      });
      return;
    }

    // Consolidate entries first
      const consolidatedEntries = consolidateEntries(workOrders);
      
      console.log(`Original entries: ${workOrders.length}`);
      console.log(`Consolidated entries: ${consolidatedEntries.length}`);
      console.log(`Saved ${workOrders.length - consolidatedEntries.length} duplicate reports`);
      
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
        _totalOriginalEntries: workOrders.length,
        _totalConsolidatedEntries: consolidatedEntries.length,
        _savedReports: workOrders.length - consolidatedEntries.length,
        _generatedAt: new Date().toISOString(),
        consolidatedEntries: consolidatedEntries,
        // Use metadata from the first entry as base
        ...consolidatedEntries[0],
        // Override with consolidated report title
        workOrderId: `CONSOLIDATED-REPORT-${new Date().toISOString().split('T')[0]}`,
        uniqueId: `CONSOLIDATED-REPORT-${new Date().toISOString().split('T')[0]}`,
        spaceName: `Consolidated Report (${consolidatedEntries.length} entries)`,
        building: 'Multiple Buildings',
        locationDescription: `Consolidated assessment report containing ${consolidatedEntries.length} entries from ${workOrders.length} original assessments`
      };

      console.log(`� Generating single consolidated PDF with ${consolidatedEntries.length} entries...`);
      
      // Generate single consolidated PDF
      await onDownloadPDF(consolidatedReport).then(() => {
        console.log(`✅ Successfully generated consolidated PDF with ${consolidatedEntries.length} entries`);
        
        // Show modern success notification
        setNotification({
          type: 'success',
          title: 'PDF Generated Successfully!',
          message: `Generated 1 consolidated PDF containing ${consolidatedEntries.length} entries from ${workOrders.length} original assessments`,
          stats: {
            consolidated: consolidatedEntries.length,
            original: workOrders.length,
            saved: workOrders.length - consolidatedEntries.length,
            efficiency: Math.round(((workOrders.length - consolidatedEntries.length) / workOrders.length) * 100)
          }
        });
      }).catch(pdfError => {
        console.error(`❌ Failed to generate consolidated PDF`, pdfError);
        setNotification({
          type: 'error',
          title: 'PDF Generation Failed',
          message: 'Error generating consolidated PDF. Please try again.',
          error: pdfError.message
        });
      });

  };

  if (!workOrders || workOrders.length === 0) {
    return (
      <div className="space-y-6">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-[#232249] to-[#2d2d5f] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Work Orders Management
                </h2>
                <p className="text-white/70 text-sm">
                  Manage confined space assessments and work orders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="bg-gradient-to-br from-[#232249]/5 to-[#232249]/10 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <FileText className="w-16 h-16 text-[#232249]" />
          </div>
          <h3 className="text-2xl font-bold text-[#232249] mb-4">No Work Orders Found</h3>
          <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
            No confined space assessments have been submitted yet. Work orders will appear here once technicians submit their assessments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-[#232249] to-[#2d2d5f] rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Work Orders Management
                </h2>
                <p className="text-white/70 text-sm">
                  Manage confined space assessments and work orders
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* Enhanced Table Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#232249' }}>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Work Order
                  </span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Status
                  </span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Technician
                  </span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Building
                  </span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workOrders.map((order) => (
                <React.Fragment key={order.id || order._id}>
                  <tr className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 transition-all duration-200 group">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(order.id || order._id)}
                          className="p-1 hover:bg-[#232249]/10 rounded-lg transition-all duration-200"
                        >
                          {expandedRows.has(order.id || order._id) ? (
                            <ChevronUp className="h-4 w-4 text-[#232249]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#232249]" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#232249] text-sm mb-1">
                            {order.workOrderId || order.uniqueId || `WO-${new Date(order.createdAt).getFullYear()}-${String(order.id || order._id).slice(-4)}`}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {order.spaceName || 'Unnamed Space'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <div className="text-xs text-[#232249] font-medium">
                          {formatDate(order.surveyDate || order.createdAt)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-[#232249] text-sm mb-1">{order.technician || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#232249] mb-1 truncate">
                          {order.building || 'Unknown Building'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {order.locationDescription || order.location || 'No description'}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(order.priority)}`}>
                        {order.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onView && onView(order)}
                          className="p-2 text-gray-400 hover:text-[#232249] hover:bg-[#232249]/10 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit Order"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {onDownloadPDF && (
                          <button
                            onClick={() => onDownloadPDF(order)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteOrder(order.id || order._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete Order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === (order.id || order._id) ? null : (order.id || order._id))}
                            className="p-2 text-gray-400 hover:text-[#232249] hover:bg-[#232249]/10 rounded-lg transition-all duration-200"
                            title="More Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {actionMenuOpen === (order.id || order._id) && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                              <div className="py-1">
                                {renderStatusActions(order)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {expandedRows.has(order.id || order._id) && (
                    <tr>
                      <td colSpan="6" className="px-3 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Left Column - Space Information */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-[#232249] flex items-center gap-2 text-sm pb-2 border-b border-gray-200">
                              <Building className="h-4 w-4" />
                              Space Information
                            </h4>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="font-medium text-[#232249] block mb-1">Space Name</span>
                                  <p className="text-gray-700 bg-gray-50 rounded px-2 py-1 text-xs">{order.spaceName || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-[#232249] block mb-1">Building</span>
                                  <p className="text-gray-700 bg-gray-50 rounded px-2 py-1 text-xs">{order.building || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                  <span className="font-medium text-[#232249] block mb-1">Description</span>
                                  <p className="text-gray-700 bg-gray-50 rounded px-2 py-1 text-xs">{order.locationDescription || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-[#232249] block mb-1">Confined Space</span>
                                  <p className="text-gray-700 bg-gray-50 rounded px-2 py-1 text-xs">{order.isConfinedSpace ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-[#232249] block mb-1">Permit Required</span>
                                  <p className="text-gray-700 bg-gray-50 rounded px-2 py-1 text-xs">{order.permitRequired ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Safety & Requirements */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-[#232249] flex items-center gap-2 text-sm pb-2 border-b border-gray-200">
                              <Shield className="h-4 w-4" />
                              Safety Requirements
                            </h4>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="font-medium text-[#232249] text-xs">PPE Required:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${order.ppeRequired ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {order.ppeRequired ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="font-medium text-[#232249] text-xs">Air Monitor:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${order.dedicatedAirMonitor ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {order.dedicatedAirMonitor ? 'Required' : 'Not Required'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="font-medium text-[#232249] text-xs">Warning Sign:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${order.warningSignPosted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {order.warningSignPosted ? 'Posted' : 'Not Posted'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Work Order</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this work order? All associated data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteOrder && onDeleteOrder(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Admin Edit Work Order Form */}
      <AdminEditWorkOrderForm
        showEditModal={editingOrder !== null}
        editingOrder={editingOrder}
        setEditingOrder={setEditingOrder}
        closeEditModal={handleCancelEdit}
        handleUpdateForm={async () => {
          if (onUpdateOrder && editingOrder) {
            try {
              await onUpdateOrder(editingOrder._id || editingOrder.id, editingOrder);
              setEditingOrder(null);
            } catch (error) {
              console.error('Error updating work order:', error);
              throw error; // Re-throw to let the form handle the error display
            }
          }
        }}
        formatDate={formatDate}
      />

      {/* Modern Success/Error Notification */}
      {notification && (
        <div className="fixed inset-0 flex items-start justify-center z-50 pointer-events-none pt-20">
          <div className={`
            pointer-events-auto transform transition-all duration-500 ease-out
            ${notification ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}
          `}>
            <div className={`
              max-w-md w-full mx-4 rounded-2xl shadow-2xl border backdrop-blur-sm
              ${notification.type === 'success' 
                ? 'bg-white/95 border-green-200 shadow-green-100/50' 
                : 'bg-white/95 border-red-200 shadow-red-100/50'
              }
            `}>
              {notification.type === 'success' ? (
                // Success Notification
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#232249] mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotification(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-[#232249] to-[#2d2d5f] rounded-xl p-3 text-white">
                      <div className="text-2xl font-bold">{notification.stats.consolidated}</div>
                      <div className="text-xs opacity-80">Final Entries</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white">
                      <div className="text-2xl font-bold">{notification.stats.efficiency}%</div>
                      <div className="text-xs opacity-80">Efficiency Gain</div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Original Reports:</span>
                      <span className="font-semibold text-[#232249]">{notification.stats.original}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-600">Duplicates Eliminated:</span>
                      <span className="font-semibold text-green-600">{notification.stats.saved}</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Consolidation Progress</span>
                      <span>{notification.stats.efficiency}% Complete</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 rounded-full h-2 transition-all duration-1000 ease-out"
                        style={{ width: `${notification.stats.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                // Error Notification
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-red-100 rounded-full p-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-800 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotification(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {notification.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-700 font-mono">
                        {notification.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkOrdersTable;
