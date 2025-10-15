import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { logActivity } from './activityController.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Only admin can create admin/manager accounts
    if ((role === 'admin' || role === 'manager') && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create admin or manager accounts'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
      department,
      createdBy: req.user?._id,
      // Set approval status based on role and context
      // Admin accounts are always auto-approved
      // Regular users need approval unless created by admin
      approvalStatus: role === 'admin' || req.user?.role === 'admin' ? 'approved' : 'pending',
      approvedBy: (role === 'admin' || req.user?.role === 'admin') ? req.user?._id || 'system' : undefined,
      approvedAt: (role === 'admin' || req.user?.role === 'admin') ? new Date() : undefined
    });

    // Log registration activity
    const mockReq = {
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      ip: req.ip,
      get: req.get.bind(req)
    };
    
    await logActivity(
      mockReq,
      'USER_REGISTER',
      `New user registered: ${firstName} ${lastName} (${email}) - Status: ${user.approvalStatus}`,
      { userId: user._id, role: user.role, approvalStatus: user.approvalStatus },
      'medium',
      'success'
    );

    // Handle response based on approval status
    if (user.approvalStatus === 'pending') {
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Your account is pending approval from an administrator.',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            isActive: user.isActive,
            approvalStatus: user.approvalStatus
          },
          requiresApproval: true
        }
      });
    }

    const token = generateToken(user._id, user.role, {
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'user'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          approvalStatus: user.approvalStatus
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check if user is approved
    if (user.approvalStatus === 'pending') {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending approval from an administrator. Please wait for approval before trying to login.',
        code: 'PENDING_APPROVAL'
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been rejected. Please contact an administrator for more information.',
        code: 'ACCOUNT_REJECTED'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Log failed login attempt
      const mockReq = {
        user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        ip: req.ip,
        get: req.get.bind(req)
      };
      
      await logActivity(
        mockReq,
        'FAILED_LOGIN',
        `Failed login attempt for ${email}`,
        { userId: user._id, email },
        'high',
        'warning'
      );

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    const mockReq = {
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      ip: req.ip,
      get: req.get.bind(req)
    };
    
    await logActivity(
      mockReq,
      'USER_LOGIN',
      `User logged in: ${user.firstName} ${user.lastName}`,
      { userId: user._id, role: user.role },
      'low',
      'success'
    );

    const token = generateToken(user._id, user.role, {
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'user'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
          approvalStatus: user.approvalStatus,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      department, 
      phone, 
      address, 
      dateOfBirth, 
      emergencyContact, 
      specializations, 
      certifications,
      email
    } = req.body;
    
    // Create update object with only provided fields
    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (email !== undefined) updateData.email = email;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle unique constraint errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Update user's last activity
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        lastActivity: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, we still want to confirm logout
    res.json({
      success: true,
      message: 'Logout completed'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    // Token is already verified by the protect middleware
    // Just return the user data
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        role: req.user.role,
        department: req.user.department,
        isActive: req.user.isActive
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
};
