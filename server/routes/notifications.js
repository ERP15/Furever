const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

// GET unread count for a user
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.params.userId,
      read: false,
    });
    return res.status(200).json({ count });
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ message: 'Failed to fetch unread count.' });
  }
});

// PUT mark a single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    return res.status(200).json(notification);
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
});

// PUT mark all notifications as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.params.userId, read: false },
      { read: true }
    );
    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ message: 'Failed to mark all as read.' });
  }
});

module.exports = router;
