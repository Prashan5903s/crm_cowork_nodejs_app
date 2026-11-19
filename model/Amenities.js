const mongoose = require('mongoose')

const { Schema } = mongoose

/* Reusable sub-schema for uploaded images / documents */
const fileSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 255 },
    url: { type: String, required: true },
    mime_type: { type: String, required: false },
    size: { type: Number, required: false } // bytes
  },
  { _id: true }
)

const amenitySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "amenity_type"
    },
    status: {
      type: Boolean,
      required: true,
      default: true, // true = Active, false = Inactive
    },
    slot_time_period: {
      type: Number,
      required: true,
      min: 1
    },
    slot_time_unit: {
      type: String,
      required: true,
      enum: ['minutes', 'hours'],
      default: 'minutes'
    },
    start_time: {
      type: String, // "HH:mm" (24h), e.g. "09:00"
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    end_time: {
      type: String, // "HH:mm" (24h), e.g. "21:00"
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    available_days: {
      type: [String],
      required: true,
      enum: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Select at least one available day'
      }
    },
    occupancy_per_slot: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    internal_booking_access: {
      type: String,
      required: true,
      enum: ['all', 'property_groups'], // entire organisation | selected groups
      default: 'all'
    },
    property_groups: {
      type: [{ type: Schema.Types.ObjectId, ref: 'property_group' }],
      default: []
    },
    is_public_listing: {
      type: Boolean,
      required: true,
      default: false
    },
    has_tenant_monthly_quota: {
      type: Boolean,
      required: true,
      default: false
    },
    tenant_monthly_quota: {
      type: Number,
      required: false,
      min: 0,
      default: null
    },
    description: {
      type: String, // HTML from the rich-text editor (sanitize before saving/rendering)
      required: false,
      default: ''
    },
    linked_devices: {
      type: [{ type: String, }],
      default: []
    },
    images: { type: [fileSchema], default: [] },
    documents: { type: [fileSchema], default: [] },
    created_by: {
      type: Schema.Types.ObjectId,
      required: true
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null
    }
  },
  {
    collection: 'amenities',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
)

/* ---------- Cross-field validation ---------- */
amenitySchema.pre('validate', function (next) {
  if (this.start_time && this.end_time && this.start_time >= this.end_time) {
    this.invalidate('end_time', 'End time must be after start time')
  }
  if (
    this.internal_booking_access === 'property_groups' &&
    (!this.property_groups || this.property_groups.length === 0)
  ) {
    this.invalidate('property_groups', 'Select at least one property group')
  }
  if (this.has_tenant_monthly_quota && !(this.tenant_monthly_quota > 0)) {
    this.invalidate('tenant_monthly_quota', 'Enter the monthly quota per tenant')
  }
  next()
})

module.exports = mongoose.model('amenity', amenitySchema)