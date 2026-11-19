const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    event_name: {
        type: String,
        required: true,
        maxLength: 255
    },
    venue: {
        type: String,
        required: true,
        maxLength: 1000
    },
    image_url: {
        type: String,
        required: false,
        maxLength: 255
    },
    description: {
        type: String,
        required: true,
        maxLength: 5000
    },
    role_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "roles"
    }],
    user_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }],
    start_on_date: {
        type: String,
        required: true,
        maxLength: 255
    },
    start_on_time: {
        type: String,
        required: true,
        maxLength: 255
    },
    end_on_date: {
        type: String,
        required: true,
        maxLength: 255
    },
    end_on_time: {
        type: String,
        required: true,
        maxLength: 255
    },
    status: {
        type: String,
        maxLength: 1,
        required: true
    }, // 1 for pending, 2 for Completed, 3 for Cancelled 
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        default: null
    }
})

module.exports = mongoose.model('event', eventSchema)