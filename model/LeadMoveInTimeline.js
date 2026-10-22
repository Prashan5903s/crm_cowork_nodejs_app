const mongoose = require('mongoose')

const leadMoveInTimelineSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 255,
        required: true
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
    collection: 'lead_move_in_timeline'
})

module.exports = mongoose.model('lead_move_in_timeline', leadMoveInTimelineSchema)