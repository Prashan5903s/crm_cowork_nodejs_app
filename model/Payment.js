const mongoose = require("mongoose");
const Counter = require("../model/Counter");

const paymentSchema = new mongoose.Schema({
    receipt_no: {
        type: String,
        unique: true,
        index: true
    },
    contract_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contract", // must match the name used in mongoose.model("Contract", ...)
        required: true,
        index: true
    },
    total_payment_amount: {
        type: Number,
        required: true,
        min: [0.01, "Payment amount must be greater than zero"]
    },
    payment_date: {
        type: Date,
        required: true
    },
    payment_method: {
        type: String,
        enum: ["Cash", "Cheque", "Bank Transfer", "UPI", "Card"],
        required: true
    },
    ref_no: {
        type: String,
        trim: true,
        maxLength: 255
    },
    remark: {
        type: String,
        trim: true,
        maxLength: 5000
    },
    documents: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ["Unpaid", "Paid", "Partial Paid"],
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

paymentSchema.pre("save", async function () {
    if (this.receipt_no) return; // already set

    const counter = await Counter.findByIdAndUpdate(
        "receipt",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    this.receipt_no = `RCPT-${dateStr}-${String(counter.seq).padStart(6, "0")}`;
});

module.exports = mongoose.model("Payment", paymentSchema);