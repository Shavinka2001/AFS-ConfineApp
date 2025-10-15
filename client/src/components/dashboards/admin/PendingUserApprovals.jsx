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
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Pending Approvals</h3>
              <p className="text-white/70 text-sm">
                {pendingUsers.length} {pendingUsers.length === 1 ? 'user' : 'users'} awaiting review
              </p>
            </div>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded-lg">
            <span className="text-white text-sm font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <UserCheck className="h-10 w-10 text-emerald-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">All Set!</h4>
            <p className="text-gray-600">No pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1">Actions</div>
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
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  {/* User Info */}
                  <div className="col-span-4 flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-sm">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      {user.department && (
                        <p className="text-xs text-gray-500 truncate">{user.department}</p>
                      )}
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="col-span-3 flex items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate">{user.email}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Email</span>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Registered</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading === user._id}
                      className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Approve"
                    >
                      {actionLoading === user._id ? (
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4" />
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
                      className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compact Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200"
            >
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <UserX className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Reject Application</h3>
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
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-4 w-4 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Compact Content */}
              <div className="p-6 space-y-4">
                {/* User Info */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejecting this application..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 placeholder-gray-400 resize-none text-sm"
                  />
                  <p className="text-xs text-gray-500">This reason will be recorded in the system.</p>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important</p>
                      <p className="text-xs text-amber-700 mt-1">
                        This action will prevent the user from accessing the system and cannot be easily reversed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Actions */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors duration-200 font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                  <span>Reject</span>
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