let mongoose = require('mongoose');
let attendanceSchema = mongoose.Schema({
    enrollment: {
        type: mongoose.Types.ObjectId,
        ref: 'enrollment',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        required: true
    },
    note: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('attendance', attendanceSchema)
