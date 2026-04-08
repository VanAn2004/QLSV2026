let attendanceModel = require('../schemas/attendances')
module.exports = {
    CreateAnAttendance: async function (enrollment, date, status, note) {
        let newItem = new attendanceModel({
            enrollment: enrollment,
            date: date,
            status: status,
            note: note
        });
        await newItem.save();
        return newItem;
    },
    FindAttendancesByEnrollment: async function (enrollmentId) {
        return await attendanceModel.find({
            enrollment: enrollmentId
        }).sort({ date: -1 })
    }
}
