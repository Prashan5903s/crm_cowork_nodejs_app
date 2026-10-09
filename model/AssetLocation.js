const mongoose = require('mongoose')

const assetLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: 255,
      required: true
    },
    description: {
      type: String,
      maxlength: 5255,
      required: true
    },
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
    collection: 'asset_location',
    timestamps: true
  }
)

module.exports = mongoose.model('asset_location', assetLocationSchema)
