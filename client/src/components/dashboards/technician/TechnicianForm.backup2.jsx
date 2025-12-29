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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Ultra-Modern Professional Header */}
        <div className="relative bg-gradient-to-br from-[#1a1b3a] via-[#232249] to-[#2d2e5f] rounded-3xl shadow-2xl mb-8 overflow-hidden border border-white/10">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}></div>
          </div>
          
          {/* Gradient Overlay Effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          {/* Header Content */}
          <div className="relative z-10 p-6 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left Side - Title and Description */}
              <div className="flex-1">
                <div className="flex items-start mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur opacity-50"></div>
                    <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
                      <Shield className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                      Confined Space Assessment
                    </h1>
                    <div className="flex items-center gap-2 text-blue-100/90">
                      <div className="h-1 w-1 rounded-full bg-blue-300"></div>
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium tracking-wide">Safety Evaluation & Documentation System</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-blue-100/90 text-base md:text-lg max-w-3xl leading-relaxed ml-[88px]">
                  Complete comprehensive safety assessment for confined space entry procedures, 
                  hazard identification, and regulatory compliance documentation with real-time validation.
                </p>
              </div>

              {/* Right Side - Time and Status Card */}
              <div className="lg:min-w-[280px]">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="p-2 bg-white/10 rounded-lg mr-2">
                          <Clock className="w-5 h-5 text-blue-200" />
                        </div>
                        <span className="text-blue-200 text-sm font-semibold tracking-wide uppercase">Live Time</span>
                      </div>
                      <div className="text-white text-3xl font-bold mb-2 font-mono tracking-wider drop-shadow-lg">
                        {formatTime(currentTime)}
                      </div>
                      <div className="text-blue-200/80 text-sm font-medium mb-4">
                        {formatDate(currentTime)}
                      </div>
                      
                      {/* Assessment Status Badge */}
                      <div className="pt-4 border-t border-white/20">
                        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg border border-green-400/30">
                          <div className="relative">
                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
                          </div>
                          <span className="text-green-100 text-xs font-bold tracking-wider">SYSTEM ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Progress Indicator Bar */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-100/90 text-sm">
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-blue-300/70 text-xs font-medium uppercase tracking-wide">Status</div>
                    <div className="text-white font-semibold">In Progress</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <User className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-purple-300/70 text-xs font-medium uppercase tracking-wide">Current Section</div>
                    <div className="text-white font-semibold truncate">{sections.find(s => s.id === activeSection)?.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-green-300" />
                  </div>
                  <div>
                    <div className="text-green-300/70 text-xs font-medium uppercase tracking-wide">Date</div>
                    <div className="text-white font-semibold">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs with Gradient */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 mb-8 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isCompleted = false;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`group relative flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 md:p-5 transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-[#232249] to-[#2d2e5f] text-white shadow-lg scale-105' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  }`}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
                  )}
                  
                  {/* Icon with Background */}
                  <div className={`p-2.5 rounded-xl mb-2 transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/15 backdrop-blur-sm shadow-lg' 
                      : 'bg-gray-100 group-hover:bg-gray-200 group-hover:scale-110'
                  }`}>
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  
                  {/* Text */}
                  <span className={`font-semibold text-xs md:text-sm text-center leading-tight ${
                    isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {section.title}
                  </span>
                  
                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
                    </div>
                  )}
                  
                  {/* Step Number */}
                  <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content with Modern Card Design */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                {/* Section Header with Icon */}
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="p-3 bg-gradient-to-br from-[#232249] to-[#2d2e5f] rounded-xl shadow-lg mr-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-500 mt-1">Start with essential assessment details</p>
                  </div>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-blue-50 rounded-lg mr-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    Survey Date
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.surveyDate}
                    onChange={(e) => handleInputChange('surveyDate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-purple-50 rounded-lg mr-2">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    Technician Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => handleInputChange('technician', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                    placeholder="Enter technician name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-green-50 rounded-lg mr-2">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🟠 High Priority</option>
                    <option value="critical">🔴 Critical Priority</option>
                  </select>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Space Information Section */}
          {activeSection === 'space' && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="p-3 bg-gradient-to-br from-[#232249] to-[#2d2e5f] rounded-xl shadow-lg mr-4">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Space Information</h3>
                    <p className="text-sm text-gray-500 mt-1">Define location and space details</p>
                  </div>
                </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg mr-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      Space Name/ID
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.spaceName}
                      onChange={(e) => handleInputChange('spaceName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                      placeholder="Enter space identifier"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-1.5 bg-purple-50 rounded-lg mr-2">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      Location
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    {(() => {
                      const userData = JSON.parse(localStorage.getItem('user') || '{}');
                      const userRole = userData.role;
                      const isTechnicianWithSingleLocation = userRole === 'technician' && locations.length === 1;
                      
                      if (isTechnicianWithSingleLocation) {
                        return (
                          <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 text-gray-700 font-medium shadow-sm">
                            🏛️ {locations[0]?.name} - {locations[0]?.address?.city}, {locations[0]?.address?.state}
                          </div>
                        );
                      } else {
                        return (
                          <select
                            value={formData.locationId}
                            onChange={(e) => handleLocationSelect(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm appearance-none cursor-pointer"
                            required
                          >
                            <option value="">Select a location</option>
                            {loadingLocations ? (
                              <option disabled>Loading locations...</option>
                            ) : (
                              Array.isArray(locations) && locations.map((location) => (
                                <option key={location._id} value={location._id}>
                                  {location.name} - {location.address?.city}, {location.address?.state}
                                </option>
                              ))
                            )}
                          </select>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-green-50 rounded-lg mr-2">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    Location Description
                  </label>
                  <textarea
                    value={formData.locationDescription}
                    onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-gradient-to-br from-gray-50 to-blue-50/30 shadow-sm resize-none"
                    rows="3"
                    placeholder="Location details will be auto-populated when you select a location"
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-1.5 bg-orange-50 rounded-lg mr-2">
                        <Building className="w-4 h-4 text-orange-600" />
                      </div>
                      Building
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={formData.buildingId}
                      onChange={(e) => handleBuildingSelect(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer"
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

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-1.5 bg-red-50 rounded-lg mr-2">
                        <Shield className="w-4 h-4 text-red-600" />
                      </div>
                      Confined Space
                    </label>
                    <select
                      value={formData.confinedSpaceId}
                      onChange={(e) => handleConfinedSpaceSelect(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer"
                      disabled={!selectedBuilding}
                    >
                      <option value="">
                        {selectedBuilding ? 'Select a confined space (optional)' : 'Select a building first'}
                      </option>
                      {Array.isArray(confinedSpaces) && confinedSpaces.map((space) => (
                        <option key={space._id} value={space._id}>
                          {space.name} ({space.type})
                        </option>
                      ))}
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
                    <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 p-6 rounded-xl border-2 border-blue-100">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                        <span className="text-blue-600 mr-2">⚠️</span>
                        Is this a confined space?
                        <span className="text-red-500 ml-2">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            value="true"
                            checked={formData.isConfinedSpace === true}
                            onChange={() => handleRadioChange('isConfinedSpace', true)}
                            className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                          />
                          <span className="font-semibold text-center flex-1">✔️ Yes</span>
                        </label>
                        <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            value="false"
                            checked={formData.isConfinedSpace === false}
                            onChange={() => handleRadioChange('isConfinedSpace', false)}
                            className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                          />
                          <span className="font-semibold text-center flex-1">❌ No</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 p-6 rounded-xl border-2 border-orange-100">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-4">
                        <span className="text-orange-600 mr-2">📋</span>
                        Is an entry permit required?
                        <span className="text-red-500 ml-2">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                          <input
                            type="radio"
                            name="permitRequired"
                            value="true"
                            checked={formData.permitRequired === true}
                            onChange={() => handleRadioChange('permitRequired', true)}
                            className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                          />
                          <span className="font-semibold text-center flex-1">✔️ Yes</span>
                        </label>
                        <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                          <input
                            type="radio"
                            name="permitRequired"
                            value="false"
                            checked={formData.permitRequired === false}
                            onChange={() => handleRadioChange('permitRequired', false)}
                            className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                          />
                          <span className="font-semibold text-center flex-1">❌ No</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                        <div className="p-1.5 bg-purple-50 rounded-lg mr-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        Entry Requirements
                      </label>
                      <textarea
                        value={formData.entryRequirements}
                        onChange={(e) => handleInputChange('entryRequirements', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                        rows="3"
                        placeholder="Describe specific entry requirements or procedures"
                      />
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Hazard Assessment Section */}
          {activeSection === 'hazards' && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg mr-4">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Hazard Assessment</h3>
                    <p className="text-sm text-gray-500 mt-1">Identify and document potential hazards</p>
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        value="true"
                        checked={formData.atmosphericHazard === true}
                        onChange={() => handleRadioChange('atmosphericHazard', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        value="false"
                        checked={formData.atmosphericHazard === false}
                        onChange={() => handleRadioChange('atmosphericHazard', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        value="true"
                        checked={formData.engulfmentHazard === true}
                        onChange={() => handleRadioChange('engulfmentHazard', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        value="false"
                        checked={formData.engulfmentHazard === false}
                        onChange={() => handleRadioChange('engulfmentHazard', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="configurationHazard"
                        value="true"
                        checked={formData.configurationHazard === true}
                        onChange={() => handleRadioChange('configurationHazard', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="configurationHazard"
                        value="false"
                        checked={formData.configurationHazard === false}
                        onChange={() => handleRadioChange('configurationHazard', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        value="true"
                        checked={formData.otherRecognizedHazards === true}
                        onChange={() => handleRadioChange('otherRecognizedHazards', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        value="false"
                        checked={formData.otherRecognizedHazards === false}
                        onChange={() => handleRadioChange('otherRecognizedHazards', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
            </div>
          )}

          {/* Safety Requirements Section */}
          {activeSection === 'safety' && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg mr-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Safety Requirements</h3>
                    <p className="text-sm text-gray-500 mt-1">Define required safety measures and equipment</p>
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="ppeRequired"
                        value="true"
                        checked={formData.ppeRequired === true}
                        onChange={() => handleRadioChange('ppeRequired', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="ppeRequired"
                        value="false"
                        checked={formData.ppeRequired === false}
                        onChange={() => handleRadioChange('ppeRequired', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        value="true"
                        checked={formData.forcedAirVentilationSufficient === true}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        value="false"
                        checked={formData.forcedAirVentilationSufficient === false}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        value="true"
                        checked={formData.dedicatedAirMonitor === true}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        value="false"
                        checked={formData.dedicatedAirMonitor === false}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        value="true"
                        checked={formData.warningSignPosted === true}
                        onChange={() => handleRadioChange('warningSignPosted', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        value="false"
                        checked={formData.warningSignPosted === false}
                        onChange={() => handleRadioChange('warningSignPosted', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Personnel & Access Section */}
          {activeSection === 'personnel' && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg mr-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Personnel & Access</h3>
                    <p className="text-sm text-gray-500 mt-1">Assess personnel activities and space visibility</p>
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        value="true"
                        checked={formData.otherPeopleWorkingNearSpace === true}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        value="false"
                        checked={formData.otherPeopleWorkingNearSpace === false}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        value="true"
                        checked={formData.canOthersSeeIntoSpace === true}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        value="false"
                        checked={formData.canOthersSeeIntoSpace === false}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
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
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        value="true"
                        checked={formData.contractorsEnterSpace === true}
                        onChange={() => handleRadioChange('contractorsEnterSpace', true)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">✔️ Yes</span>
                    </label>
                    <label className="flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#232249] hover:shadow-md transition-all duration-200 has-[:checked]:border-[#232249] has-[:checked]:bg-[#232249] has-[:checked]:text-white flex-1">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        value="false"
                        checked={formData.contractorsEnterSpace === false}
                        onChange={() => handleRadioChange('contractorsEnterSpace', false)}
                        className="w-5 h-5 text-[#232249] border-gray-300 focus:ring-[#232249] mr-3"
                      />
                      <span className="font-semibold text-center flex-1">❌ No</span>
                    </label>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-gray-50 rounded-lg mr-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-[#232249] transition-all duration-200 bg-white hover:border-gray-300 shadow-sm resize-none"
                    rows="4"
                    placeholder="Any additional observations, concerns, or notes about the confined space assessment"
                  />
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Images & Documentation Section */}
          {activeSection === 'images' && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg mr-4">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Photos & Documentation</h3>
                    <p className="text-sm text-gray-500 mt-1">Upload images for visual documentation</p>
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
                        className="bg-gradient-to-r from-[#232249] to-[#2d2e5f] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                      >
                        {uploadingImages ? '⏳ Uploading...' : '📁 Choose Files'}
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
                        className={`px-6 py-3 rounded-xl transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold ${
                          isCapturing 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg' 
                            : 'bg-gradient-to-r from-[#232249] to-[#2d2e5f] text-white hover:shadow-lg'
                        }`}
                      >
                        {isCapturing ? '⏹️ Stop Camera' : '📷 Start Camera'}
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
                          className="bg-gradient-to-r from-[#232249] to-[#2d2e5f] text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-200 flex items-center mx-auto font-semibold text-lg"
                        >
                          <Camera className="w-6 h-6 mr-3" />
                          📸 Capture Photo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden Canvas for Image Capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Uploaded Images Display */}
                {images.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/20 rounded-2xl p-6 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-gray-900 flex items-center">
                        <span className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                          <ImageIcon className="w-5 h-5 text-[#232249]" />
                        </span>
                        Uploaded Images
                        <span className="ml-3 px-3 py-1 bg-[#232249] text-white rounded-full text-sm font-bold">{images.length}</span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="relative overflow-hidden rounded-xl shadow-lg border-2 border-gray-200 hover:border-[#232249] transition-all duration-200">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
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
                            <p className="text-xs font-medium text-gray-700 truncate">{image.name}</p>
                            <p className="text-xs text-gray-500">
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
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-white rounded-lg mr-4 shadow-sm">
                      <AlertTriangle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-blue-900 mb-3 text-lg">📋 Photo Guidelines:</h5>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Take photos of confined space entry points</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Document any visible hazards or safety equipment</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Include photos of warning signs and safety measures</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Capture overall space configuration and access routes</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>Ensure images are clear and well-lit</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg mr-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Submit Assessment</h3>
              </div>
            
            {/* Error Message */}
            {submitError && (
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-red-500/5 rounded-2xl blur-md"></div>
                <div className="relative bg-red-50 border-2 border-red-200 rounded-2xl p-5">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-red-100 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-base font-bold text-red-900 mb-2">⚠️ Submission Error</h3>
                      <div className="text-sm text-red-800 bg-white/50 rounded-xl p-3 font-medium">
                        <pre className="whitespace-pre-wrap">{submitError}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-green-500/5 rounded-2xl blur-md"></div>
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-green-600 animate-pulse" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-base font-bold text-green-900 mb-2">✅ Assessment Submitted Successfully!</h3>
                      <div className="text-sm text-green-800 space-y-1">
                        <p className="font-medium">Your assessment has been submitted for admin and manager review.</p>
                        <p className="font-bold bg-white/60 rounded-lg px-3 py-1 inline-block">Status: Pending Review</p>
                        <p className="text-xs opacity-75 mt-2">The form will reset automatically in a few seconds.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitSuccess}
              className={`group/btn relative w-full flex items-center justify-center px-8 py-5 border-2 text-lg font-bold rounded-2xl shadow-lg transition-all duration-300 ${
                isSubmitting || submitSuccess
                  ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#232249] to-[#2d2e5f] hover:from-[#2d2e5f] hover:to-[#232249] text-white border-[#232249] hover:shadow-2xl hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                  Submitting Assessment...
                </>
              ) : submitSuccess ? (
                <>
                  <Check className="mr-3 h-6 w-6" />
                  ✅ Assessment Submitted
                </>
              ) : (
                <>
                  <Save className="mr-3 h-6 w-6 group-hover/btn:animate-bounce" />
                  💾 Submit Assessment
                </>
              )}
            </button>
            
            <p className="mt-4 text-sm text-gray-600 text-center bg-blue-50 rounded-xl p-3 border border-blue-100">
              <span className="font-semibold">ℹ️ Please review all sections before submitting.</span> All required fields must be completed.
            </p>
            </div>
          </div>

          {/* Modern Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={prevSection}
              disabled={activeSection === 'basic'}
              className={`group flex items-center px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeSection === 'basic'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-gray-300 hover:scale-105'
              }`}
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              ⬅️ Previous
            </button>

            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <span className="text-sm font-medium text-gray-600">Step</span>
                <span className="px-3 py-1 bg-white rounded-lg font-bold text-[#232249] shadow-sm">
                  {sections.findIndex(s => s.id === activeSection) + 1} / {sections.length}
                </span>
              </div>
            </div>

            <button
              onClick={nextSection}
              disabled={activeSection === 'images'}
              className={`group flex items-center px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeSection === 'images'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#232249] to-[#2d2e5f] text-white hover:from-[#2d2e5f] hover:to-[#232249] shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              Next ➡️
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianForm;
