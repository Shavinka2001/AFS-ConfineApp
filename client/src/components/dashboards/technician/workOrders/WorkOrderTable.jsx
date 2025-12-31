import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Eye, 
  Edit, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  ArrowUpDown, 
  ImageIcon,
  FileText
} from 'lucide-react';
import PDFDownloadButton from '../../../ui/PDFDownloadButton';

const WorkOrderTable = ({ 
  workOrders = [], 
  onView, 
  onEdit, 
  onStatusUpdate 
}) => {
  console.log('WorkOrderTable received:', workOrders.length, 'orders');
  console.log('WorkOrderTable sample order:', workOrders[0]);
  
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'bg-red-100 text-red-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-green-100 text-green-800',
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Mobile Cards View */}
      <div className="block md:hidden">
        {workOrders.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
            <p className="text-gray-500">Get started by creating your first work order.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {workOrders.map((form) => (
              <div key={form.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <p className="font-semibold text-gray-900 text-sm">
                        {form.workOrderId || `WO-${new Date(form.submittedAt || form.createdAt).getFullYear()}-${String(form.id).padStart(4, '0')}`}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {form.spaceName || form.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(form.submittedAt || form.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
                      {form.status}
                    </span>
                    {form.priority && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(form.priority)}`}>
                        {form.priority}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{form.entrySupervisor || form.customerName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-24">{form.building || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(form)}
                    className="flex-1 flex items-center justify-center py-3 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </button>
                  <button
                    onClick={() => onEdit(form)}
                    className="flex-1 flex items-center justify-center py-3 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <PDFDownloadButton 
                    workOrder={form} 
                    size="small"
                    className="flex items-center justify-center py-3 px-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#232249' }}>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Work Order</span>
                  <ArrowUpDown className="h-4 w-4 opacity-70" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Date & Status</span>
                  <ArrowUpDown className="h-4 w-4 opacity-70" />
                </button>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </span>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </span>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                Priority
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {workOrders.map((form) => (
              <React.Fragment key={form.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(form.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {expandedRows.has(form.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {form.workOrderId || `WO-${new Date(form.submittedAt || form.createdAt).getFullYear()}-${String(form.id).padStart(4, '0')}`}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {form.spaceName || form.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(form.submittedAt || form.createdAt).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
                        {form.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{form.entrySupervisor || form.customerName || 'N/A'}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {form.phone || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {form.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{form.building || form.address || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{form.location || form.locationDescription || (form.city && form.state ? `${form.city}, ${form.state}` : 'N/A')}</p>
                  </td>
                  <td className="px-6 py-4">
                    {form.priority ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(form.priority)}`}>
                        {form.priority}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Set
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onView(form)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(form)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {/* PDF Download Button */}
                      <PDFDownloadButton 
                        workOrder={form} 
                        size="small"
                        className="p-2"
                      />
                      
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(form.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeDropdown === form.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                            <div className="p-2">
                              {/* Show different actions based on current status */}
                              {form.status === 'draft' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusUpdate(form.id, 'pending');
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                  Submit for Approval
                                </button>
                              )}
                              {form.status === 'pending' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusUpdate(form.id, 'approved');
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  Mark Approved
                                </button>
                              )}
                              {form.status === 'approved' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusUpdate(form.id, 'in-progress');
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                  Start Work
                                </button>
                              )}
                              {form.status === 'in-progress' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusUpdate(form.id, 'completed');
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  Mark Completed
                                </button>
                              )}
                              {/* Always show cancel option for non-completed orders */}
                              {form.status !== 'completed' && form.status !== 'cancelled' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusUpdate(form.id, 'cancelled');
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-red-500" />
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>

                {expandedRows.has(form.id) && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Timeline
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div>
                                  <p className="font-medium text-gray-900">Created</p>
                                  <p className="text-gray-500">
                                    {new Date(form.submittedAt || form.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {form.updatedAt || form.lastModified ? (
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <div>
                                    <p className="font-medium text-gray-900">Last Updated</p>
                                    <p className="text-gray-500">
                                      {new Date(form.updatedAt || form.lastModified).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Attachments
                            </h4>
                            {form.images && form.images.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {form.images.map((image, index) => (
                                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                      src={image}
                                      alt={`Attachment ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-gray-400">
                                <div className="p-2 bg-gray-100 rounded-xl">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                                <div className="text-sm font-medium">No images</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {form.notes && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900">Notes</h4>
                            <div className="bg-white p-4 rounded-xl border border-gray-200">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {form.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {workOrders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
            <p className="text-gray-500">Get started by creating your first work order.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrderTable;
