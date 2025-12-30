const mongoose = require('mongoose');
const Counter = require('./Counter');
const { v4: uuidv4 } = require('uuid');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  uniqueId: { 
    type: String, 
    unique: true, 
    sparse: true,
    index: true
  },
  internalId: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  // Auto-generated work order ID for easy identification
  workOrderId: {
    type: String,
    unique: true,
    index: true
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  // Survey Information
  surveyDate: { 
    type: Date, 
    required: [true, 'Survey date is required'],
    index: true
  },
  technician: { 
    type: String, 
    required: false, // Made optional
    trim: true,
    maxlength: [100, 'Technician name cannot exceed 100 characters'],
    default: 'Unassigned'
  },
  
  // Space Information
  spaceName: { 
    type: String, 
    required: false, // Made optional
    trim: true,
    maxlength: [100, 'Space name cannot exceed 100 characters'],
    default: 'N/A'
  },
  building: { 
    type: String, 
    required: [true, 'Building is required'],
    trim: true,
    maxlength: [50, 'Building name cannot exceed 50 characters']
  },
  locationDescription: { 
    type: String,
    required: [true, 'Location description is required'],
    trim: true,
    maxlength: [500, 'Location description cannot exceed 500 characters']
  },
  confinedSpaceDescription: { 
    type: String,
    trim: true,
    maxlength: [1000, 'Confined space description cannot exceed 1000 characters']
  },
  
  // Space Classification
  isConfinedSpace: { 
    type: Boolean, 
    required: [true, 'Confined space classification is required']
  },
  permitRequired: { 
    type: Boolean, 
    required: [true, 'Permit requirement must be specified']
  },
  entryRequirements: { 
    type: String,
    trim: true,
    maxlength: [1000, 'Entry requirements cannot exceed 1000 characters']
  },
  
  // Hazard Assessment
  atmosphericHazard: { 
    type: Boolean, 
    required: [true, 'Atmospheric hazard assessment is required']
  },
  atmosphericHazardDescription: { 
    type: String,
    trim: true,
    maxlength: [500, 'Atmospheric hazard description cannot exceed 500 characters']
  },
  engulfmentHazard: { 
    type: Boolean, 
    required: [true, 'Engulfment hazard assessment is required']
  },
  engulfmentHazardDescription: { 
    type: String,
    trim: true,
    maxlength: [500, 'Engulfment hazard description cannot exceed 500 characters']
  },
  configurationHazard: { 
    type: Boolean, 
    required: [true, 'Configuration hazard assessment is required']
  },
  configurationHazardDescription: { 
    type: String,
    trim: true,
    maxlength: [500, 'Configuration hazard description cannot exceed 500 characters']
  },
  otherRecognizedHazards: { 
    type: Boolean, 
    required: [true, 'Other hazards assessment is required']
  },
  otherHazardsDescription: { 
    type: String,
    trim: true,
    maxlength: [500, 'Other hazards description cannot exceed 500 characters']
  },
  
  // Safety Requirements
  ppeRequired: { 
    type: Boolean, 
    required: [true, 'PPE requirement must be specified']
  },
  ppeList: { 
    type: String,
    trim: true,
    maxlength: [1000, 'PPE list cannot exceed 1000 characters']
  },
  forcedAirVentilationSufficient: { 
    type: Boolean, 
    required: [true, 'Forced air ventilation assessment is required']
  },
  dedicatedAirMonitor: { 
    type: Boolean, 
    required: [true, 'Air monitor requirement must be specified']
  },
  warningSignPosted: { 
    type: Boolean, 
    required: [true, 'Warning sign status must be specified']
  },
  
  // Entry Points and Access
  numberOfEntryPoints: { 
    type: Number,
    min: [0, 'Number of entry points cannot be negative'],
    max: [20, 'Number of entry points seems unrealistic']
  },
  
  // Personnel and Access
  otherPeopleWorkingNearSpace: { 
    type: Boolean, 
    required: [true, 'Other people working nearby must be specified']
  },
  canOthersSeeIntoSpace: { 
    type: Boolean, 
    required: [true, 'Visibility into space must be specified']
  },
  contractorsEnterSpace: { 
    type: Boolean, 
    required: [true, 'Contractor entry must be specified']
  },
  isSpaceNormallyLocked: { 
    type: Boolean, 
    required: false,
    default: false
  },
  
  // Additional Information
  notes: { 
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  
  // Images and Documentation
  imageUrls: [{
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  
  // Additional image fields for frontend compatibility
  pictures: [{
    type: String
  }],
  images: [{
    type: String
  }],
  photos: [{
    type: String
  }],
  attachments: [{
    type: String
  }],
  
  // Workflow
  assignedTo: {
    type: String,
    index: true
  },
  assignedDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  approvedBy: {
    type: String
  },
  approvedDate: {
    type: Date
  },
  
  // Metadata
  createdBy: {
    type: String,
    required: [true, 'Created by is required']
  },
  lastModifiedBy: {
    type: String
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Audit Trail
  workflowHistory: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comments: {
      type: String,
      maxlength: [500, 'Comments cannot exceed 500 characters']
    },
    previousStatus: String,
    newStatus: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ surveyDate: 1, building: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ priority: 1 });
OrderSchema.index({ technician: 1 });
OrderSchema.index({ spaceName: 1 });

// Virtual for formatted unique ID
OrderSchema.virtual('formattedId').get(function() {
  return this.uniqueId ? `WO-${new Date().getFullYear()}-${this.uniqueId}` : null;
});

// Virtual for days since creation
OrderSchema.virtual('daysSinceCreation').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save hook to generate IDs and handle workflow
OrderSchema.pre('save', async function(next) {
  const doc = this;
  
  try {
    // Generate work order ID for new orders
    if (doc.isNew && !doc.workOrderId) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      console.log(`Generating work order ID for year: ${currentYear}, month: ${currentMonth}`);
      
      // Get the next sequence number for this year-month combination
      const counter = await Counter.findOneAndUpdate(
        { _id: `workorder_${currentYear}_${currentMonth}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      // Generate work order ID: WO-YYYY-MM-NNNN
      doc.workOrderId = `WO-${currentYear}-${currentMonth}-${String(counter.seq).padStart(4, '0')}`;
      
      console.log(`Generated work order ID: ${doc.workOrderId}`);
    }
    
    // Generate uniqueId if it's not already set
    if (!doc.uniqueId) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      doc.uniqueId = counter.seq.toString().padStart(4, '0');
    }
    

    
    // Set assignment date when assigned
    if (doc.isModified('assignedTo') && doc.assignedTo && !doc.assignedDate) {
      doc.assignedDate = new Date();
    }
    

    
    next();
  } catch (error) {
    console.error('Error in Order pre-save hook:', error);
    next(error);
  }
});

// Instance methods
OrderSchema.methods.addWorkflowEntry = function(action, performedBy, comments = '') {
  this.workflowHistory.push({
    action,
    performedBy,
    timestamp: new Date(),
    comments
  });
  return this.save();
};



// Static methods
OrderSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50);
};



module.exports = mongoose.model('Order', OrderSchema);
