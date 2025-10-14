// Example usage of the enhanced LocationMap with tap functionality

import React, { useState } from 'react';
import LocationMap from './components/location/LocationMap';

const LocationManagementExample = () => {
  const [locations, setLocations] = useState([
    {
      id: 1,
      name: 'Main Office',
      lat: 40.7128,
      lng: -74.0060,
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    },
    {
      id: 2,
      name: 'Branch Office',
      lat: 34.0522,
      lng: -118.2437,
      coordinates: { latitude: 34.0522, longitude: -118.2437 },
      address: {
        street: '456 Business Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210'
      }
    }
  ]);

  const [selectedLocations, setSelectedLocations] = useState([]);
  const [tapMode, setTapMode] = useState('view');

  // Handle location tap/click
  const handleLocationClick = (location) => {
    console.log('Location clicked:', location);
    // Handle location details view
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    console.log('Location selected:', location);
  };

  // Handle selection changes
  const handleSelectionChange = (selectedLocs) => {
    console.log('Selection changed:', selectedLocs);
    setSelectedLocations(selectedLocs);
  };

  // Handle adding new location
  const handleLocationAdd = (coordinates) => {
    console.log('Adding location at:', coordinates);
    const newLocation = {
      id: Date.now(),
      name: `New Location ${locations.length + 1}`,
      lat: coordinates.latitude,
      lng: coordinates.longitude,
      coordinates,
      address: {}
    };
    setLocations([...locations, newLocation]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-[#333256] to-[#333256]/80 backdrop-blur-xl rounded-3xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">Location Management</h1>
        <p className="text-white/80">
          Interactive map with comprehensive tap functionality. Switch between View, Select, and Add modes.
        </p>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => setTapMode('view')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              tapMode === 'view'
                ? 'bg-white/20 text-white border-2 border-white/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            👁️ View Mode
          </button>
          <button
            onClick={() => setTapMode('select')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              tapMode === 'select'
                ? 'bg-white/20 text-white border-2 border-white/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            🎯 Select Mode
          </button>
          <button
            onClick={() => setTapMode('add')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              tapMode === 'add'
                ? 'bg-white/20 text-white border-2 border-white/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            ➕ Add Mode
          </button>
        </div>

        {/* Current Mode Info */}
        <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
          <h3 className="font-semibold mb-2">Current Mode: {tapMode.toUpperCase()}</h3>
          <p className="text-sm text-white/70">
            {tapMode === 'view' && 'Tap locations to view details and information.'}
            {tapMode === 'select' && 'Tap locations to select/deselect them. Selected locations will be highlighted.'}
            {tapMode === 'add' && 'Tap anywhere on the map to add a new location marker.'}
          </p>
          {selectedLocations.length > 0 && (
            <p className="text-sm text-green-300 mt-2">
              Selected: {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Enhanced Location Map */}
      <LocationMap
        locations={locations}
        onLocationClick={handleLocationClick}
        onLocationAdd={handleLocationAdd}
        onLocationSelect={handleLocationSelect}
        onSelectionChange={handleSelectionChange}
        selectedLocations={selectedLocations}
        defaultMode={tapMode}
        multiSelect={true}
        showViewToggle={true}
        showModeToggle={false} // We control mode externally
        height="600px"
        className="w-full"
      />

      {/* Location List */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Locations ({locations.length})</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                selectedLocations.some(sel => sel.id === location.id)
                  ? 'bg-green-500/20 border-green-400/50'
                  : 'bg-white/5 border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{location.name}</h3>
                  <p className="text-sm text-white/70 mt-1">
                    {location.address?.city}, {location.address?.state}
                  </p>
                  <p className="text-xs text-white/50 mt-2 font-mono">
                    {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                  </p>
                </div>
                {selectedLocations.some(sel => sel.id === location.id) && (
                  <div className="text-green-400 text-xl">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationManagementExample;