import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Hammer,
  Gauge,
  Battery,
  Zap,
  Settings,
  TrendingUp,
  FileText,
  HardHat
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, title, value, change, color, bgColor }) => (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-xl ${bgColor} shadow-lg group-hover:scale-105 transition-transform duration-200`}>
              <Icon className={`h-7 w-7 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-bold text-[#232249] mt-1">{value}</p>
            </div>
          </div>
          {change && (
            <div className="mt-4 flex items-center text-sm bg-gray-50 rounded-lg p-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-600 font-semibold">{change}</span>
              <span className="text-gray-500 ml-1">this week</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const WorkOrderCard = ({ id, title, priority, location, status, dueTime, description }) => (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-[#232249]/30 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-lg font-bold text-[#232249] group-hover:scale-105 transition-transform duration-200">#{id}</span>
          <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
            priority === 'high' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
            priority === 'medium' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
            'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
          }`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </span>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
          status === 'pending' ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800' :
          status === 'in-progress' ? 'bg-gradient-to-r from-[#232249]/10 to-[#232249]/20 text-[#232249]' :
          'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
        }`}>
          {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      
      <h4 className="font-bold text-[#232249] mb-3 text-lg">{title}</h4>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 bg-[#232249]/5 px-3 py-2 rounded-lg">
          <MapPin className="h-4 w-4 text-[#232249]" />
          <span className="font-medium text-[#232249]">{location}</span>
        </div>
        <div className="flex items-center space-x-2 bg-amber-50 px-3 py-2 rounded-lg">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-700">Due: {dueTime}</span>
        </div>
      </div>
    </div>
  );

  const TaskCard = ({ title, status, assignedBy, dueDate, tools }) => (
    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-[#232249]/20">
      <div className={`p-3 rounded-xl shadow-md ${
        status === 'completed' ? 'bg-gradient-to-br from-emerald-50 to-green-100' :
        status === 'in-progress' ? 'bg-gradient-to-br from-[#232249]/10 to-[#232249]/20' :
        'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        {status === 'completed' ? (
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        ) : status === 'in-progress' ? (
          <Clock className="h-5 w-5 text-[#232249]" />
        ) : (
          <ClipboardList className="h-5 w-5 text-gray-600" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-[#232249]">{title}</h4>
        <p className="text-xs text-gray-600 font-medium">Assigned by {assignedBy}</p>
        <p className="text-xs text-gray-500 mt-1">Due: {dueDate}</p>
      </div>
      <div className="text-right">
        <div className="bg-[#232249]/5 px-3 py-1 rounded-lg">
          <p className="text-xs text-[#232249] font-semibold">Tools: {tools}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full flex-1 p-6 space-y-4 md:space-y-6 lg:space-y-8">
          {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100 gap-4 md:gap-0">
        <div className="flex items-center space-x-3 md:space-x-6">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">
              Technician Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 font-medium">
              Welcome back, <span className="text-[#232249] font-semibold">{user.firstName}</span>!
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end md:items-end space-y-1 flex-shrink-0">
          <div className="relative bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-4 py-2 rounded-lg shadow-lg border border-[#232249]/30 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -translate-y-4 translate-x-4"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-white/5 rounded-full translate-y-3 -translate-x-3"></div>
            
            <div className="relative z-10 flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Live</span>
              </div>
              
              <div className="border-l border-white/30 pl-3">
                <div className="font-mono text-lg font-bold tracking-wide text-white">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-white/70 text-center">
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>
            
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatCard
          icon={ClipboardList}
          title="Open Work Orders"
          value="7"
          change="+2"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-blue-50 to-indigo-100"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Today"
          value="3"
          change="Great progress!"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-emerald-50 to-green-100"
        />
        <StatCard
          icon={Clock}
          title="Hours Worked"
          value="6.5h"
          change="32h total"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-purple-50 to-violet-100"
        />
        <StatCard
          icon={Gauge}
          title="Efficiency Score"
          value="94%"
          change="+3%"
          color="text-[#232249]"
          bgColor="bg-gradient-to-br from-orange-50 to-amber-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Active Work Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg flex-shrink-0">
                <Wrench className="h-5 w-5 md:h-6 md:w-6 text-[#232249]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#232249]">Active Work Orders</h3>
            </div>
          </div>
          <div className="space-y-4">
            <WorkOrderCard
              id="WO-2024-001"
              title="HVAC System Maintenance"
              priority="high"
              location="Building A - Floor 3"
              status="in-progress"
              dueTime="2:00 PM"
              description="Routine maintenance check and filter replacement for HVAC units"
            />
            <WorkOrderCard
              id="WO-2024-002"
              title="Electrical Panel Inspection"
              priority="medium"
              location="Building B - Basement"
              status="pending"
              dueTime="4:00 PM"
              description="Monthly inspection of main electrical panels and safety systems"
            />
            <WorkOrderCard
              id="WO-2024-003"
              title="Plumbing Repair"
              priority="high"
              location="Building C - Floor 2"
              status="pending"
              dueTime="Tomorrow 9:00 AM"
              description="Fix leaking pipe in conference room 201"
            />
          </div>
        </div>

        {/* Tools and Equipment */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
                <Hammer className="h-6 w-6 text-[#232249]" />
              </div>
              <h3 className="text-xl font-bold text-[#232249]">Equipment Status</h3>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div className="flex items-center space-x-3">
                <Battery className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-900">Multimeter</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Available</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-semibold text-gray-900">Power Drill</span>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">In Use</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-900">Tool Kit</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Available</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border border-rose-100">
              <div className="flex items-center space-x-3">
                <Wrench className="h-5 w-5 text-rose-600" />
                <span className="text-sm font-semibold text-gray-900">Hydraulic Jack</span>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full">Maintenance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Tasks and Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Today's Tasks */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
                <ClipboardList className="h-6 w-6 text-[#232249]" />
              </div>
              <h3 className="text-xl font-bold text-[#232249]">Today's Tasks</h3>
            </div>
          </div>
          <div className="space-y-3">
            <TaskCard
              title="Safety inspection checklist"
              status="completed"
              assignedBy="Mike Johnson"
              dueDate="9:00 AM"
              tools="Checklist"
            />
            <TaskCard
              title="Equipment calibration"
              status="in-progress"
              assignedBy="Sarah Wilson"
              dueDate="1:00 PM"
              tools="Calibrator"
            />
            <TaskCard
              title="Preventive maintenance"
              status="pending"
              assignedBy="John Davis"
              dueDate="3:00 PM"
              tools="Tool kit"
            />
            <TaskCard
              title="Documentation update"
              status="pending"
              assignedBy="Lisa Brown"
              dueDate="End of day"
              tools="Tablet"
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
                <Calendar className="h-6 w-6 text-[#232249]" />
              </div>
              <h3 className="text-xl font-bold text-[#232249]">This Week's Schedule</h3>
            </div>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-[#232249] pl-4 py-3 bg-gradient-to-r from-[#232249]/5 to-transparent rounded-r-lg">
              <p className="text-sm font-bold text-[#232249]">Monday - HVAC Maintenance</p>
              <p className="text-xs text-gray-600 font-medium">Building A, B, C - Full day</p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-4 py-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-r-lg">
              <p className="text-sm font-bold text-emerald-700">Tuesday - Electrical Inspection</p>
              <p className="text-xs text-gray-600 font-medium">All buildings - Morning</p>
            </div>
            <div className="border-l-4 border-amber-500 pl-4 py-3 bg-gradient-to-r from-amber-50 to-transparent rounded-r-lg">
              <p className="text-sm font-bold text-amber-700">Wednesday - Emergency Repairs</p>
              <p className="text-xs text-gray-600 font-medium">On-call - Full day</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-3 bg-gradient-to-r from-purple-50 to-transparent rounded-r-lg">
              <p className="text-sm font-bold text-purple-700">Thursday - Training Session</p>
              <p className="text-xs text-gray-600 font-medium">Conference room - 2:00 PM</p>
            </div>
            <div className="border-l-4 border-gray-400 pl-4 py-3 bg-gradient-to-r from-gray-50 to-transparent rounded-r-lg">
              <p className="text-sm font-bold text-gray-700">Friday - Documentation</p>
              <p className="text-xs text-gray-600 font-medium">Office - Morning</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
