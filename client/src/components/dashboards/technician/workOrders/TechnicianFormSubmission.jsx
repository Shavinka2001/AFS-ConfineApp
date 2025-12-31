import React, { useState } from 'react';
import {
  Upload,
  X,
  Plus,
  Save,
  FileText,
  Camera,
  AlertCircle,
  CheckCircle,
  Building,
  MapPin,
  User,
  Calendar,
  Shield,
  Eye,
  Trash2
} from 'lucide-react';

const TechnicianFormSubmission = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    spaceName: '',
    building: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    entrySupervisor: '',
    attendant: '',
    entrants: '',
    status: 'Pending',
    priority: 'Medium',
    isolationProcedures: '',
    ventilationRequired: 'No',
    testingEquipment: '',
    communicationMethods: '',
    notes: '',
    images: []
  });

  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.spaceName.trim()) newErrors.spaceName = 'Space name is required';
    if (!formData.building.trim()) newErrors.building = 'Building is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.entrySupervisor.trim()) newErrors.entrySupervisor = 'Entry supervisor is required';
    if (!formData.attendant.trim()) newErrors.attendant = 'Attendant is required';
    if (!formData.isolationProcedures.trim()) newErrors.isolationProcedures = 'Isolation procedures are required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (files) => {
    const newImages = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        id: `CONF-${Date.now().toString().slice(-6)}`,
        submittedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white rounded-none md:rounded-2xl lg:rounded-3xl shadow-2xl w-full h-full md:h-auto md:max-w-6xl md:max-h-[95vh] overflow-hidden border-0 md:border md:border-gray-200 flex flex-col">
        {/* Modern Header */}
        <div className="relative bg-gradient-to-br from-[#232249] via-[#2a2a5c] to-[#1a1b3a] p-4 md:p-6 lg:p-8 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between text-white gap-3 md:gap-0">
            <div className="flex items-center space-x-3 md:space-x-6 flex-1 min-w-0">
              <div className="p-2 md:p-3 lg:p-4 bg-white/15 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg flex-shrink-0">
                <FileText className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent mb-1 md:mb-2">
                  New Inspection Form
                </h2>
                <p className="text-white/80 text-xs md:text-base lg:text-lg truncate">Submit confined space inspection details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl md:rounded-2xl transition-all duration-300 group border border-white/20 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center flex-shrink-0"
            >
              <X className="h-6 w-6 group-hover:scale-110 transition-transform text-white" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 overflow-y-auto bg-gradient-to-br from-gray-50/50 to-white">
          {/* Basic Information */}
          <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl border border-gray-100">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl md:rounded-2xl mr-3 md:mr-4 flex-shrink-0">
                <Building className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Space Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2 md:space-y-3">
                <label className="block text-sm font-bold text-gray-800">Space Name *</label>
                <input
                  type="text"
                  value={formData.spaceName}
                  onChange={(e) => handleInputChange('spaceName', e.target.value)}
                  className={`w-full px-4 md:px-5 py-3.5 md:py-4 min-h-[48px] border-2 rounded-xl md:rounded-2xl transition-all duration-300 bg-white shadow-lg font-medium text-base ${
                    errors.spaceName 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-[#232249]/20 focus:border-[#232249]'
                  }`}
                  placeholder="Enter space name..."
                />
                {errors.spaceName && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.spaceName}</p>}
              </div>
              
              <div className="space-y-2 md:space-y-3">
                <label className="block text-sm font-bold text-gray-800">Building *</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => handleInputChange('building', e.target.value)}
                  className={`w-full px-4 md:px-5 py-3.5 md:py-4 min-h-[48px] border-2 rounded-xl md:rounded-2xl transition-all duration-300 bg-white shadow-lg font-medium text-base ${
                    errors.building 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-[#232249]/20 focus:border-[#232249]'
                  }`}
                  placeholder="Enter building..."
                />
                {errors.building && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.building}</p>}
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 bg-white shadow-lg font-medium ${
                    errors.location 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-[#232249]/20 focus:border-[#232249]'
                  }`}
                  placeholder="Enter location..."
                />
                {errors.location && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.location}</p>}
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-white shadow-lg font-medium"
                />
              </div>
            </div>
          </div>

          {/* Personnel Information */}
          <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl border border-gray-100">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl md:rounded-2xl mr-3 md:mr-4 flex-shrink-0">
                <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Personnel</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800">Entry Supervisor *</label>
                <input
                  type="text"
                  value={formData.entrySupervisor}
                  onChange={(e) => handleInputChange('entrySupervisor', e.target.value)}
                  className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 bg-white shadow-lg font-medium ${
                    errors.entrySupervisor 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-[#232249]/20 focus:border-[#232249]'
                  }`}
                  placeholder="Enter supervisor name..."
                />
                {errors.entrySupervisor && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.entrySupervisor}</p>}
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800">Attendant *</label>
                <input
                  type="text"
                  value={formData.attendant}
                  onChange={(e) => handleInputChange('attendant', e.target.value)}
                  className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 bg-white shadow-lg font-medium ${
                    errors.attendant 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-[#232249]/20 focus:border-[#232249]'
                  }`}
                  placeholder="Enter attendant name..."
                />
                {errors.attendant && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.attendant}</p>}
              </div>
              
              <div className="md:col-span-2 space-y-3">
                <label className="block text-sm font-bold text-gray-800">Entrants</label>
                <textarea
                  value={formData.entrants}
                  onChange={(e) => handleInputChange('entrants', e.target.value)}
                  rows={3}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-white shadow-lg font-medium resize-none"
                  placeholder="Enter entrant names (one per line)..."
                />
              </div>
            </div>
          </div>

          {/* Safety Information */}
          <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl border border-gray-100">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl md:rounded-2xl mr-3 md:mr-4 flex-shrink-0">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Safety Measures</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800">Isolation Procedures *</label>
                <textarea
                  value={formData.isolationProcedures}
                  onChange={(e) => handleInputChange('isolationProcedures', e.target.value)}
                  rows={3}
                  className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 bg-white shadow-lg font-medium resize-none ${
                    errors.isolationProcedures 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-[#232249]/20 focus:border-[#232249]'
                  }`}
                  placeholder="Describe isolation procedures..."
                />
                {errors.isolationProcedures && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.isolationProcedures}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800">Ventilation Required</label>
                  <select
                    value={formData.ventilationRequired}
                    onChange={(e) => handleInputChange('ventilationRequired', e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-white shadow-lg font-medium"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-white shadow-lg font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800">Testing Equipment</label>
                <input
                  type="text"
                  value={formData.testingEquipment}
                  onChange={(e) => handleInputChange('testingEquipment', e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-white shadow-lg font-medium"
                  placeholder="List testing equipment..."
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800">Communication Methods</label>
                <input
                  type="text"
                  value={formData.communicationMethods}
                  onChange={(e) => handleInputChange('communicationMethods', e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-white shadow-lg font-medium"
                  placeholder="Describe communication methods..."
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl border border-gray-100">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl md:rounded-2xl mr-3 md:mr-4 flex-shrink-0">
                <Camera className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Images & Documentation</h3>
            </div>
            
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-[#232249] bg-[#232249]/5' 
                  : 'border-gray-300 hover:border-[#232249]/50 hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-[#232249]/10 rounded-full">
                  <Upload className="h-12 w-12 text-[#232249]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Drop images here or click to browse
                  </p>
                  <p className="text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                </div>
              </div>
            </div>
            
            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Images ({formData.images.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((image) => (
                    <div key={image.id} className="relative group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{image.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl border border-gray-100">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl md:rounded-2xl mr-3 md:mr-4 flex-shrink-0">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Additional Notes</h3>
            </div>
            
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-300 bg-white shadow-lg font-medium resize-none"
              placeholder="Any additional notes or observations..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 md:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 min-h-[48px] text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl md:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-base touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 min-h-[48px] bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white rounded-xl md:rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base touch-manipulation"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Submit Form</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TechnicianFormSubmission;
