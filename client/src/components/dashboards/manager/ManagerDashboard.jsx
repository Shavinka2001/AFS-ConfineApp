import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  ClipboardList,
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  MapPin,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const ManagerDashboard = () => {
  const { user } = useAuth();

  const StatCard = ({ icon: Icon, title, value, change, color, bgColor, trend = 'up' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${bgColor}`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {change && (
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className={`h-4 w-4 mr-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{change}</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ProjectCard = ({ name, progress, status, dueDate, team }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          status === 'on-track' ? 'bg-green-100 text-green-800' :
          status === 'delayed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status === 'on-track' ? 'On Track' : status === 'delayed' ? 'Delayed' : 'At Risk'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                status === 'on-track' ? 'bg-green-500' :
                status === 'delayed' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Due: {dueDate}</span>
          <span className="text-gray-600">{team} team members</span>
        </div>
      </div>
    </div>
  );

  const TeamMemberCard = ({ name, role, status, tasksCompleted, avatar }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
        <span className="text-white font-medium text-sm">{name.charAt(0)}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-600">{role}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{tasksCompleted}</p>
        <p className="text-xs text-gray-600">tasks done</p>
      </div>
      <div className={`h-2 w-2 rounded-full ${
        status === 'online' ? 'bg-green-500' : 'bg-gray-400'
      }`}></div>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.firstName}! Here's your team overview.</p>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            New Project
          </motion.button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/locations"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Location Management</h4>
              <p className="text-sm text-blue-700">Assign technicians to locations</p>
            </div>
          </a>
          
          <a
            href="/manager/users"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900">User Management</h4>
              <p className="text-sm text-emerald-700">Manage users and permissions</p>
            </div>
          </a>

          <a
            href="/manager/work-orders"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Work Orders</h4>
              <p className="text-sm text-blue-700">Manage and track work orders</p>
            </div>
          </a>
          
          <a
            href="/manager/team"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">Team Management</h4>
              <p className="text-sm text-purple-700">Manage your team members</p>
            </div>
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Team Members"
          value="24"
          change="+3"
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          icon={ClipboardList}
          title="Active Projects"
          value="8"
          change="+2"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={Target}
          title="Goals Achieved"
          value="92%"
          change="+5%"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={Award}
          title="Team Performance"
          value="A+"
          change="Excellent"
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Current Projects</h3>
            <ClipboardList className="h-5 w-5 text-gray-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProjectCard
              name="Mobile App Redesign"
              progress={75}
              status="on-track"
              dueDate="Dec 15"
              team={6}
            />
            <ProjectCard
              name="API Documentation"
              progress={45}
              status="at-risk"
              dueDate="Dec 20"
              team={3}
            />
            <ProjectCard
              name="User Authentication"
              progress={90}
              status="on-track"
              dueDate="Dec 10"
              team={4}
            />
            <ProjectCard
              name="Database Optimization"
              progress={30}
              status="delayed"
              dueDate="Dec 25"
              team={5}
            />
          </div>
        </motion.div>

        {/* Team Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Status</h3>
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <TeamMemberCard
              name="Alice Johnson"
              role="Senior Developer"
              status="online"
              tasksCompleted={12}
            />
            <TeamMemberCard
              name="Bob Smith"
              role="UI Designer"
              status="online"
              tasksCompleted={8}
            />
            <TeamMemberCard
              name="Carol Davis"
              role="QA Engineer"
              status="offline"
              tasksCompleted={15}
            />
            <TeamMemberCard
              name="David Wilson"
              role="DevOps"
              status="online"
              tasksCompleted={7}
            />
          </div>
        </motion.div>
      </div>

      {/* Performance Charts and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Task Completion Rate</span>
              <span className="text-sm font-medium text-green-600">94%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Code Quality Score</span>
              <span className="text-sm font-medium text-blue-600">88%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On-time Delivery</span>
              <span className="text-sm font-medium text-purple-600">92%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">User Authentication</p>
                <p className="text-xs text-gray-600">Due in 2 days - Dec 10</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Mobile App Redesign</p>
                <p className="text-xs text-gray-600">Due in 7 days - Dec 15</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">API Documentation</p>
                <p className="text-xs text-gray-600">Due in 12 days - Dec 20</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
