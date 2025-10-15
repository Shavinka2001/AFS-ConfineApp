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
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'technician':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#232249] to-[#232249]/90 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Pending User Approvals</h3>
            <p className="text-white/80 text-sm">
              {pendingUsers.length} {pendingUsers.length === 1 ? 'user' : 'users'} awaiting approval
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <UserCheck className="h-12 w-12 text-emerald-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h4>
            <p className="text-gray-600 font-medium">No users are pending approval at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* User Avatar */}
                    <div className="h-12 w-12 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h4>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold border ${getRoleColor(user.role)} shadow-sm`}>
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Registered {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        {user.department && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{user.department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading === user._id}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center space-x-2 disabled:opacity-50"
                    >
                      {actionLoading === user._id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>Approve</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading === user._id}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center space-x-2 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedUser && (
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <UserX className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Reject User</h3>
                      <p className="text-white/80 text-sm">Provide a reason for rejection</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedUser(null);
                      setRejectionReason('');
                    }}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                  >
                    <X className="h-5 w-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-[#232249] to-[#232249]/80 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Reason for Rejection
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a clear reason for rejecting this user account..."
                      rows={4}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 placeholder-gray-400 resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500">This reason will be recorded and may be shared with the user.</p>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">Important</p>
                      <p className="text-xs text-amber-700">
                        Rejecting this user will prevent them from accessing the system. This action can be reversed by creating a new account for the user.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 p-6 rounded-b-2xl flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-all duration-300 font-semibold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                  <span>Reject User</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PendingUserApprovals;