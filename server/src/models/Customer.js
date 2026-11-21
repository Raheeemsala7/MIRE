const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  building: { type: String },
  apartment: { type: String },
  city: { type: String, required: true },
  governorate: { type: String, required: true },
  postalCode: { type: String },
  country: { type: String, default: 'Egypt' },
  landmark: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  isDefault: { type: Boolean, default: false }
});

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Customer full name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true
    },
    secondaryPhone: {
      type: String,
      trim: true
    },
    addresses: [addressSchema],
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      default: ''
    },
    socialProfiles: {
      whatsapp: String,
      instagram: String,
      facebook: String
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({ phone: 1, email: 1 });
customerSchema.index({ fullName: 'text', phone: 'text', email: 'text' });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
