const mongoose = require('mongoose')

const bookingLogSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'amenity_booking_log',
      required: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now(),
      required: true
    },
    updated_at: {
      type: Date,
      default: Date.now(),
      required: false
    }
  },
  {
    collection: 'booking_log'
  }
)

module.exports = mongoose.model('booking_log', bookingLogSchema)
