import React, { useState, useCallback } from 'react';
import DefaultMapView from './DefaultMapView';
import SatelliteMapView from './SatelliteMapView';
import { MapPin, Satellite, MousePointer, Plus, Hand } from 'lucide-react';

// Enhanced LocationMap component with comprehensive tap functionality
const LocationMap = ({
  locations = [],
  onLocationClick,
  onLocationAdd,
  onLocationSelect,
  className = '',
  defaultView = 'default', // 'default' or 'satellite'
  defaultMode = 'view', // 'view', 'select', 'add'
  showViewToggle = true,
  showModeToggle = true,
  multiSelect = false,
  selectedLocations = [],
  onSelectionChange
}) => {
  const [currentView, setCurrentView] = useState(defaultView);
  const [tapMode, setTapMode] = useState(defaultMode);
  const [selectedLocationIds, setSelectedLocationIds] = useState(
    selectedLocations.map(loc => loc.id || loc)
  );
  const [tapFeedback, setTapFeedback] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle location tap/click
  const handleLocationTap = useCallback((location) => {
    const locationId = location.id || location;

    // Show tap feedback
    setTapFeedback({
      x: Math.random() * 100, // Random position for effect
      y: Math.random() * 100,
      timestamp: Date.now()
    });

    // Clear feedback after animation
    setTimeout(() => setTapFeedback(null), 600);

    switch (tapMode) {
      case 'view':
        if (onLocationClick) {
          onLocationClick(location);
        }
        break;

      case 'select':
        if (multiSelect) {
          const newSelection = selectedLocationIds.includes(locationId)
            ? selectedLocationIds.filter(id => id !== locationId)
            : [...selectedLocationIds, locationId];

          setSelectedLocationIds(newSelection);
          if (onSelectionChange) {
            const selectedLocs = locations.filter(loc =>
              newSelection.includes(loc.id || loc)
            );
            onSelectionChange(selectedLocs);
          }
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        } else {
          setSelectedLocationIds([locationId]);
          if (onSelectionChange) {
            onSelectionChange([location]);
          }
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        }
        break;

      case 'add':
        // Add mode handled by map click, not location click
        break;

      default:
        break;
    }
  }, [tapMode, multiSelect, selectedLocationIds, locations, onLocationClick, onLocationSelect, onSelectionChange]);

  // Handle map tap/click (for adding locations)
  const handleMapTap = useCallback((coordinates) => {
    if (tapMode === 'add' && onLocationAdd) {
      // Show tap feedback
      setTapFeedback({
        x: Math.random() * 100,
        y: Math.random() * 100,
        timestamp: Date.now()
      });

      setTimeout(() => setTapFeedback(null), 600);

      onLocationAdd({
        coordinates: {
          latitude: coordinates.lat,
          longitude: coordinates.lng
        },
        timestamp: new Date().toISOString()
      });
    }
  }, [tapMode, onLocationAdd]);

  // Get mode-specific styling
  const getModeButtonStyle = (mode) => {
    const baseStyle = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2";
    const activeStyle = "bg-gradient-to-r from-[#333256] to-[#333256]/80 text-white shadow-lg backdrop-blur-sm";
    const inactiveStyle = "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/20";

    return tapMode === mode ? activeStyle : inactiveStyle;
  };

  // Get enhanced locations with selection state
  const enhancedLocations = locations.map(location => ({
    ...location,
    isSelected: selectedLocationIds.includes(location.id || location),
    tapMode
  }));

  return (
    <div className={`relative ${className}`}>
      {/* Control Panel */}
      <div className="mb-4 space-y-3">
        {/* View Toggle */}
        {showViewToggle && (
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-1 flex">
              <button
                onClick={() => setCurrentView('default')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                  currentView === 'default'
                    ? 'bg-gradient-to-r from-[#333256] to-[#333256]/80 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Standard</span>
              </button>
              <button
                onClick={() => setCurrentView('satellite')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                  currentView === 'satellite'
                    ? 'bg-gradient-to-r from-[#333256] to-[#333256]/80 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Satellite className="w-4 h-4" />
                <span>Satellite</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        {showModeToggle && (
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-1 flex">
              <button
                onClick={() => setTapMode('view')}
                className={getModeButtonStyle('view')}
                title="View locations"
              >
                <Hand className="w-4 h-4" />
                <span>View</span>
              </button>
              <button
                onClick={() => setTapMode('select')}
                className={getModeButtonStyle('select')}
                title={multiSelect ? "Select multiple locations" : "Select location"}
              >
                <MousePointer className="w-4 h-4" />
                <span>{multiSelect ? 'Multi-Select' : 'Select'}</span>
              </button>
              <button
                onClick={() => setTapMode('add')}
                className={getModeButtonStyle('add')}
                title="Tap map to add location"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Instructions */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-[#333256]/90 to-[#333256]/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20 inline-block">
            <span className="text-white/90 text-sm font-medium">
              {tapMode === 'view' && 'Tap locations to view details'}
              {tapMode === 'select' && (multiSelect ? 'Tap to select/deselect multiple locations' : 'Tap to select a location')}
              {tapMode === 'add' && 'Tap anywhere on the map to add a new location'}
            </span>
          </div>
        </div>

        {/* Selection Counter */}
        {tapMode === 'select' && selectedLocationIds.length > 0 && (
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500/90 to-blue-600/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20 inline-block">
              <span className="text-white text-sm font-medium">
                {selectedLocationIds.length} location{selectedLocationIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="relative">
        {currentView === 'satellite' ? (
          <SatelliteMapView
            height="500px"
            showLocationDetails={true}
            locations={enhancedLocations}
            onLocationClick={handleLocationTap}
            onMapClick={handleMapTap}
            tapMode={tapMode}
          />
        ) : (
          <DefaultMapView
            locations={enhancedLocations}
            onLocationClick={handleLocationTap}
            onMapClick={handleMapTap}
            height="500px"
            tapMode={tapMode}
          />
        )}

        {/* Tap Feedback Animation */}
        {tapFeedback && (
          <div
            className="absolute pointer-events-none z-50 animate-ping"
            style={{
              left: `${tapFeedback.x}%`,
              top: `${tapFeedback.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-8 h-8 bg-blue-500/50 rounded-full border-2 border-blue-400"></div>
          </div>
        )}

        {/* Mobile Touch Indicator */}
        {isMobile && tapMode === 'add' && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-[#333256]/90 to-[#333256]/80 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/20">
            <span className="text-white text-xs font-medium">👆 Tap to add location</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationMap;