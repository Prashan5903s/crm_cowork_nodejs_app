const mongoose = require('mongoose')

const AssetHistorySchema = new mongoose.Schema(
  {
    asset_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'assets',
      required: true
    },
    eventType: {
      type: String,
      enum: [
        'Purchase',
        'Installation',
        'Inspection',
        'Repair',
        'Maintenance',
        'AMC',
        'Transfer',
        'Disposed'
      ]
    },
    eventDate: Date,
    description: String,
    cost: Number,
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor'
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    attachments: [String],
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
    collection: 'asset_history',
    timestamps: true
  }
)

module.exports = mongoose.model('asset_history', AssetHistorySchema)
