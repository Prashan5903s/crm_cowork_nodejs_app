const mongoose = require('mongoose')

const vendorSchema = new mongoose.Schema(
  {
    company_Name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true
    },
    vendor_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor_category', // change to your actual category model name
      required: [true, 'Category is required']
    },
    gst_no: {
      type: String,
      required: [true, 'Tax / GST number is required'],
      trim: true,
      uppercase: true
    },
    contact_name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    },
    country_code: {
      type: String,
      trim: true,
      default: '+91'
    },
    // String, not Number: Number drops leading zeros and can lose precision
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    image: { type: String, default: '' },
    status: {
      type: Boolean,
      default: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: null
    }
  },
  {
    collection: 'vendor',
    timestamps: true
  }
)

vendorSchema.index({ company_Name: 1 })
vendorSchema.index({ vendor_category_id: 1 })

module.exports = mongoose.model('vendor', vendorSchema)