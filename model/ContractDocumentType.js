const mongoose = require('mongoose')

const contractDocumentTypeSchema = new mongoose.Schema({
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
    collection: 'contract_document_type'
})

module.exports = mongoose.model('contract_document_type', contractDocumentTypeSchema)