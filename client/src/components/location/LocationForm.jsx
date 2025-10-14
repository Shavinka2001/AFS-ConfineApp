import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Save, X, Search, Globe, Navigation } from 'lucide-react';
import { locationService } from '../../services/locationAPI';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 37.0902,
  lng: -95.7129,
};

const defaultOptions = {
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

const MapWrapper = React.forwardRef(({ center, zoom, selectedCoordinates, onMapClick }, ref) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const onMapClickHandler = useCallback((event) => {
    if (onMapClick) {
      onMapClick({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
  }, [onMapClick]);

  const onMarkerClick = (location) => {
    setSelectedMarker(location);
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center || defaultCenter}
      zoom={zoom || 4}
      options={defaultOptions}
      onClick={onMapClickHandler}
    >
      {/* Selected marker */}
      {selectedCoordinates && (
        <Marker
          position={{
            lat: selectedCoordinates.latitude,
            lng: selectedCoordinates.longitude,
          }}
          onClick={() => onMarkerClick({
            name: 'Selected Location',
            coordinates: selectedCoordinates,
            isSelected: true,
          })}
          icon={{
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#2563EB" stroke="white" stroke-width="3"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32),
          }}
        />
      )}

      {/* Info Window for selected marker */}
      {selectedMarker && (
        <InfoWindow
          position={{
            lat: selectedMarker.coordinates.latitude,
            lng: selectedMarker.coordinates.longitude,
          }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-3 max-w-xs bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="font-semibold text-gray-900 mb-1 text-sm">{selectedMarker.name}</div>
            {selectedMarker.address && (
              <div className="text-gray-600 mb-1 text-xs">
                {selectedMarker.address.city}, {selectedMarker.address.state}
              </div>
            )}
            <div className="text-gray-500 text-xs font-mono">
              {selectedMarker.coordinates.latitude.toFixed(6)}, {selectedMarker.coordinates.longitude.toFixed(6)}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
});

const LocationForm = ({ location, onSave, onCancel, isEdit = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [isMapSearching, setIsMapSearching] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const mapRef = useRef(null);
  
  // Google Maps loading
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'commercial',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    coordinates: {
      latitude: null,
      longitude: null
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    status: 'active'
  });

  const locationTypes = [
    'residential', 'commercial', 'industrial', 'institutional', 'mixed-use'
  ];

  // Map search functionality using OpenStreetMap Nominatim API
  const searchMapLocation = async (query) => {
    if (!query || query.length < 3) {
      setMapSearchResults([]);
      return;
    }

    setIsMapSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setMapSearchResults(data);
    } catch (error) {
      console.error('Map search error:', error);
      setMapSearchResults([]);
    } finally {
      setIsMapSearching(false);
    }
  };

  const selectMapLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    setSelectedCoordinates({ latitude: lat, longitude: lon });
    setFormData(prev => ({
      ...prev,
      coordinates: { latitude: lat, longitude: lon },
      address: {
        ...prev.address,
        street: result.display_name.split(',')[0] || '',
        city: result.address?.city || result.address?.town || result.address?.village || '',
        state: result.address?.state || '',
        zipCode: result.address?.postcode || '',
        country: result.address?.country || 'USA'
      }
    }));
    
    setMapSearchQuery(result.display_name);
    setMapSearchResults([]);
  };

  useEffect(() => {
    if (isEdit && location) {
      setFormData({
        name: location.name || '',
        description: location.description || '',
        type: location.type || 'commercial',
        address: location.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        coordinates: location.coordinates || {
          latitude: null,
          longitude: null
        },
        contactInfo: location.contactInfo || {
          phone: '',
          email: ''
        },
        status: location.status || 'active'
      });
      
      if (location.coordinates) {
        setSelectedCoordinates({
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude
        });
        setMapSearchQuery(`${location.address?.street || ''}, ${location.address?.city || ''}`);
      }
    }
  }, [isEdit, location]);

  // Debounced map search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (mapSearchQuery && !isEdit) {
        searchMapLocation(mapSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [mapSearchQuery, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const updated = { ...prev };
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name || !formData.type || !formData.address.street || 
          !formData.address.city || !formData.address.state || !formData.address.zipCode) {
        throw new Error('Please fill in all required fields');
      }

      let savedLocation;
      
      if (isEdit) {
        const response = await locationService.updateLocation(location._id, formData);
        savedLocation = response.data.data.location;
      } else {
        const response = await locationService.createLocation(formData);
        savedLocation = response.data.data.location;
      }

      onSave && onSave(savedLocation);
    } catch (error) {
      console.error('Error saving location:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">You don't have permission to create or edit locations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-[#232249] to-[#232249]/90 px-8 py-6 border-b border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-[#232249]/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl shadow-lg backdrop-blur-sm">
                <MapPin className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  {isEdit ? 'Edit Location' : 'Create New Location'}
                </h2>
                <p className="text-white/80 text-lg mt-1 drop-shadow-sm">
                  {isEdit ? 'Update location details and information' : 'Add a new location to your system'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 group backdrop-blur-sm border border-white/20"
            >
              <X className="h-6 w-6 text-white group-hover:scale-110 transition-transform drop-shadow-sm" />
            </button>
          </div>
        </div>

      {error && (
        <div className="mx-8 mt-6">
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-400/30 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <div className="text-red-400 text-lg">⚠️</div>
              </div>
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Map Search Section */}
        <div className="bg-gradient-to-br from-[#232249]/5 to-[#232249]/10 backdrop-blur-xl rounded-3xl p-8 border border-[#232249]/20 shadow-xl">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl shadow-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#232249]">Search Location on Map</h3>
              <p className="text-[#232249]/70 text-lg">Search for your location to automatically populate address and coordinates</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="flex">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#232249]/60 h-5 w-5" />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="Search for address, city, or landmark..."
                  className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-[#232249]/20 rounded-2xl focus:ring-2 focus:ring-[#232249] focus:border-[#232249] text-[#232249] placeholder-[#232249]/50 text-lg shadow-lg"
                />
                {isMapSearching && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#232249]"></div>
                  </div>
                )}
              </div>
            </div>
            
            {mapSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white/95 backdrop-blur-xl border border-[#232249]/20 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                {mapSearchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectMapLocation(result)}
                    className="w-full text-left px-6 py-4 hover:bg-[#232249]/10 border-b border-[#232249]/10 last:border-b-0 transition-all duration-200 group"
                  >
                    <div className="font-semibold text-[#232249] truncate group-hover:text-[#232249]/80">
                      {result.display_name}
                    </div>
                    <div className="text-sm text-[#232249]/60 mt-1">
                      📍 Lat: {parseFloat(result.lat).toFixed(4)}, Lon: {parseFloat(result.lon).toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {selectedCoordinates && (
            <div className="mt-6 p-6 bg-gradient-to-r from-[#232249]/10 to-[#232249]/5 backdrop-blur-xl border border-[#232249]/20 rounded-3xl shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl shadow-lg">
                  <div className="text-white text-xl font-bold">✓</div>
                </div>
                <div className="flex-1">
                  <p className="text-[#232249] font-bold text-lg">Location Successfully Selected</p>
                  <p className="text-[#232249]/70 text-sm font-medium mt-1">
                    Coordinates: {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[#232249]/60">
                  <div className="w-2 h-2 bg-[#232249] rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Ready to Save</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Map View */}
          <div className="mt-8 bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-2xl shadow-lg">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-[#232249]">Interactive Map</h4>
                  <p className="text-[#232249]/70 text-lg">View and select your location on the map</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50/50 to-white/50 backdrop-blur-sm rounded-2xl relative overflow-hidden border border-gray-200/50 shadow-inner" style={{ height: '500px' }}>
              {loadError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-sm border border-red-200/50 rounded-2xl">
                  <div className="text-center p-8">
                    <div className="p-4 bg-red-500/20 rounded-2xl mb-4">
                      <div className="text-red-400 text-2xl">⚠️</div>
                    </div>
                    <div className="text-red-600 text-xl font-bold mb-2">Map Loading Error</div>
                    <div className="text-red-500/80 text-lg">Please check your Google Maps API configuration</div>
                  </div>
                </div>
              ) : !isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-[#232249] mx-auto mb-4"></div>
                    <div className="text-[#232249] font-bold text-lg">Loading Interactive Map...</div>
                  </div>
                </div>
              ) : (
                <MapWrapper
                  ref={mapRef}
                  center={selectedCoordinates ? { lat: selectedCoordinates.latitude, lng: selectedCoordinates.longitude } : defaultCenter}
                  zoom={selectedCoordinates ? 14 : 4}
                  selectedCoordinates={selectedCoordinates}
                />
              )}

              {/* Clean selection overlay */}
              {!selectedCoordinates && isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="text-center bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200 max-w-sm">
                    <div className="bg-blue-100 rounded-full p-3 w-fit mx-auto mb-4">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Map</h3>
                    <p className="text-gray-600 text-sm">View your selected location on the map</p>
                  </div>
                </div>
              )}

              {/* Clean map controls */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200 z-30">
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="font-medium">Location Map View</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="Enter location name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
              >
                {locationTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="under-construction">Under Construction</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
              placeholder="Enter location description"
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Address Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code *
              </label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="USA"
              />
            </div>
          </div>

          {/* Coordinates display */}
          {selectedCoordinates && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Coordinates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-blue-700">Latitude</label>
                  <input
                    type="number"
                    name="coordinates.latitude"
                    value={formData.coordinates.latitude || ''}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-blue-700">Longitude</label>
                  <input
                    type="number"
                    name="coordinates.longitude"
                    value={formData.coordinates.longitude || ''}
                    onChange={handleInputChange}
                    step="0.000001"
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="contactInfo.email"
                value={formData.contactInfo.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                placeholder="contact@location.com"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Location' : 'Create Location')}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default LocationForm;