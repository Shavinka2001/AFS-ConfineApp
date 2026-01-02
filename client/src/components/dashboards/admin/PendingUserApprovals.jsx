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
  X,
  Eye,
  MoreVertical
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
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="animate-pulse">
            <div className="h-5 md:h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 md:h-16 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg md:shadow-xl border border-gray-100 overflow-hidden">
      {/* Responsive Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
            <div className="p-1.5 sm:p-2 md:p-2.5 bg-white/10 rounded-lg flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white truncate">Pending Approvals</h3>
              <p className="text-white/70 text-xs sm:text-xs md:text-sm truncate">
                {pendingUsers.length} {pendingUsers.length === 1 ? 'user' : 'users'} awaiting review
              </p>
            </div>
          </div>
          <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/10 rounded-lg self-start sm:self-auto">
            <span className="text-white text-xs sm:text-xs md:text-sm font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* Responsive Content */}
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        {pendingUsers.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-12 lg:py-16">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-emerald-100 rounded-lg sm:rounded-xl md:rounded-2xl mx-auto mb-3 sm:mb-4 md:mb-5 flex items-center justify-center">
              <UserCheck className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-emerald-600" />
            </div>
            <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-1.5 sm:mb-2">All Set!</h4>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base px-4">No pending approvals at the moment.</p>
          </div>
        ) : (
          <>
            {/* Desktop/Tablet Table - Hidden on Mobile */}
            <div className="hidden sm:block overflow-x-auto rounded-lg sm:rounded-xl border border-gray-200">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-xs md:text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[640px] sm:min-w-0">
                  <div className="col-span-4 sm:col-span-4">User</div>
                  <div className="col-span-2 sm:col-span-2">Role</div>
                  <div className="col-span-3 sm:col-span-3">Contact</div>
                  <div className="col-span-2 sm:col-span-2">Date</div>
                  <div className="col-span-1 sm:col-span-1 text-right">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 bg-white">
                {pendingUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="grid grid-cols-12 gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 md:py-4 hover:bg-gray-50 transition-colors duration-200 min-w-[640px] sm:min-w-0"
                  >
                    {/* User Info */}
                    <div className="col-span-4 flex items-center space-x-2 sm:space-x-3 min-w-0">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.department && (
                          <p className="text-xs text-gray-500 truncate hidden sm:block">{user.department}</p>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 flex items-center">
                      <span className={`inline-flex items-center space-x-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-semibold ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize hidden sm:inline">{user.role}</span>
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="col-span-3 flex items-center min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-900 truncate">{user.email}</p>
                        <div className="items-center space-x-1 mt-0.5 sm:mt-1 hidden sm:flex">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Email</span>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <div className="items-center space-x-1 mt-0.5 sm:mt-1 hidden sm:flex">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Registered</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1 sm:gap-1.5 md:gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(user._id)}
                        disabled={actionLoading === user._id}
                        className="p-1.5 sm:p-2 md:p-2.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md sm:rounded-lg transition-all duration-200 disabled:opacity-50 active:scale-95 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] md:min-h-[44px] md:min-w-[44px] flex items-center justify-center"
                        title="Approve"
                      >
                        {actionLoading === user._id ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
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
                        className="p-1.5 sm:p-2 md:p-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md sm:rounded-lg transition-all duration-200 disabled:opacity-50 active:scale-95 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] md:min-h-[44px] md:min-w-[44px] flex items-center justify-center"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 sm:p-2 md:p-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md sm:rounded-lg transition-all duration-200 active:scale-95 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] md:min-h-[44px] md:min-w-[44px] items-center justify-center hidden md:flex"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile Card View - Hidden on Tablet & Desktop */}
            <div className="sm:hidden space-y-2.5">
              {pendingUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm active:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* User Header with Gradient Background */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2.5 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div className="h-10 w-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.department && (
                            <p className="text-xs text-gray-600 truncate mt-0.5">{user.department}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-bold flex-shrink-0 ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="px-3 py-2.5 space-y-2 bg-white">
                    <div className="flex items-start space-x-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-900 break-all">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">
                        Registered {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Full Width Touch-Friendly Buttons */}
                  <div className="flex items-stretch gap-0 border-t border-gray-200">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading === user._id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200 font-semibold text-sm"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {actionLoading === user._id ? (
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
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
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3.5 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm md:max-w-md lg:max-w-lg border-t sm:border border-gray-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            >
              {/* Modal Header - Sticky on Mobile */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 rounded-t-2xl sm:rounded-t-2xl sticky top-0 z-10 flex-shrink-0">
                {/* Mobile Swipe Indicator */}
                <div className="w-12 h-1 bg-white/40 rounded-full mx-auto mb-3 sm:hidden"></div>
                
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                      <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-white truncate">Reject Application</h3>
                      <p className="text-white/80 text-xs sm:text-xs md:text-sm truncate">Provide a reason for rejection</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedUser(null);
                      setRejectionReason('');
                    }}
                    className="p-2 sm:p-2 hover:bg-white/20 active:bg-white/30 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <X className="h-5 w-5 sm:h-5 sm:w-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5 overflow-y-auto flex-1">
                {/* User Info Card */}
                <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-3 md:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-10 sm:w-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm sm:text-sm md:text-base truncate">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                      <p className="text-xs sm:text-xs md:text-sm text-gray-600 truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason Input */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm sm:text-sm md:text-base font-bold text-gray-700">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejecting this application..."
                    rows={4}
                    className="w-full px-3 sm:px-3 md:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder-gray-400 resize-none text-sm sm:text-sm md:text-base"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  />
                  <p className="text-xs sm:text-xs md:text-sm text-gray-500">This reason will be recorded in the system.</p>
                </div>

                {/* Warning Alert */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 sm:h-4 sm:w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-amber-800">Important Notice</p>
                      <p className="text-xs sm:text-xs text-amber-700 mt-0.5 sm:mt-1">
                        This action will prevent the user from accessing the system and cannot be easily reversed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions - Sticky on Mobile */}
              <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 rounded-b-2xl sm:rounded-b-2xl flex flex-col sm:flex-row gap-2 sm:gap-3 border-t border-gray-200 flex-shrink-0 sticky bottom-0">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-3 sm:py-3 md:py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white active:bg-gray-100 transition-colors duration-200 font-semibold min-h-[48px] sm:min-h-[48px] flex items-center justify-center text-sm sm:text-sm md:text-base"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-3 sm:py-3 md:py-3.5 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[48px] text-sm sm:text-sm md:text-base"
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