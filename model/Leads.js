// Node.js (CommonJS) + Mongoose
const mongoose = require("mongoose")

const { Schema } = mongoose
const ref = to => ({ type: Schema.Types.ObjectId, ref: to })

// NOTE: every ref below must match the name you pass to mongoose.model(...)
// for that collection. "users" matches the contact model; change it if your
// user model is registered as "User".
const USER_MODEL = "users"

const LeadSchema = new Schema(
    {
        contact_id: {
            type: Schema.Types.ObjectId,
            ref: "contact",
            required: true,
            index: true
        },
        source_id: ref("lead_source"),
        status_id: ref("lead_status"),
        contact_method_id: ref("ContactMethod"),
        type_id: ref("LeadType"),
        priority_id: {
            type: String,
            required: false,
            default: null
        },
        purpose_id: ref("lead_purpose"),
        property_type_id: ref("property_type"),
        move_in_timeline_id: {
            type: String,
            required: false,
            default: null
        },
        department_id: ref("department"),
        assigned_to: { ...ref(USER_MODEL), index: true },
        agent_id: ref("Agent"),
        commission_type: { type: String, enum: ["percentage", "fixed"] },
        commission_value: Number,
        commission_amount: Number,

        average_monthly_consumption: Number,
        sanctioned_load: Number,

        is_converted: { type: Boolean, default: false, index: true },
        converted_at: Date,
        branch_id: ref("Branch"),
        created_by: ref(USER_MODEL)
    },
    {
        collection: "leads",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
)

LeadSchema.index({ status_id: 1, created_at: -1 })

module.exports = mongoose.model("leads", LeadSchema)