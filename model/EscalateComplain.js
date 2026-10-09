const mongoose = require('mongoose')

const escalateComplainSchema = new mongoose.Schema(
  {
    complain_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'complain'
    },
    resident_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    escalation_status_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    escalation_reason_id: {
      type: String,
      maxlength: 1500,
      required: false
    },
    resident_remarks: {
      type: String,
      maxlength: 3200,
      required: false
    },
    resolution_remarks: {
      type: String,
      maxlength: 3200,
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
      required: true,
      default: Date.now()
    },
    updated_at: {
      type: Date,
      required: false,
      default: null
    }
  },
  {
    collection: 'escalate_complain_log'
  }
)

module.exports = mongoose.model('escalate_complain', escalateComplainSchema)
