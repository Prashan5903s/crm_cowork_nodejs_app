// Node.js (CommonJS) + Mongoose. Collections: contacts, leads
const mongoose = require('mongoose')

const { Schema } = mongoose
const ref = to => ({ type: Schema.Types.ObjectId, ref: to })

const LeadSchema = new Schema(
    {
        contact_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        source_id: ref('lead_source'),
        status_id: ref('lead_status'),
        contact_method_id: ref('ContactMethod'),
        type_id: ref('LeadType'),
        priority_id: ref('LeadPriority'),
        purpose_id: ref('LeadPurpose'),
        property_type_id: ref('PropertyType'),
        move_in_timeline_id: ref('MoveInTimeline'),
        department_id: ref('Department'),
        assigned_to: { ...ref('User'), index: true },
        agent_id: ref('Agent'),
        commission_type: { type: String, enum: ['percentage', 'fixed'] },
        commission_value: Number,
        commission_amount: Number,

        average_monthly_consumption: Number,
        sanctioned_load: Number,

        is_converted: { type: Boolean, default: false, index: true },
        converted_at: Date,
        branch_id: ref('Branch'),
        created_by: ref('User')
    },
    {
        collection: "leads",
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
)

LeadSchema.index({ status_id: 1, created_at: -1 })

module.exports = mongoose.model("leads", LeadSchema)