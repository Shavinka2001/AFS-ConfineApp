import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Wrench,
  ChevronDown,
  X,
  Save,
  Mail,
  Phone,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { userAPI } from '../../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  useEffect(() => {
    console.log('=== UserManagement useEffect ===');
    
    // Check authentication status
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Auth check - Token exists:', !!token);
    console.log('Auth check - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('Auth check - User:', user);
    console.log('Auth check - User role:', user.role);
    
    if (!token) {
      console.error('No authentication token found');
      alert('Please log in first');
      return;
    }
    
    if (user.role !== 'admin') {
      console.error('User is not an admin:', user.role);
      alert('Access denied. You must be an admin to view this page.');
      return;
    }
    
    console.log('Authentication checks passed, fetching users...');
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Attempting to fetch users...');
      
      // Check authentication before making API call
      const token = localStorage.getItem('token');
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Token exists:', !!token);
      console.log('User from storage:', userFromStorage);
      
      if (!token) {
        console.error('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }
      
      const response = await userAPI.getAllUsers();
      console.log('Fetch users response:', response);
      console.log('Response data:', response.data);
      
      // Handle different response structures
      const userData = response.data.data || response.data || [];
      console.log('Processed user data:', userData);
      
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.error('Authentication failed, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        console.error('Access denied - insufficient permissions');
        alert('You do not have permission to view users.');
      } else {
        console.error('Unknown error occurred');
        alert('Failed to load users. Please try again.');
      }
      
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      console.log('Creating user with data:', userData);
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }
      
      console.log('Token exists, making API call...');
      const response = await userAPI.createUser(userData);
      console.log('Create user response:', response);
      
      fetchUsers();
      setShowAddModal(false);
      alert('User created successfully!');
    } catch (error) {
      console.error('Failed to add user:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to create users.');
      } else if (error.response?.status === 404) {
        alert('API endpoint not found. Please check server configuration.');
      } else {
        alert(`Failed to create user: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await userAPI.updateUser(selectedUser._id, userData);
      fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userAPI.deleteUser(selectedUser._id);
      fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      case 'technician':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'technician':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="animate-pulse space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="space-y-4 p-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-600 font-medium">Loading user management...</p>
        </div>
      </div>
    );
  }

  // Check if user is not authenticated or not admin
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100 text-center">
            <div className="mx-auto h-16 h-16 md:h-20 md:w-20 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl md:rounded-2xl mb-4 md:mb-6 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 md:h-10 md:w-10 text-red-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6 md:mb-8 font-medium text-sm md:text-base">You need to be logged in as an administrator to access this page.</p>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-6 mb-4 md:mb-6">
              <h4 className="font-bold text-blue-800 mb-2 md:mb-3 text-sm md:text-base">Demo Admin Account:</h4>
              <div className="space-y-1 md:space-y-2">
                <p className="text-xs md:text-sm text-blue-700 font-medium">Email: admin@confine.com</p>
                <p className="text-xs md:text-sm text-blue-700 font-medium">Password: Admin123!</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-bold hover:shadow-xl transition-all duration-300 w-full min-h-[48px] flex items-center justify-center"
            >
              Go to Login
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 border border-gray-100 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-1 font-medium text-sm md:text-base">
              Manage users, roles, and permissions across your system
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 md:px-6 py-3 rounded-lg md:rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-2 min-h-[48px] flex-1 sm:flex-none justify-center"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-sm md:text-base">Add User</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-3 md:p-6 border border-gray-100 hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-2 md:p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg md:rounded-xl shadow-sm md:shadow-lg">
              <Users className="h-4 w-4 md:h-7 md:w-7 text-slate-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Users</p>
              <p className="text-lg md:text-3xl font-bold text-slate-800 mt-1">{Array.isArray(users) ? users.length : 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-3 md:p-6 border border-gray-100 hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-2 md:p-4 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg md:rounded-xl shadow-sm md:shadow-lg">
              <UserCheck className="h-4 w-4 md:h-7 md:w-7 text-slate-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Users</p>
              <p className="text-lg md:text-3xl font-bold text-slate-800 mt-1">{Array.isArray(users) ? users.filter(u => u.isActive).length : 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-3 md:p-6 border border-gray-100 hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-2 md:p-4 bg-gradient-to-br from-red-50 to-pink-100 rounded-lg md:rounded-xl shadow-sm md:shadow-lg">
              <Crown className="h-4 w-4 md:h-7 md:w-7 text-slate-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">Admins</p>
              <p className="text-lg md:text-3xl font-bold text-slate-800 mt-1">{Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-3 md:p-6 border border-gray-100 hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-2 md:p-4 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg md:rounded-xl shadow-sm md:shadow-lg">
              <UserX className="h-4 w-4 md:h-7 md:w-7 text-slate-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">Inactive Users</p>
              <p className="text-lg md:text-3xl font-bold text-slate-800 mt-1">{Array.isArray(users) ? users.filter(u => !u.isActive).length : 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 border border-gray-100"
      >
        <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
          <div className="p-2 bg-gradient-to-br from-slate-600/10 to-slate-800/20 rounded-lg">
            <Search className="h-4 w-4 md:h-6 md:w-6 text-slate-800" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-800">Search & Filter Users</h3>
        </div>
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between md:space-x-6">
          {/* Search */}
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-gray-50/50 border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-4 focus:ring-slate-800/10 focus:border-slate-800 transition-all duration-300 placeholder-gray-400 font-medium text-sm md:text-base min-h-[48px]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="appearance-none bg-gray-50/50 border-2 border-gray-200 px-4 md:px-6 py-3 md:py-4 pr-8 md:pr-10 rounded-lg md:rounded-xl focus:ring-4 focus:ring-slate-800/10 focus:border-slate-800 transition-all duration-300 font-semibold text-gray-700 w-full min-h-[48px] text-sm md:text-base"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="technician">Technician</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-gray-50/50 border-2 border-gray-200 px-4 md:px-6 py-3 md:py-4 pr-8 md:pr-10 rounded-lg md:rounded-xl focus:ring-4 focus:ring-slate-800/10 focus:border-slate-800 transition-all duration-300 font-semibold text-gray-700 w-full min-h-[48px] text-sm md:text-base"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Users Table/Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-4 md:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="p-2 bg-gradient-to-br from-slate-600/10 to-slate-800/20 rounded-lg">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-slate-800" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800">User Directory</h3>
            </div>
            <div className="text-xs md:text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full font-medium">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
          </div>
        </div>

        {/* Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
              <tr>
                <th className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">User</th>
                <th className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Role</th>
                <th className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Status</th>
                <th className="text-left py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Last Login</th>
                <th className="text-center py-3 px-4 text-white font-bold text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gradient-to-r hover:from-slate-800/5 hover:to-transparent transition-all duration-300 group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                        <span className="text-white font-bold text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold border ${getRoleColor(user.role)} shadow-sm`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold shadow-sm ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-medium text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-slate-800 hover:bg-slate-800/10 rounded-lg transition-all duration-200 group"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-slate-800 hover:bg-slate-800/10 rounded-lg transition-all duration-200"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Hidden on Desktop */}
        <div className="md:hidden space-y-3 p-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* User Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="capitalize">{user.role}</span>
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                    user.isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last Login:</span>
                  <span className="text-sm text-gray-900">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center space-x-2 pt-3 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedUser(user);
                    setShowDetailsModal(true);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200 min-h-[44px] flex-1 justify-center"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">View</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedUser(user);
                    setShowEditModal(true);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-all duration-200 min-h-[44px] flex-1 justify-center"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Edit</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedUser(user);
                    setShowDeleteModal(true);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all duration-200 min-h-[44px] flex-1 justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Delete</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 md:py-16 px-4">
            <div className="p-4 md:p-6 bg-gradient-to-br from-slate-600/10 to-slate-800/20 rounded-xl md:rounded-2xl w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 flex items-center justify-center">
              <Users className="h-8 w-8 md:h-12 md:w-12 text-slate-800" />
            </div>
            <p className="text-gray-500 text-lg md:text-xl font-bold mb-2">No users found</p>
            <p className="text-gray-400 font-medium text-sm md:text-base">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <UserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
        title="Add New User"
        mode="add"
      />

      <UserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateUser}
        title="Edit User"
        mode="edit"
        user={selectedUser}
      />

      <UserDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />
    </div>
  );
};

// User Modal Component
const UserModal = ({ isOpen, onClose, onSubmit, title, mode, user }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'technician',
    isActive: true,
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'technician',
        isActive: user.isActive || false,
        password: ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'technician',
        isActive: true,
        password: ''
      });
    }
  }, [mode, user, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin':
        return { icon: Crown, color: 'text-red-600 bg-red-50', description: 'Full system access and user management' };
      case 'manager':
        return { icon: Shield, color: 'text-purple-600 bg-purple-50', description: 'Team management and oversight capabilities' };
      case 'technician':
        return { icon: Wrench, color: 'text-blue-600 bg-blue-50', description: 'Technical operations and maintenance access' };
      default:
        return { icon: Users, color: 'text-gray-600 bg-gray-50', description: 'Standard user access' };
    }
  };

  if (!isOpen) return null;

  const currentRoleInfo = getRoleInfo(formData.role);
  const IconComponent = currentRoleInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-r from-[#232249] via-[#232249]/95 to-[#232249]/90 p-8">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{title}</h3>
                  <p className="text-white/80 text-sm">{mode === 'add' ? 'Create a new user account' : 'Modify user information'}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <X className="h-6 w-6 text-white" />
              </motion.button>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="user-form" className="p-8 space-y-6 flex-1 overflow-y-auto">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-2 w-2 bg-[#232249] rounded-full"></div>
                <h4 className="text-lg font-semibold text-[#232249]">Personal Information</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">First Name</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 placeholder-gray-400"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 placeholder-gray-400"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 placeholder-gray-400"
                  placeholder="user@company.com"
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-2 w-2 bg-[#232249] rounded-full"></div>
                <h4 className="text-lg font-semibold text-[#232249]">Security</h4>
              </div>

              {(mode === 'add' || mode === 'edit') && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {mode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}
                  </label>
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type={showPassword ? 'text' : 'password'}
                      required={mode === 'add'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 placeholder-gray-400"
                      placeholder={mode === 'add' ? 'Enter secure password' : 'Leave blank to keep current'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-[#232249] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role & Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-2 w-2 bg-[#232249] rounded-full"></div>
                <h4 className="text-lg font-semibold text-[#232249]">Role & Permissions</h4>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">User Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {['technician', 'manager', 'admin'].map((role) => {
                    const roleInfo = getRoleInfo(role);
                    const RoleIcon = roleInfo.icon;
                    const isSelected = formData.role === role;
                    
                    return (
                      <motion.button
                        key={role}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          isSelected 
                            ? `${roleInfo.color} border-current shadow-lg` 
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RoleIcon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? roleInfo.color.split(' ')[0] : 'text-gray-400'}`} />
                        <p className={`text-sm font-semibold capitalize ${isSelected ? roleInfo.color.split(' ')[0] : 'text-gray-600'}`}>
                          {role}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
                <div className={`p-4 rounded-xl ${currentRoleInfo.color} border border-current/20`}>
                  <p className="text-sm font-medium">{currentRoleInfo.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                    {formData.isActive ? 
                      <UserCheck className="h-5 w-5 text-green-600" /> : 
                      <UserX className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Account Status</p>
                    <p className="text-xs text-gray-500">
                      {formData.isActive ? 'User can access the system' : 'User access is disabled'}
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.isActive ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                  />
                </motion.button>
              </div>
            </div>
          </form>

          {/* Action Buttons - Fixed at bottom */}
          <div className="bg-white border-t border-gray-100 p-6 flex-shrink-0">
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                form="user-form"
                className="flex-1 bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-6 py-4 rounded-xl hover:shadow-2xl hover:shadow-[#232249]/25 transition-all duration-300 font-semibold flex items-center justify-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>{mode === 'add' ? 'Create User' : 'Save Changes'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#232249]">User Details</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* User Avatar and Basic Info */}
            <div className="text-center">
              <div className="h-20 w-20 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <h4 className="text-xl font-bold text-[#232249]">{user.firstName} {user.lastName}</h4>
              <p className="text-gray-600">{user.email}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-[#232249]" />
                  <span className="text-sm font-semibold text-gray-700">Role</span>
                </div>
                <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span className="capitalize">{user.role}</span>
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <UserCheck className="h-4 w-4 text-[#232249]" />
                  <span className="text-sm font-semibold text-gray-700">Status</span>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  user.isActive 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-[#232249]" />
                  <span className="text-sm font-semibold text-gray-700">Created</span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-[#232249]" />
                  <span className="text-sm font-semibold text-gray-700">Last Login</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-br from-[#232249]/5 to-[#232249]/10 rounded-xl p-4">
              <h5 className="font-semibold text-[#232249] mb-3">Contact Information</h5>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-[#232249]" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-[#232249]" />
                    <span className="text-sm text-gray-700">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function for role colors (moved outside component)
const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'manager':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'technician':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Helper function for role icons (moved outside component)
const getRoleIcon = (role) => {
  switch (role) {
    case 'admin':
      return <Crown className="h-4 w-4" />;
    case 'manager':
      return <Shield className="h-4 w-4" />;
    case 'technician':
      return <Wrench className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        >
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>? 
                This will permanently remove their account and all associated data.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete User</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserManagement;
