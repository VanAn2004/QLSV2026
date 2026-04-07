let departmentModel = require('../schemas/departments')
module.exports = {
    CreateADepartment: async function (name, description, session) {
        let newItem = new departmentModel({
            name: name,
            description: description
        });
        await newItem.save({ session });
        return newItem;
    },
    FindDepartmentById: async function (id) {
        try {
            return await departmentModel.findOne({
                _id: id,
                isDeleted: false
            })
        } catch (error) {
            return false
        }
    },
    FindAllDepartments: async function () {
        return await departmentModel.find({
            isDeleted: false
        })
    }
}
