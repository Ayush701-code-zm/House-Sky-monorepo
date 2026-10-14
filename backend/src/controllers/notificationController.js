const Notification = require('../models/Notification');

// Broadcast notifications (userId: null) carry lead contact details meant for
// the admin desk only — agents/owners/customers must only see their own.
const ADMIN_FEED_ROLES = ['ADMIN', 'DIRECTOR', 'MANAGER'];

function visibilityFilter(user) {
  if (user && ADMIN_FEED_ROLES.includes(user.role)) {
    return { $or: [{ userId: null }, { userId: user._id }] };
  }
  return { userId: user._id };
}


exports.getNotifications = async (req, res, next) => {
  try {
    const { category, status, limit = 100 } = req.query;

    const filter = visibilityFilter(req.user);

    if (typeof category === 'string' && category) filter.category = category;
    if (typeof status === 'string' && status) filter.status = status;

    const notifications = await Notification.find(filter)
      .populate('userId', 'fullName email')
      .sort({ sentAt: -1 })
      .limit(Math.min(500, Math.max(1, Number(limit) || 100)));

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /notifications/unread-count
 * Returns the count of unread notifications for badge display.
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      ...visibilityFilter(req.user),
      status: 'UNREAD'
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /notifications/:id/read
 * Mark a single notification as READ.
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[a-fA-F0-9]{24}$/.test(String(id))) return res.status(404).json({ message: 'Notification not found' });
    const notif = await Notification.findOne({ _id: id, ...visibilityFilter(req.user) });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    notif.status = 'READ';
    await notif.save();
    res.json(notif);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /notifications/mark-all-read
 * Mark ALL unread notifications for this admin as READ.
 */
exports.markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      {
        ...visibilityFilter(req.user),
        status: 'UNREAD'
      },
      { $set: { status: 'READ' } }
    );
    res.json({ message: 'All notifications marked as read', updatedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};
