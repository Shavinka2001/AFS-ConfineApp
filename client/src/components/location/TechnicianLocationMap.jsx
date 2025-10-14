import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  ArrowLeft,
  Navigation,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LocationMap from './LocationMap';

const TechnicianLocationMap = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [assignedLocation, setAssignedLocation] = useState(location.state?.location || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If no location passed in state, try to fetch current technician's location
    if (!assignedLocation) {
      fetchAssignedLocation();
    } else {
      setLoading(false);
    }
  }, [assignedLocation]);

  const fetchAssignedLocation = async () => {
    try {
      setLoading(true);
      setError('');
      
      // This would typically call the technician location service
      // For now, we'll try to get it from the technicianLocationService
      const { technicianLocationService } = await import('../../services/technicianLocationService');
      const response = await technicianLocationService.getMyLocation();
      
      if (response.success && response.data) {
        setAssignedLocation(response.data);
      } else {
        setError(response.error || 'No assigned location found. Please contact your manager.');
      }
    } catch (error) {
      console.error('Error fetching assigned location:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load assigned location');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/technician/dashboard');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#232249]"></div>
        </div>
      </div>
    );
  }

  if (error || !assignedLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Location Map</h1>
                <p className="text-gray-600 mt-1">View your assigned location</p>
              </div>
            </div>
          </div>

          {/* Error/No Location Message */}
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Assigned Location</h2>
            <p className="text-gray-600 mb-6">
              {error || 'You currently have no assigned location. Please contact your manager for assignment.'}
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Location Map</h1>
              <p className="text-gray-600 mt-1">View and navigate to your assigned location</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(assignedLocation.status)}`}>
            {assignedLocation.status?.charAt(0).toUpperCase() + assignedLocation.status?.slice(1)} Location
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Location Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Location Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-[#232249]/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-[#232249]" />
                </div>
                <h3 className="text-xl font-bold text-[#232249]">Location Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{assignedLocation.name}</h4>
                  {assignedLocation.description && (
                    <p className="text-gray-600 text-sm">{assignedLocation.description}</p>
                  )}
                </div>

                {/* Address */}
                {assignedLocation.address && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Address</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{assignedLocation.address.street}</p>
                      <p>{assignedLocation.address.city}, {assignedLocation.address.state} {assignedLocation.address.zipCode}</p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {assignedLocation.contactInfo && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h5>
                    <div className="space-y-2">
                      {assignedLocation.contactInfo.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{assignedLocation.contactInfo.phone}</span>
                        </div>
                      )}
                      {assignedLocation.contactInfo.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{assignedLocation.contactInfo.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignment Info */}
                {assignedLocation.assignedTechnician && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="text-sm font-medium text-green-900 mb-2">Assignment Details</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800">Assigned to you</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-green-800">
                          Since {new Date(assignedLocation.assignedTechnician.assignedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/technician/inspection-forms', { state: { location: assignedLocation } })}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Add Inspection Form</span>
                  </button>
                  <button
                    onClick={() => navigate('/technician/work-orders')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Clock className="h-4 w-4" />
                    <span>View Work Orders</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Safety Information */}
            {assignedLocation.safety && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Safety Information</h3>
                </div>

                <div className="space-y-3">
                  {assignedLocation.safety.confinedSpaces && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">Confined Spaces Present</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Special safety protocols required for confined space entry
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {assignedLocation.safety.hazards && assignedLocation.safety.hazards.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Known Hazards:</h4>
                      <ul className="space-y-1">
                        {assignedLocation.safety.hazards.map((hazard, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{hazard}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#232249]">Location Map</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Navigation className="h-4 w-4" />
                  <span>Get Directions</span>
                </div>
              </div>

              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <LocationMap
                  locations={[assignedLocation]}
                  className="w-full h-full rounded-lg"
                  showViewToggle={true}
                  defaultView="default"
                />
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Navigation Tip</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Use the map above to navigate to your assigned location. Make sure to review safety information before arrival.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianLocationMap;