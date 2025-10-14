import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  MapPin,
  Calendar,
  User
} from 'lucide-react';
import { technicianAssignmentService } from '../../services/technicianAssignmentService';
import { useAuth } from '../../contexts/AuthContext';

const TasksSidebar = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user?.role === 'technician') {
      loadTechnicianData();
    }
  }, [isOpen, user]);

  const loadTechnicianData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Load technician profile and tasks in parallel
      const [profileResponse, tasksResponse] = await Promise.all([
        technicianAssignmentService.getMyTechnicianProfile(),
        technicianAssignmentService.getMyTasks()
      ]);
      
      setTechnicianProfile(profileResponse.data);
      setTasks(tasksResponse.data || []);
      
    } catch (error) {
      console.error('Error loading technician data:', error);
      setError('Failed to load tasks and profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      
      await technicianAssignmentService.updateTaskStatus(taskId, newStatus);
      
      // Reload tasks to get updated data
      await loadTechnicianData();
      
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in-progress':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'on-hold':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <ClipboardList className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardList className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        {/* Technician Info */}
        {technicianProfile && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <User className="w-4 h-4 text-blue-600 mr-2" />
              <div>
                <p className="font-medium text-blue-800">
                  {technicianProfile.fullName}
                </p>
                <p className="text-sm text-blue-600">
                  ID: {technicianProfile.employeeId}
                </p>
                {technicianProfile.currentAssignment?.isActive && (
                  <div className="flex items-center mt-1">
                    <MapPin className="w-3 h-3 text-blue-500 mr-1" />
                    <p className="text-xs text-blue-500">
                      {technicianProfile.currentAssignment.locationName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-2" />
            <span className="text-gray-600">Loading tasks...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={loadTechnicianData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* No Assignment Message */}
        {!isLoading && !error && !technicianProfile?.currentAssignment?.isActive && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No Location Assignment</p>
            <p className="text-sm text-gray-500">
              You need to be assigned to a location to view tasks
            </p>
          </div>
        )}

        {/* Tasks List */}
        {!isLoading && !error && tasks.length === 0 && technicianProfile?.currentAssignment?.isActive && (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No Tasks Assigned</p>
            <p className="text-sm text-gray-500">
              You don't have any tasks at the moment
            </p>
          </div>
        )}

        {/* Location Info Banner */}
        {!isLoading && !error && technicianProfile?.currentAssignment?.isActive && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Current Location</p>
                <p className="text-xs text-green-600">
                  {technicianProfile.currentAssignment.locationName}
                </p>
              </div>
            </div>
          </div>
        )}

        {tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow duration-200"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getStatusIcon(task.status)}
                    <h3 className="font-medium text-gray-800 ml-2 text-sm">
                      {task.title}
                    </h3>
                  </div>
                  {task.priority && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>

                {/* Task Description */}
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Task Details */}
                <div className="space-y-1 mb-3">
                  {task.dueDate && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  {task.location && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      {task.location}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                    {task.status.replace('-', ' ')}
                  </span>

                  {/* Action Buttons */}
                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div className="flex gap-1">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleTaskStatusUpdate(task._id, 'in-progress')}
                          disabled={updatingTaskId === task._id}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors duration-200 disabled:opacity-50"
                        >
                          {updatingTaskId === task._id ? 'Updating...' : 'Start'}
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button
                          onClick={() => handleTaskStatusUpdate(task._id, 'completed')}
                          disabled={updatingTaskId === task._id}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors duration-200 disabled:opacity-50"
                        >
                          {updatingTaskId === task._id ? 'Updating...' : 'Complete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadTechnicianData}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 inline ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksSidebar;
