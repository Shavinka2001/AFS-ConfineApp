import React, { useState, useEffect } from 'react';
import { Building, Save, X, Home, Factory, ShoppingBag, Warehouse } from 'lucide-react';
import { locationService } from '../../services/locationAPI';
import { useAuth } from '../../contexts/AuthContext';

const BuildingForm = ({ building, locationId, onSave, onCancel, isEdit = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    buildingNumber: '',
    specifications: {
      buildingType: 'office',
      yearBuilt: new Date().getFullYear(),
      totalFloors: 1,
      totalUnits: 1,
      totalArea: 0
    },
    status: 'active',
    tags: []
  });

  const buildingTypes = [
    { value: 'residential', label: 'Residential', icon: Home },
    { value: 'office', label: 'Office', icon: Building },
    { value: 'retail', label: 'Retail', icon: ShoppingBag },
    { value: 'warehouse', label: 'Warehouse', icon: Warehouse },
    { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
    { value: 'mixed-use', label: 'Mixed Use', icon: Building },
    { value: 'parking', label: 'Parking', icon: Building }
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (isEdit && building) {
      setFormData({
        name: building.name || '',
        code: building.code || '',
        description: building.description || '',
        buildingNumber: building.buildingNumber || '',
        specifications: {
          buildingType: building.specifications?.buildingType || 'office',
          yearBuilt: building.specifications?.yearBuilt || currentYear,
          totalFloors: building.specifications?.totalFloors || 1,
          totalUnits: building.specifications?.totalUnits || 1,
          totalArea: building.specifications?.totalArea || 0
        },
        status: building.status || 'active',
        tags: building.tags || []
      });
    }
  }, [isEdit, building]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
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
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const buildingData = {
        ...formData,
        locationId,
        specifications: {
          ...formData.specifications,
          totalFloors: parseInt(formData.specifications.totalFloors),
          totalUnits: parseInt(formData.specifications.totalUnits),
          totalArea: parseFloat(formData.specifications.totalArea) || 0
        }
      };

      if (isEdit) {
        const response = await locationService.updateBuilding(building._id, buildingData);
        onSave && onSave(response.data.data.building);
      } else {
        const response = await locationService.createBuilding(buildingData);
        onSave && onSave(response.data.data.building);
      }
    } catch (error) {
      console.error('Error saving building:', error);
      
      let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save building';
      
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const validationErrors = error.response.data.details
          .map(detail => `${detail.field || detail.path || 'Field'}: ${detail.message || detail.msg}`)
          .join('; ');
        errorMessage += `. Details: ${validationErrors}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">You don't have permission to create or edit buildings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-[#232249]" />
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Building' : 'Create New Building'}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                placeholder="Enter building name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                placeholder="e.g., BLD-001, A-Wing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Number
              </label>
              <input
                type="text"
                name="buildingNumber"
                value={formData.buildingNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                placeholder="e.g., A, B, 101"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
              placeholder="Enter building description"
            />
          </div>
        </div>

        {/* Building Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Building Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {buildingTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label
                  key={type.value}
                  className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.specifications.buildingType === type.value
                      ? 'border-[#232249] bg-[#232249]/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-2 ${
                    formData.specifications.buildingType === type.value
                      ? 'text-[#232249]'
                      : 'text-gray-400'
                  }`} />
                  <span className={`text-sm ${
                    formData.specifications.buildingType === type.value
                      ? 'text-[#232249] font-medium'
                      : 'text-gray-600'
                  }`}>
                    {type.label}
                  </span>
                  <input
                    type="radio"
                    name="specifications.buildingType"
                    value={type.value}
                    checked={formData.specifications.buildingType === type.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Building Specifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Building Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Built
              </label>
              <select
                name="specifications.yearBuilt"
                value={formData.specifications.yearBuilt}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Floors *
              </label>
              <input
                type="number"
                name="specifications.totalFloors"
                value={formData.specifications.totalFloors}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Units
              </label>
              <input
                type="number"
                name="specifications.totalUnits"
                value={formData.specifications.totalUnits}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Area (sq ft)
              </label>
              <input
                type="number"
                name="specifications.totalArea"
                value={formData.specifications.totalArea}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
              />
            </div>
          </div>
        </div>

        {/* Status and Tags */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="under-construction">Under Construction</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#232249] focus:border-[#232249]"
                placeholder="e.g., high-priority, secure, renovated"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#232249] text-white rounded-lg hover:bg-[#232249]/90 transition-colors flex items-center disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Building' : 'Create Building')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuildingForm;