const mongoose = require('mongoose')

const leadStatusSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 255,
        required: true
    },
    color: {
        type: String,
        mexLength: 20,
        required: true,
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
}, {
    collection: 'lead_status'
})

module.exports = mongoose.model('lead_status', leadStatusSchema)