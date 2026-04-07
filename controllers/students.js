let studentModel = require('../schemas/students')
module.exports = {
    CreateAStudent: async function (user, studentCode, fullName, phone, email, dateOfBirth, classId, session) {
        let newItem = new studentModel({
            user: user,
            studentCode: studentCode,
            fullName: fullName,
            phone: phone,
            email: email,
            dateOfBirth: dateOfBirth,
            class: classId
        });
        await newItem.save({ session });
        return newItem;
    },
    FindStudentById: async function (id) {
        try {
            return await studentModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('user').populate('class')
        } catch (error) {
            return false
        }
    },
    FindStudentByUserId: async function (userId) {
        try {
            return await studentModel.findOne({
                user: userId,
                isDeleted: false
            }).populate('user').populate('class')
        } catch (error) {
            return false
        }
    },
    FindStudentByCode: async function (studentCode) {
        return await studentModel.findOne({
            studentCode: studentCode,
            isDeleted: false
        })
    }
}
