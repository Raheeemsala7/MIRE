const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const filter = {
        $or: [
          { recipientRole: req.user.role },
          { recipientRole: null },
          { recipientUser: req.user._id }
        ]
      };

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

      return ApiResponse.success(res, {
        message: 'Notifications fetched',
        data: { notifications, unreadCount }
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { $set: { isRead: true } });
      return ApiResponse.success(res, { message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const filter = {
        $or: [
          { recipientRole: req.user.role },
          { recipientRole: null },
          { recipientUser: req.user._id }
        ]
      };
      await Notification.updateMany(filter, { $set: { isRead: true } });
      return ApiResponse.success(res, { message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
