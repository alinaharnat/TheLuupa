//controllers/adminController.js
import User from '../models/user.js';
import CarrierApplication from '../models/carrierApplication.js';
import { sendCarrierApplicationStatusEmail } from '../config/email.js';

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-emailVerificationToken -emailVerificationTokenExpires')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role && ['admin', 'carrier', 'passenger'].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Get all carrier applications
 * @route   GET /api/admin/carrier-applications
 * @access  Private/Admin
 */
const getCarrierApplications = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const applications = await CarrierApplication.find(filter)
      .populate('userId', 'name email userId')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get carrier applications error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Review carrier application (approve/reject)
 * @route   PUT /api/admin/carrier-applications/:id
 * @access  Private/Admin
 */
const reviewCarrierApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
    }

    const application = await CarrierApplication.findById(id).populate('userId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application has already been reviewed' });
    }

    // Update application
    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    await application.save();

    // If approved, update user role to carrier
    if (status === 'approved') {
      const user = await User.findById(application.userId._id);
      if (user) {
        user.role = 'carrier';
        user.companyName = application.companyName;
        user.phoneNumber = application.phoneNumber;
        user.licenseNumber = application.licenseNumber;
        await user.save();
      }
    }

    // Send email notification
    await sendCarrierApplicationStatusEmail(application.userId.email, {
      userName: application.userId.name,
      companyName: application.companyName,
      phoneNumber: application.phoneNumber,
      licenseNumber: application.licenseNumber,
      status: status
    });

    res.json({
      _id: application._id,
      status: application.status,
      reviewedAt: application.reviewedAt,
      message: `Application ${status} successfully`
    });
  } catch (error) {
    console.error('Review carrier application error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export { getUsers, updateUser, deleteUser, getCarrierApplications, reviewCarrierApplication };
