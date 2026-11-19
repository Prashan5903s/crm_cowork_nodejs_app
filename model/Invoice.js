const mongoose = require("mongoose");

const { Schema } = mongoose;

/* ---------- Line item (LineItemDrawer) ---------- */
const lineItemSchema = new Schema(
    {
        category: { type: String, default: "Property Rent", trim: true },
        property: { type: String, default: "", trim: true },                // Property _id as string
        item: { type: String, default: "", trim: true },
        chartOfAccount: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0, default: 0 },
        taxRate: { type: Number, min: 0, default: 0 },                      // percent, e.g. 18

        taxAmount: { type: Number, min: 0, default: 0 },
        total: { type: Number, min: 0, default: 0 },
    },
    { _id: true }
);

/* ---------- Uploaded documents ---------- */
const fileSchema = new Schema(
    {
        name: { type: String, required: true },
        url: { type: String, required: true },
        mimeType: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

/* ---------- Payments ---------- */
const paymentSchema = new Schema(
    {
        amount: { type: Number, required: true, min: 0 },
        paidOn: { type: Date, default: Date.now },
        method: { type: String, enum: ["BANK", "UPI", "CASH", "CHEQUE", "OTHER"], default: "BANK" },
        transactionRef: String,
    },
    { _id: true }
);

/* ---------- Invoice ---------- */
const invoiceSchema = new Schema(
    {
        // Uniqueness is per user (see compound indexes below), not global.
        sequence: { type: Number, required: true },
        invoiceNumber: { type: String },
        ref: { type: String, index: true },

        billedTo: { type: Schema.Types.ObjectId, ref: "contact", required: true, index: true },
        billedToName: { type: String, required: true, trim: true },
        bankAccount: { type: Schema.Types.ObjectId, ref: "bankAccount" },
        upi: { type: String, trim: true },

        invoiceDate: { type: Date, required: true, default: Date.now },
        dueDate: { type: Date, required: true, index: true },
        reference: { type: String, trim: true },
        remarks: { type: String, trim: true },

        items: { type: [lineItemSchema], default: [] },
        totals: {
            sub: { type: Number, default: 0 },
            tax: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },

        // true = Active, false = Inactive
        status: { type: Boolean, default: true, index: true },

        payments: { type: [paymentSchema], default: [] },
        amountPaid: { type: Number, default: 0, min: 0 },

        files: { type: [fileSchema], default: [] },

        group: { type: String, index: true },
        type: { type: String },
        city: { type: String, index: true },
        tenant: { type: Schema.Types.ObjectId, ref: "tenant", index: true },

        contractSchedule: { type: Schema.Types.ObjectId, ref: "contractSchedule" },

        createdBy: { type: Schema.Types.ObjectId, ref: "user", index: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: "user" },
    },
    {
        collection: "invoice",
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/* Sequence / number are unique per user */
invoiceSchema.index({ createdBy: 1, sequence: 1 }, { unique: true });
invoiceSchema.index({ createdBy: 1, invoiceNumber: 1 }, { unique: true, sparse: true });
invoiceSchema.index({ billedToName: "text", ref: "text", invoiceNumber: "text" });

invoiceSchema.virtual("paidPercent").get(function () {
    const total = this.totals?.total || 0;
    return total ? Math.min(100, Math.round((this.amountPaid / total) * 100)) : 0;
});

/* Keep line + invoice totals consistent on every save */
invoiceSchema.pre("save", function (next) {
    let sub = 0;
    let tax = 0;

    this.items.forEach((it) => {
        it.taxAmount = +(((it.amount || 0) * (it.taxRate || 0)) / 100).toFixed(2);
        it.total = +((it.amount || 0) + it.taxAmount).toFixed(2);
        sub += it.amount || 0;
        tax += it.taxAmount;
    });

    this.totals = {
        sub: +sub.toFixed(2),
        tax: +tax.toFixed(2),
        total: +(sub + tax).toFixed(2),
    };

    this.amountPaid = this.payments.reduce((s, p) => s + p.amount, 0);

    if (!this.invoiceNumber) this.invoiceNumber = `INV-${this.sequence}`;
    if (!this.ref) this.ref = String(this.sequence);

    next();
});

module.exports = mongoose.model("invoice", invoiceSchema);