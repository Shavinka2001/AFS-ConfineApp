import React, { useState, useEffect } from 'react';
import { 
  MapPin, Building, Users, Plus, Search, Filter, Edit, 
  Trash2, UserCheck, UserX, Eye, Settings, Calendar,
  Phone, Mail, AlertTriangle, CheckCircle, ArrowRight, RefreshCw
} from 'lucide-react';
import { locationService } from '../../services/locationAPI';
import { technicianAssignmentService } from '../../services/technicianAssignmentService';
import { useAuth } from '../../contexts/AuthContext';
import LocationForm from './LocationForm';
import LocationWorkflow from './LocationWorkflow';
import BuildingManagement from './BuildingManagement';

const LocationManagement = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [buildings, setBuildings] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [showBuildingManagement, setShowBuildingManagement] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    technicianAssigned: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchLocations();
    fetchTechnicians();
  }, [filters, pagination.current]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await locationService.getLocations(params);
      if (response.data.success) {
        const locationsData = response.data.data.locations;
        setLocations(locationsData);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));

        // Fetch buildings for each location
        for (const location of locationsData) {
          fetchLocationBuildings(location._id);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationBuildings = async (locationId) => {
    try {
      const response = await locationService.getBuildingsByLocation(locationId);
      if (response.data.success) {
        setBuildings(prev => ({
          ...prev,
          [locationId]: response.data.data.buildings || []
        }));
      }
    } catch (error) {
      console.error('Error fetching buildings for location:', locationId, error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await technicianAssignmentService.getAllTechnicians();
      if (response && response.success && Array.isArray(response.data)) {
        setTechnicians(response.data);
      } else {
        console.warn('Invalid technicians response:', response);
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
      setTechnicians([]);
    }
  };

  const handleCreateLocation = () => {
    setShowWorkflow(true);
  };

  const handleCreateSimple = () => {
    setEditLocation(null);
    setShowForm(true);
  };

  const handleWorkflowComplete = (result) => {
    setShowWorkflow(false);
    fetchLocations();
    
    // Show success message
    if (result && result.location && result.location.name) {
      if (result.technician) {
        console.log(`Location "${result.location.name}" created with ${result.buildingsCount || 0} buildings and assigned to ${result.technician.firstName} ${result.technician.lastName}`);
      } else {
        console.log(`Location "${result.location.name}" created with ${result.buildingsCount || 0} buildings`);
      }
    } else {
      console.log('Location workflow completed successfully');
    }
  };

  const handleEditLocation = (location) => {
    setEditLocation(location);
    setShowForm(true);
  };

  const handleSaveLocation = async (savedLocation) => {
    setShowForm(false);
    setEditLocation(null);
    await fetchLocations();
  };

  const handleManageBuildings = (location) => {
    setSelectedLocation(location);
    setShowBuildingManagement(true);
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location? This will permanently remove the location and all associated data. If the location has buildings, you must delete them first.')) {
      return;
    }

    try {
      await locationService.deleteLocation(locationId);
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);

      // Extract error message from server response
      let errorMessage = 'Failed to delete location';

      if (error.response?.data) {
        // Server returned structured error response
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.response) {
        // Server returned error status but no data
        errorMessage = `Server error: ${error.response.status}`;
      } else if (error.message && !error.message.includes('Request failed')) {
        // Network or other error
        errorMessage = error.message;
      }

      console.log('Final error message:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleAssignTechnician = (location) => {
    setSelectedLocation(location);
    setShowTechnicianModal(true);
  };

  const handleTechnicianAssignment = async (technicianId) => {
    if (!selectedLocation) {
      setError('No location selected');
      return;
    }

    try {
      setError('');
      
      // Find technician details
      const technician = technicians.find(tech => tech._id === technicianId || tech.id === technicianId);
      if (!technician) {
        setError('Selected technician not found');
        return;
      }

      // Prepare technician data
      const technicianData = {
        technicianId: technician._id || technician.id,
        name: `${technician.firstName || ''} ${technician.lastName || ''}`.trim() || technician.name || technician.email,
        email: technician.email,
        phone: technician.phone || technician.contactNumber || ''
      };

      // Validate required fields
      if (!technicianData.technicianId || !technicianData.name || !technicianData.email) {
        setError('Technician information is incomplete');
        return;
      }

      await locationService.assignTechnician(selectedLocation._id, technicianData);

      setShowTechnicianModal(false);
      setSelectedLocation(null);
      await fetchLocations();
      
      // Show success message
      alert(`Technician ${technicianData.name} has been successfully assigned to ${selectedLocation.name}`);
    } catch (error) {
      console.error('Error assigning technician:', error);
      
      let errorMessage = 'Failed to assign technician';
      if (error.response?.status === 409) {
        errorMessage = error.response.data?.message || 'This technician is already assigned to another location';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid technician or location data';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to assign technicians';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleRemoveTechnician = async (locationId) => {
    if (!window.confirm('Are you sure you want to remove the technician from this location?')) {
      return;
    }

    try {
      await locationService.removeTechnician(locationId);
      await fetchLocations();
    } catch (error) {
      console.error('Error removing technician:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to remove technician');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        color: 'bg-green-50 text-green-700 border border-green-200', 
        icon: CheckCircle,
        dotColor: 'bg-green-500'
      },
      inactive: { 
        color: 'bg-gray-50 text-gray-700 border border-gray-200', 
        icon: AlertTriangle,
        dotColor: 'bg-gray-500'
      },
      maintenance: { 
        color: 'bg-yellow-50 text-yellow-700 border border-yellow-200', 
        icon: Settings,
        dotColor: 'bg-yellow-500'
      }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${config.color}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} mr-1.5 animate-pulse`}></div>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Check if user has permission (admin or manager)
  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-16 hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center shadow-xl">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <X className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">Access Denied</h2>
                <p className="text-red-600 font-medium text-lg leading-relaxed max-w-md">
                  You don't have permission to manage locations. This feature is available only to administrators and managers.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-red-500/80 font-medium">
                  <span>Role required:</span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">Admin or Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showWorkflow) {
    return (
      <LocationWorkflow
        onComplete={handleWorkflowComplete}
      />
    );
  }

  if (showBuildingManagement && selectedLocation) {
    return (
      <div>
      
        <BuildingManagement
          locationId={selectedLocation._id}
          locationName={selectedLocation.name}
        />
      </div>
    );
  }

  if (showForm) {
    return (
      <LocationForm
        location={editLocation}
        onSave={handleSaveLocation}
        onCancel={() => setShowForm(false)}
        isEdit={!!editLocation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-[#232249] to-[#2d2d5f] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Location Management</h1>
                  <p className="text-white/80 font-medium text-sm mt-0.5">Manage locations, buildings, and technician assignments</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-xs font-semibold text-white">System Active</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateLocation}
                    className="group flex items-center space-x-2 px-5 py-2.5 bg-[#5b1d1b] text-white rounded-lg hover:bg-[#6d2420] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                  >
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Workflow</span>
                  </button>
                  <button
                    onClick={handleCreateSimple}
                    className="group flex items-center space-x-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                  >
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Quick Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="p-6 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-[#232249]/30 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#232249] to-[#2d2d5f] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#232249]">{locations.length}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Locations</p>
              </div>

              <div className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700">{locations.filter(l => l.status === 'active').length}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Locations</p>
              </div>

              <div className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-700">{locations.filter(l => l.assignedTechnician?.isActive).length}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Assigned Techs</p>
              </div>

              <div className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-[#5b1d1b]/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#5b1d1b] to-[#6d2420] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#5b1d1b]">{Object.values(buildings).reduce((sum, b) => sum + (b?.length || 0), 0)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Buildings</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 shadow-md">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-base">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 text-gray-900 font-medium"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Under Maintenance</option>
            </select>

            <select
              value={filters.technicianAssigned}
              onChange={(e) => handleFilterChange('technicianAssigned', e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 text-gray-900 font-medium"
            >
              <option value="">All Assignments</option>
              <option value="true">With Technician</option>
              <option value="false">Without Technician</option>
            </select>

            <button
              onClick={() => setFilters({ search: '', status: '', technicianAssigned: '' })}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md font-semibold"
            >
              <Filter className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Locations List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-[#232249] to-[#2d2d5f] rounded-xl flex items-center justify-center shadow-lg">
                  <RefreshCw className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#232249] mb-1">Loading Locations</h3>
                <p className="text-gray-600 font-medium text-sm">Please wait while we fetch your location data...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((location) => (
              <div key={location._id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 group">
                {/* Location Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#232249] to-[#2d2d5f] rounded-lg flex items-center justify-center shadow-md">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#232249]">{location.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(location.status)}
                            <span className="text-gray-400 text-xs">•</span>
                            <span className="text-gray-600 text-xs font-medium">{buildings[location._id]?.length || 0} buildings</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium">{location.fullAddress}</span>
                        </div>
                        
                        {location.contactInfo?.phone && (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-medium">{location.contactInfo.phone}</span>
                          </div>
                        )}
                        
                        {location.contactInfo?.email && (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-medium">{location.contactInfo.email}</span>
                          </div>
                        )}
                      </div>

                      {location.description && (
                        <p className="mt-3 text-gray-600 leading-relaxed font-medium text-sm">{location.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditLocation(location)}
                        className="p-2 text-gray-500 hover:text-[#232249] hover:bg-gray-100 rounded-lg transition-all duration-200"
                        title="Edit Location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLocation(location._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete Location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Buildings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-bold text-[#232249] flex items-center">
                          <Building className="h-4 w-4 mr-2 text-[#232249]" />
                          Buildings ({buildings[location._id]?.length || 0})
                        </h4>
                        <button
                          onClick={() => handleManageBuildings(location)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#5b1d1b] text-white rounded-lg hover:bg-[#6d2420] transition-all duration-200 font-semibold text-xs shadow-md hover:shadow-lg"
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      {buildings[location._id]?.length > 0 ? (
                        <div className="space-y-2.5">
                          {buildings[location._id].slice(0, 2).map((building) => (
                            <div key={building._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-bold text-[#232249] mb-1 text-sm">{building.name}</h5>
                                  <p className="text-xs text-gray-600 mb-2">{building.fullAddress}</p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium">
                                    <span>{building.specifications.buildingType}</span>
                                    <span>•</span>
                                    <span>{building.specifications.totalFloors} floors</span>
                                    <span>•</span>
                                    <span>{building.specifications.totalUnits} units</span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  {getStatusBadge(building.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {buildings[location._id].length > 2 && (
                            <div className="text-center py-2">
                              <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                +{buildings[location._id].length - 2} more buildings
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-200">
                            <Building className="h-6 w-6 text-gray-400" />
                          </div>
                          <h5 className="text-[#232249] font-bold mb-1 text-sm">No Buildings Added</h5>
                          <p className="text-gray-600 text-xs font-medium">Create buildings to organize your confined spaces</p>
                        </div>
                      )}
                    </div>

                    {/* Technician Assignment */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-bold text-[#232249] flex items-center">
                          <Users className="h-4 w-4 mr-2 text-[#232249]" />
                          Assigned Technician
                        </h4>
                        
                        {location.assignedTechnician?.isActive ? (
                          <button
                            onClick={() => handleRemoveTechnician(location._id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Remove Technician"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignTechnician(location)}
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Assign Technician"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {location.assignedTechnician?.isActive ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                                <UserCheck className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h5 className="font-bold text-green-900 text-sm">{location.assignedTechnician.name}</h5>
                                <p className="text-xs text-green-700">{location.assignedTechnician.email}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              Active
                            </span>
                          </div>
                          
                          {location.assignedTechnician.phone && (
                            <div className="flex items-center space-x-1.5 text-xs text-green-800 mb-2">
                              <Phone className="h-3.5 w-3.5" />
                              <span className="font-medium">{location.assignedTechnician.phone}</span>
                            </div>
                          )}
                          
                          <div className="text-xs text-green-700 font-medium">
                            Assigned: {new Date(location.assignedTechnician.assignedDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-200">
                            <UserX className="h-6 w-6 text-gray-400" />
                          </div>
                          <h5 className="text-[#232249] font-bold mb-1 text-sm">No Technician Assigned</h5>
                          <p className="text-gray-600 text-xs font-medium mb-3">Assign a technician to manage this location</p>
                          <button
                            onClick={() => handleAssignTechnician(location)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-[#232249] to-[#2d2d5f] text-white rounded-lg hover:from-[#2d2d5f] hover:to-[#232249] transition-all duration-200 font-semibold text-xs shadow-md hover:shadow-lg"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Assign Technician</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {locations.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 hover:shadow-xl transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#232249] to-[#2d2d5f] rounded-xl flex items-center justify-center mx-auto shadow-lg">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#232249] mb-2">No Locations Found</h3>
                    <p className="text-gray-600 font-medium text-base mb-6">Create your first location to get started with managing confined spaces</p>
                    <button
                      onClick={handleCreateLocation}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#232249] to-[#2d2d5f] text-white rounded-lg hover:from-[#2d2d5f] hover:to-[#232249] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-base"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add First Location</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="text-gray-600 font-medium text-sm">
                Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} locations
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                >
                  <ArrowRight className="h-4 w-4 transform rotate-180" />
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-[#232249] font-bold px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 text-sm">
                    Page {pagination.current} of {pagination.pages}
                  </span>
                </div>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.pages}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#232249] to-[#2d2d5f] text-white rounded-lg hover:from-[#2d2d5f] hover:to-[#232249] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold text-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Technician Assignment Modal */}
      {showTechnicianModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-md w-full mx-4 hover:shadow-3xl transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#232249] to-[#2d2d5f] rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#232249]">Assign Technician</h3>
              </div>
              <button
                onClick={() => setShowTechnicianModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-6 font-medium">
              Select a technician to assign to <span className="font-semibold text-[#232249]">{selectedLocation?.name}</span>
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(technicians || []).filter(tech => !locations.some(loc => loc.assignedTechnician?.technicianId === tech._id && loc.assignedTechnician?.isActive)).map((technician) => (
                <button
                  key={technician._id}
                  onClick={() => handleTechnicianAssignment(technician._id)}
                  className="w-full p-4 text-left bg-gray-50 rounded-xl border border-gray-200 hover:border-[#232249]/30 hover:bg-white hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#232249] group-hover:text-[#2d2d5f] transition-colors">
                        {technician.firstName} {technician.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{technician.email}</div>
                      {technician.specializations?.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2 font-medium">
                          Specializations: {technician.specializations.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-[#232249]/10 rounded-lg flex items-center justify-center group-hover:bg-[#232249]/20 transition-colors">
                      <UserCheck className="h-5 w-5 text-[#232249]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {(technicians || []).filter(tech => !locations.some(loc => loc.assignedTechnician?.technicianId === tech._id && loc.assignedTechnician?.isActive)).length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-700 font-semibold">No available technicians</p>
                <p className="text-gray-500 text-sm mt-1">All technicians are currently assigned</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTechnicianModal(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default LocationManagement;
