const mongoose = require('mongoose')

const userPushNotifySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    notification_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    user_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    fcm_token: {
      type: String,
      maxLength: 25000,
      required: true
    },
    title: {
      type: String,
      maxLength: 255,
      required: true
    },
    screen: {
      type: String,
      maxLength: 2555,
      required: true
    },
    description: {
      type: String,
      maxLength: 50000,
      required: true
    },
    priority: {
      type: String,
      maxLength: 20,
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
      default: null,
      required: false
    },
    created_at: {
      type: Date,
      default: Date.now(),
      required: true
    },
    updated_at: {
      type: Date,
      default: null,
      required: false
    }
  },
  {
    collection: 'user_push_notify'
  }
)

module.exports = mongoose.model('user_push_notify', userPushNotifySchema)
