import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    default: 'USA',
    trim: true
  }
}, { _id: false });

const contactInfoSchema = new mongoose.Schema({
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  }
}, { _id: false });

const coordinatesSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: {
    type: Number,
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  }
}, { _id: false });

const assignedTechnicianSchema = new mongoose.Schema({
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [100, 'Location name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'institutional', 'mixed-use'],
    required: [true, 'Location type is required']
  },
  address: {
    type: addressSchema,
    required: true
  },
  coordinates: coordinatesSchema,
  contactInfo: contactInfoSchema,
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'under-construction'],
    default: 'active'
  },
  assignedTechnician: assignedTechnicianSchema,
  buildings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building'
  }],
  specifications: {
    totalArea: {
      type: Number,
      min: [0, 'Total area must be positive']
    },
    totalBuildings: {
      type: Number,
      default: 0,
      min: [0, 'Total buildings must be non-negative']
    },
    zoning: {
      type: String,
      trim: true
    },
    accessibility: {
      wheelchairAccessible: {
        type: Boolean,
        default: false
      },
      elevatorAccess: {
        type: Boolean,
        default: false
      },
      parkingAvailable: {
        type: Boolean,
        default: false
      }
    }
  },
  safety: {
    hazardousAreas: [{
      area: String,
      hazardType: String,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }],
    emergencyProcedures: {
      type: String,
      trim: true
    },
    emergencyContacts: [{
      name: String,
      role: String,
      phone: String,
      email: String
    }]
  },
  operationalInfo: {
    businessHours: {
      weekdays: {
        open: String,
        close: String
      },
      weekends: {
        open: String,
        close: String
      }
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    specialInstructions: {
      type: String,
      trim: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
locationSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Virtual for building count
locationSchema.virtual('buildingCount').get(function() {
  return this.buildings ? this.buildings.length : 0;
});

// Indexes for better query performance
locationSchema.index({ name: 1 });
locationSchema.index({ type: 1 });
locationSchema.index({ status: 1 });
locationSchema.index({ 'address.city': 1 });
locationSchema.index({ 'address.state': 1 });
locationSchema.index({ 'assignedTechnician.technicianId': 1 });
locationSchema.index({ 'assignedTechnician.isActive': 1 });
locationSchema.index({ createdBy: 1 });
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ tags: 1 });
locationSchema.index({ isActive: 1 });

// Pre-save middleware to update specifications
locationSchema.pre('save', function(next) {
  if (this.buildings && this.buildings.length !== undefined) {
    this.specifications.totalBuildings = this.buildings.length;
  }
  next();
});

// Static method to find locations by technician
locationSchema.statics.findByTechnician = function(technicianId) {
  return this.find({
    'assignedTechnician.technicianId': technicianId,
    'assignedTechnician.isActive': true,
    isActive: true
  });
};

// Static method to find available locations (without active technician)
locationSchema.statics.findAvailable = function() {
  return this.find({
    $or: [
      { assignedTechnician: { $exists: false } },
      { 'assignedTechnician.isActive': false }
    ],
    isActive: true
  });
};

// Instance method to assign technician
locationSchema.methods.assignTechnician = function(technicianData, assignedBy) {
  this.assignedTechnician = {
    ...technicianData,
    assignedBy,
    assignedDate: new Date(),
    isActive: true
  };
  this.lastModifiedBy = assignedBy;
  return this.save();
};

// Instance method to remove technician
locationSchema.methods.removeTechnician = function(removedBy) {
  if (this.assignedTechnician) {
    this.assignedTechnician.isActive = false;
  }
  this.lastModifiedBy = removedBy;
  return this.save();
};

const Location = mongoose.model('Location', locationSchema);

export default Location;