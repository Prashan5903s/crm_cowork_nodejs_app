const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const scheduleUserSchema = new Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    schedule_type: {
        type: Number,
        required: true
    },
    schedule_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "companies"
    },
    schedule_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "program_schedules"
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId, // ID of designation/department/group/region/user
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: null
    }
}, { collection: "schedule_users" });


module.exports = mongoose.model('schedule_user', scheduleUserSchema);
