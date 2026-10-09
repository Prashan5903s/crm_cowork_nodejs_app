const mongoose = require('mongoose')

const AMCSchema = new mongoose.Schema(
  {
    asset_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'assets',
      required: true
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor'
    },
    contact_no: String,
    start_date: Date,
    end_date: Date,
    amount: Number,
    service_frequency: {
      type: String,
      enum: ['1', '2', '3', '4']
    },
    status: {
      type: String,
      enum: ['1', '2', '3'],
      default: '1'
    },
    documents: [String],
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
    collection: 'amc_log',
    timestamps: true
  }
)

module.exports = mongoose.model('amc_log', AMCSchema)
