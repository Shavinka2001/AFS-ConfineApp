import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, X, Globe, Navigation, Target } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Add custom modern popup styles
const modernPopupStyles = `
  .modern-popup .leaflet-popup-content-wrapper {
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;
  }
  .modern-popup .leaflet-popup-content {
    margin: 0;
    border-radius: 16px;
  }
  .modern-popup .leaflet-popup-tip {
    background-color: white;
  }
  .modern-tooltip {
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = modernPopupStyles;
  document.head.appendChild(styleSheet);
}

// Static imports for marker images
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icon for search results - modern clean design
const searchResultIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" opacity="0.95"/>
      <circle cx="16" cy="16" r="8" fill="#3b82f6" opacity="0.9"/>
      <circle cx="16" cy="16" r="4" fill="#ffffff"/>
    </svg>
  `)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Custom icon for selected location - modern clean design
const selectedIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#10b981" stroke-width="3" opacity="0.95"/>
      <circle cx="20" cy="20" r="12" fill="#10b981" opacity="0.9"/>
      <circle cx="20" cy="20" r="6" fill="#ffffff"/>
      <circle cx="20" cy="20" r="2" fill="#10b981"/>
    </svg>
  `)}`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        display_name: `Selected Location (${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)})`,
        type: 'selected'
      });
    },
  });
  return null;
}

// Component to fit map bounds
function FitBounds({ locations, selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (selectedLocation) {
      points.push([selectedLocation.lat, selectedLocation.lng]);
    }

    locations.forEach(loc => {
      if (loc.lat && loc.lng) {
        points.push([loc.lat, loc.lng]);
      }
    });

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds.pad(0.1), { animate: true });
      } catch (err) {
        console.warn('Could not fit bounds:', err);
      }
    }
  }, [locations, selectedLocation, map]);

  return null;
}

// Main LocationSearch component
const LocationSearch = ({ onLocationSelect, initialQuery = '', className = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([37.0902, -95.7129]); // Center of USA
  const [mapZoom, setMapZoom] = useState(4);
  const mapRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&countrycodes=us`
        );
        const data = await response.json();
        const formattedResults = data.map(result => ({
          ...result,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          type: 'search'
        }));
        setSearchResults(formattedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setMapCenter([location.lat, location.lng]);
    setMapZoom(15);
    onLocationSelect && onLocationSelect(location);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setSelectedLocation(null);
    setMapCenter([37.0902, -95.7129]);
    setMapZoom(4);
  };

  // Memoized markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    const allLocations = [...searchResults];
    if (selectedLocation) {
      allLocations.push(selectedLocation);
    }
    return allLocations;
  }, [searchResults, selectedLocation]);

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Location Search</h3>
              <p className="text-gray-600 text-sm mt-1">
                Find and select locations with precision
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for cities, addresses, landmarks..."
            className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white shadow-sm"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleLocationSelect(result)}
                className="w-full text-left px-6 py-4 hover:bg-blue-50 border-b border-gray-50 last:border-b-0 focus:outline-none focus:bg-blue-50 transition-colors duration-150 group"
              >
                <div className="font-semibold text-gray-900 truncate group-hover:text-blue-700">
                  {result.display_name.split(',')[0]}
                </div>
                <div className="text-sm text-gray-600 truncate mt-1">
                  {result.display_name}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-emerald-800">Selected Location</span>
                <p className="text-sm text-emerald-700 mt-1">{selectedLocation.display_name}</p>
                <p className="text-xs text-emerald-600 font-mono">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: '500px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          className="rounded-b-2xl"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Markers */}
          {markers.map((location, index) => (
            <Marker
              key={`${location.type}-${index}`}
              position={[location.lat, location.lng]}
              icon={location.type === 'selected' ? selectedIcon : searchResultIcon}
              eventHandlers={{
                click: () => handleLocationSelect(location),
              }}
            >
              <Popup className="modern-popup">
                <div className="p-3">
                  <div className="font-bold text-gray-900 mb-2">{location.display_name}</div>
                  <div className="text-gray-600 text-sm mb-3">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Lat: {location.lat.toFixed(6)}
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Lng: {location.lng.toFixed(6)}
                    </div>
                  </div>
                  {location.type === 'selected' && (
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </Popup>
              <Tooltip className="modern-tooltip">{location.display_name.split(',')[0]}</Tooltip>
            </Marker>
          ))}

          {/* Map Event Handlers */}
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <FitBounds locations={searchResults} selectedLocation={selectedLocation} />
        </MapContainer>

        {/* Map Instructions Overlay */}
        {!selectedLocation && searchResults.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center max-w-sm border border-gray-100">
              <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Search & Select Location</h4>
              <p className="text-gray-600 leading-relaxed">
                Type in the search box above or click directly on the map to select a location with precision.
              </p>
            </div>
          </div>
        )}

        {/* Modern Map Controls */}
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 p-2">
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView([37.0902, -95.7129], 4);
              }
            }}
            className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
            title="Reset map view"
          >
            <Navigation className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSearch;