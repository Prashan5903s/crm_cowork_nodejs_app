const mongoose = require('mongoose')

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxLength: 255
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

module.exports = mongoose.model('notice', noticeSchema)