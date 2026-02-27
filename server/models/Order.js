const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, default: '' },
  price: { type: Number, default: 0 },
  image: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    orderItems: [orderItemSchema],
    shippingAddress1: { type: String, default: '' },
    shippingAddress2: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'],
      default: 'Pending',
    },
    totalPrice: { type: Number, default: 0 },
    paymentMethod: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dateOrdered: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

orderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
