const mongoose = require("mongoose")

const {
    Schema
} = mongoose
const {
    ObjectId
} = Schema.Types

const followUpSchema = new Schema({
    lead_id: {
        type: ObjectId,
        ref: "lead",
        required: true,
        index: true
    },
    lead_status_id: {
        type: ObjectId,
        ref: "lead_status",
        default: null
    },

    follow_up_date: {
        type: Date,
        required: true
    },
    next_follow_up_date: {
        type: Date,
        default: null
    },

    follow_up_type: {
        type: String,
        enum: ["calls", "emails", "meetings", "whatsapp"],
        default: "calls",
    },
    status: {
        type: String,
        enum: ["in_progress", "completed", "missed"],
        default: "in_progress",
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
    },

    notes: {
        type: String,
        default: null,
        trim: true
    },
    reminder_before: {
        type: Number,
        default: null,
        min: 0
    }, // minutes

    created_by: {
        type: ObjectId,
        ref: "users",
        required: true
    },
    updated_by: {
        type: ObjectId,
        ref: "users",
        default: null
    },
}, {
    collection: "follow_up",
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    },
})

module.exports = mongoose.model("FollowUp", followUpSchema)