import React, { useState, useEffect } from 'react';
import { 
  Building, Plus, Search, Filter, Edit, Trash2, Eye, 
  MapPin, Layers, Hash, Calendar, AlertCircle, CheckCircle,
  Settings, Home, Factory, ShoppingBag, Warehouse, RefreshCw, X, ArrowLeft
} from 'lucide-react';
import { locationService } from '../../services/locationAPI';
import { useAuth } from '../../contexts/AuthContext';
import BuildingForm from './BuildingForm';
import ConfinedSpaceModal from './ConfinedSpaceModal';

const BuildingManagement = ({ locationId, locationName }) => {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editBuilding, setEditBuilding] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showConfinedSpaceModal, setShowConfinedSpaceModal] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    buildingType: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchBuildings();
  }, [locationId, filters, pagination.current]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const params = {
        locationId,
        page: pagination.current,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await locationService.getBuildings(params);
      if (response.data.success) {
        setBuildings(response.data.data.buildings);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setError('Failed to fetch buildings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuilding = () => {
    setEditBuilding(null);
    setShowForm(true);
  };

  const handleEditBuilding = (building) => {
    setEditBuilding(building);
    setShowForm(true);
  };

  const handleSaveBuilding = async (savedBuilding) => {
    setShowForm(false);
    setEditBuilding(null);
    await fetchBuildings();
  };

  const handleDeleteBuilding = async (buildingId) => {
    if (!window.confirm('Are you sure you want to delete this building? This action cannot be undone.')) {
      return;
    }

    try {
      await locationService.deleteBuilding(buildingId);
      await fetchBuildings();
    } catch (error) {
      console.error('Error deleting building:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to delete building');
    }
  };

  const handleViewConfinedSpaces = (building) => {
    setSelectedBuilding(building);
    setShowConfinedSpaceModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-[#232249]/10 text-[#232249] border-[#232249]/20', icon: CheckCircle },
      inactive: { color: 'bg-[#232249]/10 text-[#232249]/70 border-[#232249]/20', icon: AlertCircle },
      maintenance: { color: 'bg-[#232249]/10 text-[#232249] border-[#232249]/20', icon: Settings },
      'under-construction': { color: 'bg-[#232249]/10 text-[#232249] border-[#232249]/20', icon: Settings }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${config.color} backdrop-blur-sm shadow-sm`}>
        <Icon className="h-4 w-4 mr-2" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const getBuildingTypeIcon = (type) => {
    const iconMap = {
      residential: Home,
      office: Building,
      retail: ShoppingBag,
      warehouse: Warehouse,
      manufacturing: Factory,
      'mixed-use': Building,
      parking: Building
    };
    return iconMap[type] || Building;
  };

  // Check if user has permission (admin or manager)
  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#232249]/20 p-16 hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-3xl flex items-center justify-center shadow-xl">
                  <AlertCircle className="h-12 w-12 text-[#232249]" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg">
                  <X className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">Access Denied</h2>
                <p className="text-[#232249] font-medium text-lg leading-relaxed">You don't have permission to manage buildings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <BuildingForm
        building={editBuilding}
        locationId={locationId}
        onSave={handleSaveBuilding}
        onCancel={() => setShowForm(false)}
        isEdit={!!editBuilding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back Button */}
        <div className="flex justify-start">
          <button
            onClick={() => window.location.href = '/locations'}
            className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#232249]/10 to-[#232249]/20 text-[#232249] rounded-2xl hover:from-[#232249]/20 hover:to-[#232249]/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm border border-[#232249]/20 hover:border-[#232249]/30"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Back to Location</span>
          </button>
        </div>
        
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
          <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 p-6 border-b border-[#232249]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#232249] via-[#232249]/90 to-[#232249]/70 bg-clip-text text-transparent">Building Management</h1>
                  <p className="text-[#232249]/60 text-sm font-medium">Manage buildings in {locationName} ({buildings.length} total)</p>
                </div>
              </div>
              <button
                onClick={handleCreateBuilding}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-2xl hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-sm"
              >
                <Plus className="h-5 w-5" />
                <span>Add Building</span>
              </button>
            </div>
          </div>
        </div>

      {error && (
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 p-6 hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-xl flex items-center justify-center shadow-lg">
              <AlertCircle className="h-6 w-6 text-[#232249]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#232249]">Error Loading Buildings</h3>
              <p className="text-[#232249]/80 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
        <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 p-6 border-b border-[#232249]/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-lg flex items-center justify-center shadow-lg">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">Filters & Search</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#232249]/40 group-focus-within:text-[#232249] transition-colors duration-300" />
              </div>
              <input
                type="text"
                placeholder="Search buildings..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 border border-[#232249]/20 rounded-xl focus:ring-2 focus:ring-[#232249]/30 focus:border-[#232249] transition-all duration-300 text-[#232249] placeholder-[#232249]/40 font-medium"
              />
            </div>

            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-[#232249]/20 rounded-xl focus:ring-2 focus:ring-[#232249]/30 focus:border-[#232249] transition-all duration-300 text-[#232249] font-medium appearance-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="under-construction">Under Construction</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <div className="w-2 h-2 bg-[#232249]/30 rounded-full"></div>
              </div>
            </div>

            <div className="relative">
              <select
                value={filters.buildingType}
                onChange={(e) => handleFilterChange('buildingType', e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-[#232249]/20 rounded-xl focus:ring-2 focus:ring-[#232249]/30 focus:border-[#232249] transition-all duration-300 text-[#232249] font-medium appearance-none"
              >
                <option value="">All Types</option>
                <option value="residential">Residential</option>
                <option value="office">Office</option>
                <option value="retail">Retail</option>
                <option value="warehouse">Warehouse</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="mixed-use">Mixed Use</option>
                <option value="parking">Parking</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <div className="w-2 h-2 bg-[#232249]/30 rounded-full"></div>
              </div>
            </div>

            <button
              onClick={() => setFilters({ search: '', status: '', buildingType: '' })}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#232249]/10 to-[#232249]/20 text-[#232249] rounded-xl hover:from-[#232249]/20 hover:to-[#232249]/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-[#232249]/20"
            >
              <Filter className="h-4 w-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      {loading ? (
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 p-16 hover:shadow-2xl transition-all duration-500">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-3xl flex items-center justify-center shadow-xl">
                <RefreshCw className="h-12 w-12 text-[#232249] animate-spin" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">Loading Buildings</h2>
              <p className="text-[#232249]/60 font-medium text-lg">Please wait while we fetch your building data...</p>
              <div className="flex items-center justify-center space-x-2 mt-6">
                <div className="w-2 h-2 bg-[#232249]/40 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#232249]/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#232249]/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => {
            const TypeIcon = getBuildingTypeIcon(building.specifications?.buildingType);
            
            return (
              <div key={building._id} className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 hover:shadow-2xl hover:border-[#232249]/30 transition-all duration-500 overflow-hidden group">
                {/* Building Header */}
                <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 p-6 border-b border-[#232249]/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold text-[#232249] truncate leading-tight">
                          {building.name}
                        </h3>
                        {building.buildingNumber && (
                          <p className="text-sm text-[#232249]/60 font-medium">
                            Building #{building.buildingNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(building.status)}
                    </div>
                  </div>
                  
                  {building.fullAddress && (
                    <div className="flex items-start space-x-2 text-sm text-[#232249]/70 bg-white/60 px-3 py-2 rounded-lg border border-[#232249]/10">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#232249]/50" />
                      <span className="font-medium leading-relaxed">{building.fullAddress}</span>
                    </div>
                  )}
                  
                  {building.description && (
                    <p className="text-sm text-[#232249]/70 mt-3 leading-relaxed bg-white/40 px-3 py-2 rounded-lg border border-[#232249]/10">
                      {building.description}
                    </p>
                  )}
                </div>

                {/* Building Details */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-4 py-3 rounded-xl border border-[#232249]/10">
                      <Layers className="h-5 w-5 text-[#232249]/60" />
                      <div>
                        <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Floors</p>
                        <p className="text-[#232249] font-bold text-lg">{building.specifications?.totalFloors || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-4 py-3 rounded-xl border border-[#232249]/10">
                      <Hash className="h-5 w-5 text-[#232249]/60" />
                      <div>
                        <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Units</p>
                        <p className="text-[#232249] font-bold text-lg">{building.specifications?.totalUnits || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-4 py-3 rounded-xl border border-[#232249]/10">
                      <Building className="h-5 w-5 text-[#232249]/60" />
                      <div>
                        <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Type</p>
                        <p className="text-[#232249] font-bold text-sm capitalize">{building.specifications?.buildingType || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    {building.specifications?.yearBuilt && (
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 px-4 py-3 rounded-xl border border-[#232249]/10">
                        <Calendar className="h-5 w-5 text-[#232249]/60" />
                        <div>
                          <p className="text-xs text-[#232249]/60 font-medium uppercase tracking-wide">Built</p>
                          <p className="text-[#232249] font-bold text-lg">{building.specifications.yearBuilt}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confined Spaces Info */}
                  {building.confinedSpacesCount > 0 && (
                    <div className="bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 border border-[#232249]/20 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-lg flex items-center justify-center shadow-lg">
                            <AlertCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#232249]">Confined Spaces</p>
                            <p className="text-[#232249]/70 text-sm">{building.confinedSpacesCount} space{building.confinedSpacesCount !== 1 ? 's' : ''} identified</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewConfinedSpaces(building)}
                          className="px-3 py-2 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-lg hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Building Actions */}
                <div className="bg-gradient-to-r from-[#232249]/5 via-[#232249]/10 to-[#232249]/5 px-6 py-4 border-t border-[#232249]/10">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#232249]/60 bg-white/60 px-3 py-1 rounded-lg border border-[#232249]/10">
                      <span className="font-semibold">Created:</span> {new Date(building.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewConfinedSpaces(building)}
                        className="p-2 text-[#232249]/70 hover:text-[#232249] bg-white/60 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditBuilding(building)}
                        className="p-2 text-[#232249]/70 hover:text-[#232249] bg-white/60 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="Edit Building"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteBuilding(building._id)}
                        className="p-2 text-red-500/70 hover:text-red-600 bg-white/60 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="Delete Building"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {buildings.length === 0 && (
            <div className="col-span-full">
              <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 p-16 hover:shadow-2xl transition-all duration-500">
                <div className="flex flex-col items-center justify-center space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-3xl flex items-center justify-center shadow-xl">
                      <Building className="h-12 w-12 text-[#232249]/60" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center space-y-4 max-w-lg">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-[#232249] via-[#232249]/90 to-[#232249]/70 bg-clip-text text-transparent">No Buildings Found</h2>
                    <p className="text-[#232249]/70 font-medium text-lg leading-relaxed">
                      No buildings match your current filters, or no buildings have been added to this location yet.
                    </p>
                    <div className="pt-6">
                      <button
                        onClick={handleCreateBuilding}
                        className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-2xl hover:from-[#232249]/90 hover:to-[#232249] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
                      >
                        <Plus className="h-6 w-6" />
                        <span>Add First Building</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#232249]/20 p-6 hover:shadow-2xl transition-all duration-500">
          <div className="flex justify-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#232249]/10 to-[#232249]/20 text-[#232249] rounded-xl hover:from-[#232249]/20 hover:to-[#232249]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-[#232249]/20"
              >
                <div className="w-2 h-2 bg-[#232249]/50 rounded-full"></div>
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-4 px-6 py-3 bg-white/80 rounded-xl border border-[#232249]/20 shadow-sm">
                <span className="text-[#232249] font-bold">Page {pagination.current}</span>
                <div className="w-1 h-1 bg-[#232249]/30 rounded-full"></div>
                <span className="text-[#232249]/70 font-medium">of {pagination.pages}</span>
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#232249]/10 to-[#232249]/20 text-[#232249] rounded-xl hover:from-[#232249]/20 hover:to-[#232249]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold border border-[#232249]/20"
              >
                <span>Next</span>
                <div className="w-2 h-2 bg-[#232249]/50 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confined Space Modal */}
      {showConfinedSpaceModal && selectedBuilding && (
        <ConfinedSpaceModal
          building={selectedBuilding}
          onClose={() => {
            setShowConfinedSpaceModal(false);
            setSelectedBuilding(null);
            fetchBuildings(); // Refresh to get updated data
          }}
        />
      )}
      </div>
    </div>
  );
};

export default BuildingManagement;