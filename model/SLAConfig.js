const mongoose = require('mongoose')

const slaConfigSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    sla_breach_days: {
      type: Number,
      required: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'users'
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
    collection: 'sla_config'
  }
)

module.exports = mongoose.model('sla_config', slaConfigSchema)
