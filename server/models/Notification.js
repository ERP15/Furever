const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'order_confirmed',
        'order_processing',
        'order_shipped',
        'order_delivered',
        'order_canceled',
        'review_approved',
        'review_rejected',
        'admin_new_order',
        'admin_order_delivered',
        'admin_low_stock',
        'admin_out_of_stock',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
