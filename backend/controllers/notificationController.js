import Notification from "../models/notification.js";
import Booking from "../models/booking.js";
import Schedule from "../models/schedule.js";

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate({
        path: "bookingId",
        select: "status",
      })
      .populate({
        path: "scheduleId",
        populate: [
          { path: "routeId", populate: { path: "cityId", select: "name" } },
          { path: "busId", select: "busName numberPlate" },
        ],
      })
      .sort({ createdAt: -1 });

    // Use stored scheduleDetails if schedule is deleted (scheduleId is null or doesn't exist)
    const notificationsWithDetails = notifications.map(notification => {
      if (!notification.scheduleId || !notification.scheduleId.routeId) {
        // Schedule was deleted, use stored details
        return {
          ...notification.toObject(),
          scheduleId: notification.scheduleId || null,
          scheduleDetails: notification.scheduleDetails || null,
        };
      }
      return notification;
    });

    res.json(notificationsWithDetails);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

export { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount };

