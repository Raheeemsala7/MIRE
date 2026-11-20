const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/pagination');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { page, limit, skip } = getPaginationOptions(req.query);

      const filter = {
        $or: [
          { recipientRole: req.user.role },
          { recipientRole: null },
          { recipientUser: req.user._id }
        ]
      };

      if (req.query.isRead !== undefined) {
        filter.isRead = req.query.isRead === 'true';
      }
      if (req.query.type) {
        filter.type = req.query.type;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({
          $or: [
            { recipientRole: req.user.role },
            { recipientRole: null },
            { recipientUser: req.user._id }
          ],
          isRead: false
        })
      ]);

      return ApiResponse.paginated(res, {
        message: 'Notifications fetched successfully',
        data: notifications,
        page,
        limit,
        total,
        meta: { unreadCount }
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
