import React from 'react';
import DefaultMapView from '../components/location/DefaultMapView';

// Example usage of DefaultMapView
const MapExample = () => {
  // Sample locations data
  const sampleLocations = [
    {
      id: 1,
      name: 'New York Office',
      lat: 40.7128,
      lng: -74.0060,
      address: {
        street: '123 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    },
    {
      id: 2,
      name: 'Los Angeles Office',
      lat: 34.0522,
      lng: -118.2437,
      address: {
        street: '456 Hollywood Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210'
      }
    },
    {
      id: 3,
      name: 'Chicago Office',
      lat: 41.8781,
      lng: -87.6298,
      address: {
        street: '789 Michigan Ave',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601'
      }
    }
  ];

  const handleLocationClick = (location) => {
    console.log('Clicked location:', location);
    alert(`Clicked: ${location.name}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Default Map View Example</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Map */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Map (Default USA View)</h2>
          <DefaultMapView />
        </div>

        {/* Map with Locations */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Map with Sample Locations</h2>
          <DefaultMapView
            locations={sampleLocations}
            onLocationClick={handleLocationClick}
            center={[39.8283, -98.5795]} // Center of USA
            zoom={4}
          />
        </div>
      </div>

      {/* Custom Height Map */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Custom Height Map</h2>
        <DefaultMapView
          locations={sampleLocations.slice(0, 2)} // First 2 locations
          height="300px"
          showControls={false}
          className="border-2 border-blue-200"
        />
      </div>

      {/* Code Example */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
        <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`import DefaultMapView from './components/location/DefaultMapView';

const MyComponent = () => {
  const locations = [
    {
      id: 1,
      name: 'Office Location',
      lat: 40.7128,
      lng: -74.0060,
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    }
  ];

  return (
    <DefaultMapView
      locations={locations}
      onLocationClick={(location) => console.log(location)}
      center={[40.7128, -74.0060]}
      zoom={10}
      height="400px"
    />
  );
};`}
        </pre>
      </div>
    </div>
  );
};

export default MapExample;