const mongoose = require('mongoose')

const complainUserSchema = new mongoose.Schema({
  complain_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'complain'
  },

  escalate_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },

  complaint_status: {
    type: String,
    required: true
  },

  remark: {
    type: String,
    maxLength: 5000
  },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date
  }
})

module.exports = mongoose.model('complain_user', complainUserSchema)
