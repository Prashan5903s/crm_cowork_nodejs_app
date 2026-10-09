const mongoose = require('mongoose')

const userSendMail = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  email: [
    {
      type: String,
      maxLength: 1255,
      required: true
    }
  ],
  mail_subject: {
    type: String,
    maxLength: 1255,
    required: true
  },
  mail_body: {
    type: String,
    maxLength: 50000,
    required: true
  },
  sent_at: {
    type: Date,
    default: Date.now(),
    required: true
  }
},{
    collection: 'user_send_mail',
})

module.exports = mongoose.model('user_send_mail', userSendMail)
