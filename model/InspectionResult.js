const mongoose = require('mongoose')

const InspectionSchema = new mongoose.Schema(
  {
    asset_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'assets'
    },
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'inspection_template'
    },
    inspection_schedule_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'inspection_schedule',
      required: true
    },
    inspected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    inspection_date: Date,
    overall_Status: {
      type: String,
      enum: ['Pass', 'Fail', 'Needs Repair']
    },
    responses: [
      {
        question: String,
        answer: mongoose.Schema.Types.Mixed
      }
    ],
    remarks: String,
    images: [String],
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
    collection: 'inspection_result',
    timestamps: true
  }
)

module.exports = mongoose.model('inspection_result', InspectionSchema)
