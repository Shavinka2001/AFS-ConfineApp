import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Building, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  Activity,
  Loader2,
  Save,
  Check,
  Camera,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { locationService } from '../../../services/locationAPI';

const TechnicianForm = () => {
  const [activeSection, setActiveSection] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [images, setImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Location and building data
  const [locations, setLocations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [confinedSpaces, setConfinedSpaces] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedConfinedSpace, setSelectedConfinedSpace] = useState(null);
  const [formData, setFormData] = useState({
    // Basic Information
    surveyDate: '',
    technician: '',
    priority: 'medium',
    
    // Space Information
    spaceName: '',
    locationId: '',
    buildingId: '',
    confinedSpaceId: '',
    building: '',
    locationDescription: '',
    confinedSpaceDescription: '',
    numberOfEntryPoints: '',
    
    // Space Classification
    isConfinedSpace: null,
    permitRequired: null,
    entryRequirements: '',
    
    // Hazard Assessment
    atmosphericHazard: null,
    atmosphericHazardDescription: '',
    engulfmentHazard: null,
    engulfmentHazardDescription: '',
    configurationHazard: null,
    configurationHazardDescription: '',
    otherRecognizedHazards: null,
    otherHazardsDescription: '',
    
    // Safety Requirements
    ppeRequired: null,
    ppeList: '',
    forcedAirVentilationSufficient: null,
    dedicatedAirMonitor: null,
    warningSignPosted: null,
    
    // Personnel and Access
    otherPeopleWorkingNearSpace: null,
    canOthersSeeIntoSpace: null,
    contractorsEnterSpace: null,
    
    // Additional Information
    notes: '',
    
    // Images
    imageUrls: []
  });

  const sections = [
    { id: 'basic', title: 'Basic Information', icon: FileText },
    { id: 'space', title: 'Space Information', icon: Building },
    { id: 'hazards', title: 'Hazard Assessment', icon: AlertTriangle },
    { id: 'safety', title: 'Safety Requirements', icon: Shield },
    { id: 'personnel', title: 'Personnel & Access', icon: Users },
    { id: 'images', title: 'Photos & Documentation', icon: ImageIcon }
  ];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-fill technician name on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      setFormData(prev => ({
        ...prev,
        technician: fullName
      }));
    }
  }, []);

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        // Get current user to determine if they should see only assigned locations
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = userData.role;
        const userId = userData.id || userData._id;

        let response;
        if (userRole === 'technician' && userId) {
          // Technicians should only see locations assigned to them
          response = await locationService.getLocationsByTechnician(userId);
        } else {
          // Admins and managers can see all locations
          response = await locationService.getLocations();
        }

        // Handle different response structures
        const locationsData = response.data?.data?.locations || response.data?.locations || response.data || [];
        const fetchedLocations = Array.isArray(locationsData) ? locationsData : [];
        setLocations(fetchedLocations);

        // Auto-fill location for technicians if they have exactly one location
        if (userRole === 'technician' && fetchedLocations.length === 1) {
          const location = fetchedLocations[0];
          setSelectedLocation(location);
          
          // Auto-populate location description using the location's description field
          const locationDesc = location.description || `${location.name} - ${location.type} location at ${location.address.street}, ${location.address.city}, ${location.address.state} ${location.address.zipCode}`;
          
          setFormData(prev => ({
            ...prev,
            locationId: location._id,
            locationDescription: locationDesc,
            buildingId: '',
            building: '',
            confinedSpaceId: '',
            confinedSpaceDescription: ''
          }));
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
        setSubmitError('Failed to load locations. Please refresh the page.');
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // Fetch buildings when location is selected
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!selectedLocation) {
        setBuildings([]);
        setConfinedSpaces([]);
        return;
      }

      setLoadingBuildings(true);
      try {
        const response = await locationService.getBuildingsByLocation(selectedLocation._id);
        // Handle different response structures
        const buildingsData = response.data?.data?.buildings || response.data?.buildings || response.data || [];
        setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      } catch (error) {
        console.error('Error fetching buildings:', error);
        setBuildings([]);
      } finally {
        setLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [selectedLocation]);

  // Update confined spaces when building is selected
  useEffect(() => {
    if (selectedBuilding && selectedBuilding.confinedSpaces) {
      setConfinedSpaces(Array.isArray(selectedBuilding.confinedSpaces) ? selectedBuilding.confinedSpaces : []);
    } else {
      setConfinedSpaces([]);
    }
  }, [selectedBuilding]);

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Image handling functions
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera if available
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleImageUpload(file);
      }, 'image/jpeg', 0.8);
      
      stopCamera();
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    });
    event.target.value = ''; // Reset file input
  };

  const handleImageUpload = async (file) => {
    setUploadingImages(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      console.log('File details:', { name: file.name, type: file.type, size: file.size });
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('orderId', `temp-${Date.now()}`); // Temporary ID until order is created
      
      console.log('Uploading to:', '/api/workorder/upload-image');
      
      const response = await fetch('/api/workorder/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get response text first to see raw response
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
          console.error('Parsed error:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      const result = JSON.parse(responseText);
      console.log('Upload successful:', result);
      
      // Add image to local state
      const newImage = {
        id: Date.now(),
        url: result.imageUrl,
        name: file.name,
        uploadedAt: new Date().toISOString()
      };
      
      setImages(prev => [...prev, newImage]);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, result.imageUrl]
      }));
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      setFormData(prev => ({
        ...prev,
        imageUrls: prev.imageUrls.filter(url => url !== imageToRemove.url)
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationSelect = (locationId) => {
    const location = locations.find(loc => loc._id === locationId);
    setSelectedLocation(location);
    setSelectedBuilding(null);
    setSelectedConfinedSpace(null);
    
    if (location) {
      // Auto-populate location description using the location's description field
      const locationDesc = location.description || `${location.name} - ${location.type} location at ${location.address.street}, ${location.address.city}, ${location.address.state} ${location.address.zipCode}`;
      
      setFormData(prev => ({
        ...prev,
        locationId: location._id,
        locationDescription: locationDesc,
        buildingId: '',
        building: '',
        confinedSpaceId: '',
        confinedSpaceDescription: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        locationId: '',
        locationDescription: '',
        buildingId: '',
        building: '',
        confinedSpaceId: '',
        confinedSpaceDescription: ''
      }));
    }
  };

  const handleBuildingSelect = (buildingId) => {
    const building = buildings.find(bldg => bldg._id === buildingId);
    setSelectedBuilding(building);
    setSelectedConfinedSpace(null);
    
    if (building) {
      // Auto-populate building name and description
      const buildingDesc = `${building.name} (${building.specifications?.buildingType || 'Unknown type'}) - Built in ${building.specifications?.yearBuilt || 'Unknown year'}, ${building.specifications?.totalFloors || 0} floors, ${building.specifications?.totalArea || 0} sq ft`;
      
      setFormData(prev => ({
        ...prev,
        buildingId: building._id,
        building: building.name,
        confinedSpaceId: '',
        confinedSpaceDescription: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        buildingId: '',
        building: '',
        confinedSpaceId: '',
        confinedSpaceDescription: ''
      }));
    }
  };

  const handleConfinedSpaceSelect = (confinedSpaceId) => {
    const confinedSpace = confinedSpaces.find(space => space._id === confinedSpaceId);
    setSelectedConfinedSpace(confinedSpace);
    
    if (confinedSpace) {
      // Auto-populate confined space description
      const hazards = confinedSpace.hazards?.map(h => `${h.type}: ${h.description}`).join(', ') || 'No known hazards';
      const spaceDesc = `${confinedSpace.name} (${confinedSpace.type}) - Located: ${confinedSpace.location?.description || 'Unknown location'}. Hazards: ${hazards}. Entry points: ${confinedSpace.entryPoints?.length || 0}`;
      
      setFormData(prev => ({
        ...prev,
        confinedSpaceId: confinedSpace._id,
        confinedSpaceDescription: spaceDesc
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        confinedSpaceId: '',
        confinedSpaceDescription: ''
      }));
    }
  };

  const handleRadioChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    // Basic Information validation
    if (!formData.surveyDate) errors.push('Survey Date is required');
    if (!formData.technician.trim()) errors.push('Technician Name is required');
    
    // Space Information validation
    if (!formData.spaceName.trim()) errors.push('Space Name/ID is required');
    if (!formData.locationId) errors.push('Location selection is required');
    if (!formData.buildingId) errors.push('Building selection is required');
    if (!formData.locationDescription.trim()) errors.push('Location Description is required');
    if (formData.isConfinedSpace === null) errors.push('Confined Space classification is required');
    if (formData.permitRequired === null) errors.push('Entry Permit requirement is required');
    
    // Hazard Assessment validation
    if (formData.atmosphericHazard === null) errors.push('Atmospheric Hazard assessment is required');
    if (formData.engulfmentHazard === null) errors.push('Engulfment Hazard assessment is required');
    if (formData.configurationHazard === null) errors.push('Configuration Hazard assessment is required');
    if (formData.otherRecognizedHazards === null) errors.push('Other Hazards assessment is required');
    
    // Safety Requirements validation
    if (formData.ppeRequired === null) errors.push('PPE requirement is required');
    if (formData.forcedAirVentilationSufficient === null) errors.push('Forced Air Ventilation assessment is required');
    if (formData.dedicatedAirMonitor === null) errors.push('Dedicated Air Monitor requirement is required');
    if (formData.warningSignPosted === null) errors.push('Warning Sign status is required');
    
    // Personnel & Access validation
    if (formData.otherPeopleWorkingNearSpace === null) errors.push('Other People Working assessment is required');
    if (formData.canOthersSeeIntoSpace === null) errors.push('Visibility assessment is required');
    if (formData.contractorsEnterSpace === null) errors.push('Contractor Entry assessment is required');
    
    return errors;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess(false);
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setSubmitError(`Please complete all required fields:\n${errors.join('\n')}`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get user data from localStorage or context
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id || userData._id;
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (!userId) {
        throw new Error('User information not found. Please log in again.');
      }
      
      // Prepare form data for submission to match the Order model
      const submitData = {
        userId: userId,
        status: 'pending', // Set initial status for admin/manager review
        
        // Basic Information
        surveyDate: formData.surveyDate ? new Date(formData.surveyDate).toISOString() : new Date().toISOString(),
        technician: formData.technician.trim(),
        priority: formData.priority,
        
        // Space Information
        spaceName: formData.spaceName.trim(),
        locationId: formData.locationId,
        buildingId: formData.buildingId,
        confinedSpaceId: formData.confinedSpaceId || undefined,
        building: formData.building.trim(),
        locationDescription: formData.locationDescription.trim(),
        confinedSpaceDescription: formData.confinedSpaceDescription.trim() || undefined,
        
        // Space Classification
        isConfinedSpace: formData.isConfinedSpace,
        permitRequired: formData.permitRequired,
        entryRequirements: formData.entryRequirements.trim() || undefined,
        
        // Hazard Assessment
        atmosphericHazard: formData.atmosphericHazard,
        atmosphericHazardDescription: formData.atmosphericHazardDescription.trim() || undefined,
        engulfmentHazard: formData.engulfmentHazard,
        engulfmentHazardDescription: formData.engulfmentHazardDescription.trim() || undefined,
        configurationHazard: formData.configurationHazard,
        configurationHazardDescription: formData.configurationHazardDescription.trim() || undefined,
        otherRecognizedHazards: formData.otherRecognizedHazards,
        otherHazardsDescription: formData.otherHazardsDescription.trim() || undefined,
        
        // Safety Requirements
        ppeRequired: formData.ppeRequired,
        ppeList: formData.ppeList.trim() || undefined,
        forcedAirVentilationSufficient: formData.forcedAirVentilationSufficient,
        dedicatedAirMonitor: formData.dedicatedAirMonitor,
        warningSignPosted: formData.warningSignPosted,
        
        // Personnel and Access
        otherPeopleWorkingNearSpace: formData.otherPeopleWorkingNearSpace,
        canOthersSeeIntoSpace: formData.canOthersSeeIntoSpace,
        contractorsEnterSpace: formData.contractorsEnterSpace,
        
        // Additional Information
        notes: formData.notes.trim() || undefined,
        
        // Images
        imageUrls: formData.imageUrls || [],
        
        // Metadata
        createdBy: userId,
        lastModifiedBy: userId
      };

      // Only include numberOfEntryPoints if it has a valid value
      if (formData.numberOfEntryPoints && formData.numberOfEntryPoints.trim() !== '') {
        const entryPoints = parseInt(formData.numberOfEntryPoints);
        if (!isNaN(entryPoints) && entryPoints >= 0 && entryPoints <= 20) {
          submitData.numberOfEntryPoints = entryPoints;
        }
      }

      console.log('Submitting confined space assessment:', JSON.stringify(submitData, null, 2));

      // Use the workOrderAPI service for consistency
      const response = await fetch('/api/workorder/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API submission error:', errorData);
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationMessages = errorData.errors.map(err => err.msg || err.message).join(', ');
          throw new Error(`Validation errors: ${validationMessages}`);
        }
        
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Assessment submitted successfully:', result);
      
      // Show success message with work order ID
      const workOrderId = result.data?.workOrderId || result.workOrderId || 'Generated';
      setSubmitSuccess(true);
      setSubmitError(''); // Clear any previous errors
      
      // Display success message with work order information
      console.log(`Confined Space Assessment submitted successfully! Work Order ID: ${workOrderId}`);
      
      // Reset form after successful submission
      setTimeout(() => {
        // Reset all form data to initial state
        setFormData({
          surveyDate: '',
          technician: '',
          priority: 'medium',
          spaceName: '',
          locationId: '',
          buildingId: '',
          confinedSpaceId: '',
          building: '',
          locationDescription: '',
          confinedSpaceDescription: '',
          numberOfEntryPoints: '',
          isConfinedSpace: null,
          permitRequired: null,
          entryRequirements: '',
          atmosphericHazard: null,
          atmosphericHazardDescription: '',
          engulfmentHazard: null,
          engulfmentHazardDescription: '',
          configurationHazard: null,
          configurationHazardDescription: '',
          otherRecognizedHazards: null,
          otherHazardsDescription: '',
          ppeRequired: null,
          ppeList: '',
          forcedAirVentilationSufficient: null,
          dedicatedAirMonitor: null,
          warningSignPosted: null,
          otherPeopleWorkingNearSpace: null,
          canOthersSeeIntoSpace: null,
          contractorsEnterSpace: null,
          notes: '',
          imageUrls: []
        });
        
        // Reset location-related state
        setSelectedLocation(null);
        setSelectedBuilding(null);
        setSelectedConfinedSpace(null);
        setBuildings([]);
        setConfinedSpaces([]);
        
        // Reset other states
        setImages([]);
        setActiveSection('basic');
        setSubmitSuccess(false);
        setSubmitError('');
        
        // Stop camera if it's running
        if (isCapturing) {
          stopCamera();
        }
      }, 4000); // Increased timeout to allow user to see the success message
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      let errorMessage = 'Failed to submit assessment. ';
      
      if (error.message.includes('Authentication')) {
        errorMessage += 'Please log in again.';
      } else if (error.message.includes('Network')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('Validation')) {
        errorMessage += error.message;
      } else {
        errorMessage += error.message || 'Please try again later.';
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = () => {
    const currentIndex = sections.findIndex(section => section.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };

  const prevSection = () => {
    const currentIndex = sections.findIndex(section => section.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Simple Professional Header */}
        <div className="bg-[#232249] rounded-lg shadow-md mb-4 md:mb-6">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="bg-white/10 rounded-lg p-2.5">
                  <Shield className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">
                    Confined Space Assessment
                  </h1>
                  <p className="text-white/80 text-xs md:text-sm mt-0.5">
                    Safety Evaluation & Documentation
                  </p>
                </div>
              </div>

              {/* Time and Status */}
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-center">
                  <div className="text-white text-sm md:text-base font-bold font-mono">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-white/70 text-xs">
                    {formatDate(currentTime)}
                  </div>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-3 py-2">
                  <span className="text-emerald-200 text-xs font-semibold">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 border-b-3 ${
                    isActive 
                      ? 'bg-[#232249] border-[#232249] text-white' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-1.5 ${
                    isActive 
                      ? 'bg-white/15' 
                      : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className={`font-medium text-xs leading-tight text-center ${
                    isActive ? 'text-white' : 'text-gray-700'
                  }`}>
                    {section.title}
                  </span>
                  <span className={`text-xs mt-0.5 ${
                    isActive ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {index + 1}/{sections.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content with Modern Card Design */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-[#232249] rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Basic Information</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Essential assessment details</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Survey Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.surveyDate}
                    onChange={(e) => handleInputChange('surveyDate', e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Technician Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => handleInputChange('technician', e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] bg-white text-gray-900"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Space Information Section */}
          {activeSection === 'space' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-[#232249] rounded-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Space Information</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Location and space details</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
                        <MapPin className="w-4 h-4 text-blue-700" />
                      </div>
                      Space Name/ID
                      <span className="text-red-500 ml-1.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.spaceName}
                      onChange={(e) => handleInputChange('spaceName', e.target.value)}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-400 text-gray-900"
                      placeholder="Enter space identifier"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg mr-2">
                        <Building className="w-4 h-4 text-orange-700" />
                      </div>
                      Building
                      <span className="text-red-500 ml-1.5">*</span>
                    </label>
                    <select
                      value={formData.buildingId}
                      onChange={(e) => handleBuildingSelect(e.target.value)}
                      className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-400 appearance-none cursor-pointer text-gray-900 font-medium"
                      style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23232249%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.65em auto' }}
                      required
                      disabled={!selectedLocation}
                    >
                      <option value="">
                        {selectedLocation ? 'Select a building' : 'Select a location first'}
                      </option>
                      {loadingBuildings ? (
                        <option disabled>Loading buildings...</option>
                      ) : (
                        Array.isArray(buildings) && buildings.map((building) => (
                          <option key={building._id} value={building._id}>
                            {building.name} ({building.specifications?.buildingType || 'Unknown'})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-indigo-50 rounded-lg mr-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    Confined Space Description
                  </label>
                  <textarea
                    value={formData.confinedSpaceDescription}
                    onChange={(e) => handleInputChange('confinedSpaceDescription', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                    rows="3"
                    placeholder="Confined space details will be auto-populated when you select a space"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-yellow-50 rounded-lg mr-2">
                      <Activity className="w-4 h-4 text-yellow-600" />
                    </div>
                    Number of Entry Points
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfEntryPoints}
                    onChange={(e) => handleInputChange('numberOfEntryPoints', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                    placeholder="Enter number of entry points"
                    min="1"
                  />
                </div>

                {/* Space Classification */}
                <div className="border-t-2 border-gray-100 pt-8 mt-8">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mr-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Space Classification</h4>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-200">
                      <label className="flex items-center text-sm font-bold text-gray-800 mb-4">
                        <span className="text-blue-600 mr-2 text-lg">⚠️</span>
                        Is this a confined space?
                        <span className="text-red-500 ml-2">*</span>
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1 group">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            value="true"
                            checked={formData.isConfinedSpace === true}
                            onChange={() => handleRadioChange('isConfinedSpace', true)}
                            className="sr-only"
                          />
                          <span className="font-bold text-center">Yes</span>
                        </label>
                        <label className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1 group">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            value="false"
                            checked={formData.isConfinedSpace === false}
                            onChange={() => handleRadioChange('isConfinedSpace', false)}
                            className="sr-only"
                          />
                          <span className="font-bold text-center">No</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50/50 p-5 rounded-2xl border border-orange-200">
                      <label className="flex items-center text-sm font-bold text-gray-800 mb-4">
                        <span className="text-orange-600 mr-2 text-lg">📋</span>
                        Is an entry permit required?
                        <span className="text-red-500 ml-2">*</span>
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1 group">
                          <input
                            type="radio"
                            name="permitRequired"
                            value="true"
                            checked={formData.permitRequired === true}
                            onChange={() => handleRadioChange('permitRequired', true)}
                            className="sr-only"
                          />
                          <span className="font-bold text-center">Yes</span>
                        </label>
                        <label className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1 group">
                          <input
                            type="radio"
                            name="permitRequired"
                            value="false"
                            checked={formData.permitRequired === false}
                            onChange={() => handleRadioChange('permitRequired', false)}
                            className="sr-only"
                          />
                          <span className="font-bold text-center">No</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg mr-2">
                          <FileText className="w-4 h-4 text-purple-700" />
                        </div>
                        Entry Requirements
                      </label>
                      <textarea
                        value={formData.entryRequirements}
                        onChange={(e) => handleInputChange('entryRequirements', e.target.value)}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-400 resize-none text-gray-900"
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-[#232249] rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Hazard Assessment</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Identify potential hazards</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Atmospheric Hazard */}
                <div className="bg-gradient-to-br from-cyan-50/50 to-blue-50/30 p-6 rounded-xl border-2 border-cyan-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <Wind className="w-5 h-5 text-cyan-600" />
                    </div>
                    Atmospheric Hazard Present?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        value="true"
                        checked={formData.atmosphericHazard === true}
                        onChange={() => handleRadioChange('atmosphericHazard', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        value="false"
                        checked={formData.atmosphericHazard === false}
                        onChange={() => handleRadioChange('atmosphericHazard', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.atmosphericHazardDescription}
                    onChange={(e) => handleInputChange('atmosphericHazardDescription', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                    rows="2"
                    placeholder="Describe atmospheric hazards if present (e.g., oxygen deficiency, toxic gases)"
                  />
                </div>

                {/* Engulfment Hazard */}
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-6 rounded-xl border-2 border-blue-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <Droplets className="w-5 h-5 text-blue-600" />
                    </div>
                    Engulfment Hazard Present?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        value="true"
                        checked={formData.engulfmentHazard === true}
                        onChange={() => handleRadioChange('engulfmentHazard', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        value="false"
                        checked={formData.engulfmentHazard === false}
                        onChange={() => handleRadioChange('engulfmentHazard', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.engulfmentHazardDescription}
                    onChange={(e) => handleInputChange('engulfmentHazardDescription', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                    rows="2"
                    placeholder="Describe engulfment hazards if present (e.g., liquids, flowing solids)"
                  />
                </div>

                {/* Configuration Hazard */}
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 p-6 rounded-xl border-2 border-purple-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    Configuration Hazard Present?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="configurationHazard"
                        value="true"
                        checked={formData.configurationHazard === true}
                        onChange={() => handleRadioChange('configurationHazard', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="configurationHazard"
                        value="false"
                        checked={formData.configurationHazard === false}
                        onChange={() => handleRadioChange('configurationHazard', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.configurationHazardDescription}
                    onChange={(e) => handleInputChange('configurationHazardDescription', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                    rows="2"
                    placeholder="Describe configuration hazards if present (e.g., internal design, obstructions)"
                  />
                </div>

                {/* Other Hazards */}
                <div className="bg-gradient-to-br from-red-50/50 to-orange-50/30 p-6 rounded-xl border-2 border-red-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    Other Recognized Hazards Present?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        value="true"
                        checked={formData.otherRecognizedHazards === true}
                        onChange={() => handleRadioChange('otherRecognizedHazards', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        value="false"
                        checked={formData.otherRecognizedHazards === false}
                        onChange={() => handleRadioChange('otherRecognizedHazards', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.otherHazardsDescription}
                    onChange={(e) => handleInputChange('otherHazardsDescription', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                    rows="2"
                    placeholder="Describe other hazards if present (e.g., electrical, mechanical, thermal)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Safety Requirements Section */}
          {activeSection === 'safety' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-[#232249] rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Safety Requirements</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Safety measures and equipment</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* PPE Required */}
                <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 p-6 rounded-xl border-2 border-blue-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <span className="text-blue-600 mr-2">🦺</span>
                    Personal Protective Equipment (PPE) Required?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="ppeRequired"
                        value="true"
                        checked={formData.ppeRequired === true}
                        onChange={() => handleRadioChange('ppeRequired', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="ppeRequired"
                        value="false"
                        checked={formData.ppeRequired === false}
                        onChange={() => handleRadioChange('ppeRequired', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.ppeList}
                    onChange={(e) => handleInputChange('ppeList', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                    rows="2"
                    placeholder="List required PPE (e.g., hard hat, gloves, respirator, safety harness)"
                  />
                </div>

                {/* Forced Air Ventilation */}
                <div className="bg-gradient-to-br from-cyan-50/50 to-teal-50/30 p-6 rounded-xl border-2 border-cyan-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <Wind className="w-5 h-5 text-cyan-600" />
                    </div>
                    Is forced air ventilation sufficient for safe entry?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        value="true"
                        checked={formData.forcedAirVentilationSufficient === true}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        value="false"
                        checked={formData.forcedAirVentilationSufficient === false}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>

                {/* Dedicated Air Monitor */}
                <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/30 p-6 rounded-xl border-2 border-amber-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <Thermometer className="w-5 h-5 text-amber-600" />
                    </div>
                    Is a dedicated air monitor required?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        value="true"
                        checked={formData.dedicatedAirMonitor === true}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        value="false"
                        checked={formData.dedicatedAirMonitor === false}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>

                {/* Warning Sign */}
                <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 p-6 rounded-xl border-2 border-orange-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <span className="text-orange-600 mr-2">⚠️</span>
                    Is a warning sign posted?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        value="true"
                        checked={formData.warningSignPosted === true}
                        onChange={() => handleRadioChange('warningSignPosted', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        value="false"
                        checked={formData.warningSignPosted === false}
                        onChange={() => handleRadioChange('warningSignPosted', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personnel & Access Section */}
          {activeSection === 'personnel' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-[#232249] rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Personnel & Access</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Personnel activities and visibility</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Other People Working */}
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-6 rounded-xl border-2 border-blue-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Are other people working near the space?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        value="true"
                        checked={formData.otherPeopleWorkingNearSpace === true}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        value="false"
                        checked={formData.otherPeopleWorkingNearSpace === false}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>

                {/* Visibility */}
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 p-6 rounded-xl border-2 border-purple-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <span className="text-purple-600 mr-2">👁️</span>
                    Can others see into the space?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        value="true"
                        checked={formData.canOthersSeeIntoSpace === true}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        value="false"
                        checked={formData.canOthersSeeIntoSpace === false}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>

                {/* Contractors */}
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6 rounded-xl border-2 border-amber-100">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                    <span className="text-amber-600 mr-2">👷</span>
                    Do contractors enter the space?
                    <span className="text-red-500 ml-2">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        value="true"
                        checked={formData.contractorsEnterSpace === true}
                        onChange={() => handleRadioChange('contractorsEnterSpace', true)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 flex-1">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        value="false"
                        checked={formData.contractorsEnterSpace === false}
                        onChange={() => handleRadioChange('contractorsEnterSpace', false)}
                        className="w-2.5 h-2.5 text-blue-600 border-gray-300 focus:ring-[#232249] mr-2"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg mr-2">
                      <FileText className="w-4 h-4 text-gray-700" />
                    </div>
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249]/20 focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-400 resize-none text-gray-900"
                    rows="4"
                    placeholder="Any additional observations, concerns, or notes about the confined space assessment"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Images & Documentation Section */}
          {activeSection === 'images' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-[#232249] rounded-lg">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Photos & Documentation</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Upload visual documentation</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Upload */}
                  <div className="group/upload relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-md opacity-0 group-hover/upload:opacity-100 transition-opacity"></div>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#232249] hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-300">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mx-auto w-fit mb-4">
                        <Upload className="w-10 h-10 text-[#232249]" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Upload Photos</h4>
                      <p className="text-sm text-gray-600 mb-6">
                        Select multiple images from your device
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages}
                        className="bg-gradient-to-r from-[#232249] to-[#2d2e5f] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold hover:scale-105"
                      >
                        {uploadingImages ? 'Uploading...' : 'Choose Files'}
                      </button>
                    </div>
                  </div>

                  {/* Camera Capture */}
                  <div className="group/camera relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl blur-md opacity-0 group-hover/camera:opacity-100 transition-opacity"></div>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#232249] hover:bg-gradient-to-br hover:from-pink-50/30 hover:to-rose-50/20 transition-all duration-300">
                      <div className="p-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl mx-auto w-fit mb-4">
                        <Camera className="w-10 h-10 text-[#232249]" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Take Photo</h4>
                      <p className="text-sm text-gray-600 mb-6">
                        Capture images using your camera
                      </p>
                      <button
                        type="button"
                        onClick={isCapturing ? stopCamera : startCamera}
                        disabled={uploadingImages}
                        className={`px-6 py-3 rounded-xl transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold hover:scale-105 ${
                          isCapturing 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg' 
                            : 'bg-gradient-to-r from-[#232249] to-[#2d2e5f] text-white hover:shadow-lg'
                        }`}
                      >
                        {isCapturing ? 'Stop Camera' : 'Start Camera'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Camera View */}
                {isCapturing && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                    <div className="relative max-w-2xl mx-auto">
                      <video
                        ref={videoRef}
                        className="w-full h-auto rounded-xl shadow-2xl border-4 border-white"
                        playsInline
                      />
                      <div className="mt-6 text-center">
                        <button
                          type="button"
                          onClick={captureImage}
                          className="bg-gradient-to-r from-[#232249] to-[#2d2e5f] text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-200 flex items-center mx-auto font-semibold text-lg hover:scale-105"
                        >
                          <Camera className="w-6 h-6 mr-3" />
                          Capture Photo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden Canvas for Image Capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Uploaded Images Display */}
                {images.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-gray-900 flex items-center">
                        <span className="p-2 bg-white rounded-xl mr-3 shadow-sm border border-gray-200">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                        </span>
                        Uploaded Images
                        <span className="ml-3 px-3 py-1 bg-[#232249] text-white rounded-full text-sm font-bold">{images.length}</span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="relative overflow-hidden rounded-xl shadow-md border-2 border-gray-200 hover:border-[#232249] transition-all duration-200 hover:shadow-lg">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="mt-2 px-1">
                            <p className="text-xs font-semibold text-gray-800 truncate">{image.name}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(image.uploadedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadingImages && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#232249]" />
                    <p className="text-sm font-semibold text-gray-700">Uploading images to Azure Blob Storage...</p>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start">
                    <div className="p-2.5 bg-white rounded-xl mr-4 shadow-sm border border-blue-200">
                      <AlertTriangle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-blue-900 mb-3 text-lg">Photo Guidelines</h5>
                      <ul className="text-sm text-blue-800 space-y-2.5">
                        <li className="flex items-start">
                          <span className="mr-2 text-blue-600 font-bold">•</span>
                          <span className="font-medium">Take photos of confined space entry points</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-blue-600 font-bold">•</span>
                          <span className="font-medium">Document any visible hazards or safety equipment</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-blue-600 font-bold">•</span>
                          <span className="font-medium">Include photos of warning signs and safety measures</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-blue-600 font-bold">•</span>
                          <span className="font-medium">Capture overall space configuration and access routes</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-blue-600 font-bold">•</span>
                          <span className="font-medium">Ensure images are clear and well-lit</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-3 md:gap-4 mt-4 md:mt-6">
            <button
              onClick={prevSection}
              disabled={activeSection === 'basic'}
              className={`flex items-center px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base ${
                activeSection === 'basic'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 rounded-lg">
                <span className="text-xs md:text-sm font-semibold text-gray-700">
                  Step {sections.findIndex(s => s.id === activeSection) + 1} of {sections.length}
                </span>
              </div>
            </div>

            <button
              onClick={nextSection}
              disabled={activeSection === 'images'}
              className={`flex items-center px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base ${
                activeSection === 'images'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#232249] text-white hover:bg-[#1a1a35]'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1.5 md:ml-2" />
            </button>
          </div>
        </div>

        {/* Submit Assessment Section - Always visible at bottom */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mt-4 md:mt-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-2.5 bg-[#232249] rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Submit Assessment</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">Review and submit your assessment</p>
            </div>
          </div>
            
          {/* Error Message */}
          {submitError && (
            <div className="mb-4 md:mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900 mb-1">Submission Error</h4>
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-4 md:mb-6 bg-emerald-50 border border-emerald-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 mb-1">Assessment Submitted Successfully!</h4>
                  <p className="text-sm text-emerald-800">Your assessment has been submitted for review.</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded">Status: Pending Review</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || submitSuccess}
            className={`w-full flex items-center justify-center px-6 py-3 md:py-4 text-base md:text-lg font-bold rounded-lg ${
              isSubmitting || submitSuccess
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#232249] text-white hover:bg-[#1a1a35]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2" />
                Submitting...
              </>
            ) : submitSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Submitted
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Submit Assessment
              </>
            )}
          </button>
          
          <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600 text-center">
            Please review all sections before submitting. All required fields must be completed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TechnicianForm;




