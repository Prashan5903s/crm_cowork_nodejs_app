const mongoose = require('mongoose')

const {
  Schema
} = mongoose

const visitorSchema = new Schema({
  // Visitor registration
  visitor_name: {
    type: String,
    required: true,
    trim: true
  },
  visitor_contact_no: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  company: {
    type: String,
    default: '',
    trim: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  host_member: {
    type: Schema.Types.ObjectId,
    ref: 'contact',
    required: true
  },

  // Visit window ("YYYY-MM-DD" and "hh:mm A", exactly as the frontend sends them)
  check_in_date: {
    type: String,
    required: true
  },
  check_in_from_time: {
    type: String,
    required: true
  },
  check_in_to_time: {
    type: String,
    required: true
  },

  // ID proof (file name stored in /public/uploads/visitor)
  id_proof_type: {
    type: String,
    default: ''
  },
  id_proof: {
    type: String,
    default: ''
  },

  vehicle_no: {
    type: String,
    default: '',
    trim: true,
    uppercase: true
  },

  // Gate flow
  otp: {
    type: String,
    index: true
  },
  // '1' Invited, '2' Rejected, '3' Expired, '4' Accepted (checked in), '5' Exited
  // Must stay a String: the frontend compares with === '1'
  visitor_status: {
    type: String,
    enum: ['1', '2', '3', '4', '5'],
    default: '1'
  },
  status: {
    type: Boolean,
    default: false
  },
  gate_entry_time: {
    type: Date
  },
  gate_rejected_time: {
    type: Date
  },
  gate_exit_time: {
    type: Date
  },

  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

module.exports = mongoose.model('Visitor', visitorSchema)