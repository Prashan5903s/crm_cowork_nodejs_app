const mongoose = require("mongoose")

const phoneSchema = new mongoose.Schema({
    country_code: { type: String, default: "+91" },
    number: { type: String, trim: true }
}, { _id: false })

const kycSchema = new mongoose.Schema({
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lead_document_type"
    },
    number: { type: String, trim: true },
    file: { type: String }
}, { _id: true })

const contactSchema = new mongoose.Schema({
    contact_type: {
        type: String,
        enum: ["INDIVIDUAL", "COMPANY"],
        default: "INDIVIDUAL",
        required: true
    },
    contact_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact_category",
        default: null
    },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    reference_number: { type: String, trim: true },
    full_name: { type: String, required: true, trim: true },
    nationality: { type: String, trim: true },
    photo: { type: String }, // stored file path / URL
    emails: [{ type: String, trim: true, lowercase: true }],
    phones: [phoneSchema],
    kyc_documents: [kycSchema],
    mailing_address: { type: String, trim: true },
    website: { type: String, trim: true },
    emergency_contact_name: { type: String, trim: true },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: false
    }
}, {
    collection: "contact",
    timestamps: true
})

// Quick Contact Search (name / email / phone)
contactSchema.index({ full_name: "text" })
contactSchema.index({ emails: 1 })
contactSchema.index({ "phones.number": 1 })

module.exports = mongoose.model("contact", contactSchema)