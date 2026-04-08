let gradeModel = require('../schemas/grades')
module.exports = {
    CreateAGrade: async function (enrollment, session) {
        let newItem = new gradeModel({
            enrollment: enrollment
        });
        await newItem.save({ session });
        return newItem;
    },
    FindGradeById: async function (id) {
        try {
            return await gradeModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('enrollment')
        } catch (error) {
            return false
        }
    },
    FindGradeByEnrollment: async function (enrollmentId) {
        try {
            return await gradeModel.findOne({
                enrollment: enrollmentId,
                isDeleted: false
            }).populate('enrollment')
        } catch (error) {
            return false
        }
    }
}
