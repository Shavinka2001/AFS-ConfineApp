import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Download,
  Upload,
  RefreshCw,
  UserCog,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Crown,
  EyeOff
} from 'lucide-react';
import { userAPI } from '../../../services/api';
import { handleError, handleSuccess } from '../../../utils/errorHandler';
import { Toaster } from 'react-hot-toast';

const ManagerUserManagement = () => {
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
    fetchUsers();
    
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-container')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      
      if (response.data && response.data.success) {
        // Filter out admin users for manager view
        const nonAdminUsers = response.data.data.filter(user => user.role !== 'admin');
        setUsers(nonAdminUsers || []);
      } else {
        console.error('Failed to fetch users:', response.data?.message);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      handleError(error, 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const response = await userAPI.createUser(userData);
      
      if (response.data && response.data.success) {
        handleSuccess('User created successfully');
        setShowAddModal(false);
        fetchUsers();
      } else {
        throw new Error(response.data?.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('email')) {
        handleError(error, 'Email already exists');
      } else if (error.response?.status === 403) {
        handleError(error, 'You do not have permission to create users');
      } else {
        handleError(error, 'Failed to create user');
      }
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await userAPI.updateUser(selectedUser._id, userData);
      handleSuccess('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      handleError(error, 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userAPI.deleteUser(selectedUser._id);
      handleSuccess('User deleted successfully');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      handleError(error, 'Failed to delete user');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'manager':
        return <Shield className="h-3 w-3" />;
      case 'technician':
        return <UserCog className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-24 h-24 border-8 border-[#232249]/20 border-t-[#232249] rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-24 h-24 border-8 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto"
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-2xl font-bold text-[#232249] mb-2">Loading Users</h3>
          <p className="text-gray-600 text-lg">Please wait while we fetch user data...</p>
          <div className="mt-6 w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#232249] to-blue-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check if user is not authenticated or not manager/admin
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md border border-gray-100"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 text-lg mb-8">
            You need manager or admin privileges to access user management.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Render filters and actions
  const renderFiltersAndActions = () => (
    <div className="relative bg-white rounded-3xl shadow-lg p-8 border-t border-l border-white border-opacity-30 mb-8 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))",
        backdropFilter: "blur(10px)"
      }}
    >
      <div className="absolute -right-40 -top-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -left-40 -bottom-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 group-hover:text-blue-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-14 pr-5 py-4 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow-md bg-white/80 hover:bg-white transition-all duration-200"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="appearance-none w-full pl-5 pr-12 py-4 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow-md bg-white/80 hover:bg-white transition-all duration-200"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
              <option value="user">User</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none w-full pl-5 pr-12 py-4 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm hover:shadow-md bg-white/80 hover:bg-white transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
          
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  // Render users table
  const renderUsersTable = () => (
    <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))",
        backdropFilter: "blur(10px)"
      }}
    >
      <div className="absolute -right-60 -top-60 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -left-60 -bottom-60 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-30"></div>
      
      <div className="relative z-10 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100/80 to-slate-50/80 backdrop-blur-sm">
              <th className="px-8 py-5 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded-md border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 cursor-pointer w-5 h-5"
                />
              </th>
              <th className="px-8 py-5 text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">User</span>
              </th>
              <th className="px-8 py-5 text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role</span>
              </th>
              <th className="px-8 py-5 text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</span>
              </th>
              <th className="px-8 py-5 text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contact</span>
              </th>
              <th className="px-8 py-5 text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Created</span>
              </th>
              <th className="px-8 py-5 text-left">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {users.map((user, index) => (
              <motion.tr
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-50/80 transition-all duration-300 group bg-white/60"
              >
                <td className="px-8 py-6 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => handleSelectUser(user._id, e.target.checked)}
                    className="rounded-md border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 cursor-pointer w-5 h-5"
                  />
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110">
                        <span className="text-white font-bold text-lg">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div className="ml-5">
                      <div className="text-base font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors duration-300">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(user.status)}`}>
                    {user.status === 'active' && <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>}
                    {user.status === 'inactive' && <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>}
                    {user.status === 'pending' && <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>}
                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                  </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="space-y-2">
                    {user.phone && (
                      <div className="flex items-center text-sm text-slate-600 group-hover:text-slate-800 transition-colors duration-300">
                        <Phone className="h-4 w-4 text-slate-400 mr-3 group-hover:text-blue-500 transition-colors duration-300" />
                        <span className="font-medium">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-slate-600 group-hover:text-slate-800 transition-colors duration-300">
                      <Mail className="h-4 w-4 text-slate-400 mr-3 group-hover:text-blue-500 transition-colors duration-300" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center text-sm text-slate-600 group-hover:text-slate-800 transition-colors duration-300">
                    <Calendar className="h-4 w-4 text-slate-400 mr-3 group-hover:text-blue-500 transition-colors duration-300" />
                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric'
                    })}</span>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openViewModal(user)}
                      className="p-2.5 bg-white text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md border border-blue-100 hover:border-blue-600 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2.5 bg-white text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md border border-indigo-100 hover:border-indigo-600 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`p-2.5 bg-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md border opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 ${
                        user.status === 'active'
                          ? 'text-amber-600 hover:text-white hover:bg-amber-600 border-amber-100 hover:border-amber-600'
                          : 'text-emerald-600 hover:text-white hover:bg-emerald-600 border-emerald-100 hover:border-emerald-600'
                      }`}
                      title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-2.5 bg-white text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md border border-red-100 hover:border-red-600 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="relative z-10 border-t border-slate-100/60 px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center text-slate-600 font-medium">
              <span>Showing <span className="font-bold text-blue-700">{((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)}</span> of <span className="font-bold text-blue-700">{totalUsers}</span> users</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center"
              >
                <ChevronDown className="h-4 w-4 rotate-90 mr-1" />
                Previous
              </button>
              
              <div className="flex items-center">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else {
                    const middlePoint = Math.min(Math.max(currentPage, 3), totalPages - 2);
                    pageToShow = i + middlePoint - 2;
                  }
                  
                  if (pageToShow > 0 && pageToShow <= totalPages) {
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => setCurrentPage(pageToShow)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl mx-0.5 text-sm font-semibold transition-all duration-200 ${
                          currentPage === pageToShow
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageToShow}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center"
              >
                Next
                <ChevronDown className="h-4 w-4 -rotate-90 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Create/Edit User Modal Component
  const renderUserModal = () => (
    <AnimatePresence>
      {(showCreateModal || showEditModal) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            resetForm();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-200/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {showCreateModal ? 'Create New User' : 'Edit User'}
                  </h3>
                  <p className="text-slate-600 mt-1">
                    {showCreateModal ? 'Add a new user to the system' : 'Update user information'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showCreateModal ? handleCreateUser() : handleEditUser();
              }}
              className="p-8 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 ${
                      formErrors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder="Enter first name"
                  />
                  {formErrors.firstName && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 ${
                      formErrors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder="Enter last name"
                  />
                  {formErrors.lastName && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 ${
                    formErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.email}</p>
                )}
              </div>

              {showCreateModal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 ${
                        formErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="Enter password"
                    />
                    {formErrors.password && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 ${
                        formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="Confirm password"
                    />
                    {formErrors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 ${
                      formErrors.role ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  >
                    <option value="">Select role</option>
                    <option value="user">User</option>
                    <option value="technician">Technician</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  {formErrors.role && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                    placeholder="Enter department"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter position"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 font-medium"
                >
                  {showCreateModal ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // View User Modal Component
  const renderViewModal = () => (
    <AnimatePresence>
      {showViewModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowViewModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-200/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">User Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-slate-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h4>
                  <p className="text-slate-600 text-lg">{selectedUser.email}</p>
                  <div className="flex items-center space-x-3 mt-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadgeColor(selectedUser.status)}`}>
                      {selectedUser.status?.charAt(0).toUpperCase() + selectedUser.status?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h5 className="font-bold text-slate-900 border-b border-slate-200/60 pb-3 text-lg">
                    Contact Information
                  </h5>
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                      <Mail className="h-5 w-5 text-slate-400 mr-4" />
                      <span className="text-slate-700 font-medium">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                        <Phone className="h-5 w-5 text-slate-400 mr-4" />
                        <span className="text-slate-700 font-medium">{selectedUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="font-bold text-slate-900 border-b border-slate-200/60 pb-3 text-lg">
                    Organization Details
                  </h5>
                  <div className="space-y-4">
                    {selectedUser.department && (
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-500 font-medium">Department:</span>
                        <p className="text-slate-900 font-semibold text-lg">{selectedUser.department}</p>
                      </div>
                    )}
                    {selectedUser.position && (
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-500 font-medium">Position:</span>
                        <p className="text-slate-900 font-semibold text-lg">{selectedUser.position}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="font-bold text-slate-900 border-b border-slate-200/60 pb-3 text-lg">
                    Account Information
                  </h5>
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500 font-medium">Created:</span>
                      <p className="text-slate-900 font-semibold">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500 font-medium">Last Updated:</span>
                      <p className="text-slate-900 font-semibold">
                        {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="font-bold text-slate-900 border-b border-slate-200/60 pb-3 text-lg">
                    Quick Actions
                  </h5>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        openEditModal(selectedUser);
                      }}
                      className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 font-semibold"
                    >
                      <Edit className="h-5 w-5 mr-3" />
                      Edit User
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleToggleStatus(selectedUser);
                      }}
                      className={`w-full flex items-center justify-center px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 font-semibold ${
                        selectedUser.status === 'active'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800'
                      }`}
                    >
                      {selectedUser.status === 'active' ? (
                        <>
                          <UserX className="h-5 w-5 mr-3" />
                          Deactivate User
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-5 w-5 mr-3" />
                          Activate User
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-12 border border-white/60 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
          
          <div className="relative">
            <div className="relative mx-auto h-20 w-20 mb-8">
              <div className="absolute inset-0 rounded-full border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-8 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
              <div className="absolute inset-4 rounded-full border-8 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-0 h-20 w-20 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2 mt-4">Loading Users</h3>
          <p className="text-slate-600 text-lg max-w-md mx-auto">Please wait while we fetch the user data from our servers.</p>
          
          <div className="mt-8 w-full max-w-md mx-auto bg-slate-100/50 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 space-y-8">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#232249] to-[#232249]/80 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-1 font-medium">
              Manage users, roles, and permissions across your system
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add User</span>
          </motion.button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg">
              <Users className="h-7 w-7 text-[#232249]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Users</p>
              <p className="text-3xl font-bold text-[#232249] mt-1">{Array.isArray(users) ? users.length : 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl shadow-lg">
              <UserCheck className="h-7 w-7 text-[#232249]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Users</p>
              <p className="text-3xl font-bold text-[#232249] mt-1">{Array.isArray(users) ? users.filter(u => u.isActive).length : 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg">
              <Shield className="h-7 w-7 text-[#232249]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Managers</p>
              <p className="text-3xl font-bold text-[#232249] mt-1">{Array.isArray(users) ? users.filter(u => u.role === 'manager').length : 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg">
              <UserCog className="h-7 w-7 text-[#232249]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Technicians</p>
              <p className="text-3xl font-bold text-[#232249] mt-1">{Array.isArray(users) ? users.filter(u => u.role === 'technician').length : 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
            <Search className="h-6 w-6 text-[#232249]" />
          </div>
          <h3 className="text-xl font-bold text-[#232249]">Search & Filter Users</h3>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 placeholder-gray-400 font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="appearance-none bg-gray-50/50 border-2 border-gray-200 px-6 py-4 pr-10 rounded-xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 font-semibold text-gray-700"
              >
                <option value="all">All Roles</option>
                <option value="manager">Manager</option>
                <option value="technician">Technician</option>
                <option value="user">User</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-gray-50/50 border-2 border-gray-200 px-6 py-4 pr-10 rounded-xl focus:ring-4 focus:ring-[#232249]/10 focus:border-[#232249] transition-all duration-300 font-semibold text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-lg">
              <Users className="h-6 w-6 text-[#232249]" />
            </div>
            <h3 className="text-xl font-bold text-[#232249]">User Directory</h3>
            <div className="flex-1"></div>
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full font-medium">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#232249] to-[#232249]/90">
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
                  className="hover:bg-gradient-to-r hover:from-[#232249]/5 hover:to-transparent transition-all duration-300 group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                        <span className="text-white font-bold text-sm">
                          {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || 'N'}
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
                        className="p-2 text-gray-600 hover:text-[#232249] hover:bg-[#232249]/10 rounded-lg transition-all duration-200 group"
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
                        className="p-2 text-gray-600 hover:text-[#232249] hover:bg-[#232249]/10 rounded-lg transition-all duration-200"
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-br from-[#232249]/10 to-[#232249]/20 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Users className="h-12 w-12 text-[#232249]" />
            </div>
            <p className="text-gray-500 text-xl font-bold mb-2">No users found</p>
            <p className="text-gray-400 font-medium">Try adjusting your search criteria or filters</p>
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
        isActive: user.isActive !== undefined ? user.isActive : true,
        password: ''
      });
    } else if (mode === 'add') {
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
      case 'manager':
        return { icon: Shield, color: 'text-purple-600', description: 'Can manage users and oversee operations' };
      case 'technician':
        return { icon: UserCog, color: 'text-blue-600', description: 'Can handle technical tasks and maintenance' };
      default:
        return { icon: Users, color: 'text-gray-600', description: 'Standard user with basic access' };
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
          {/* Header */}
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
            {/* Personal Information */}
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

            {/* Security */}
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

            {/* Role & Permissions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-2 w-2 bg-[#232249] rounded-full"></div>
                <h4 className="text-lg font-semibold text-[#232249]">Role & Permissions</h4>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">User Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {['technician', 'manager', 'user'].map((role) => {
                    const roleInfo = getRoleInfo(role);
                    const RoleIcon = roleInfo.icon;
                    return (
                      <motion.button
                        key={role}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                          formData.role === role
                            ? 'border-[#232249] bg-[#232249]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RoleIcon className={`h-6 w-6 mx-auto mb-2 ${roleInfo.color}`} />
                        <p className="text-sm font-semibold capitalize">{role}</p>
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

          {/* Footer */}
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#232249] via-[#232249]/95 to-[#232249]/90 p-8">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || 'N'}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{user.firstName} {user.lastName}</h3>
                  <p className="text-white/80 text-sm">{user.email}</p>
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

          {/* Content */}
          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-[#232249] border-b border-gray-200 pb-2">User Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 font-medium">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role & Status */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-[#232249] border-b border-gray-200 pb-2">Role & Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'technician' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {user.isActive ? <CheckCircle className="h-5 w-5 text-green-500" /> : <UserX className="h-5 w-5 text-red-500" />}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-[#232249] border-b border-gray-200 pb-2">Activity</h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 font-medium">
                    Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#232249] to-[#232249]/90 text-white px-6 py-4 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete User</h3>
                <p className="text-red-100 text-sm">This action cannot be undone</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 text-center">
              Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>?
              All associated data will be permanently removed.
            </p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold"
            >
              Delete
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManagerUserManagement;