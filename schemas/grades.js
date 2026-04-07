let mongoose = require('mongoose');
let gradeSchema = mongoose.Schema({
    enrollment: {
        type: mongoose.Types.ObjectId,
        ref: 'enrollment',
        required: true,
        unique: true
    },
    attendanceScore: {
        type: Number,
        min: 0,
        max: 10
    },
    midtermScore: {
        type: Number,
        min: 0,
        max: 10
    },
    finalScore: {
        type: Number,
        min: 0,
        max: 10
    },
    averageScore: {
        type: Number,
        min: 0,
        max: 10
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('grade', gradeSchema)
