const mongoose = require('mongoose')

const slotSchema = new mongoose.Schema(
  {
    start_time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    end_time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    start_at: {
      type: Date,
      required: true
    },
    end_at: {
      type: Date,
      required: true
    }
  },
  { _id: false }
)

const amenityBookingSchema = new mongoose.Schema(
  {
    amenity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'amenity'
    },
    booked_for: {
      type: String,
      required: true,
      enum: ['self', 'tenant'],
      default: 'self'
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tenant',
      required: function () {
        return this.booked_for === 'tenant'
      },
      default: null
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    slots: {
      type: [slotSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one slot is required'
      }
    },
    booking_start_time: { type: Date, required: true },
    booking_end_time: { type: Date, required: true },
    no_of_person: { type: Number, default: 1, min: 1 },
    remarks: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    },
    cancelled_at: {
      type: Date,
      default: null
    },
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  {
    collection: 'amenity_booking_log',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
)

// Derive the overall range from the slots before validation
amenityBookingSchema.pre('validate', function (next) {
  if (this.slots && this.slots.length) {
    const starts = this.slots.map((s) => s.start_at.getTime())
    const ends = this.slots.map((s) => s.end_at.getTime())

    this.booking_start_time = new Date(Math.min(...starts))
    this.booking_end_time = new Date(Math.max(...ends))
  }

  next()
})

amenityBookingSchema.index({ amenity_id: 1, date: 1, status: 1 })
amenityBookingSchema.index({ tenant_id: 1, booking_start_time: -1 })
amenityBookingSchema.index({ created_by: 1, booking_start_time: -1 })

amenityBookingSchema.set('toObject', { virtuals: true })
amenityBookingSchema.set('toJSON', { virtuals: true })

amenityBookingSchema.virtual('bookingLog', {
  ref: 'booking_log',
  localField: '_id',
  foreignField: 'booking_id'
})

module.exports = mongoose.model('amenity_booking_log', amenityBookingSchema)