const mongoose = require('mongoose')

const parkingSchema = new mongoose.Schema({
    apartment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "apartments"
    },
    parking_code: {
        type: Number,
        maxLength: 3,
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

module.exports = mongoose.model("parkings", parkingSchema)