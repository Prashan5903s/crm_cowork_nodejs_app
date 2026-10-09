const mongoose = require('mongoose')
const Counter = require('../model/Counter')

const billSchema = new mongoose.Schema({
    bill_data_type: {
        type: String,
        required: true // 1=Utility, 2=Common area, 3=Maintenance
    },
    apartment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "apartments",
        default: null
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    invoice_no: {
        type: String,
        maxLength: 255,
        unique: true
    },
    bill_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bill_type",
        default: null
    },
    doc_data: {
        type: String,
        maxLength: 255
    },
    bill_amount: {
        type: Number, // should be number not string
        required: false
    },
    bill_date: {
        type: Date
    },
    bill_due_date: {
        type: Date
    },
    month: {
        type: String,
        maxLength: 255
    },
    year: {
        type: Number // should be number
    },
    payment_due_date: { // ✅ FIXED naming
        type: Date
    },
    additional_cost: [
        {
            title: {
                type: String,
                maxLength: 255
            },
            amount: {
                type: Number
            }
        }
    ],
    status: {
        type: Boolean,
        default: false,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    }
})

billSchema.pre('save', async function (next) {

    if (this.invoice_no) return next(); // Already set

    // Get next sequence
    const counter = await Counter.findByIdAndUpdate(
        'receipt',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const seq = counter.seq;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const seqPadded = String(seq).padStart(6, '0');

    this.invoice_no = `INVC-${dateStr}-${seqPadded}`;
    next();
});

billSchema.virtual("payments", {
    ref: "Payment",
    localField: "_id",   // Bill._id
    foreignField: "bill_id" // Payment.bill_id
});

billSchema.set("toJSON", { virtuals: true });
billSchema.set("toObject", { virtuals: true });

billSchema.virtual("user_bills", {
    ref: "user_bill",          // model name
    localField: "_id",         // Bill._id
    foreignField: "bill_id"    // UserBill.bill_id
});

module.exports = mongoose.model('Bill', billSchema)
