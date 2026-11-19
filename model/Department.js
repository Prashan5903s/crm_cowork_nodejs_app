const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        manager: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            ref: 'users', // Reference to 'users' collection
        },
        property_groups: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'property_group', // Reference to your property groups collection
            }
        ],
        budget: {
            type: Number,
            required: false,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        description: {
            type: String,
            required: false,
            trim: true,
        },
        company_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'users', // Reference to 'companies' collection
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'users', // Reference to 'users' collection
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

module.exports = mongoose.model('department', departmentSchema);