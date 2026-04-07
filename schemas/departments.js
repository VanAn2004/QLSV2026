let mongoose = require('mongoose');
let departmentSchema = mongoose.Schema({
    name: {
        type: String,
        unique: [true, "name khong duoc trung"],
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('department', departmentSchema)
