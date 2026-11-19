const mongoose = require('mongoose')
const Counter = require('../model/Counter')

const UserBillSchema = new mongoose.Schema({
    bill_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Bill"
    },
    apartment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "apartments"
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users"
    },
    amount: {
        type: Number,
        required: false,
        default: 0,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        required: false,
    }
})

UserBillSchema.virtual("bill", {
    ref: "Bill",
    localField: "bill_id",
    foreignField: "_id",
    justOne: true
});

UserBillSchema.virtual("payments", {
    ref: "Payment",
    localField: "_id",
    foreignField: "user_bill_id"
});

UserBillSchema.set("toJSON", { virtuals: true });
UserBillSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("user_bill", UserBillSchema)