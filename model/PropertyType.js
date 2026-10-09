const mongoose = require('mongoose')

const apartmentTypeSchema = new mongoose.Schema({
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
})

module.exports = mongoose.model('apartment_type', apartmentTypeSchema)