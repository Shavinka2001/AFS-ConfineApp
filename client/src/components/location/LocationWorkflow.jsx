import React, { useState, useEffect } from 'react';
import { 
  MapPin, Building, User, ArrowRight, CheckCircle, Plus,
  AlertCircle, Clock, Users, Home 
} from 'lucide-react';
import { locationService, technicianAssignmentService } from '../../services/locationAPI';
import { useAuth } from '../../contexts/AuthContext';
import LocationForm from './LocationForm';
import BuildingManagement from './BuildingManagement';

const LocationWorkflow = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Location data
  const [createdLocation, setCreatedLocation] = useState(null);
  const [buildingsCount, setBuildingsCount] = useState(0);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [technicianNotes, setTechnicianNotes] = useState('');

  const steps = [
    {
      id: 1,
      title: 'Create Location',
      description: 'Add location with map search',
      icon: MapPin,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming'
    },
    {
      id: 2,
      title: 'Add Buildings',
      description: 'Add buildings to location',
      icon: Building,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming'
    },
    {
      id: 3,
      title: 'Assign Technician',
      description: 'Assign technician to location',
      icon: User,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming'
    }
  ];

  useEffect(() => {
    if (currentStep === 3) {
      fetchTechnicians();
    }
  }, [currentStep]);

  const fetchTechnicians = async () => {
    try {
      const response = await technicianAssignmentService.getAllTechnicians();
      if (response.success) {
        setTechnicians(response.data);
      } else {
        setError('Failed to fetch technicians');
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
      setError('Failed to fetch technicians');
    }
  };

  const handleLocationSaved = (location) => {
    setCreatedLocation(location);
    setCurrentStep(2);
  };

  const handleBuildingsComplete = (buildingCount) => {
    setBuildingsCount(buildingCount);
    setCurrentStep(3);
  };

  const handleTechnicianAssignment = async () => {
    if (!selectedTechnician) {
      setError('Please select a technician');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const technicianData = {
        technicianId: selectedTechnician._id,
        name: `${selectedTechnician.firstName} ${selectedTechnician.lastName}`,
        email: selectedTechnician.email,
        phone: selectedTechnician.phone || '',
        notes: technicianNotes
      };

      await locationService.assignTechnician(createdLocation._id, technicianData);
      
      // Complete workflow
      onComplete && onComplete({
        location: createdLocation,
        buildingsCount,
        technician: selectedTechnician
      });
    } catch (error) {
      console.error('Error assigning technician:', error);
      setError(error.response?.data?.message || 'Failed to assign technician');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTechnician = () => {
    onComplete && onComplete({
      location: createdLocation,
      buildingsCount,
      technician: null
    });
  };

  const getStepStatus = (step) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-600 text-white';
      case 'current':
        return 'bg-[#232249] text-white';
      case 'upcoming':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  const getStepIcon = (step) => {
    const Icon = step.icon;
    if (step.status === 'completed') {
      return <CheckCircle className="h-5 w-5" />;
    }
    return <Icon className="h-5 w-5" />;
  };

  // Check if user has permission (admin or manager)
  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">You don't have permission to create locations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getStepStatus(step)}`}>
                  {getStepIcon(step)}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${step.status === 'current' ? 'text-[#232249]' : step.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className={`h-5 w-5 ${step.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step Content */}
      {currentStep === 1 && (
        <div>
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Step 1: Create Location</h2>
            <p className="text-blue-700">
              Use the map search to find and select your location. This will automatically populate address fields and coordinates.
            </p>
          </div>
          <LocationForm
            onSave={handleLocationSaved}
            onCancel={onComplete}
            isEdit={false}
          />
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Step 2: Add Buildings</h2>
            <p className="text-blue-700 mb-3">
              Add buildings to your location "{createdLocation?.name}". You can add buildings now or skip this step and add them later.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleBuildingsComplete(0)}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg">
            <BuildingManagement
              locationId={createdLocation?._id}
              locationName={createdLocation?.name}
            />
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => handleBuildingsComplete(buildingsCount)}
                className="px-6 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors"
              >
                Continue to Technician Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Step 3: Assign Technician</h2>
            <p className="text-blue-700">
              Assign a technician to manage "{createdLocation?.name}". This step is optional and can be done later.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Location Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium">{createdLocation?.name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Home className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{createdLocation?.fullAddress}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{buildingsCount} buildings added</span>
                  </div>
                </div>
              </div>

              {/* Technician Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Technician</h3>
                
                {technicians.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No technicians available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {technicians.map((technician) => (
                      <label
                        key={technician._id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTechnician?._id === technician._id
                            ? 'border-[#232249] bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="technician"
                          value={technician._id}
                          checked={selectedTechnician?._id === technician._id}
                          onChange={() => setSelectedTechnician(technician)}
                          className="text-[#232249] focus:ring-[#232249]"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {technician.firstName} {technician.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{technician.email}</p>
                          {technician.phone && (
                            <p className="text-sm text-gray-600">{technician.phone}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {selectedTechnician && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={technicianNotes}
                      onChange={(e) => setTechnicianNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#232249] focus:border-[#232249]"
                      placeholder="Any special notes about this assignment..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={handleSkipTechnician}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip for Now
              </button>
              
              <button
                onClick={handleTechnicianAssignment}
                disabled={!selectedTechnician || loading}
                className="px-6 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationWorkflow;