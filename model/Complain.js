const mongoose = require('mongoose')
const Counter = require('../model/Counter')

// Single source of truth for status codes (must match the front-end STATUS map)
const STATUS = {
  OPEN: 1,
  ASSIGNED: 2,
  RESOLVED: 3,
  IN_PROGRESS: 4,
  WAITING: 5,
  CLOSED: 6
}

// STATIC ticket types (must match TICKET_TYPES in the front-end)
const TICKET_TYPES = [{
    value: 'maintenance',
    label: 'Maintenance'
  },
  {
    value: 'housekeeping',
    label: 'Housekeeping'
  },
  {
    value: 'internet',
    label: 'Internet / Wi-Fi'
  },
  {
    value: 'electricity',
    label: 'Electricity'
  },
  {
    value: 'air_conditioning',
    label: 'Air Conditioning'
  },
  {
    value: 'security',
    label: 'Security'
  },
  {
    value: 'billing',
    label: 'Billing'
  },
  {
    value: 'other',
    label: 'Other'
  }
]

const TICKET_TYPE_VALUES = TICKET_TYPES.map(t => t.value)

// One entry per assignment / status change -> powers the "View" history dialog
const historySchema = new mongoose.Schema({
  complaint_status: {
    type: Number,
    required: true,
    enum: Object.values(STATUS)
  },
  remark: {
    type: String,
    maxlength: 5000,
    default: ''
  },
  assigned_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false
})

const complainSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  happy_code: {
    type: Number,
    required: true,
    min: 0,
    max: 999999
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
    maxlength: 5000
  },

  priority: {
    type: String,
    required: true,
    enum: ['1', '2', '3']
  },

  complain_status: {
    type: Number,
    enum: Object.values(STATUS),
    default: STATUS.OPEN,
    index: true
  },

  // STATIC ticket type: stored as a plain string (no TicketType collection)
  category: {
    type: String,
    required: true,
    enum: TICKET_TYPE_VALUES
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
      maxlength: 5000
    }
  },

  escalated_assigned_to: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    remark: {
      type: String,
      maxlength: 5000
    },
    escalate_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  },

  history: {
    type: [historySchema],
    default: []
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

complainSchema.index({
  company_id: 1,
  complain_status: 1,
  created_at: -1
})

complainSchema.statics.STATUS = STATUS
complainSchema.statics.TICKET_TYPES = TICKET_TYPES

// Auto-generate ticket number
complainSchema.pre('save', async function (next) {
  try {
    if (this.complain_no) return next()

    // Own counter ('complain') so complaints and receipts don't share a sequence.
    const counter = await Counter.findByIdAndUpdate(
      'complain', {
        $inc: {
          seq: 1
        }
      }, {
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