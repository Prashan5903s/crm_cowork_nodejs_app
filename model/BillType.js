const mongoose = require('mongoose')

const billTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 255
    },
    bill_type_category: {
        type: String,
        maxLength: 1,
    }, // 1 for utility bill type, 2 for comman area bill type
    status: {
        type: Boolean,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model("bill_type", billTypeSchema)