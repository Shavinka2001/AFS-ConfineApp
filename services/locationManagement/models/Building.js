import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'USA',
    trim: true
  }
}, { _id: false });

const utilitiesSchema = new mongoose.Schema({
  electricity: {
    provider: String,
    accountNumber: String,
    voltage: String
  },
  water: {
    provider: String,
    accountNumber: String
  },
  gas: {
    provider: String,
    accountNumber: String,
    type: String
  },
  internet: {
    provider: String,
    connectionType: String
  },
  waste: {
    provider: String,
    accountNumber: String
  }
}, { _id: false });

const floorSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  totalUnits: {
    type: Number,
    default: 0,
    min: [0, 'Total units must be non-negative']
  },
  floorArea: {
    type: Number,
    min: [0, 'Floor area must be positive']
  },
  ceilingHeight: {
    type: Number,
    min: [0, 'Ceiling height must be positive']
  },
  hasElevatorAccess: {
    type: Boolean,
    default: false
  },
  hasFireExit: {
    type: Boolean,
    default: true
  },
  specialFeatures: [String]
}, { _id: false });

const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['office', 'residential', 'commercial', 'storage', 'utility', 'common-area'],
    required: true
  },
  area: {
    type: Number,
    min: [0, 'Unit area must be positive']
  },
  occupancy: {
    maxOccupancy: {
      type: Number,
      min: [0, 'Max occupancy must be non-negative']
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: [0, 'Current occupancy must be non-negative']
    }
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  isAccessible: {
    type: Boolean,
    default: true
  },
  confinedSpaces: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['tank', 'vessel', 'pipe', 'duct', 'tunnel', 'pit', 'vault', 'other'],
      required: true
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      diameter: Number
    },
    entryPoints: [{
      location: String,
      type: {
        type: String,
        enum: ['manhole', 'hatch', 'door', 'opening']
      },
      size: String
    }],
    hazards: [{
      type: {
        type: String,
        enum: ['atmospheric', 'physical', 'chemical', 'biological', 'mechanical']
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }],
    ventilationRequired: {
      type: Boolean,
      default: true
    },
    permitRequired: {
      type: Boolean,
      default: true
    },
    lastInspected: Date,
    nextInspectionDue: Date
  }]
}, { _id: false });

const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Building name is required'],
    trim: true,
    maxlength: [100, 'Building name cannot exceed 100 characters']
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Building code cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  buildingNumber: {
    type: String,
    trim: true
  },
  address: addressSchema, // Optional: can be different from location address
  specifications: {
    buildingType: {
      type: String,
      enum: ['residential', 'office', 'retail', 'warehouse', 'manufacturing', 'mixed-use', 'parking'],
      required: true
    },
    yearBuilt: {
      type: Number,
      min: [1800, 'Year built seems too early'],
      max: [new Date().getFullYear() + 5, 'Year built cannot be too far in the future']
    },
    totalFloors: {
      type: Number,
      required: true,
      min: [1, 'Building must have at least 1 floor']
    },
    totalUnits: {
      type: Number,
      default: 0,
      min: [0, 'Total units must be non-negative']
    },
    totalArea: {
      type: Number,
      min: [0, 'Total area must be positive']
    },
    basementLevels: {
      type: Number,
      default: 0,
      min: [0, 'Basement levels must be non-negative']
    },
    hasElevator: {
      type: Boolean,
      default: false
    },
    hasEmergencyExit: {
      type: Boolean,
      default: true
    },
    hasFireSprinkler: {
      type: Boolean,
      default: false
    },
    hasSecuritySystem: {
      type: Boolean,
      default: false
    },
    hvacSystem: {
      type: String,
      trim: true
    },
    structuralMaterial: {
      type: String,
      enum: ['concrete', 'steel', 'wood', 'brick', 'mixed'],
      default: 'mixed'
    }
  },
  floors: [floorSchema],
  units: [unitSchema],
  confinedSpaces: [{
    name: {
      type: String,
      required: true
    },
    location: {
      floor: Number,
      unit: String,
      description: String
    },
    type: {
      type: String,
      enum: ['tank', 'vessel', 'pipe', 'duct', 'tunnel', 'pit', 'vault', 'boiler', 'other'],
      required: true
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      diameter: Number,
      volume: Number
    },
    entryPoints: [{
      location: String,
      type: {
        type: String,
        enum: ['manhole', 'hatch', 'door', 'opening']
      },
      size: String,
      isAccessible: {
        type: Boolean,
        default: true
      }
    }],
    hazards: [{
      type: {
        type: String,
        enum: ['atmospheric', 'physical', 'chemical', 'biological', 'mechanical', 'electrical']
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      mitigationMeasures: [String]
    }],
    ventilationRequired: {
      type: Boolean,
      default: true
    },
    permitRequired: {
      type: Boolean,
      default: true
    },
    safetyEquipment: [String],
    lastInspected: Date,
    nextInspectionDue: Date,
    inspectionNotes: String
  }],
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: false
    },
    elevatorAccess: {
      type: Boolean,
      default: false
    },
    rampAccess: {
      type: Boolean,
      default: false
    },
    accessibleParking: {
      type: Boolean,
      default: false
    },
    accessibleRestrooms: {
      type: Boolean,
      default: false
    }
  },
  safety: {
    emergencyExits: [{
      floor: Number,
      location: String,
      type: String
    }],
    fireExtinguishers: [{
      floor: Number,
      location: String,
      type: String,
      lastInspected: Date
    }],
    emergencyProcedures: String,
    evacutationPlan: String
  },
  utilities: utilitiesSchema,
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'under-construction', 'demolished'],
    default: 'active'
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
buildingSchema.virtual('fullAddress').get(function() {
  if (this.address) {
    return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
  }
  return null;
});

// Virtual for confined spaces count
buildingSchema.virtual('confinedSpacesCount').get(function() {
  return this.confinedSpaces ? this.confinedSpaces.length : 0;
});

// Virtual for high-risk confined spaces count
buildingSchema.virtual('highRiskConfinedSpacesCount').get(function() {
  return this.confinedSpaces ? this.confinedSpaces.filter(space => 
    space.hazards && space.hazards.some(hazard => ['high', 'critical'].includes(hazard.severity))
  ).length : 0;
});

// Indexes for better query performance
buildingSchema.index({ name: 1 });
buildingSchema.index({ locationId: 1 });
buildingSchema.index({ 'specifications.buildingType': 1 });
buildingSchema.index({ status: 1 });
buildingSchema.index({ createdBy: 1 });
buildingSchema.index({ isActive: 1 });
buildingSchema.index({ 'confinedSpaces.type': 1 });

// Pre-save middleware to update unit count
buildingSchema.pre('save', function(next) {
  if (this.units && this.units.length !== undefined) {
    this.specifications.totalUnits = this.units.length;
  }
  next();
});

// Static method to find buildings by location
buildingSchema.statics.findByLocation = function(locationId) {
  return this.find({ 
    locationId,
    isActive: true
  }).sort({ name: 1 });
};

// Static method to find buildings with confined spaces
buildingSchema.statics.findWithConfinedSpaces = function() {
  return this.find({
    'confinedSpaces.0': { $exists: true },
    isActive: true
  });
};

// Instance method to add confined space
buildingSchema.methods.addConfinedSpace = function(spaceData) {
  this.confinedSpaces.push(spaceData);
  return this.save();
};

// Instance method to remove confined space
buildingSchema.methods.removeConfinedSpace = function(spaceId) {
  this.confinedSpaces = this.confinedSpaces.filter(space => space._id.toString() !== spaceId);
  return this.save();
};

const Building = mongoose.model('Building', buildingSchema);

export default Building;