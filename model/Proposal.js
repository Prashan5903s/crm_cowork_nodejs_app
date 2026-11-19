const mongoose = require("mongoose")

/* ---------- atomic counter (one doc per sequence) ---------- */
const counterSchema = new mongoose.Schema({
    _id: String,
    seq: {
        type: Number,
        default: 0
    }
})

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema)

async function nextSeq(name, Model, field) {
    const inc = () => Counter.findOneAndUpdate({
        _id: name
    }, {
        $inc: {
            seq: 1
        }
    }, {
        new: true
    })

    let c = await inc()

    if (!c) {
        // first use: start after the highest number already in the collection
        const last = await Model.findOne().sort({
            [field]: -1
        }).select(field).lean()

        try {
            await Counter.create({
                _id: name,
                seq: Number(last?. [field]) || 0
            })
        } catch (e) {
            if (e.code !== 11000) throw e // another request seeded it first - fine
        }

        c = await inc()
    }

    return c.seq
}

/* ---------- proposal ---------- */
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100

const proposalSchema = new mongoose.Schema({
    proposal_no: {
        type: Number,
        unique: true,
        index: true
    },

    lead_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead"
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
        required: true
    },
    property_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true
    },

    seats: {
        type: Number,
        required: true,
        min: 1
    },
    contract_period: {
        type: Number,
        required: true,
        min: 1
    },
    start_date: {
        type: Date,
        required: true
    },
    expiry_date: {
        type: Date,
        required: true
    },

    monthly_rent: {
        type: Number,
        required: true,
        min: 0
    },
    setup_fee: {
        type: Number,
        default: 0,
        min: 0
    },
    security_deposit: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    tax_percent: {
        type: Number,
        default: 18,
        min: 0,
        max: 100
    },

    additional_services: [{
        _id: false,
        name: {
            type: String,
            required: true,
            trim: true
        },
        amount: {
            type: Number,
            default: 0,
            min: 0
        }
    }],

    // computed in pre-validate
    subtotal: {
        type: Number,
        default: 0
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        default: 0
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    notes: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: ["Draft", "Sent", "Accepted", "Rejected", "Expired"],
        default: "Draft"
    },
    sent_at: {
        type: Date
    },

    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, {
    collection: "proposal",
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
})

proposalSchema.pre("validate", async function (next) {
    try {
        // same formula as the dialog's live summary
        const rent = this.monthly_rent * this.contract_period
        const services = (this.additional_services || []).reduce((s, i) => s + (i.amount || 0), 0)
        const subtotal = rent + (this.setup_fee || 0) + services
        const discount = Math.min(this.discount || 0, subtotal)
        const taxable = subtotal - discount
        const tax = (taxable * (this.tax_percent ?? 18)) / 100

        this.subtotal = round2(subtotal)
        this.tax_amount = round2(tax)
        this.total_amount = round2(taxable + tax + (this.security_deposit || 0))

        if (this.isNew && !this.proposal_no) {
            this.proposal_no = await nextSeq("proposal_no", this.constructor, "proposal_no")
        }

        next()
    } catch (err) {
        next(err)
    }
})

module.exports = mongoose.models.Proposal || mongoose.model("Proposal", proposalSchema)