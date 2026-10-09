const mongoose = require('mongoose')

const amenitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 255
    },
    status: {
      type: Number,
      required: true,
      enum: ['1', '2']
    },
    is_booking_required: {
      type: Boolean,
      required: false,
      default: false
    },
    start_time: {
      type: String,
      maxlength: 10,
      required: false
    },
    end_time: {
      type: String,
      maxlength: 10,
      required: false
    },
    time_diffrence: {
      type: Number,
      required: true,
    },
    is_multiple_booking_allowed: {
      type: Boolean,
      required: true,
      default: false
    },
    no_of_person: {
      type: Number,
      required: false
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null
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
    collection: 'amenities'
  }
)

module.exports = mongoose.model('amenity', amenitySchema)
