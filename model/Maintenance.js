const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
    cost_type: {
        type: String,
        required: true // "1" for fixed value, "2" for unit type
    },
    fixed_data: [{
        apartment_type: {
            type: String,
            required: false
        },
        unit_value: {
            type: String,
            required: false
        }
    }],
    unit_type: {
        unit_name: {
            type: String,
            required: false
        },
        unit_value: {
            type: Number,
            required: false
        }
    },
    status: {
        type: Boolean,
        default: false
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        required: false, // created_at is optional
        default: Date.now(), // Set the default to the current date/time
    },
    updated_at: {
        type: Date,
        required: false, // updated_at is optional
    },

});

module.exports = mongoose.model('Maintenance', maintenanceSchema);