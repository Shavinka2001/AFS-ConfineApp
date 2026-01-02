import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Wrench,
  Users,
  MessageSquare,
  X
} from 'lucide-react';
import { userAPI } from '../../../services/api';

const PendingUserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getPendingUsers();
      setPendingUsers(Array.isArray(response.data.data) ? response.data.data : response.data || []);
    } catch (error) {
      console.error('Failed to fetch pending users:', error);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId);
      await userAPI.approveUser(userId);
      await fetchPendingUsers();
      // Show success message
      alert('User approved successfully!');
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Failed to approve user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) return;

    try {
      setActionLoading(selectedUser._id);
      await userAPI.rejectUser(selectedUser._id, rejectionReason);
      await fetchPendingUsers();
      setShowRejectModal(false);
      setSelectedUser(null);
      setRejectionReason('');
      // Show success message
      alert('User rejected successfully!');
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('Failed to reject user. Please try again.');
    } finally {
      setActionLoading(null);
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
        return 'bg-gradient-to-r from-red-50 to-rose-100 text-red-700 border border-red-200/50';
      case 'manager':
        return 'bg-gradient-to-r from-purple-50 to-violet-100 text-purple-700 border border-purple-200/50';
      case 'technician':
        return 'bg-gradient-to-r from-blue-50 to-sky-100 text-blue-700 border border-blue-200/50';
      default:
        return 'bg-gradient-to-r from-slate-50 to-gray-100 text-slate-700 border border-slate-200/50';
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Responsive Header */}
        <div className="bg-[#232249] px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="p-2 sm:p-2.5 bg-white/10 rounded-xl flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Pending Approvals</h3>
                <p className="text-white/80 text-sm sm:text-base mt-1">
                  {pendingUsers.length} {pendingUsers.length === 1 ? 'user' : 'users'} awaiting review
                </p>
              </div>
            </div>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-lg">
              <span className="text-white text-sm sm:text-base font-medium">Today</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 md:p-8">{pendingUsers.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-emerald-100 rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <UserCheck className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-emerald-600" />
            </div>
            <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">All Set!</h4>
            <p className="text-gray-600 text-base sm:text-lg">No pending approvals at the moment.</p>
          </div>
        ) : (
          <>
            {/* Desktop/Tablet Table View - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <div className="col-span-4">User Information</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-3">Contact</div>
                  <div className="col-span-2">Registered</div>
                  <div className="col-span-1 text-center">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 bg-white">
                {pendingUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* User Info */}
                    <div className="col-span-4 flex items-center space-x-3">
                      <div className="h-11 w-11 bg-gradient-to-br from-[#232249] to-[#2a2a5e] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.department && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.department}</p>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 flex items-center">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="col-span-3 flex items-center">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate font-medium">{user.email}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">Primary Email</span>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(user._id)}
                        disabled={actionLoading === user._id}
                        className="p-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-all duration-200 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm hover:shadow-md"
                        title="Approve User"
                      >
                        {actionLoading === user._id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRejectModal(true);
                        }}
                        disabled={actionLoading === user._id}
                        className="p-2.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all duration-200 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm hover:shadow-md"
                        title="Reject User"
                      >
                        <XCircle className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tablet Card View - Hidden on Mobile and Desktop */}
            <div className="hidden sm:block md:hidden space-y-4">
              {pendingUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#232249] transition-all p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 bg-gradient-to-br from-[#232249] to-[#2a2a5e] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white font-bold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Registered</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {user.department && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{user.department}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading === user._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 min-h-[48px] shadow-sm"
                    >
                      {actionLoading === user._id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Approve</span>
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading === user._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 min-h-[48px] shadow-sm"
                    >
                      <XCircle className="h-5 w-5" />
                      <span>Reject</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile Card View - Shown only on Mobile */}
            <div className="sm:hidden space-y-4">
              {pendingUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* User Header */}
                  <div className="bg-gradient-to-r from-[#232249] to-[#2a2a5e] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-white font-bold text-base">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-white truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.department && (
                          <p className="text-sm text-white/80 truncate mt-0.5">{user.department}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="p-4 space-y-3 bg-gray-50">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Email Address</p>
                          <p className="text-sm font-medium text-gray-900 break-all">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2.5 pt-2.5 border-t border-gray-100">
                        <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-0.5">Registered Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(user.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Full Width Touch-Friendly Buttons */}
                  <div className="flex gap-3 p-4 bg-white border-t-2 border-gray-100">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading === user._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 rounded-xl font-bold text-base transition-colors disabled:opacity-50 shadow-sm"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {actionLoading === user._id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Approve</span>
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading === user._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-red-500 text-white hover:bg-red-600 active:bg-red-700 rounded-xl font-bold text-base transition-colors disabled:opacity-50 shadow-sm"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <XCircle className="h-5 w-5" />
                      <span>Reject</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fully Responsive Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => {
              setShowRejectModal(false);
              setSelectedUser(null);
              setRejectionReason('');
            }}
          >
            <motion.div
              initial={{ scale: 1, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md md:max-w-lg border-t sm:border border-gray-200 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 sm:px-6 py-4 sm:py-5 rounded-t-3xl sm:rounded-t-2xl sticky top-0 z-10 flex-shrink-0">
                {/* Mobile Swipe Indicator */}
                <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto mb-3 sm:hidden"></div>
                
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 sm:p-2.5 bg-white/20 rounded-xl flex-shrink-0">
                      <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Reject Application</h3>
                      <p className="text-white/90 text-sm sm:text-base mt-0.5">Provide a reason for rejection</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedUser(null);
                      setRejectionReason('');
                    }}
                    className="p-2 sm:p-2.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <X className="h-6 w-6 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                {/* User Info Card */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-[#232249] to-[#2a2a5e] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold text-base">
                        {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base sm:text-lg truncate">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason Input */}
                <div className="space-y-2">
                  <label className="block text-base sm:text-lg font-bold text-gray-700">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejecting this application..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder-gray-400 resize-none text-base"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  />
                  <p className="text-sm text-gray-500">This reason will be recorded in the system.</p>
                </div>

                {/* Warning Alert */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-bold text-amber-800">Important Notice</p>
                      <p className="text-sm text-amber-700 mt-1">
                        This action will prevent the user from accessing the system and cannot be easily reversed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions - Sticky */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-5 rounded-b-3xl sm:rounded-b-2xl flex flex-col sm:flex-row gap-3 border-t-2 border-gray-200 flex-shrink-0 sticky bottom-0">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white active:bg-gray-100 transition-colors font-bold min-h-[52px] flex items-center justify-center text-base"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-4 rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px] text-base shadow-md"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserX className="h-5 w-5" />
                      <span>Reject User</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default PendingUserApprovals;