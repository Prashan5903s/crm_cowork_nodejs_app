const mongoose = require("mongoose");

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// One line of the details table (rent / deposit / other / amenity)
const detailSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ["Property Rent", "Deposit", "Other", "Amenity"], default: "Property Rent" },
    description: { type: String, required: true, trim: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    rentalValue: { type: Number, default: 0, min: 0 },
    payments: { type: Number, default: 1, min: 1 },
    discountPct: { type: Number, default: null, min: 0, max: 100 },
    discountValue: { type: Number, default: 0, min: 0 },
    tax: { type: String, enum: ["none", "gst5", "gst12", "gst18"], default: "none" },
    amenityId: { type: ObjectId, ref: "amenity", default: null, set: (v) => v || null },
    freeSlots: { type: Number, default: 0, min: 0 },
    extraSlotPrice: { type: Number, default: 0, min: 0 },
    monthlyFee: { type: Number, default: 0, min: 0 },
}, { _id: false });

const documentSchema = new Schema({
    id: { type: String, required: true },    // `${Date.now()}-${index}`
    type: { type: ObjectId, ref: "contractDocumentType", required: true },
    name: { type: String, required: true },
    size: { type: Number, default: 0 },
    url: { type: String },                   // set after you store the file
}, { _id: false });

const contractSchema = new Schema({
    id: { type: Number, unique: true, index: true },
    kind: { type: String, default: "org-tenant", trim: true },
    status: { type: String, enum: ["Draft", "Approved",], default: "Draft", index: true },
    tenant: { type: ObjectId, ref: "contact" },
    properties: [{ type: ObjectId, ref: "property" }],
    amenities: [{
        _id: false,
        amenity: { type: ObjectId, ref: "amenity", required: true },
        freeSlots: { type: Number, default: 0, min: 0 },
        monthlyFee: { type: Number, default: 0, min: 0 },
    }],

    details: { type: [detailSchema], default: [] },
    documents: { type: [documentSchema], default: [] },

    value: { type: Number, default: 0 },
    start: { type: String },
    end: { type: String },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: false,
        default: null
    }
}, {
    collection: "contract",
    timestamps: true,
});

contractSchema.pre("validate", async function () {
    if (this.isNew && this.id == null) {
        const last = await this.constructor.findOne().sort({ id: -1 }).select("id").lean();
        this.id = (last?.id || 0) + 1;
    }
});

contractSchema.virtual('payment', {
    ref: 'Payment',
    localField: '_id',
    foreignField: 'contract_id',
    justOne: false,
});

contractSchema.set('toObject', { virtuals: true });
contractSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("contract", contractSchema);