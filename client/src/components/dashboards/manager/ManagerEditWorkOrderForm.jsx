import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Building,
  AlertTriangle,
  Shield,
  Users,
  Camera,
  X,
  Save,
  ChevronRight,
  CheckCircle,
  Calendar,
  Clock,
  Map,
  Info,
  User,
  Tag,
  MessageSquare,
  ClipboardList,
  Upload,
  Trash2,
  Plus
} from 'lucide-react';
import { handleError, handleSuccess } from '../../../utils/errorHandler';

const ManagerEditWorkOrderForm = ({
  showEditModal,
  editingOrder,
  setEditingOrder,
  closeEditModal,
  handleUpdateForm,
  formatDate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [submitError, setSubmitError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  if (!showEditModal || !editingOrder) return null;

  const sections = [
    { id: 'basic', title: 'Basic Information', icon: FileText },
    { id: 'space', title: 'Space Information', icon: Building },
    { id: 'hazards', title: 'Hazard Assessment', icon: AlertTriangle },
    { id: 'safety', title: 'Safety Requirements', icon: Shield },
    { id: 'personnel', title: 'Personnel & Access', icon: Users },
    { id: 'images', title: 'Images & Documentation', icon: Camera }
  ];

  const handleInputChange = (field, value) => {
    setEditingOrder({
      ...editingOrder,
      [field]: value
    });
  };

  const handleRadioChange = (field, value) => {
    setEditingOrder({
      ...editingOrder,
      [field]: value === 'yes'
    });
  };

  // Image upload functionality
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    // Upload each file
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    });
    
    // Reset file input
    event.target.value = '';
  };

  const handleImageUpload = async (file) => {
    setUploadingImages(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('orderId', editingOrder._id || editingOrder.id);
      
      const response = await fetch('http://localhost:3012/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const result = JSON.parse(responseText);
      
      // Add the new image URL to the editing order
      const currentImages = editingOrder.imageUrls || editingOrder.images || [];
      setEditingOrder(prev => ({
        ...prev,
        imageUrls: [...currentImages, result.imageUrl],
        images: [...currentImages, result.imageUrl]  // Support both field names
      }));
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    const currentImages = editingOrder.imageUrls || editingOrder.images || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setEditingOrder(prev => ({
      ...prev,
      imageUrls: updatedImages,
      images: updatedImages  // Support both field names
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');

      // Validate required fields
      if (!editingOrder.location) {
        setSubmitError('Location is required');
        setActiveSection('basic');
        setIsSubmitting(false);
        return;
      }

      if (!editingOrder.buildingName) {
        setSubmitError('Building name is required');
        setActiveSection('space');
        setIsSubmitting(false);
        return;
      }

      // Submit form
      await handleUpdateForm(editingOrder);
      
      // Show success message and close modal
      handleSuccess('Work order updated successfully');
      closeEditModal();
    } catch (error) {
      setSubmitError('Failed to update work order');
      handleError(error, 'Failed to update work order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Edit Work Order #{editingOrder.workOrderId || editingOrder.uniqueId}</h3>
              <p className="text-blue-100 text-sm">Last modified: {formatDate(editingOrder.updatedAt || editingOrder.createdAt)}</p>
            </div>
          </div>
          <button 
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            onClick={closeEditModal}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{section.title}</span>
                    {activeSection === section.id && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Sections */}
          <div className="flex-1 overflow-y-auto p-6">
            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                {submitError}
              </div>
            )}

            {/* Basic Information */}
            {activeSection === 'basic' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location/Department
                    </label>
                    <input
                      type="text"
                      value={editingOrder.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter location or department"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Survey
                    </label>
                    <input
                      type="date"
                      value={editingOrder.dateOfSurvey || editingOrder.surveyDate || ''}
                      onChange={(e) => handleInputChange('dateOfSurvey', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technician Name
                    </label>
                    <input
                      type="text"
                      value={editingOrder.technician || ''}
                      onChange={(e) => handleInputChange('technician', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter technician name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={editingOrder.priority || 'medium'}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editingOrder.status || 'pending'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description of Work
                    </label>
                    <textarea
                      value={editingOrder.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter work description"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Space Information */}
            {activeSection === 'space' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Space Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Building Name
                    </label>
                    <input
                      type="text"
                      value={editingOrder.buildingName || ''}
                      onChange={(e) => handleInputChange('buildingName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter building name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confined Space Name/ID
                    </label>
                    <input
                      type="text"
                      value={editingOrder.spaceName || editingOrder.confinedSpaceNameOrId || ''}
                      onChange={(e) => {
                        handleInputChange('spaceName', e.target.value);
                        handleInputChange('confinedSpaceNameOrId', e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter space name or ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Location
                    </label>
                    <input
                      type="text"
                      value={editingOrder.spaceLocation || ''}
                      onChange={(e) => handleInputChange('spaceLocation', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter precise location of the space"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Description
                    </label>
                    <input
                      type="text"
                      value={editingOrder.spaceDescription || editingOrder.confinedSpaceDescription || ''}
                      onChange={(e) => {
                        handleInputChange('spaceDescription', e.target.value);
                        handleInputChange('confinedSpaceDescription', e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter description of the space"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Points
                    </label>
                    <input
                      type="text"
                      value={editingOrder.numberOfEntryPoints || ''}
                      onChange={(e) => handleInputChange('numberOfEntryPoints', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="How many entry points? (e.g., '2 entries')"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Is this a Confined Space?
                    </label>
                    <div className="flex space-x-4 mt-1">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isConfinedSpace"
                          checked={(editingOrder.isConfinedSpace || editingOrder.confinedSpace) === true}
                          onChange={() => {
                            handleInputChange('isConfinedSpace', true);
                            handleInputChange('confinedSpace', true);
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">Yes</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isConfinedSpace"
                          checked={(editingOrder.isConfinedSpace || editingOrder.confinedSpace) === false}
                          onChange={() => {
                            handleInputChange('isConfinedSpace', false);
                            handleInputChange('confinedSpace', false);
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hazard Assessment */}
            {activeSection === 'hazards' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Hazard Assessment
                </h3>

                <div className="space-y-6">
                  {/* Permit Required */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-800">
                        Permit Required Confined Space?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="permitRequired"
                            checked={editingOrder.permitRequired === true}
                            onChange={() => handleInputChange('permitRequired', true)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="permitRequired"
                            checked={editingOrder.permitRequired === false}
                            onChange={() => handleInputChange('permitRequired', false)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Hazards Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Atmospheric Hazard */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-gray-800">
                          Atmospheric Hazard
                        </label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="atmosphericHazard"
                              checked={editingOrder.atmosphericHazard === true}
                              onChange={() => handleInputChange('atmosphericHazard', true)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="atmosphericHazard"
                              checked={editingOrder.atmosphericHazard === false}
                              onChange={() => handleInputChange('atmosphericHazard', false)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                      {editingOrder.atmosphericHazard && (
                        <textarea
                          value={editingOrder.atmosphericHazardDescription || ''}
                          onChange={(e) => handleInputChange('atmosphericHazardDescription', e.target.value)}
                          placeholder="Describe the atmospheric hazard"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* Engulfment Hazard */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-gray-800">
                          Engulfment Hazard
                        </label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="engulfmentHazard"
                              checked={editingOrder.engulfmentHazard === true}
                              onChange={() => handleInputChange('engulfmentHazard', true)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="engulfmentHazard"
                              checked={editingOrder.engulfmentHazard === false}
                              onChange={() => handleInputChange('engulfmentHazard', false)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                      {editingOrder.engulfmentHazard && (
                        <textarea
                          value={editingOrder.engulfmentHazardDescription || ''}
                          onChange={(e) => handleInputChange('engulfmentHazardDescription', e.target.value)}
                          placeholder="Describe the engulfment hazard"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* Configuration Hazard */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-gray-800">
                          Configuration Hazard
                        </label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="configurationHazard"
                              checked={editingOrder.configurationHazard === true}
                              onChange={() => handleInputChange('configurationHazard', true)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="configurationHazard"
                              checked={editingOrder.configurationHazard === false}
                              onChange={() => handleInputChange('configurationHazard', false)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                      {editingOrder.configurationHazard && (
                        <textarea
                          value={editingOrder.configurationHazardDescription || ''}
                          onChange={(e) => handleInputChange('configurationHazardDescription', e.target.value)}
                          placeholder="Describe the configuration hazard"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* Other Hazards */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-gray-800">
                          Other Recognized Hazards
                        </label>
                        <div className="flex space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="otherRecognizedHazards"
                              checked={editingOrder.otherRecognizedHazards === true}
                              onChange={() => handleInputChange('otherRecognizedHazards', true)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Yes</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="otherRecognizedHazards"
                              checked={editingOrder.otherRecognizedHazards === false}
                              onChange={() => handleInputChange('otherRecognizedHazards', false)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                      {editingOrder.otherRecognizedHazards && (
                        <textarea
                          value={editingOrder.otherHazardsDescription || ''}
                          onChange={(e) => handleInputChange('otherHazardsDescription', e.target.value)}
                          placeholder="Describe other hazards"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Safety Requirements */}
            {activeSection === 'safety' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Safety Requirements
                </h3>

                <div className="space-y-4">
                  {/* PPE Requirements */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-800">
                        Personal Protective Equipment Required
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="ppeRequired"
                            checked={editingOrder.ppeRequired === true}
                            onChange={() => handleInputChange('ppeRequired', true)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="ppeRequired"
                            checked={editingOrder.ppeRequired === false}
                            onChange={() => handleInputChange('ppeRequired', false)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                    {editingOrder.ppeRequired && (
                      <textarea
                        value={editingOrder.ppeList || ''}
                        onChange={(e) => handleInputChange('ppeList', e.target.value)}
                        placeholder="List required PPE items"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* Ventilation */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-800">
                        Is forced air ventilation sufficient for entry?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="forcedAirVentilation"
                            checked={editingOrder.forcedAirVentilationSufficient === true}
                            onChange={() => handleInputChange('forcedAirVentilationSufficient', true)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="forcedAirVentilation"
                            checked={editingOrder.forcedAirVentilationSufficient === false}
                            onChange={() => handleInputChange('forcedAirVentilationSufficient', false)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Air Monitor */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-800">
                        Dedicated continuous air monitor required?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="dedicatedAirMonitor"
                            checked={editingOrder.dedicatedContinuousAirMonitor === true || editingOrder.dedicatedAirMonitor === true}
                            onChange={() => {
                              handleInputChange('dedicatedContinuousAirMonitor', true);
                              handleInputChange('dedicatedAirMonitor', true);
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="dedicatedAirMonitor"
                            checked={editingOrder.dedicatedContinuousAirMonitor === false || editingOrder.dedicatedAirMonitor === false}
                            onChange={() => {
                              handleInputChange('dedicatedContinuousAirMonitor', false);
                              handleInputChange('dedicatedAirMonitor', false);
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Warning Sign */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-800">
                        Warning sign posted?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="warningSignPosted"
                            checked={editingOrder.warningSignPosted === true}
                            onChange={() => handleInputChange('warningSignPosted', true)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="warningSignPosted"
                            checked={editingOrder.warningSignPosted === false}
                            onChange={() => handleInputChange('warningSignPosted', false)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Requirements
                    </label>
                    <textarea
                      value={editingOrder.entryRequirements || ''}
                      onChange={(e) => handleInputChange('entryRequirements', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter special entry requirements or precautions"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Personnel & Access */}
            {activeSection === 'personnel' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Personnel & Access
                </h3>

                <div className="space-y-4">
                  {/* Other Workers */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-800">
                        Are other people working near space?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="otherPeopleWorkingNearSpace"
                            checked={editingOrder.otherPeopleWorkingNearSpace === true}
                            onChange={() => handleInputChange('otherPeopleWorkingNearSpace', true)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="otherPeopleWorkingNearSpace"
                            checked={editingOrder.otherPeopleWorkingNearSpace === false}
                            onChange={() => handleInputChange('otherPeopleWorkingNearSpace', false)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-800">
                        Can others see into the space?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="canOthersSeeIntoSpace"
                            checked={editingOrder.canOthersSeeIntoSpace === true}
                            onChange={() => handleInputChange('canOthersSeeIntoSpace', true)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="canOthersSeeIntoSpace"
                            checked={editingOrder.canOthersSeeIntoSpace === false}
                            onChange={() => handleInputChange('canOthersSeeIntoSpace', false)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Contractors */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-800">
                        Do contractors enter the space?
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="contractorsEnterSpace"
                            checked={editingOrder.contractorsEnterSpace === true}
                            onChange={() => handleInputChange('contractorsEnterSpace', true)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="contractorsEnterSpace"
                            checked={editingOrder.contractorsEnterSpace === false}
                            onChange={() => handleInputChange('contractorsEnterSpace', false)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editingOrder.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any additional notes about personnel and access"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Images & Documentation */}
            {activeSection === 'images' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Images & Documentation
                </h3>

                <div className="space-y-4">
                  {/* Image Gallery */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Space Images</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {(editingOrder.images || editingOrder.imageUrls || []).map((image, index) => (
                        <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <img
                            src={typeof image === 'string' ? image : image.url}
                            alt={`Space image ${index + 1}`}
                            className="object-cover w-full h-32"
                          />
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {/* Upload Button */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-4 h-32 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          id="manager-image-upload"
                          disabled={uploadingImages}
                        />
                        <label 
                          htmlFor="manager-image-upload"
                          className={`text-center cursor-pointer ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {uploadingImages ? (
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-1"></div>
                              <span className="text-sm text-blue-600">Uploading...</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Plus className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                              <span className="text-sm text-gray-500">Add Image</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Upload Instructions */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800">
                    <div className="flex">
                      <Info className="h-5 w-5 mr-2 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Image Upload Guidelines:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Click "Add Image" to upload new photos</li>
                          <li>Supported formats: JPG, PNG, GIF, WebP</li>
                          <li>Maximum file size: 10MB per image</li>
                          <li>You can upload multiple images at once</li>
                          <li>Click the trash icon to remove images</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setActiveSection(sections.findIndex(s => s.id === activeSection) > 0 
                  ? sections[sections.findIndex(s => s.id === activeSection) - 1].id 
                  : activeSection)}
                className={`px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors
                  ${activeSection === sections[0].id ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={activeSection === sections[0].id}
              >
                Previous
              </button>
              
              {activeSection !== sections[sections.length - 1].id ? (
                <button
                  type="button"
                  onClick={() => setActiveSection(sections.findIndex(s => s.id === activeSection) < sections.length - 1 
                    ? sections[sections.findIndex(s => s.id === activeSection) + 1].id 
                    : activeSection)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ManagerEditWorkOrderForm;