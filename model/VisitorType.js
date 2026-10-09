const mongoose = require('mongoose')

const visitorTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 255,
        required: true
    },
    icon: {
        type: String,
        maxLength: 25,
        default: null,
        required: false
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
        required: false,
    }
})

module.exports = mongoose.model('visitor_type', visitorTypeSchema)