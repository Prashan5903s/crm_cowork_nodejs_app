const mongoose = require('mongoose')

const visitorSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  apartment_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'apartments'
  },
  visitor_name: {
    type: String,
    required: true,
    maxLength: 255
  },
  visitor_contact_no: {
    type: Number,
    minLength: 10,
    maxLength: 15,
    required: true
  },
  otp: {
    type: Number,
    unique: true,
    required: true,
    maxLength: 6,
    minLength: 6
  },
  check_in_date: {
    type: String,
    required: true
  },
  check_end_date: {
    type: String,
    required: false
  },
  check_in_from_time: {
    type: String,
    required: true
  },
  check_in_to_time: {
    type: String,
    required: true
  },
  no_person: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'visitor_type'
  },
  vehicle_no: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false,
    maxLength: 5000
  },
  status: {
    type: Boolean,
    default: false
  },
  is_frequent: {
    type: Boolean,
    required: false,
    default: false
  },
  visitor_status: {
    type: String,
    default: '1'
  },
  gate_entry_time: {
    type: Date,
    required: false,
    default: null
  },
  gate_rejected_time: {
    type: Date,
    required: false,
    default: null
  },
  gate_exit_time: {
    type: Date,
    required: false,
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  created_at: {
    type: Date,
    required: false,
    default: Date.now()
  },
  updated_at: {
    type: Date,
    required: false
  }
})

module.exports = mongoose.model('visitor', visitorSchema)
