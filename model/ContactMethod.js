const mongoose = require('mongoose')

const conatactMethodSchema = new mongoose.Schema({
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
    collection: 'contact_method'
})

module.exports = mongoose.model('contact_method', conatactMethodSchema)