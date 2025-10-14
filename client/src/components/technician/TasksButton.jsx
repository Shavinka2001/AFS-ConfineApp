import React, { useState, useEffect } from 'react';
import { ClipboardList, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { technicianAssignmentService } from '../../services/technicianAssignmentService';
import TasksSidebar from './TasksSidebar';

const TasksButton = () => {
  const [showTasksSidebar, setShowTasksSidebar] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'technician') {
      loadTaskCounts();
      
      // Set up interval to refresh task counts every 30 seconds
      const interval = setInterval(loadTaskCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadTaskCounts = async () => {
    try {
      const response = await technicianAssignmentService.getMyTasks();
      const tasks = response.data || [];
      
      setTaskCount(tasks.length);
      setPendingTaskCount(tasks.filter(task => 
        task.status === 'pending' || task.status === 'in-progress'
      ).length);
      
    } catch (error) {
      console.error('Error loading task counts:', error);
    }
  };

  // Only show for technicians
  if (user?.role !== 'technician') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowTasksSidebar(true)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
        title="My Tasks"
      >
        <ClipboardList className="w-5 h-5" />
        
        {/* Task Count Badge */}
        {taskCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {taskCount > 99 ? '99+' : taskCount}
          </span>
        )}
        
        {/* Pending Tasks Indicator */}
        {pendingTaskCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-2 w-2 animate-pulse">
          </span>
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          My Tasks {taskCount > 0 && `(${taskCount})`}
        </div>
      </button>

      {/* Tasks Sidebar */}
      <TasksSidebar 
        isOpen={showTasksSidebar}
        onClose={() => setShowTasksSidebar(false)}
      />
    </>
  );
};

export default TasksButton;
