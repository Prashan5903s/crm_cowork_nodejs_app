const mongoose = require('mongoose')

const assetSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'vendor'
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'asset_location'
    },
    asset_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'asset_category',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: String,
    model: String,
    serial_number: {
      type: String,
      unique: true,
      sparse: true
    },
    purchase_date: Date,
    purchase_cost: Number,
    warranty_start: Date,
    warranty_end: Date,
    status: {
      type: String,
      enum: ['1', '2', '3', '4'],
      default: '1'
    },
    condition: {
      type: String,
      enum: ['1', '2', '3', '4'],
      default: '1'
    },
    depreciationValue: Number,
    description: String,
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
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
    collection: 'assets',
    timestamps: true
  }
)

module.exports = mongoose.model('assets', assetSchema)
