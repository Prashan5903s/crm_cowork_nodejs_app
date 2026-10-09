const mongoose = require('mongoose')

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: String,
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
    collection: 'asset_category',
    timestamps: true
  }
)

module.exports = mongoose.model('asset_category', assetCategorySchema)
