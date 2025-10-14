import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, AlertCircle, CheckCircle, Loader, MapPin } from 'lucide-react';
import { technicianAssignmentService } from '../../services/technicianAssignmentService';
import { locationService } from '../../services/locationAPI';

const AssignTechnician = ({ locationId, locationName, onAssignmentChange }) => {
  const [technicians, setTechnicians] = useState([]);
  const [assignedTechnician, setAssignedTechnician] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationDetails, setLocationDetails] = useState(null);
  const [mapUrl, setMapUrl] = useState('');
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    loadTechnicians();
    loadAssignedTechnician();
    loadLocationDetails();
  }, [locationId]);

  const loadLocationDetails = async () => {
    if (!locationId) return;
    try {
      setMapLoading(true);
      const res = await locationService.getLocationById(locationId);
      // backend shape may be res.data or res.data.data
      const loc = res?.data?.data || res?.data || null;
      setLocationDetails(loc);

      // Determine lat/lon from multiple possible fields
      const lat = loc?.latitude || loc?.lat || loc?.coords?.lat || loc?.location?.lat;
      const lon = loc?.longitude || loc?.lng || loc?.coords?.lng || loc?.location?.lng;

      if (lat && lon) {
        const z = 16;
        const delta = 0.005;
        const bbox = `${Number(lon) - delta},${Number(lat) - delta},${Number(lon) + delta},${Number(lat) + delta}`;
        const iframeUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${lon}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat}%2C${lon}!5e0!3m2!1sen!2sus!4v1690000000000!5m2!1sen!2sus`;
        const openUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        setMapUrl({ iframe: iframeUrl, open: openUrl });
      } else {
        // Fallback to a search by name
        const query = encodeURIComponent(locationName || loc?.name || '');
        const searchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        setMapUrl({ iframe: searchUrl, open: searchUrl });
      }
    } catch (err) {
      console.error('Error loading location details for map:', err);
      setLocationDetails(null);
      setMapUrl('');
    } finally {
      setMapLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      setIsLoading(true);
      const response = await technicianAssignmentService.getAllTechnicians();
      setTechnicians(response.data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
      setError('Failed to load technicians');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignedTechnician = async () => {
    try {
      const response = await technicianAssignmentService.getTechnicianByLocation(locationId);
      setAssignedTechnician(response.data);
    } catch (error) {
      console.error('Error loading assigned technician:', error);
      // It's ok if no technician is assigned
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnicianId) {
      setError('Please select a technician');
      return;
    }

    try {
      setIsAssigning(true);
      setError('');
      
      await technicianAssignmentService.assignTechnicianToLocation(
        selectedTechnicianId, 
        locationId
      );
      
      setSuccess('Technician assigned successfully!');
      setSelectedTechnicianId('');
      
      // Reload data
      await loadAssignedTechnician();
      await loadTechnicians();
      
      // Notify parent component
      if (onAssignmentChange) {
        onAssignmentChange();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error assigning technician:', error);
      setError(error.response?.data?.message || 'Failed to assign technician');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignTechnician = async () => {
    if (!assignedTechnician) return;

    try {
      setIsAssigning(true);
      setError('');
      
      await technicianAssignmentService.unassignTechnicianFromLocation(
        assignedTechnician._id,
        'manual_unassignment'
      );
      
      setSuccess('Technician unassigned successfully!');
      
      // Reload data
      setAssignedTechnician(null);
      await loadTechnicians();
      
      // Notify parent component
      if (onAssignmentChange) {
        onAssignmentChange();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error unassigning technician:', error);
      setError(error.response?.data?.message || 'Failed to unassign technician');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter out assigned technicians from the dropdown (except the currently assigned one)
  const availableTechnicians = technicians.filter(tech => 
    !tech.currentAssignment?.isActive || tech._id === assignedTechnician?._id
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <Users className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">
          Technician Assignment - {locationName}
        </h3>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Map Preview */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Location Map</h4>
        <div className="relative w-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200/50 overflow-hidden shadow-lg backdrop-blur-sm">
          {mapLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin text-blue-500 mr-3" />
              <span className="text-blue-700 font-medium">Loading map…</span>
            </div>
          ) : mapUrl && mapUrl.iframe ? (
            <div className="relative group">
              <iframe
                title={`location-map-${locationId}`}
                src={mapUrl.iframe}
                width="100%"
                height="240"
                style={{ border: 0 }}
                loading="lazy"
                className="rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border border-white/20">
                <a
                  href={mapUrl.open}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors duration-200"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  View larger map
                </a>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-lg px-3 py-1 shadow-lg border border-white/20">
                <span className="text-xs text-gray-600 font-medium">Interactive Map</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">No map available for this location</p>
              <p className="text-sm text-gray-500 mt-1">Location coordinates not found</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Currently Assigned Technician */}
      {assignedTechnician && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCheck className="w-4 h-4 text-blue-600 mr-2" />
              <div>
                <p className="font-medium text-blue-800">
                  Currently Assigned: {assignedTechnician.fullName}
                </p>
                <p className="text-sm text-blue-600">
                  Employee ID: {assignedTechnician.employeeId} | 
                  Email: {assignedTechnician.email}
                </p>
                {assignedTechnician.currentAssignment?.assignedDate && (
                  <p className="text-xs text-blue-500">
                    Assigned: {new Date(assignedTechnician.currentAssignment.assignedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleUnassignTechnician}
              disabled={isAssigning}
              className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              {isAssigning ? (
                <Loader className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <UserX className="w-3 h-3 mr-1" />
              )}
              Unassign
            </button>
          </div>
        </div>
      )}

      {/* Assign New Technician */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {assignedTechnician ? 'Reassign to Different Technician' : 'Assign Technician'}
        </label>
        
        <div className="flex gap-2">
          <select
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            disabled={isLoading || isAssigning}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {isLoading ? 'Loading technicians...' : 'Select a technician'}
            </option>
            {availableTechnicians.map((technician) => (
              <option key={technician._id} value={technician._id}>
                {technician.fullName} - {technician.employeeId} 
                {technician.currentAssignment?.isActive && technician._id !== assignedTechnician?._id 
                  ? ' (Currently Assigned)' 
                  : ''
                }
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAssignTechnician}
            disabled={!selectedTechnicianId || isAssigning || isLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isAssigning ? (
              <div className="flex items-center">
                <Loader className="w-3 h-3 mr-1 animate-spin" />
                Assigning...
              </div>
            ) : (
              <div className="flex items-center">
                <UserCheck className="w-3 h-3 mr-1" />
                {assignedTechnician ? 'Reassign' : 'Assign'}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Technicians: </span>
            <span className="font-medium">{technicians.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Available: </span>
            <span className="font-medium text-green-600">
              {technicians.filter(t => !t.currentAssignment?.isActive).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTechnician;
