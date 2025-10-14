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
      
      console.log('Uploading to:', 'http://localhost:3012/api/upload-image');
      
      const response = await fetch('http://localhost:3012/api/upload-image', {
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
      const response = await fetch('http://localhost:3012/api/orders', {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Professional Header */}
        <div className="relative bg-gradient-to-r from-[#232249] via-[#2a2a5a] to-[#232249] rounded-xl shadow-2xl mb-8 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          {/* Header Content */}
          <div className="relative z-10 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              {/* Left Side - Title and Description */}
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mr-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Confined Space Assessment
                    </h1>
                    <div className="flex items-center text-blue-100">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Safety Evaluation & Documentation System</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
                  Complete comprehensive safety assessment for confined space entry procedures, 
                  hazard identification, and regulatory compliance documentation.
                </p>
              </div>

              {/* Right Side - Time and Status */}
              <div className="mt-6 lg:mt-0 lg:ml-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <Clock className="w-5 h-5 text-blue-200 mr-2" />
                      <span className="text-blue-200 text-sm font-medium">Current Time</span>
                    </div>
                    <div className="text-white text-2xl font-bold mb-2 font-mono">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-blue-200 text-sm">
                      {formatDate(currentTime)}
                    </div>
                    
                    {/* Assessment Status */}
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-blue-200 text-xs font-medium">SYSTEM ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between text-blue-200 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Form Status: In Progress</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>Section: {sections.find(s => s.id === activeSection)?.title}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Assessment Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isCompleted = false; // You can add completion logic here
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center p-4 border-b-2 transition-colors duration-200 ${
                    isActive 
                      ? 'border-[#232249] bg-blue-50 text-[#232249]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="font-medium text-sm">{section.title}</span>
                  {isCompleted && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
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
                    value={formData.surveyDate}
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
                    value={formData.technician}
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
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Space Information Section */}
          {activeSection === 'space' && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
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
                      value={formData.spaceName}
                      onChange={(e) => handleInputChange('spaceName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                      placeholder="Enter space identifier"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Location *
                    </label>
                    {(() => {
                      const userData = JSON.parse(localStorage.getItem('user') || '{}');
                      const userRole = userData.role;
                      const isTechnicianWithSingleLocation = userRole === 'technician' && locations.length === 1;
                      
                      if (isTechnicianWithSingleLocation) {
                        // Show read-only display for auto-filled location
                        return (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                            {locations[0]?.name} - {locations[0]?.address?.city}, {locations[0]?.address?.state}
                          </div>
                        );
                      } else {
                        // Show dropdown for selection
                        return (
                          <select
                            value={formData.locationId}
                            onChange={(e) => handleLocationSelect(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Description
                  </label>
                  <textarea
                    value={formData.locationDescription}
                    onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent bg-gray-50"
                    rows="3"
                    placeholder="Location details will be auto-populated when you select a location"
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline w-4 h-4 mr-1" />
                      Building *
                    </label>
                    <select
                      value={formData.buildingId}
                      onChange={(e) => handleBuildingSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="inline w-4 h-4 mr-1" />
                      Confined Space
                    </label>
                    <select
                      value={formData.confinedSpaceId}
                      onChange={(e) => handleConfinedSpaceSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confined Space Description
                  </label>
                  <textarea
                    value={formData.confinedSpaceDescription}
                    onChange={(e) => handleInputChange('confinedSpaceDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#232249] focus:border-transparent"
                    rows="3"
                    placeholder="Confined space details will be auto-populated when you select a space"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Entry Points
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfEntryPoints}
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
                            value="true"
                            checked={formData.isConfinedSpace === true}
                            onChange={() => handleRadioChange('isConfinedSpace', true)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="isConfinedSpace"
                            value="false"
                            checked={formData.isConfinedSpace === false}
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
                            value="true"
                            checked={formData.permitRequired === true}
                            onChange={() => handleRadioChange('permitRequired', true)}
                            className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="permitRequired"
                            value="false"
                            checked={formData.permitRequired === false}
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
                        value={formData.entryRequirements}
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
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
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
                        value="true"
                        checked={formData.atmosphericHazard === true}
                        onChange={() => handleRadioChange('atmosphericHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="atmosphericHazard"
                        value="false"
                        checked={formData.atmosphericHazard === false}
                        onChange={() => handleRadioChange('atmosphericHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.atmosphericHazardDescription}
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
                        value="true"
                        checked={formData.engulfmentHazard === true}
                        onChange={() => handleRadioChange('engulfmentHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="engulfmentHazard"
                        value="false"
                        checked={formData.engulfmentHazard === false}
                        onChange={() => handleRadioChange('engulfmentHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.engulfmentHazardDescription}
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
                        value="true"
                        checked={formData.configurationHazard === true}
                        onChange={() => handleRadioChange('configurationHazard', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="configurationHazard"
                        value="false"
                        checked={formData.configurationHazard === false}
                        onChange={() => handleRadioChange('configurationHazard', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.configurationHazardDescription}
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
                        value="true"
                        checked={formData.otherRecognizedHazards === true}
                        onChange={() => handleRadioChange('otherRecognizedHazards', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherRecognizedHazards"
                        value="false"
                        checked={formData.otherRecognizedHazards === false}
                        onChange={() => handleRadioChange('otherRecognizedHazards', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.otherHazardsDescription}
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
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
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
                        value="true"
                        checked={formData.ppeRequired === true}
                        onChange={() => handleRadioChange('ppeRequired', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ppeRequired"
                        value="false"
                        checked={formData.ppeRequired === false}
                        onChange={() => handleRadioChange('ppeRequired', false)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.ppeList}
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
                        value="true"
                        checked={formData.forcedAirVentilationSufficient === true}
                        onChange={() => handleRadioChange('forcedAirVentilationSufficient', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="forcedAirVentilationSufficient"
                        value="false"
                        checked={formData.forcedAirVentilationSufficient === false}
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
                        value="true"
                        checked={formData.dedicatedAirMonitor === true}
                        onChange={() => handleRadioChange('dedicatedAirMonitor', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="dedicatedAirMonitor"
                        value="false"
                        checked={formData.dedicatedAirMonitor === false}
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
                        value="true"
                        checked={formData.warningSignPosted === true}
                        onChange={() => handleRadioChange('warningSignPosted', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="warningSignPosted"
                        value="false"
                        checked={formData.warningSignPosted === false}
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
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
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
                        value="true"
                        checked={formData.otherPeopleWorkingNearSpace === true}
                        onChange={() => handleRadioChange('otherPeopleWorkingNearSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="otherPeopleWorkingNearSpace"
                        value="false"
                        checked={formData.otherPeopleWorkingNearSpace === false}
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
                        value="true"
                        checked={formData.canOthersSeeIntoSpace === true}
                        onChange={() => handleRadioChange('canOthersSeeIntoSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="canOthersSeeIntoSpace"
                        value="false"
                        checked={formData.canOthersSeeIntoSpace === false}
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
                        value="true"
                        checked={formData.contractorsEnterSpace === true}
                        onChange={() => handleRadioChange('contractorsEnterSpace', true)}
                        className="w-4 h-4 text-[#232249] border-gray-300 focus:ring-[#232249]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contractorsEnterSpace"
                        value="false"
                        checked={formData.contractorsEnterSpace === false}
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
                    value={formData.notes}
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
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <ImageIcon className="w-6 h-6 mr-2" />
                Photos & Documentation
              </h3>
              
              <div className="space-y-6">
                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#232249] transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Upload Photos</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Select images from your device gallery
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="bg-[#232249] text-white px-4 py-2 rounded-md hover:bg-[#1a1b3a] transition-colors disabled:bg-gray-400"
                    >
                      {uploadingImages ? 'Uploading...' : 'Choose Files'}
                    </button>
                  </div>

                  {/* Camera Capture */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#232249] transition-colors">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Take Photo</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Use camera to capture images directly
                    </p>
                    <button
                      type="button"
                      onClick={isCapturing ? stopCamera : startCamera}
                      disabled={uploadingImages}
                      className={`px-4 py-2 rounded-md transition-colors disabled:bg-gray-400 ${
                        isCapturing 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-[#232249] text-white hover:bg-[#1a1b3a]'
                      }`}
                    >
                      {isCapturing ? 'Stop Camera' : 'Start Camera'}
                    </button>
                  </div>
                </div>

                {/* Camera View */}
                {isCapturing && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="relative max-w-md mx-auto">
                      <video
                        ref={videoRef}
                        className="w-full h-auto rounded-lg shadow-lg"
                        playsInline
                      />
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={captureImage}
                          className="bg-[#232249] text-white px-6 py-3 rounded-lg hover:bg-[#1a1b3a] transition-colors flex items-center mx-auto"
                        >
                          <Camera className="w-5 h-5 mr-2" />
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
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-4">
                      Uploaded Images ({images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 truncate">{image.name}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(image.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadingImages && (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#232249]" />
                    <p className="text-sm text-gray-600">Uploading images to Azure Blob Storage...</p>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-800 mb-2">Photo Guidelines:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Take photos of confined space entry points</li>
                    <li>• Document any visible hazards or safety equipment</li>
                    <li>• Include photos of warning signs and safety measures</li>
                    <li>• Capture overall space configuration and access routes</li>
                    <li>• Ensure images are clear and well-lit</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-[#232249] mb-4">Submit Assessment</h3>
            
            {/* Error Message */}
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <pre className="whitespace-pre-wrap">{submitError}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Confined Space Assessment Submitted Successfully!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your assessment has been submitted for admin and manager review.</p>
                      <p className="font-semibold mt-1">Status: Pending Review</p>
                      <p className="text-xs mt-2 opacity-90">The form will reset automatically in a few seconds.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitSuccess}
              className={`w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
                isSubmitting || submitSuccess
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#232249] hover:bg-[#1a1b3a] text-white'
              } transition-colors duration-200`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Submitting Assessment...
                </>
              ) : submitSuccess ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Assessment Submitted
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Submit Assessment
                </>
              )}
            </button>
            
            <p className="mt-3 text-sm text-gray-600 text-center">
              Please review all sections before submitting. All required fields must be completed.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={prevSection}
              disabled={activeSection === 'basic'}
              className={`flex items-center px-4 py-2 rounded-md font-medium ${
                activeSection === 'basic'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors duration-200`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <button
              onClick={nextSection}
              disabled={activeSection === 'images'}
              className={`flex items-center px-4 py-2 rounded-md font-medium ${
                activeSection === 'images'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#232249] text-white hover:bg-[#1a1b3a]'
              } transition-colors duration-200`}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianForm;
