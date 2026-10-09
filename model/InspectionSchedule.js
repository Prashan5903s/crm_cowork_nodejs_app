const mongoose = require('mongoose')

const InspectionScheduleSchema = new mongoose.Schema(
  {
    asset_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'assets',
      required: true
    },
    inspection_template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'inspection_template',
      required: true
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users', // or "user"
      required: true
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    frequency: {
      type: String,
      enum: ['7', '1', '2', '3', '4', '5', '6'],
      default: 'One Time'
    },
    scheduled_date: {
      type: Date,
      required: true
    },
    due_date: {
      type: Date,
      required: true
    },
    completed_date: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Overdue', 'Cancelled'],
      default: 'Pending'
    },
    remarks: {
      type: String,
      default: ''
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'inspection_schedule'
  }
)

module.exports = mongoose.model('inspection_schedule', InspectionScheduleSchema)
