const mongoose = require('mongoose')

const reviewComplainSchema = new mongoose.Schema(
  {
    complain_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'complain'
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    rating: {
      type: Number,
      required: true,
      maxlength: 1
    },
    is_satisfied: {
      type: Boolean,
      required: true
    },
    feedback: {
      type: String,
      required: false,
      maxlength: 6000
    },
    is_open: {
      type: Boolean,
      required: false
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null
    },
    created_at: {
      type: Date,
      default: Date.now()
    },
    updated_at: {
      type: Date,
      required: false
    }
  },
  {
    collection: 'complain_feedback_log'
  }
)

module.exports = mongoose.model('review_complain', reviewComplainSchema)
