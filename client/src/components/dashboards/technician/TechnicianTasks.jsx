import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Wrench,
  FileText,
  Play,
  Pause,
  Check,
  RefreshCw,
  AlertCircle,
  MapIcon,
  Map,
  Plus,
  X
} from 'lucide-react';
import { technicianLocationService } from '../../../services/technicianLocationService';
import workOrderAPI from '../../../services/workOrderAPI';
import { technicianAssignmentService } from '../../../services/technicianAssignmentService';

const TechnicianTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [workOrders, setWorkOrders] = useState([]);
  const [previouslyAssignedLocation, setPreviouslyAssignedLocation] = useState(null);

  // Function to geocode address and get coordinates
  const geocodeAddress = async (address) => {
    try {
      if (!address || typeof address !== 'object') return null;

      const addressString = [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country
      ].filter(Boolean).join(', ');

      if (!addressString.trim()) return null;

      console.log('Attempting to geocode address:', addressString);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&addressdetails=1`
      );

      const data = await response.json();
      if (data && data.length > 0) {
        const coords = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
        console.log('Geocoded coordinates:', coords);
        return coords;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load location assignment first (service returns { success, data }) where data is null or the active location
      const locationResponse = await technicianLocationService.getMyLocation();
      const loc = locationResponse?.data || null;

      if (loc) {
        console.log('Location data received:', loc); // Debug log to see what coordinates are available

        let coordinates = {
          latitude: loc.latitude || loc.lat || loc.coordinates?.latitude || loc.coordinates?.lat || null,
          longitude: loc.longitude || loc.lng || loc.coordinates?.longitude || loc.coordinates?.lng || null
        };

        // If coordinates are not available, try to geocode from address
        if ((!coordinates.latitude || !coordinates.longitude) && loc.address) {
          console.log('Coordinates not found, attempting geocoding...');
          const geocodedCoords = await geocodeAddress(loc.address);
          if (geocodedCoords) {
            coordinates = geocodedCoords;
            console.log('Successfully geocoded coordinates:', coordinates);
          } else {
            console.log('Geocoding failed, coordinates remain unavailable');
          }
        }

        // Normalize locationData to the component's expected shape
        const normalized = {
          location: {
            name: loc.name || loc.locationName || loc.location?.name || '',
            description: loc.description || loc.desc || loc.location?.description || ''
          },
          coordinates: coordinates,
          assignedDate: loc.assignedTechnician?.assignedDate || loc.assignedDate || null,
          raw: loc
        };

        console.log('Final normalized coordinates:', normalized.coordinates); // Debug log for normalized coordinates

        setLocationData(normalized);
        setHasAssignment(true);

        // Load tasks if assigned
        const tasksResponse = await technicianLocationService.getMyTasks();
        const t = tasksResponse?.data || [];
        setTasks(Array.isArray(t) ? t : (t.tasks || []));

        // Load work orders for technician (non-blocking)
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
        } catch (workOrderError) {
          console.error('Error fetching work orders:', workOrderError);
          // Continue silently
        }
      } else {
        setLocationData(null);
        setHasAssignment(false);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data on mount and refresh when assignments change
  useEffect(() => {
    loadData();

    const refreshHandler = () => {
      // Re-run loadData when assignment events occur
      loadData();
    };

    window.addEventListener('technician-assigned', refreshHandler);
    window.addEventListener('technician-unassigned', refreshHandler);

    return () => {
      window.removeEventListener('technician-assigned', refreshHandler);
      window.removeEventListener('technician-unassigned', refreshHandler);
    };
  }, [loadData]);

  const formatDueDate = (date) => {
    if (!date) return 'No due date';
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Due Today';
    } else if (diffDays === 1) {
      return 'Due Tomorrow';
    } else if (diffDays > 1) {
      return `Due in ${diffDays} days`;
    } else {
      return `Overdue by ${Math.abs(diffDays)} days`;
    }
  };

  // Safely join arrays or provide a readable fallback
  const safeJoin = (val) => {
    if (Array.isArray(val)) return val.join(', ');
    if (val == null) return '—';
    try { return String(val); } catch (e) { return '—'; }
  };

  // Helper: Status icon for a task
  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'in-progress':
        return <Clock className="h-5 w-5 text-[#232249] mr-2" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-[#232249] mr-2" />;
      case 'pending':
      default:
        return <FileText className="h-5 w-5 text-[#232249] mr-2" />;
    }
  };

  // Helper: Priority color classes
  const getPriorityColor = (priority) => {
    const p = (priority || '').toString().toLowerCase();
    if (p.includes('high')) return 'border-[#232249]/30 text-[#232249]';
    if (p.includes('medium')) return 'border-[#232249]/30 text-[#232249]';
    if (p.includes('low')) return 'border-[#232249]/30 text-[#232249]';
    return 'border-[#232249]/20 text-[#232249]/80';
  };

  // Helper: Status color classes
  const getStatusColor = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'pending') return 'border-[#232249]/30 text-[#232249]';
    if (s === 'in-progress') return 'border-[#232249]/30 text-[#232249]';
    if (s === 'completed') return 'border-[#232249]/30 text-[#232249]';
    return 'border-[#232249]/20 text-[#232249]/80';
  };

  // Minimal task action handler (optimistic UI). Replace with API calls if available.
  const handleTaskAction = async (taskId, action) => {
    try {
      setTasks(prev => prev.map(t => {
        const id = t.id || t._id || t.taskId;
        if (id !== taskId) return t;
        let newStatus = t.status;
        if (action === 'start') newStatus = 'in-progress';
        if (action === 'pause') newStatus = 'pending';
        if (action === 'complete') newStatus = 'completed';
        return { ...t, status: newStatus };
      }));

      // TODO: Call backend API to persist status change. For now we optimistically update UI.
      // Example: await technicianLocationService.updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleViewMap = () => {
    try {
      const locationToUse = displayLocationData;
      if (!locationToUse?.coordinates?.latitude || !locationToUse?.coordinates?.longitude) {
        alert('Location coordinates not available.');
        return;
      }
      const lat = locationToUse.coordinates.latitude;
      const lng = locationToUse.coordinates.longitude;
      // Build a safe, encoded URL and open it in a new tab/window
      const coords = `${lat},${lng}`;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (newWindow) newWindow.focus();
    } catch (error) {
      console.error('Error opening map:', error);
      alert('Failed to open location map. Please try again.');
    }
  };

  const handleAddInspection = () => {
    try {
      if (isPreviouslyAssigned) {
        alert('Cannot add inspection to a previously assigned location.');
        return;
      }
      const locationToUse = displayLocationData;
      if (!locationToUse?.raw) {
        alert('No assigned location found. Please contact your manager.');
        return;
      }
      // Navigate to inspection form
      window.location.href = '/technician/inspection-forms';
    } catch (error) {
      console.error('Error navigating to inspection form:', error);
      alert('Failed to open inspection form. Please try again.');
    }
  };

  // Unassign technician from location without closing work orders
  const handleUnassignLocation = async () => {
    try {
      if (!locationData?.raw?._id) {
        alert('Location information not available. Cannot unassign.');
        return;
      }

      const locationId = locationData.raw._id;

      // If there are active work orders, warn the user that they will remain open
      const activeOrders = (workOrders || []).filter(o => ['in-progress','approved','pending'].includes(o.status));
      let confirmMessage = `Unassign from ${locationData.location?.name || 'this location'}?`;
      if (activeOrders.length > 0) {
        confirmMessage = `There are ${activeOrders.length} open work order(s) at this location. Unassigning will NOT close them. Are you sure you want to unassign from ${locationData.location?.name || 'this location'}?`;
      }

      if (!window.confirm(confirmMessage)) return;

      // Perform unassignment only
      const unassignResult = await technicianAssignmentService.removeTechnicianAssignment(locationId);

      if (unassignResult && unassignResult.success) {
        // Preserve the location for reference
        setPreviouslyAssignedLocation({
          location: locationData.location,
          coordinates: locationData.coordinates,
          assignedDate: locationData.assignedDate,
          unassignedDate: new Date().toISOString(),
          status: 'unassigned',
          raw: locationData.raw
        });

        // Clear active assignment
        setLocationData(null);
        setHasAssignment(false);

        // Notify other parts of the app
        window.dispatchEvent(new CustomEvent('technician-unassigned', { detail: { locationId, technicianId: 'current-user' } }));

        alert('Successfully unassigned from location. Work orders (if any) were left unchanged.');

        // Refresh to update lists
        await loadData();
        return;
      }

      // If the API returned an error shape
      throw new Error(unassignResult?.error || 'Failed to unassign from location');
    } catch (err) {
      console.error('Error unassigning technician:', err);
      let msg = 'Failed to unassign from location.';
      if (err.response?.status === 401) {
        msg = 'Authentication failed. Please log in again.';
        window.location.href = '/login';
        return;
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      alert(msg);
    }
  };

  // Note: Closing work orders is intentionally disabled here. The desired behavior
  // is to only unassign the technician from the location when the action button
  // is used. The full work order lifecycle should be handled from the Work Orders
  // UI by authorized roles. See `handleUnassignLocation` which performs the
  // unassign-only flow and preserves the previously assigned location for
  // reference.

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="w-full flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-[#232249]/10 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-[#232249] animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-[#232249]">Loading Your Tasks</h2>
                <p className="text-gray-600 text-sm">Please wait while we fetch your assignment details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="w-full flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center space-y-2 max-w-md">
                <h2 className="text-xl font-semibold text-gray-900">Error Loading Tasks</h2>
                <p className="text-gray-600 text-sm">{error}</p>
                <div className="pt-4">
                  <button
                    onClick={loadData}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors font-medium text-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAssignment && !previouslyAssignedLocation) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="w-full flex-1 p-6">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#232249]/20 p-16 hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-3xl flex items-center justify-center shadow-xl">
                  <MapIcon className="h-12 w-12 text-[#232249]/60" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center space-y-4 max-w-lg">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-[#232249] via-[#232249]/90 to-[#232249]/70 bg-clip-text text-transparent">No Location Assignment</h2>
                <p className="text-[#232249]/70 font-medium text-lg leading-relaxed">
                  You are not currently assigned to any location. Please contact your manager to get assigned to a location to view and manage tasks.
                </p>
                <div className="pt-6">
                  <button
                    onClick={loadData}
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-2xl hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
                  >
                    <RefreshCw className="h-6 w-6" />
                    <span>Check Assignment Status</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
                <div className="bg-gradient-to-br from-[#232249]/5 to-[#232249]/10 p-6 rounded-2xl border border-[#232249]/10 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/20 to-[#232249]/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-6 w-6 text-[#232249]" />
                  </div>
                  <h3 className="font-bold text-[#232249] mb-2">Location Assignment</h3>
                  <p className="text-[#232249]/70 text-sm">Get assigned to a specific location by your manager</p>
                </div>
                <div className="bg-gradient-to-br from-[#232249]/5 to-[#232249]/10 p-6 rounded-2xl border border-[#232249]/10 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/20 to-[#232249]/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-6 w-6 text-[#232249]" />
                  </div>
                  <h3 className="font-bold text-[#232249] mb-2">Task Management</h3>
                  <p className="text-[#232249]/70 text-sm">View and manage tasks for your assigned location</p>
                </div>
                <div className="bg-gradient-to-br from-[#232249]/5 to-[#232249]/10 p-6 rounded-2xl border border-[#232249]/10 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/20 to-[#232249]/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-6 w-6 text-[#232249]" />
                  </div>
                  <h3 className="font-bold text-[#232249] mb-2">Work Orders</h3>
                  <p className="text-[#232249]/70 text-sm">Access and update work orders for your location</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine which location data to display
  const displayLocationData = locationData || previouslyAssignedLocation;
  const isPreviouslyAssigned = !hasAssignment && previouslyAssignedLocation;

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="w-full flex-1 p-6 space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
          <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 p-4 md:p-6 border-b border-[#232249]/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-[#232249] via-[#232249]/90 to-[#232249]/70 bg-clip-text text-transparent">My Tasks</h1>
                  <p className="text-[#232249]/60 text-sm font-medium">Manage your assigned location and tasks</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-white/80 px-3 py-2 rounded-lg border border-[#232249]/20 shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${isPreviouslyAssigned ? 'bg-[#232249]' : 'bg-[#232249]'} animate-pulse`}></div>
                  <span className={`text-xs font-semibold ${isPreviouslyAssigned ? 'text-[#232249]' : 'text-[#232249]'}`}>
                    {isPreviouslyAssigned ? 'Previously Assigned' : 'Active Assignment'}
                  </span>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-lg hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Location Card */}
              <div className="bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-4 py-3 rounded-xl border border-[#232249]/10 hover:border-[#232249]/20 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-[#232249]/70" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Location</p>
                    <p className="text-[#232249] font-semibold text-sm truncate">{displayLocationData?.location?.name || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Date Card */}
              <div className="bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-4 py-3 rounded-xl border border-[#232249]/10 hover:border-[#232249]/20 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-[#232249]/70" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Assignment</p>
                    <p className="text-[#232249] font-semibold text-sm truncate">
                      {isPreviouslyAssigned ? 'Previously Assigned' : 'Assigned'}: {
                        (displayLocationData && displayLocationData.assignedDate) ? 
                          new Date(displayLocationData.assignedDate).toLocaleDateString() : '—'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Unassignment Date Card - Only show if previously assigned */}
              {isPreviouslyAssigned && displayLocationData.unassignedDate && (
                <div className="bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-4 py-3 rounded-xl border border-[#232249]/10 hover:border-[#232249]/20 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <X className="h-4 w-4 text-[#232249]/70" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Unassigned</p>
                      <p className="text-[#232249] font-semibold text-sm">
                        {new Date(displayLocationData.unassignedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Details Section */}
        <div className={`bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden ${isPreviouslyAssigned ? 'ring-1 ring-orange-200/40' : ''}`}>
          <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 p-4 md:p-6 border-b border-[#232249]/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">
                    {isPreviouslyAssigned ? 'Previously Assigned Location' : 'Location Details'}
                  </h2>
                  <p className="text-[#232249]/60 text-sm font-medium">Manage your assigned location</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 px-3 py-2 md:px-4 md:py-2 rounded-xl border border-[#232249]/20 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isPreviouslyAssigned ? 'bg-[#232249]' : 'bg-[#232249]'} animate-pulse`}></div>
                <span className={`text-xs md:text-sm font-semibold ${isPreviouslyAssigned ? 'text-[#232249]' : 'text-[#232249]'}`}>
                  {isPreviouslyAssigned ? 'Unassigned' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {isPreviouslyAssigned && (
            <div className="mx-4 md:mx-6 mt-4 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-blue-900 text-sm">
                  Location was unassigned. View details and map for reference.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Location Info - Compact */}
              <div className="md:col-span-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg md:text-xl font-bold text-[#232249] leading-tight">{displayLocationData?.location?.name || '—'}</h3>
                  <p className="text-[#232249]/70 text-sm leading-relaxed">{displayLocationData?.location?.description || 'No description available'}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-3 py-2 md:px-4 md:py-3 rounded-xl border border-[#232249]/10">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-[#232249]/70" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Assignment</p>
                      <p className="text-[#232249] font-semibold text-sm truncate">
                        {isPreviouslyAssigned ? 'Previously Assigned' : 'Assigned'}: {
                          (displayLocationData && displayLocationData.assignedDate) ? 
                            new Date(displayLocationData.assignedDate).toLocaleDateString() : '—'
                        }
                      </p>
                    </div>
                  </div>
                  {isPreviouslyAssigned && displayLocationData.unassignedDate && (
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-3 py-2 md:px-4 md:py-3 rounded-xl border border-[#232249]/10">
                      <X className="h-3 w-3 md:h-4 md:w-4 text-[#232249]/70" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Unassigned</p>
                        <p className="text-[#232249] font-semibold text-sm">
                          {new Date(displayLocationData.unassignedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Compact Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleViewMap}
                    className="group flex items-center justify-center space-x-2 px-3 py-3 md:px-4 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-xl hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                  >
                    <Map className="h-3 w-3 md:h-4 md:w-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Map</span>
                  </button>
                  <button 
                    onClick={handleAddInspection}
                    className={`group flex items-center justify-center space-x-2 px-3 py-3 md:px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm ${
                      isPreviouslyAssigned 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white hover:from-[#232249]/90 hover:to-[#232249]'
                    }`}
                    disabled={isPreviouslyAssigned}
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Inspect</span>
                  </button>
                </div>

                {!isPreviouslyAssigned && workOrders.length > 0 && (
                  <button 
                    onClick={handleUnassignLocation}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-xl hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                  >
                    <X className="h-4 w-4" />
                    <span>Unassign Location</span>
                  </button>
                )}
              </div>

              {/* Google Map View - Compact */}
              <div className="md:col-span-2 bg-white/90 backdrop-blur-xl rounded-xl border border-[#232249]/20 overflow-hidden shadow-lg">
                <div className="p-4 bg-gradient-to-br from-[#232249]/5 to-[#232249]/10 border-b border-[#232249]/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${isPreviouslyAssigned ? 'bg-[#232249]' : 'bg-[#232249]'} animate-pulse`}></div>
                      <h4 className="text-lg font-bold text-[#232249]">Location Map</h4>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-[#232249]/70 bg-white/80 px-3 py-1 rounded-lg border border-[#232249]/20 shadow-sm">
                      <Map className="h-4 w-4" />
                      <span className="font-semibold">Google Maps</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  {displayLocationData?.coordinates?.latitude && displayLocationData?.coordinates?.longitude ? (
                    <div className="relative group">
                      <iframe
                        title={`assigned-location-map-${displayLocationData.raw._id || displayLocationData.raw.id}`}
                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${displayLocationData.coordinates.longitude}!3d${displayLocationData.coordinates.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${displayLocationData.coordinates.latitude}%2C${displayLocationData.coordinates.longitude}!5e0!3m2!1sen!2sus!4v1690000000000!5m2!1sen!2sus`}
                        width="100%"
                        height="280"
                        style={{ border: 0, filter: 'contrast(1.05) brightness(1.02)' }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="rounded-b-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-b-xl"></div>
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xl rounded-lg px-3 py-2 shadow-lg border border-[#232249]/20">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            try {
                              const lat = displayLocationData.coordinates.latitude;
                              const lng = displayLocationData.coordinates.longitude;
                              const coords = `${lat},${lng}`;
                              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
                              const w = window.open(url, '_blank', 'noopener,noreferrer');
                              if (w) w.focus();
                            } catch (err) {
                              console.error('Error opening maps link:', err);
                              alert('Failed to open maps.');
                            }
                          }}
                          className="text-xs text-[#232249] hover:text-[#232249]/80 font-bold flex items-center space-x-1"
                        >
                          <Map className="h-4 w-4" />
                          <span>Open Maps</span>
                        </a>
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#232249]/95 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm border border-white/30">
                        📍 Location
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                            <MapIcon className="h-8 w-8 text-[#232249]/60" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-full flex items-center justify-center shadow-lg">
                            <AlertTriangle className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[#232249] font-bold text-lg">Interactive Map Unavailable</p>
                          <p className="text-[#232249]/70 text-sm max-w-xs leading-relaxed">
                            Location coordinates are not available for this assignment. Please contact your manager to update the location with proper coordinates.
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              const locationName = displayLocationData?.location?.name || 'the location';
                              alert(`Please contact your manager to add coordinates for ${locationName}. The map will be available once coordinates are provided.`);
                            }}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-lg hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span>Contact Manager</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards removed per request */}

        {/* Task List removed per request */}
      </div>
    </div>
  );
};

export default TechnicianTasks;
