import React from 'react';
import SatelliteMapView from '../components/location/SatelliteMapView';
import LocationMap from '../components/location/LocationMap';

// Example component showing satellite map usage
const SatelliteMapExample = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Satellite Map View</h1>
        <p className="text-gray-600">
          High-resolution satellite imagery showing all locations in the system
        </p>
      </div>

      {/* Full Satellite Map */}
      <div className="mb-8">
        <SatelliteMapView
          height="700px"
          className="shadow-2xl"
        />
      </div>

      {/* Comparison with toggle */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Map View Comparison</h2>
        <p className="text-gray-600 mb-6">
          Toggle between standard and satellite views to see the difference
        </p>
        <LocationMap
          showViewToggle={true}
          defaultView="satellite"
          className="shadow-lg"
        />
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use Satellite Map View</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Features:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• High-resolution satellite imagery</li>
              <li>• Shows all locations with color-coded markers</li>
              <li>• Auto-fits to display all locations</li>
              <li>• Interactive popups with location details</li>
              <li>• Zoom and pan controls</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Usage:</h4>
            <pre className="bg-blue-100 text-blue-900 p-3 rounded text-sm overflow-x-auto">
{`import SatelliteMapView from './components/location/SatelliteMapView';

<SatelliteMapView
  height="600px"
  showLocationDetails={true}
  className="my-custom-class"
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Satellite Imagery:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Esri World Imagery service</li>
              <li>• Up to 18 zoom levels</li>
              <li>• Global coverage</li>
              <li>• High-resolution imagery</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Location Markers:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Color-coded by location type</li>
              <li>• Interactive popups</li>
              <li>• Auto-fitting bounds</li>
              <li>• Real-time data from API</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteMapExample;