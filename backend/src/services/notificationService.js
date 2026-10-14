const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send a notification to a single specific user.
 */
async function sendNotification({ userId, title, message, channel = 'IN_APP', category = 'SYSTEM', meta = {} }) {
  const notif = await Notification.create({
    userId: userId || null,
    title,
    message,
    channel,
    category,
    meta,
    status: 'UNREAD',
    sentAt: new Date()
  });

  if (channel === 'WHATSAPP') {
    console.log(`[WHATSAPP] To ${userId}: ${title} - ${message}`);
  } else if (channel === 'EMAIL') {
    console.log(`[EMAIL] To ${userId}: ${title} - ${message}`);
  }

  return notif;
}

/**
 * Create a system-wide admin notification (no specific userId).
 * These appear in every admin's notification feed.
 * Used for: new bulk deal requests, property submissions, inquiries, agent signups.
 */
async function notifyAdmins({ title, message, category = 'SYSTEM', meta = {} }) {
  try {
    const notif = await Notification.create({
      userId: null,          // null = broadcast to all admins
      title,
      message,
      category,
      channel: 'IN_APP',
      meta,
      status: 'UNREAD',
      sentAt: new Date()
    });
    return notif;
  } catch (err) {
    // Non-blocking — never crash the main request because of a notification failure
    console.error('[NotificationService] notifyAdmins failed:', err.message);
    return null;
  }
}

module.exports = {
  sendNotification,
  notifyAdmins
};
