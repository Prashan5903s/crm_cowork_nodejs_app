const mongoose = require('mongoose')
const Counter = require('../model/Counter')

const complainSchema = new mongoose.Schema({
  happy_code: {
    type: Number,
    required: true,
    maxLength: 6
  },

  complain_no: {
    type: String,
    unique: true
  },

  nature: {
    type: Number,
    required: true
  },

  complain_type: {
    type: Number,
    required: true
  },

  complain_img: {
    type: String,
    required: false
  },

  description: {
    type: String,
    required: true,
    maxLength: 5000
  },

  priority: {
    type: String,
    required: true,
    eNum: ['1', '2', '3']
  },

  complain_status: {
    type: Number,
    default: 1
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'TicketType'
  },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },

  assigned_to: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    remark: {
      type: String,
      maxLength: 5000
    }
  },
  escalated_assigned_to: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    remark: {
      type: String,
      maxLength: 5000
    },
    escalate_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date
  }
})

complainSchema.pre('save', async function (next) {
  try {
    if (this.complain_no) return next()

    const counter = await Counter.findByIdAndUpdate(
      'receipt',
      {
        $inc: {
          seq: 1
        }
      },
      {
        new: true,
        upsert: true
      }
    )

    const seqPadded = String(counter.seq).padStart(2, '0')
    this.complain_no = `101${seqPadded}`

    next()
  } catch (err) {
    next(err)
  }
})

module.exports = mongoose.model('complain', complainSchema)
