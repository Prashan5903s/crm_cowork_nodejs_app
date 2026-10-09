const mongoose = require('mongoose')

const parcelSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      maxlength: 255,
      required: true
    },
    floor_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'floors'
    },
    resident_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    courier_company_id: {
      type: String,
      enum: ['1', '2', '3', '4', '5', '6'],
      required: true
    },
    trackingNumber: {
      type: String,
      required: true,
      default: null
    },
    notes: {
      type: String,
      required: false,
      default: null
    },
    otp: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['1', '2', '3'],
      default: '1',
      index: true
    },
    gateStation: {
      type: String,
      default: 'Gate #1 Security Desk'
    },
    securityGuardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: null
    },
    deliveredAt: { type: Date, default: null }
  },
  { timestamps: true, collection: 'parcels' }
)

parcelSchema.virtual('parcel_log', {
  ref: 'parcel_log',
  localField: '_id',
  foreignField: 'parcelId',
  options: { sort: { createdAt: -1 }, limit: 1 }
})

parcelSchema.set('toObject', {
  virtuals: true
})
parcelSchema.set('toJSON', {
  virtuals: true
})

module.exports = mongoose.model('parcel', parcelSchema)
