const mongoose = require('mongoose')

const InspectionTemplateSchema = new mongoose.Schema(
  {
    name: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'asset_category'
    },
    checklist: [
      {
        title: String,

        type: {
          type: String,
          enum: ['text', 'number', 'boolean', 'date']
        },

        required: Boolean
      }
    ],
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
    collection: 'inspection_template',
    timestamps: true
  }
)

module.exports = mongoose.model('inspection_template', InspectionTemplateSchema)
