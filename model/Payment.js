const mongoose = require('mongoose')
const Counter = require('../model/Counter');

const paymentSchema = new mongoose.Schema({
    bill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill", // ✅ Relation with Bill model
        required: true
    },
    user_bill_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    receipt_no: {
        type: String,
        unique: true, // ✅ ensures no duplicate receipt numbers
    },
    amount: {
        type: Number, // ✅ Better as Number, not String
        required: true
    },
    bank_name: {
        type: String,
        maxLength: 255
    },
    status: {
        type: String,
        maxLength: 255,
        required: true
    },
    paid_remark: {
        type: String,
        maxLength: 5000
    },
    neft_no: String,
    neft_date: Date, // ✅ Date instead of string
    cheque_no: String,
    cheque_date: Date,
    demand_draft_no: String,
    demand_draft_date: Date,
    payment_mode: {
        type: String,
        mxLength: 10
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

paymentSchema.pre('save', async function (next) {
    if (this.receipt_no) return next(); // Already set

    // Get next sequence
    const counter = await Counter.findByIdAndUpdate(
        'receipt', {
            $inc: {
                seq: 1
            }
        }, {
            new: true,
            upsert: true
        }
    );

    const seq = counter.seq;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const seqPadded = String(seq).padStart(6, '0');

    this.receipt_no = `RCPT-${dateStr}-${seqPadded}`;
    next();
});


module.exports = mongoose.model('Payment', paymentSchema)