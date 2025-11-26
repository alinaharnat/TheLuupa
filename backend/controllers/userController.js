//controllers/userController.js
import User from '../models/user.js';
import CarrierApplication from '../models/carrierApplication.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-emailVerificationToken -emailVerificationTokenExpires');

    if (user) {
      res.json({
        _id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        surname: user.surname,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        companyName: user.companyName,
        phoneNumber: user.phoneNumber,
        licenseNumber: user.licenseNumber,
        isEmailVerified: user.isEmailVerified,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update only the fields that are provided
      user.name = req.body.name || user.name;
      user.surname = req.body.surname !== undefined ? req.body.surname : user.surname;

      // Update date of birth if provided
      if (req.body.dateOfBirth) {
        user.dateOfBirth = req.body.dateOfBirth;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        userId: updatedUser.userId,
        email: updatedUser.email,
        name: updatedUser.name,
        surname: updatedUser.surname,
        dateOfBirth: updatedUser.dateOfBirth,
        role: updatedUser.role,
        companyName: updatedUser.companyName,
        phoneNumber: updatedUser.phoneNumber,
        licenseNumber: updatedUser.licenseNumber,
        isEmailVerified: updatedUser.isEmailVerified,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Submit carrier application
 * @route   POST /api/users/carrier-application
 * @access  Private
 */
const submitCarrierApplication = async (req, res) => {
  try {
    const { companyName, phoneNumber, licenseNumber } = req.body;

    // Validate required fields
    if (!companyName || !phoneNumber || !licenseNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a carrier
    if (user.role === 'carrier') {
      return res.status(400).json({ message: 'You are already a carrier' });
    }

    // Check if user already has a pending application
    const existingApplication = await CarrierApplication.findOne({
      userId: req.user._id,
      status: 'pending'
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending application' });
    }

    // Create new application
    const application = await CarrierApplication.create({
      userId: req.user._id,
      companyName,
      phoneNumber,
      licenseNumber,
      status: 'pending'
    });

    res.status(201).json({
      _id: application._id,
      companyName: application.companyName,
      phoneNumber: application.phoneNumber,
      licenseNumber: application.licenseNumber,
      status: application.status,
      createdAt: application.createdAt,
      message: 'Your application has been submitted and is pending review.'
    });
  } catch (error) {
    console.error('Submit carrier application error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Get my carrier application
 * @route   GET /api/users/carrier-application
 * @access  Private
 */
const getMyCarrierApplication = async (req, res) => {
  try {
    const application = await CarrierApplication.findOne({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    if (!application) {
      return res.status(404).json({ message: 'No application found' });
    }

    res.json({
      _id: application._id,
      companyName: application.companyName,
      phoneNumber: application.phoneNumber,
      licenseNumber: application.licenseNumber,
      status: application.status,
      adminComment: application.adminComment,
      createdAt: application.createdAt,
      reviewedAt: application.reviewedAt
    });
  } catch (error) {
    console.error('Get carrier application error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export { getUserProfile, updateUserProfile, submitCarrierApplication, getMyCarrierApplication };
