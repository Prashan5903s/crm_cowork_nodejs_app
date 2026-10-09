const mongoose = require('mongoose')

const vendorSchema = new mongoose.Schema(
  {
    company_Name: {
      type: String,
      required: true
    },
    phone: {
      type: Number,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    gst_no: {
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      default: false,
      required: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: false,
      default: null
    }
  },
  {
    collection: 'vendor',
    timestamps: true
  }
)

module.exports = mongoose.model('vendor', vendorSchema)
