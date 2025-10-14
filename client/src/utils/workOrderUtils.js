// Utility functions for work order management

/**
 * Formats a work order ID for display
 * @param {Object} workOrder - The work order object
 * @returns {string} Formatted work order ID
 */
export const formatWorkOrderId = (workOrder) => {
  if (workOrder.workOrderId) {
    return workOrder.workOrderId;
  }
  
  // Fallback for legacy records
  const date = new Date(workOrder.submittedAt || workOrder.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const id = String(workOrder.id || workOrder._id).slice(-4).padStart(4, '0');
  
  return `WO-${year}-${month}-${id}`;
};

/**
 * Generates a display title for work orders
 * @param {Object} workOrder - The work order object
 * @returns {string} Display title
 */
export const getWorkOrderTitle = (workOrder) => {
  const id = formatWorkOrderId(workOrder);
  const space = workOrder.spaceName || workOrder.description || 'Confined Space';
  return `${id} - ${space}`;
};

/**
 * Gets priority badge styling
 * @param {string} priority - Priority level
 * @returns {string} CSS classes
 */
export const getPriorityBadge = (priority) => {
  const badges = {
    'critical': 'bg-red-500 text-white border-red-600',
    'high': 'bg-red-100 text-red-800 border-red-200',
    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'low': 'bg-green-100 text-green-800 border-green-200'
  };
  return badges[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Gets status badge styling
 * @param {string} status - Work order status
 * @returns {string} CSS classes
 */
export const getStatusBadge = (status) => {
  const badges = {
    'draft': 'bg-gray-100 text-gray-800 border-gray-200',
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'approved': 'bg-green-100 text-green-800 border-green-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'completed': 'bg-green-500 text-white border-green-600',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
    'on-hold': 'bg-orange-100 text-orange-800 border-orange-200'
  };
  return badges[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};
