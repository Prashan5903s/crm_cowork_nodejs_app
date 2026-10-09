const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const userSchema = new Schema({
    company_id: {
        type: Schema.Types.Mixed,
        required: true,
        ref: "users",
        validate: {
            validator: v =>
                Types.ObjectId.isValid(v) || typeof v === "number",
            message: props =>
                `${props.value} is not a valid ObjectId or number`,
        },
    },

    first_name: {
        type: String,
        required: true,
        maxlength: 255,
    },
    last_name: {
        type: String,
        required: true,
        maxlength: 255,
    },
    user_type: {
        type: String,
        required: true,
        maxlength: 255,
        enum: ["admin", "company", "user"],
    },
    company_name: {
        type: String,
        maxlength: 255,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        maxlength: 255,
    },
    phone: String,
    fcm_token: {
        type: String,
        default: null,
        maxlength: 80000,
    },
    status: {
        type: Boolean,
        default: false,
    },
    address: {
        type: String,
        maxlength: 4000,
    },
    package_id: {
        type: Schema.Types.ObjectId,
        required: false,
    },
    pincode: {
        type: String,
        maxlength: 10,
    },
    dob: Date,
    country_id: {
        type: String,
        ref: "countries",
    },
    state_id: String,
    city_id: String,
    photo: String,

    gst_no: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 15,
        validate: {
            validator: value =>
                !value ||
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z1-9]Z[0-9A-Z]$/.test(value),
            message: "Invalid GST number format",
        },
    },
    pan_no: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 10,
        validate: {
            validator: value =>
                !value || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value),
            message: "Invalid PAN number format",
        },
    },
    website: {
        type: String,
        trim: true,
        maxlength: 255,
    },

    // Tax and GST fields: names match the frontend
    tax_registration_type: {
        type: String,
        enum: ["regular", "composition", "unregistered", "sez"],
        default: "unregistered",
    },
    gst_applicable: {
        type: Boolean,
        default: false,
    },
    tax_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },

    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    deleted_at: Date,
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    master_company_id: {
        type: Schema.Types.Mixed,
        ref: "users",
        required: true,
        validate: {
            validator: v =>
                Types.ObjectId.isValid(v) || typeof v === "number",
            message: props =>
                `${props.value} is not a valid ObjectId or number`,
        },
    },
    parent_company_id: {
        type: Schema.Types.Mixed,
        ref: "users",
        required: true,
        validate: {
            validator: v =>
                Types.ObjectId.isValid(v) || typeof v === "number",
            message: props =>
                `${props.value} is not a valid ObjectId or number`,
        },
    },
});

// Employee ID virtual
userSchema.virtual("emp_id").get(function () {
    const activeCode = (this.codes || []).find(
        code => code.type === "active"
    );

    return activeCode?.code || null;
});

// Roles virtual
userSchema.virtual("roles", {
    ref: "role_user",
    localField: "_id",
    foreignField: "user_id",
    justOne: false,
});

userSchema.set("toJSON", {
    virtuals: true,
    getters: true,
});

userSchema.set("toObject", {
    virtuals: true,
    getters: true,
});

module.exports = mongoose.model("users", userSchema);
