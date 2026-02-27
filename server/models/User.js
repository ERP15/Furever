const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, default: 'customer' },
    shippingAddress: { type: String, default: '' },
    preferredPets: { type: [String], default: [] },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.verificationCode;
    delete ret.verificationExpires;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
