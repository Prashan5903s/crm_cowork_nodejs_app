const mongoose = require('mongoose')

const amenityBookingSchema = new mongoose.Schema(
  {
    amenity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'amenity'
    },
    booking_type: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5]
    },
    booking_start_time: {
      type: Date,
      required: false
    },
    booking_end_time: {
      type: Date,
      required: false
    },
    custom_time: [
      {
        type: String,
        required: false
      }
    ],
    no_of_person: {
      type: Number,
      required: false
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
    collection: 'amenity_booking_log'
  }
)

amenityBookingSchema.set('toObject', {
  virtuals: true
})
amenityBookingSchema.set('toJSON', {
  virtuals: true
})

amenityBookingSchema.virtual('bookingLog', {
  ref: 'booking_log',
  localField: '_id',
  foreignField: 'booking_id'
})

module.exports = mongoose.model('amenity_booking_log', amenityBookingSchema)
