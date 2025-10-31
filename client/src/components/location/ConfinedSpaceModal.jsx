import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle, Eye, Info } from 'lucide-react';
import { locationService } from '../../services/locationAPI';

const ConfinedSpaceModal = ({ building, onClose }) => {
  const [activeTab, setActiveTab] = useState('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [newSpace, setNewSpace] = useState({
    name: '',
    location: {
      floor: 1,
      unit: '',
      description: ''
    },
    type: 'tank',
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      diameter: 0,
      volume: 0
    },
    entryPoints: [],
    hazards: [],
    ventilationRequired: true,
    permitRequired: true,
    safetyEquipment: []
  });

  const spaceTypes = [
    'tank', 'vessel', 'pipe', 'duct', 'tunnel', 'pit', 'vault', 'boiler', 'other'
  ];

  const hazardTypes = [
    'atmospheric', 'physical', 'chemical', 'biological', 'mechanical', 'electrical'
  ];

  const severityLevels = [
    'low', 'medium', 'high', 'critical'
  ];

  const entryPointTypes = [
    'manhole', 'hatch', 'door', 'opening'
  ];

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors.medium;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setNewSpace(prev => {
        const updated = { ...prev };
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
        return updated;
      });
    } else {
      setNewSpace(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const addEntryPoint = () => {
    setNewSpace(prev => ({
      ...prev,
      entryPoints: [...prev.entryPoints, { location: '', type: 'manhole', size: '', isAccessible: true }]
    }));
  };

  const removeEntryPoint = (index) => {
    setNewSpace(prev => ({
      ...prev,
      entryPoints: prev.entryPoints.filter((_, i) => i !== index)
    }));
  };

  const updateEntryPoint = (index, field, value) => {
    setNewSpace(prev => ({
      ...prev,
      entryPoints: prev.entryPoints.map((point, i) => 
        i === index ? { ...point, [field]: value } : point
      )
    }));
  };

  const addHazard = () => {
    setNewSpace(prev => ({
      ...prev,
      hazards: [...prev.hazards, { type: 'atmospheric', description: '', severity: 'medium', mitigationMeasures: [] }]
    }));
  };

  const removeHazard = (index) => {
    setNewSpace(prev => ({
      ...prev,
      hazards: prev.hazards.filter((_, i) => i !== index)
    }));
  };

  const updateHazard = (index, field, value) => {
    setNewSpace(prev => ({
      ...prev,
      hazards: prev.hazards.map((hazard, i) => 
        i === index ? { ...hazard, [field]: value } : hazard
      )
    }));
  };

  const handleSafetyEquipmentChange = (e) => {
    const value = e.target.value;
    const equipment = value.split(',').map(item => item.trim()).filter(item => item);
    setNewSpace(prev => ({ ...prev, safetyEquipment: equipment }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await locationService.addConfinedSpace(building._id, newSpace);
      setActiveTab('view');
      setNewSpace({
        name: '',
        location: { floor: 1, unit: '', description: '' },
        type: 'tank',
        dimensions: { length: 0, width: 0, height: 0, diameter: 0, volume: 0 },
        entryPoints: [],
        hazards: [],
        ventilationRequired: true,
        permitRequired: true,
        safetyEquipment: []
      });
      // Refresh building data would be handled by parent component
    } catch (error) {
      console.error('Error adding confined space:', error);
      setError(error.response?.data?.error || 'Failed to add confined space');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSpace = async (spaceId) => {
    if (!window.confirm('Are you sure you want to remove this confined space?')) {
      return;
    }

    try {
      await locationService.removeConfinedSpace(building._id, spaceId);
      // Refresh would be handled by parent
    } catch (error) {
      console.error('Error removing confined space:', error);
      setError(error.response?.data?.error || 'Failed to remove confined space');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Confined Spaces - {building.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {building.confinedSpaces?.length || 0} confined space{(building.confinedSpaces?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('view')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'view'
                  ? 'border-[#232249] text-[#232249]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              View Spaces
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'add'
                  ? 'border-[#232249] text-[#232249]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Add Space
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {activeTab === 'view' && (
            <div className="space-y-4">
              {building.confinedSpaces && building.confinedSpaces.length > 0 ? (
                building.confinedSpaces.map((space, index) => {
                  const StatusIcon = getStatusIcon(space.status);
                  return (
                    <div key={space._id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{space.name}</h3>
                          <span className="text-sm text-gray-600 capitalize mt-1 block">{space.type}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveSpace(space._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Space"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {space.location && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            <strong>Location:</strong> Floor {space.location.floor}
                            {space.location.unit && `, Unit ${space.location.unit}`}
                            {space.location.description && ` - ${space.location.description}`}
                          </p>
                        </div>
                      )}

                      {space.dimensions && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            <strong>Dimensions:</strong>
                            {space.dimensions.length > 0 && ` ${space.dimensions.length}L`}
                            {space.dimensions.width > 0 && ` × ${space.dimensions.width}W`}
                            {space.dimensions.height > 0 && ` × ${space.dimensions.height}H`}
                            {space.dimensions.diameter > 0 && ` Ø${space.dimensions.diameter}`}
                            {space.dimensions.volume > 0 && ` (${space.dimensions.volume} cubic units)`}
                          </p>
                        </div>
                      )}

                      {space.hazards && space.hazards.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Hazards:</p>
                          <div className="space-y-1">
                            {space.hazards.map((hazard, hazardIndex) => (
                              <div key={hazardIndex} className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(hazard.severity)}`}>
                                  {hazard.severity.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {hazard.type.charAt(0).toUpperCase() + hazard.type.slice(1)}: {hazard.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {space.entryPoints && space.entryPoints.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Entry Points:</p>
                          <div className="space-y-1">
                            {space.entryPoints.map((entry, entryIndex) => (
                              <p key={entryIndex} className="text-sm text-gray-600">
                                {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} at {entry.location}
                                {entry.size && ` (${entry.size})`}
                                {!entry.isAccessible && ' - Not Accessible'}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        {space.ventilationRequired && (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Ventilation Required
                          </span>
                        )}
                        {space.permitRequired && (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-yellow-500 mr-1" />
                            Permit Required
                          </span>
                        )}
                      </div>

                      {space.safetyEquipment && space.safetyEquipment.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700">Safety Equipment:</p>
                          <p className="text-sm text-gray-600">{space.safetyEquipment.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 text-lg">No confined spaces defined</p>
                  <p className="text-gray-500 mb-4">Add confined spaces to track safety requirements</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors"
                  >
                    Add First Confined Space
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Space Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSpace.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                    placeholder="e.g., Main Storage Tank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={newSpace.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                  >
                    {spaceTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor
                    </label>
                    <input
                      type="number"
                      name="location.floor"
                      value={newSpace.location.floor}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit (optional)
                    </label>
                    <input
                      type="text"
                      name="location.unit"
                      value={newSpace.location.unit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                      placeholder="e.g., A101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      name="location.description"
                      value={newSpace.location.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                      placeholder="e.g., Basement utility room"
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Requirements</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="ventilationRequired"
                      checked={newSpace.ventilationRequired}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-[#232249] focus:ring-[#232249]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Ventilation Required</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="permitRequired"
                      checked={newSpace.permitRequired}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-[#232249] focus:ring-[#232249]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Entry Permit Required</span>
                  </label>
                </div>
              </div>

              {/* Safety Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Safety Equipment (comma-separated)
                </label>
                <input
                  type="text"
                  value={newSpace.safetyEquipment.join(', ')}
                  onChange={handleSafetyEquipmentChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                  placeholder="e.g., Gas monitors, Breathing apparatus, Safety harness"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors flex items-center disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Adding...' : 'Add Confined Space'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfinedSpaceModal;