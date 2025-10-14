import React, { useState, useEffect } from 'react';
import { MapPin, Building, Users, Search, Eye, Edit } from 'lucide-react';
import { locationService } from '../../services/locationAPI';
import { useAuth } from '../../contexts/AuthContext';

const LocationList = ({ onSelectLocation, onEditLocation, showActions = true }) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    // Filter locations based on search term
    if (searchTerm.trim()) {
      const filtered = locations.filter(location =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchTerm, locations]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      // Get current user to determine if they should see only assigned locations
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userData.role;
      const userId = userData.id || userData._id;

      let response;
      if (userRole === 'technician' && userId) {
        // Technicians should only see locations assigned to them
        response = await locationService.getLocationsByTechnician(userId);
      } else {
        // Admins and managers can see all locations
        response = await locationService.getLocations({ limit: 100 });
      }

      if (response.data.success) {
        setLocations(response.data.data.locations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#232249]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => (
          <div
            key={location._id}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              {/* Location Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="h-4 w-4 text-[#232249]" />
                    <h3 className="font-semibold text-gray-900 truncate">{location.name}</h3>
                  </div>
                  {getStatusBadge(location.status)}
                </div>
                
                {showActions && (
                  <div className="flex items-center space-x-1 ml-2">
                    {onSelectLocation && (
                      <button
                        onClick={() => onSelectLocation(location)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    
                    {onEditLocation && ['admin', 'manager'].includes(user?.role) && (
                      <button
                        onClick={() => onEditLocation(location)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Edit Location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="text-sm text-gray-600 mb-3">
                <p>{location.address?.street}</p>
                <p>{location.address?.city}, {location.address?.state} {location.address?.zipCode}</p>
              </div>

              {/* Statistics */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1 text-gray-500">
                  <Building className="h-4 w-4" />
                  <span>{location.buildingsCount || 0} buildings</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {location.assignedTechnician?.isActive ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Assigned</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">No technician</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {location.description && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 line-clamp-2">{location.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'No locations found matching your search' : 'No locations available'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-[#232249] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationList;
