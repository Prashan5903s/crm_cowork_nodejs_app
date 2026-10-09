const mongoose = require('mongoose')

const ParcelLogSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'parcel',
      required: true
    },
    action: {
      type: String,
      enum: ['1', '2', '3', '4'],
      required: true
    },
    performedBy: {
      type: String,
      default: 'Security Guard'
    }, // Guard name or ID
    details: { type: String }, // Extra info e.g., "Handed over successfully"
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'parcel_log'
  }
)

module.exports = mongoose.model('parcel_log', ParcelLogSchema)
