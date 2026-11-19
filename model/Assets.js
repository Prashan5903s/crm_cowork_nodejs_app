const mongoose = require('mongoose')

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true
    },
    asset_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'asset_category',
      required: [true, 'Category is required'],
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    serial_number: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    status: {
      type: String,
      required: true,
      default: true
    },
    brand: String,
    model: String,
    condition: {
      type: String,
      enum: ['1', '2', '3', '4'],
      default: '1'
    },
    purchase_cost: {
      type: Number,
      min: 0,
      default: 0
    },
    purchase_date: {
      type: String,
      required: false,
      default: null
    },
    depreciationValue: Number,
    location: {
      type: String,
      trim: true
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'asset_location'
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor'
    },
    warranty_start: Date,
    warranty_end: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || !this.warranty_start || v >= this.warranty_start
        },
        message: 'Warranty end must be after warranty start'
      }
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    attachments: [
      {
        file_name: String,
        file_url: String,
        mimetype: String,
        size: Number
      }
    ],
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
    collection: 'assets',
    timestamps: true
  }
)

module.exports = mongoose.model('assets', assetSchema)