const mongoose = require('mongoose')

const towerSchema = new mongoose.Schema({
    name: {
        type: String,
        maxLength: 255,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now(),
        required: true
    },
    updated_at: {
        type: Date,
        default: Date.now(),
        required: false
    }
})

towerSchema.virtual('floors', {
    ref: 'floors',
    localField: '_id',
    foreignField: 'tower_id'
});

towerSchema.set('toObject', { virtuals: true });
towerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('towers', towerSchema);