import React, { useState } from 'react';
import {
  XCircle,
  FileText,
  Save,
  AlertTriangle,
  Building,
  Shield,
  Users,
  Camera,
  Calendar,
  User,
  MapPin,
  Wind,
  Droplets,
  Activity,
  Thermometer,
  Upload,
  Eye,
  Trash2,
  Clock
} from 'lucide-react';

const AdminEditWorkOrderForm = ({
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
    setEditingOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRadioChange = (field, value) => {
    setEditingOrder(prev => ({
      ...prev,
      [field]: value
    }));
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
      
      const response = await fetch('/api/workorder/upload-image', {
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
      const currentImages = editingOrder.imageUrls || [];
      setEditingOrder(prev => ({
        ...prev,
        imageUrls: [...currentImages, result.imageUrl]
      }));
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    const updatedImages = editingOrder.imageUrls.filter((_, i) => i !== index);
    setEditingOrder(prev => ({
      ...prev,
      imageUrls: updatedImages
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Validate required fields
      const requiredFields = ['technician', 'spaceName', 'building', 'locationDescription'];
      const missingFields = requiredFields.filter(field => !editingOrder[field]?.trim());
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in required fields: ${missingFields.join(', ')}`);
      }

      // Validate boolean fields are not null for required hazard assessments
      const requiredBooleanFields = [
        'isConfinedSpace', 'permitRequired', 'atmosphericHazard', 
        'engulfmentHazard', 'configurationHazard', 'otherRecognizedHazards',
        'ppeRequired', 'forcedAirVentilationSufficient', 'dedicatedAirMonitor',
        'warningSignPosted', 'otherPeopleWorkingNearSpace', 'canOthersSeeIntoSpace',
        'contractorsEnterSpace'
      ];
      
      const nullBooleanFields = requiredBooleanFields.filter(field => 
        editingOrder[field] === null || editingOrder[field] === undefined
      );
      
      if (nullBooleanFields.length > 0) {
        throw new Error(`Please provide answers for all assessment questions`);
      }

      // Validate number of entry points if provided
      if (editingOrder.numberOfEntryPoints) {
        const entryPoints = parseInt(editingOrder.numberOfEntryPoints);
        if (isNaN(entryPoints) || entryPoints < 0 || entryPoints > 20) {
          throw new Error('Number of entry points must be between 0 and 20');
        }
      }

      await handleUpdateForm();
      setSubmitError('');
    } catch (error) {
      console.error('Error updating work order:', error);
      setSubmitError(error.message || 'Failed to update work order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl max-h-[90vh] overflow-hidden w-full border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#232249] via-[#2a2a5c] to-[#1a1b3a] p-8">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-2">Edit Work Order</h2>
                <p className="text-white/80 text-lg">
                  {editingOrder.workOrderId || `WO-${new Date(editingOrder.surveyDate || editingOrder.createdAt).getFullYear()}-${String(editingOrder.id || editingOrder._id).slice(-4)}`}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(editingOrder.surveyDate || editingOrder.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {editingOrder.technician}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    editingOrder.status === 'completed' ? 'bg-green-500/20 text-green-100' :
                    editingOrder.status === 'in-progress' ? 'bg-blue-500/20 text-blue-100' :
                    editingOrder.status === 'pending' ? 'bg-yellow-500/20 text-yellow-100' :
                    'bg-gray-500/20 text-gray-100'
                  }`}>
                    {editingOrder.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={closeEditModal}
                className="p-4 hover:bg-white/20 rounded-2xl transition-all duration-300 group border border-white/20"
              >
                <XCircle className="h-8 w-8 group-hover:scale-110 transition-transform text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex overflow-x-auto scrollbar-hide">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center p-3 border-b-2 transition-colors duration-200 whitespace-nowrap ${
                    isActive 
                      ? 'border-[#232249] bg-blue-50 text-[#232249]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="font-medium text-xs sm:text-sm">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{submitError}</span>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Survey Date *
                  </label>
                  <input
                    type="date"
                    value={editingOrder.surveyDate ? new Date(editingOrder.surveyDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('surveyDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Technician Name *
                  </label>
                  <input
                    type="text"
                    value={editingOrder.technician || ''}
                    onChange={(e) => handleInputChange('technician', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    placeholder="Enter technician name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Priority Level
                  </label>
                  <select
                    value={editingOrder.priority || 'medium'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingOrder.status || 'pending'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                {editingOrder.createdBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created By
                    </label>
                    <input
                      type="text"
                      value={editingOrder.createdBy}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                )}

                {editingOrder.workOrderId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Order ID
                    </label>
                    <input
                      type="text"
                      value={editingOrder.workOrderId}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Space Information Section */}
          {activeSection === 'space' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <Building className="w-6 h-6 mr-2" />
                Space Information
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Space Name/ID *
                    </label>
                    <input
                      type="text"
                      value={editingOrder.spaceName || ''}
                      onChange={(e) => handleInputChange('spaceName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                      placeholder="Enter space identifier"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline w-4 h-4 mr-1" />
                      Building *
                    </label>
                    <input
                      type="text"
                      value={editingOrder.building || ''}
                      onChange={(e) => handleInputChange('building', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                      placeholder="Enter building name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Description *
                  </label>
                  <textarea
                    value={editingOrder.locationDescription || ''}
                    onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="3"
                    placeholder="Describe the location of the confined space"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confined Space Description
                  </label>
                  <textarea
                    value={editingOrder.confinedSpaceDescription || ''}
                    onChange={(e) => handleInputChange('confinedSpaceDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="3"
                    placeholder="Additional details about the confined space"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Entry Points
                  </label>
                  <input
                    type="number"
                    value={editingOrder.numberOfEntryPoints || ''}
                    onChange={(e) => handleInputChange('numberOfEntryPoints', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    placeholder="Enter number of entry points (0-20)"
                    min="0"
                    max="20"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a number between 0 and 20</p>
                </div>

                {/* Space Classification */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-[#232249] mb-4">Space Classification</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Is this a confined space? *
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            checked={editingOrder.isConfinedSpace === true}
                            onChange={() => handleRadioChange('isConfinedSpace', true)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            checked={editingOrder.isConfinedSpace === false}
                            onChange={() => handleRadioChange('isConfinedSpace', false)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Is an entry permit required? *
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="permitRequired"
                            checked={editingOrder.permitRequired === true}
                            onChange={() => handleRadioChange('permitRequired', true)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="permitRequired"
                            checked={editingOrder.permitRequired === false}
                            onChange={() => handleRadioChange('permitRequired', false)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entry Requirements
                      </label>
                      <textarea
                        value={editingOrder.entryRequirements || ''}
                        onChange={(e) => handleInputChange('entryRequirements', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                        rows="3"
                        placeholder="Describe specific entry requirements or procedures"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hazard Assessment Section */}
          {activeSection === 'hazards' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Hazard Assessment
              </h3>
              
              <div className="space-y-6">
                {/* Atmospheric Hazard */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Wind className="inline w-4 h-4 mr-1" />
                    Atmospheric Hazard Present? *
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        checked={editingOrder.atmosphericHazard === true}
                        onChange={() => handleRadioChange('atmosphericHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        checked={editingOrder.atmosphericHazard === false}
                        onChange={() => handleRadioChange('atmosphericHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingOrder.atmosphericHazardDescription || ''}
                    onChange={(e) => handleInputChange('atmosphericHazardDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="2"
                    placeholder="Describe atmospheric hazards if present"
                  />
                </div>

                {/* Engulfment Hazard */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Droplets className="inline w-4 h-4 mr-1" />
                    Engulfment Hazard Present? *
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        checked={editingOrder.engulfmentHazard === true}
                        onChange={() => handleRadioChange('engulfmentHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        checked={editingOrder.engulfmentHazard === false}
                        onChange={() => handleRadioChange('engulfmentHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingOrder.engulfmentHazardDescription || ''}
                    onChange={(e) => handleInputChange('engulfmentHazardDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="2"
                    placeholder="Describe engulfment hazards if present"
                  />
                </div>

                {/* Configuration Hazard */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Activity className="inline w-4 h-4 mr-1" />
                    Configuration Hazard Present? *
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="configurationHazard"
                        checked={editingOrder.configurationHazard === true}
                        onChange={() => handleRadioChange('configurationHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="configurationHazard"
                        checked={editingOrder.configurationHazard === false}
                        onChange={() => handleRadioChange('configurationHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingOrder.configurationHazardDescription || ''}
                    onChange={(e) => handleInputChange('configurationHazardDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="2"
                    placeholder="Describe configuration hazards if present"
                  />
                </div>

                {/* Other Hazards */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <AlertTriangle className="inline w-4 h-4 mr-1" />
                    Other Recognized Hazards Present? *
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        checked={editingOrder.otherRecognizedHazards === true}
                        onChange={() => handleRadioChange('otherRecognizedHazards', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        checked={editingOrder.otherRecognizedHazards === false}
                        onChange={() => handleRadioChange('otherRecognizedHazards', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingOrder.otherHazardsDescription || ''}
                    onChange={(e) => handleInputChange('otherHazardsDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="2"
                    placeholder="Describe other hazards if present"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Safety Requirements Section */}
          {activeSection === 'safety' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Safety Requirements
              </h3>
              
              <div className="space-y-6">
                {/* PPE Required */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Personal Protective Equipment (PPE) Required? *
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ppeRequired"
                        checked={editingOrder.ppeRequired === true}
                        onChange={() => handleRadioChange('ppeRequired', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ppeRequired"
                        checked={editingOrder.ppeRequired === false}
                        onChange={() => handleRadioChange('ppeRequired', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingOrder.ppeList || ''}
                    onChange={(e) => handleInputChange('ppeList', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="2"
                    placeholder="List required PPE if applicable"
                  />
                </div>

                {/* Forced Air Ventilation */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Wind className="inline w-4 h-4 mr-1" />
                    Is forced air ventilation sufficient for safe entry? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        checked={editingOrder.forcedAirVentilationSufficient === true}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        checked={editingOrder.forcedAirVentilationSufficient === false}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Dedicated Air Monitor */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Thermometer className="inline w-4 h-4 mr-1" />
                    Is a dedicated air monitor required? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        checked={editingOrder.dedicatedAirMonitor === true}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        checked={editingOrder.dedicatedAirMonitor === false}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Warning Sign */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Is a warning sign posted? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        checked={editingOrder.warningSignPosted === true}
                        onChange={() => handleRadioChange('warningSignPosted', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        checked={editingOrder.warningSignPosted === false}
                        onChange={() => handleRadioChange('warningSignPosted', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personnel & Access Section */}
          {activeSection === 'personnel' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <Users className="w-6 h-6 mr-2" />
                Personnel & Access
              </h3>
              
              <div className="space-y-6">
                {/* Other People Working */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Users className="inline w-4 h-4 mr-1" />
                    Are other people working near the space? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        checked={editingOrder.otherPeopleWorkingNearSpace === true}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        checked={editingOrder.otherPeopleWorkingNearSpace === false}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Visibility */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Can others see into the space? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        checked={editingOrder.canOthersSeeIntoSpace === true}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        checked={editingOrder.canOthersSeeIntoSpace === false}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Contractors */}
                <div className="border-b pb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do contractors enter the space? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        checked={editingOrder.contractorsEnterSpace === true}
                        onChange={() => handleRadioChange('contractorsEnterSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        checked={editingOrder.contractorsEnterSpace === false}
                        onChange={() => handleRadioChange('contractorsEnterSpace', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={editingOrder.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="4"
                    placeholder="Any additional observations, concerns, or notes about the confined space assessment"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Images & Documentation Section */}
          {activeSection === 'images' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <Camera className="w-6 h-6 mr-2" />
                Images & Documentation
              </h3>
              
              <div className="space-y-6">
                {/* Current Images */}
                {(editingOrder.imageUrls?.length > 0) && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-4">
                      Current Images ({editingOrder.imageUrls.length})
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {editingOrder.imageUrls.map((imageUrl, index) => (
                        <div key={`image-${index}`} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg border border-gray-200">
                            <img
                              src={imageUrl}
                              alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                console.log(`Failed to load image ${index + 1}:`, imageUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="w-full h-full bg-gray-200 hidden items-center justify-center text-gray-500 text-sm">
                              Image not available
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => window.open(imageUrl, '_blank')}
                                className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all"
                                title="View Image"
                              >
                                <Eye className="h-4 w-4 text-gray-700" />
                              </button>
                              <button
                                onClick={() => removeImage(index)}
                                className="bg-red-500 rounded-full p-2 shadow-lg hover:shadow-xl transition-all"
                                title="Remove Image"
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-lg">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show message if no images */}
                {(!editingOrder.imageUrls || editingOrder.imageUrls.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No images uploaded yet</p>
                  </div>
                )}

                {/* Image Upload Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload New Images
                  </h4>
                  
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImages}
                      />
                      <label 
                        htmlFor="image-upload"
                        className={`cursor-pointer ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                        <h5 className="text-lg font-medium text-blue-800 mb-2">
                          {uploadingImages ? 'Uploading...' : 'Upload Images'}
                        </h5>
                        <p className="text-sm text-blue-600 mb-3">
                          Click to select images from your device
                        </p>
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block hover:bg-blue-700 transition-colors">
                          {uploadingImages ? 'Please wait...' : 'Choose Files'}
                        </div>
                      </label>
                    </div>
                    
                    {/* Upload Progress */}
                    {uploadingImages && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-blue-800 font-medium">Uploading images...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Note about image management */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-800 mb-2">Image Management:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click the eye icon to view images in full size</li>
                    <li>• Click the trash icon to remove images from the work order</li>
                    <li>• You can upload multiple images at once</li>
                    <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                    <li>• Maximum file size: 10MB per image</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed Position */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>Last Modified: {formatDate(editingOrder.lastModified || editingOrder.updatedAt || editingOrder.createdAt)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeEditModal}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#232249] to-[#2a2a5c] text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 font-medium min-w-[140px] justify-center border-2 border-[#232249]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditWorkOrderForm;