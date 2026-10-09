const mongoose = require('mongoose')

const floorSchema = new mongoose.Schema({
    tower_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "towers"
    },
    floor_name: {
        type: String,
        maxLength: 255,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now(),
        required: true
    },
    updated_at: {
        type: Date,
        default: Date.now(),
        required: false
    }
})

module.exports = mongoose.model('floors', floorSchema)