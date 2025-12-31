import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import PDFDownloadButton from '../../../ui/PDFDownloadButton';

const EditModal = ({
  showEditModal,
  editingForm,
  setEditingForm,
  closeEditModal,
  handleUpdateForm,
  formatDate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  if (!showEditModal || !editingForm) return null;

  const sections = [
    { id: 'basic', title: 'Basic Information', icon: FileText },
    { id: 'space', title: 'Space Information', icon: Building },
    { id: 'hazards', title: 'Hazard Assessment', icon: AlertTriangle },
    { id: 'safety', title: 'Safety Requirements', icon: Shield },
    { id: 'personnel', title: 'Personnel & Access', icon: Users },
    { id: 'images', title: 'Images & Documentation', icon: Camera }
  ];

  const handleInputChange = (field, value) => {
    setEditingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRadioChange = (field, value) => {
    setEditingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Image upload functionality
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    console.log('Starting upload of', files.length, 'files');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'uploading', progress: 0 }
          }));
          
          await handleImageUpload(file);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'completed', progress: 100 }
          }));
        }
      }
    } catch (error) {
      console.error('Error during file upload:', error);
    } finally {
      setUploadingImages(false);
      setUploadProgress({});
      // Reset file input
      event.target.value = '';
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('Uploading image:', file.name, 'for work order:', editingForm._id || editingForm.id);
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('orderId', editingForm._id || editingForm.id || `temp-${Date.now()}`);
      
      const response = await fetch('/api/workorder/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const responseText = await response.text();
      console.log('Upload response status:', response.status);
      console.log('Upload response text:', responseText);
      
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
      console.log('Upload successful:', result);
      
      // Add the new image URL to the editing form
      const currentImages = editingForm.imageUrls || [];
      const updatedImages = [...currentImages, result.imageUrl];
      
      console.log('Updating imageUrls from', currentImages.length, 'to', updatedImages.length);
      
      setEditingForm(prev => ({
        ...prev,
        imageUrls: updatedImages
      }));
      
      return result;
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image ${file.name}: ${error.message}`);
      throw error;
    }
  };

  const removeImage = (index) => {
    const currentImages = editingForm.imageUrls || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    
    console.log('Removing image at index', index, 'from', currentImages.length, 'images');
    
    setEditingForm(prev => ({
      ...prev,
      imageUrls: updatedImages
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Ensure we pass the updated form data
      await handleUpdateForm(editingForm);
    } catch (error) {
      console.error('Error updating form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white rounded-none md:rounded-2xl lg:rounded-3xl shadow-2xl w-full h-full md:h-auto md:max-w-6xl md:max-h-[95vh] overflow-hidden border-0 md:border md:border-gray-200 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#232249] via-[#2a2a5c] to-[#1a1b3a] p-4 md:p-6 lg:p-8 flex-shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white gap-3 md:gap-0">
            <div className="flex items-center space-x-3 md:space-x-6 flex-1 min-w-0">
              <div className="p-2 md:p-3 lg:p-4 bg-white/15 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg flex-shrink-0">
                <FileText className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 truncate">Edit Work Order</h2>
                <p className="text-white/80 text-xs md:text-base lg:text-lg truncate">
                  {editingForm.workOrderId || `WO-${new Date(editingForm.submittedAt || editingForm.createdAt).getFullYear()}-${String(editingForm.id).padStart(4, '0')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* PDF Download Button */}
              <PDFDownloadButton 
                workOrder={editingForm} 
                size="large"
                className="bg-white/15 text-white hover:bg-white/25 border-white/20"
              />
              
              <button
                onClick={closeEditModal}
                className="p-3 md:p-4 hover:bg-white/20 rounded-xl md:rounded-2xl transition-all duration-300 group border border-white/20 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <XCircle className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 group-hover:scale-110 transition-transform text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          <div className="flex min-w-max md:min-w-0">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 min-w-[120px] md:min-w-0 flex items-center justify-center p-3.5 md:p-3 min-h-[48px] border-b-2 transition-colors duration-200 whitespace-nowrap touch-manipulation ${
                    isActive 
                      ? 'border-[#232249] bg-blue-50 text-[#232249]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="font-medium text-sm">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-bold text-[#232249] mb-3 md:mb-4 flex items-center">
                <FileText className="w-5 h-5 md:w-6 md:h-6 mr-2 flex-shrink-0" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Survey Date *
                  </label>
                  <input
                    type="date"
                    value={editingForm.surveyDate ? new Date(editingForm.surveyDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('surveyDate', e.target.value)}
                    className="w-full px-3 py-3 min-h-[48px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Technician Name *
                  </label>
                  <input
                    type="text"
                    value={editingForm.technician || ''}
                    onChange={(e) => handleInputChange('technician', e.target.value)}
                    className="w-full px-3 py-3 min-h-[48px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent text-base"
                    placeholder="Enter technician name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={editingForm.priority || 'medium'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-3 min-h-[48px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent text-base"
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
                    value={editingForm.status || 'pending'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-3 min-h-[48px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent text-base"
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
              </div>
            </div>
          )}

          {/* Space Information Section */}
          {activeSection === 'space' && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-bold text-[#232249] mb-3 md:mb-4 flex items-center">
                <Building className="w-5 h-5 md:w-6 md:h-6 mr-2 flex-shrink-0" />
                Space Information
              </h3>
              
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Space Name/ID *
                    </label>
                    <input
                      type="text"
                      value={editingForm.spaceName || ''}
                      onChange={(e) => handleInputChange('spaceName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                      placeholder="Enter space identifier"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline w-4 h-4 mr-1" />
                      Building *
                    </label>
                    <input
                      type="text"
                      value={editingForm.building || ''}
                      onChange={(e) => handleInputChange('building', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                      placeholder="Enter building name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Description *
                  </label>
                  <textarea
                    value={editingForm.locationDescription || ''}
                    onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="3"
                    placeholder="Describe the location of the confined space"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confined Space Description
                  </label>
                  <textarea
                    value={editingForm.confinedSpaceDescription || ''}
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
                    value={editingForm.numberOfEntryPoints || ''}
                    onChange={(e) => handleInputChange('numberOfEntryPoints', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    placeholder="Enter number of entry points"
                    min="1"
                  />
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
                            checked={editingForm.isConfinedSpace === true}
                            onChange={() => handleRadioChange('isConfinedSpace', true)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            checked={editingForm.isConfinedSpace === false}
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
                            checked={editingForm.permitRequired === true}
                            onChange={() => handleRadioChange('permitRequired', true)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="permitRequired"
                            checked={editingForm.permitRequired === false}
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
                        value={editingForm.entryRequirements || ''}
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
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-bold text-[#232249] mb-3 md:mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 mr-2 flex-shrink-0" />
                Hazard Assessment
              </h3>
              
              <div className="space-y-4 md:space-y-6">
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
                        checked={editingForm.atmosphericHazard === true}
                        onChange={() => handleRadioChange('atmosphericHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        checked={editingForm.atmosphericHazard === false}
                        onChange={() => handleRadioChange('atmosphericHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingForm.atmosphericHazardDescription || ''}
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
                        checked={editingForm.engulfmentHazard === true}
                        onChange={() => handleRadioChange('engulfmentHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        checked={editingForm.engulfmentHazard === false}
                        onChange={() => handleRadioChange('engulfmentHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingForm.engulfmentHazardDescription || ''}
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
                        checked={editingForm.configurationHazard === true}
                        onChange={() => handleRadioChange('configurationHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="configurationHazard"
                        checked={editingForm.configurationHazard === false}
                        onChange={() => handleRadioChange('configurationHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingForm.configurationHazardDescription || ''}
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
                        checked={editingForm.otherRecognizedHazards === true}
                        onChange={() => handleRadioChange('otherRecognizedHazards', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        checked={editingForm.otherRecognizedHazards === false}
                        onChange={() => handleRadioChange('otherRecognizedHazards', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingForm.otherHazardsDescription || ''}
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
                        checked={editingForm.ppeRequired === true}
                        onChange={() => handleRadioChange('ppeRequired', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ppeRequired"
                        checked={editingForm.ppeRequired === false}
                        onChange={() => handleRadioChange('ppeRequired', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={editingForm.ppeList || ''}
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
                        checked={editingForm.forcedAirVentilationSufficient === true}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        checked={editingForm.forcedAirVentilationSufficient === false}
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
                        checked={editingForm.dedicatedAirMonitor === true}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        checked={editingForm.dedicatedAirMonitor === false}
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
                        checked={editingForm.warningSignPosted === true}
                        onChange={() => handleRadioChange('warningSignPosted', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        checked={editingForm.warningSignPosted === false}
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
                        checked={editingForm.otherPeopleWorkingNearSpace === true}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        checked={editingForm.otherPeopleWorkingNearSpace === false}
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
                        checked={editingForm.canOthersSeeIntoSpace === true}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        checked={editingForm.canOthersSeeIntoSpace === false}
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
                        checked={editingForm.contractorsEnterSpace === true}
                        onChange={() => handleRadioChange('contractorsEnterSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        checked={editingForm.contractorsEnterSpace === false}
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
                    value={editingForm.notes || ''}
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
                {(editingForm.imageUrls?.length > 0) && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-4">
                      Current Images ({editingForm.imageUrls.length})
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {editingForm.imageUrls.map((imageUrl, index) => (
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
                                onClick={() => {
                                  const updatedImages = editingForm.imageUrls.filter((_, i) => i !== index);
                                  setEditingForm({
                                    ...editingForm, 
                                    imageUrls: updatedImages
                                  });
                                }}
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
                {(!editingForm.imageUrls || editingForm.imageUrls.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No images uploaded yet</p>
                  </div>
                )}

                {/* Add New Images */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-4">
                    Add New Images
                    {uploadingImages && (
                      <span className="ml-2 text-blue-600 text-xs">
                        (Uploading...)
                      </span>
                    )}
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#232249] transition-all duration-300">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      {uploadingImages ? 'Uploading images to server...' : 'Drag and drop images here, or click to select'}
                    </p>
                    
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    
                    <label
                      htmlFor="image-upload"
                      className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 ${
                        uploadingImages ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Select Images
                        </>
                      )}
                    </label>
                  </div>
                  
                  {/* Upload Progress */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 truncate">{fileName}</span>
                            <span className="text-blue-600">{progress.status}</span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Images Display */}
                {editingForm.imageUrls && editingForm.imageUrls.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-4">
                      Current Images ({editingForm.imageUrls.length})
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {editingForm.imageUrls.map((imageUrl, index) => (
                        <div key={`image-${index}`} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg border border-gray-200">
                            <img
                              src={imageUrl}
                              alt={`Work order image ${index + 1}`}
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

                {/* Upload Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h5 className="font-medium text-blue-800 mb-2">Image Upload Guidelines:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Images are uploaded to secure cloud storage</li>
                    <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                    <li>• Maximum file size: 10MB per image</li>
                    <li>• You can upload multiple images at once</li>
                    <li>• Images are automatically saved with the work order</li>
                  </ul>
                </div>

                {/* Debug Information (remove in production) */}
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Debug Info:</strong><br/>
                    ImageUrls array length: {editingForm.imageUrls?.length || 0}<br/>
                    Work Order ID: {editingForm.workOrderId || 'Not generated'}<br/>
                    Status: {editingForm.status || 'Unknown'}
                  </p>
                  {(editingForm.imageUrls || []).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-yellow-800 cursor-pointer">View image URLs</summary>
                      <pre className="text-xs text-yellow-700 mt-2 max-h-32 overflow-y-auto">
                        {JSON.stringify(editingForm.imageUrls, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed Position */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>Last Modified: {formatDate(editingForm.lastModified || editingForm.updatedAt)}</span>
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

export default EditModal;
