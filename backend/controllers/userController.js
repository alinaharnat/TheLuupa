//controllers/userController.js
import User from '../models/user.js';

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

export { getUserProfile, updateUserProfile };
