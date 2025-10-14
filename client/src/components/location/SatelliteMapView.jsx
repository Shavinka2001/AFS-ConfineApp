import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Satellite view popup styles (same as DefaultMapView)
const satellitePopupStyles = `
  .satellite-popup .leaflet-popup-content-wrapper {
    background: linear-gradient(135deg, rgba(51, 50, 86, 0.95) 0%, rgba(51, 50, 86, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .satellite-popup .leaflet-popup-content {
    margin: 0;
    border-radius: 20px;
    color: white;
  }
  .satellite-popup .leaflet-popup-tip {
    background: linear-gradient(135deg, rgba(51, 50, 86, 0.95) 0%, rgba(51, 50, 86, 0.9) 100%);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  .satellite-popup .leaflet-popup-close-button {
    color: rgba(255, 255, 255, 0.8);
    font-weight: bold;
    font-size: 18px;
  }
  .satellite-popup .leaflet-popup-close-button:hover {
    color: white;
  }
  .satellite-marker {
    background: none !important;
    border: none !important;
  }
  @keyframes satellitePulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = satellitePopupStyles;
  document.head.appendChild(styleSheet);
}

// Static imports for marker images
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure satellite marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to fit bounds when locations change
function FitBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations && locations.length > 0) {
      const validLocations = locations.filter(loc =>
        loc.coordinates?.latitude && loc.coordinates?.longitude
      );

      if (validLocations.length > 0) {
        const points = validLocations.map(loc => [
          loc.coordinates.latitude,
          loc.coordinates.longitude
        ]);

        try {
          const bounds = L.latLngBounds(points);
          map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: 16 });
        } catch (err) {
          console.warn('Could not fit bounds:', err);
        }
      }
    }
  }, [locations, map]);

  return null;
}

// Satellite Map View Component
const SatelliteMapView = ({
  center = [37.0902, -95.7129], // Center of USA
  zoom = 4,
  locations = [],
  height = '400px',
  className = '',
  showControls = true,
  onLocationClick = null,
  onMapClick = null,
  tapMode = 'view',
  showLocationDetails = true
}) => {

  // Satellite tile layer URLs (high quality)
  const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const satelliteAttribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

  return (
    <div className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden ${className}`}>
      <div style={{ height }} className="relative">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          className="rounded-3xl"
          eventHandlers={{
            click: (e) => {
              if (onMapClick && tapMode === 'add') {
                onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
              }
            }
          }}
        >
          {/* Satellite Tile Layer */}
          <TileLayer
            url={satelliteTileUrl}
            attribution={satelliteAttribution}
            maxZoom={18}
            minZoom={1}
          />

          {/* Render markers for locations */}
          {locations.map((location, index) => {
            if (!location.coordinates?.latitude || !location.coordinates?.longitude) {
              return null;
            }

            // Create custom marker icon for satellite view
            const createSatelliteIcon = (isSelected, mode) => {
              let color = '#FFFFFF'; // White for satellite contrast
              let size = 32;

              if (mode === 'select') {
                color = isSelected ? '#10B981' : '#F59E0B';
                size = isSelected ? 36 : 32;
              } else if (mode === 'add') {
                color = '#6B7280';
              }

              return L.divIcon({
                html: `
                  <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background: linear-gradient(135deg, ${color} 0%, ${color}CC 100%);
                    border: 3px solid #333256;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #333256;
                    font-weight: bold;
                    font-size: ${size === 36 ? '16px' : '14px'};
                    backdrop-filter: blur(4px);
                    ${isSelected ? 'animation: satellitePulse 2s infinite;' : ''}
                  ">
                    ${isSelected ? '✓' : '📍'}
                  </div>
                `,
                className: 'satellite-marker',
                iconSize: [size, size],
                iconAnchor: [size/2, size],
                popupAnchor: [0, -size]
              });
            };

            const icon = createSatelliteIcon(location.isSelected, tapMode);

            return (
              <Marker
                key={location.id || location._id || index}
                position={[location.coordinates.latitude, location.coordinates.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onLocationClick && tapMode !== 'add') {
                      onLocationClick(location);
                    }
                  }
                }}
              >
                {showLocationDetails && (
                  <Popup className="satellite-popup">
                    <div className="p-6">
                      <div className="font-bold text-white mb-4 text-xl drop-shadow-lg">{location.name || location.display_name}</div>
                      {location.address && (
                        <div className="text-white/90 mb-4">
                          <div className="font-semibold text-white mb-2 text-sm uppercase tracking-wide">Address</div>
                          <div className="text-sm leading-relaxed">
                            {location.address.street && <div className="drop-shadow-sm">{location.address.street}</div>}
                            <div className="drop-shadow-sm">
                              {location.address.city && `${location.address.city}, `}
                              {location.address.state && `${location.address.state} `}
                              {location.address.zipCode && location.address.zipCode}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="bg-white/10 backdrop-blur-sm text-white/80 text-xs font-mono p-3 rounded-xl border border-white/20">
                        <div className="flex items-center space-x-2">
                          <span className="text-white/60">📍</span>
                          <span>{location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}</span>
                        </div>
                      </div>
                      {tapMode === 'select' && (
                        <div className="mt-3 text-center">
                          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                            location.isSelected
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {location.isSelected ? 'Selected' : 'Tap to select'}
                          </div>
                        </div>
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}

          {/* Fit bounds to locations */}
          {locations.length > 0 && <FitBounds locations={locations} />}
        </MapContainer>

        {/* Satellite overlay when no locations */}
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-br from-[#333256]/95 to-[#333256]/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center max-w-sm border border-white/20">
              <div className="p-4 bg-gradient-to-br from-white/20 to-white/10 rounded-full w-fit mx-auto mb-6 shadow-lg">
                <div className="text-3xl drop-shadow-lg">
                  {tapMode === 'add' ? '👆' : '🛰️'}
                </div>
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
                {tapMode === 'add' ? 'Add Locations' : 'Satellite View'}
              </h4>
              <p className="text-white/80 leading-relaxed drop-shadow-sm">
                {tapMode === 'add'
                  ? 'Tap anywhere on the satellite imagery to add a new location.'
                  : 'High-resolution satellite imagery with location markers.'
                }
              </p>
              {tapMode === 'add' && (
                <div className="mt-4 p-3 bg-blue-500/20 rounded-xl border border-blue-400/30">
                  <p className="text-blue-300 text-sm font-medium">
                    💡 Tip: Tap the satellite imagery to place markers
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Satellite Controls */}
        {showControls && (
          <div className="absolute top-6 right-6 bg-gradient-to-br from-[#333256]/90 to-[#333256]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-3">
            <button
              onClick={() => {
                const map = document.querySelector('.leaflet-container')?.leafletElement;
                if (map) {
                  map.setView(center, zoom);
                }
              }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 group mb-2 block"
              title="Reset view"
            >
              <div className="text-lg group-hover:scale-110 transition-transform drop-shadow-sm">🏠</div>
            </button>
            <button
              onClick={() => {
                const map = document.querySelector('.leaflet-container')?.leafletElement;
                if (map) {
                  map.zoomIn();
                }
              }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 group mb-2 block"
              title="Zoom in"
            >
              <div className="text-lg group-hover:scale-110 transition-transform drop-shadow-sm">➕</div>
            </button>
            <button
              onClick={() => {
                const map = document.querySelector('.leaflet-container')?.leafletElement;
                if (map) {
                  map.zoomOut();
                }
              }}
              className="p-3 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 group"
              title="Zoom out"
            >
              <div className="text-lg group-hover:scale-110 transition-transform drop-shadow-sm">➖</div>
            </button>
          </div>
        )}
      </div>

      {/* Satellite location count */}
      {locations.length > 0 && (
        <div className="px-8 py-5 bg-gradient-to-r from-[#333256]/90 to-[#333256]/80 backdrop-blur-xl border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-xl shadow-lg">
                <div className="text-white font-bold text-lg drop-shadow-lg">🛰️</div>
              </div>
              <span className="text-white font-semibold text-lg drop-shadow-sm">
                Satellite • {locations.length} location{locations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-white/70 text-sm font-medium drop-shadow-sm">
              High-res imagery • Interactive markers
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteMapView;