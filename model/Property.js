const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
    {
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        propertyType: {
            type: String,
            default: "",
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        refNo: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            default: "",
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "property_category",
            default: null,
        },
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "property_group",
            default: null,
        },
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "property_type",
            default: null,
        },

        size: {
            type: Number,
            default: 0,
        },
        pricingType: {
            type: String,
            enum: ["sale", "rent"],
            default: "rent",
        },
        salePrice: {
            type: String,
            default: "",
        },
        terms: [
            {
                name: {
                    type: String,
                    trim: true,
                    default: "",
                },
                price: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        tax: {
            type: String,
            default: "",
        },

        description: {
            type: String,
            default: "",
        },
        template: {
            type: String,
            default: "",
        },

        address: {
            type: String,
            default: "",
        },
        building: {
            type: String,
            default: "",
        },
        street: {
            type: String,
            default: "",
        },
        unit: {
            type: String,
            default: "",
        },
        floor: {
            type: String,
            default: "",
        },

        country: {
            type: String,
            default: "",
        },
        state: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            default: "",
        },
        govRef: {
            type: String,
            default: "",
        },
        lat: {
            type: String,
            default: "",
        },
        lng: {
            type: String,
            default: "",
        },

        owner: {
            type: String,
            default: "",
        },
        dial: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },

        // Uploaded property files
        files: {
            photos: {
                type: [
                    {
                        filename: { type: String, default: "" },
                        path: { type: String, default: "" },
                        mimetype: { type: String, default: "" },
                        size: { type: Number, default: 0 },
                    },
                ],
                default: [],
            },
            videos: {
                type: [
                    {
                        filename: { type: String, default: "" },
                        path: { type: String, default: "" },
                        mimetype: { type: String, default: "" },
                        size: { type: Number, default: 0 },
                    },
                ],
                default: [],
            },
            ownership: {
                type: [
                    {
                        filename: { type: String, default: "" },
                        path: { type: String, default: "" },
                        mimetype: { type: String, default: "" },
                        size: { type: Number, default: 0 },
                    },
                ],
                default: [],
            },
            other: {
                type: [
                    {
                        filename: { type: String, default: "" },
                        path: { type: String, default: "" },
                        mimetype: { type: String, default: "" },
                        size: { type: Number, default: 0 },
                    },
                ],
                default: [],
            },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("property", PropertySchema);