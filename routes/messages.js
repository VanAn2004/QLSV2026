var express = require('express');
var router = express.Router();
let { checkLogin } = require('../utils/authHandler')
let { uploadImage } = require('../utils/uploadHandler')
let userSchema = require('../schemas/users')
let messageSchema = require('../schemas/messages')
let teacherModel = require('../schemas/teachers')
let studentModel = require('../schemas/students')
let enrollmentModel = require('../schemas/enrollments')
let courseclassModel = require('../schemas/courseclasses')
router.post('/', checkLogin, uploadImage.single('file'), async function (req, res, next) {
    try {
        let user01 = req.user._id;
        let user02 = req.body.to;
        let getUser = await userSchema.findById(user02);
        if (!getUser) {
            res.status(404).send({
                message: 'user khong ton tai'
            })
            return;
        }
        let message = {};
        if (req.file) {
            message.type = 'file';
            message.text = req.file.path
        } else {
            message.type = 'text';
            message.text = req.body.text || req.body.content
        }
        let newMess = new messageSchema({
            from: user01,
            to: user02,
            messageContent: message
        })
        await newMess.save();
        let io = global._io;
        if (io) {
            io.to('notification_' + user02.toString()).emit('new_message', {
                from: user01,
                message: newMess
            })
        }
        res.send(newMess)
    } catch (error) {
        res.status(404).send({ message: error.message })
    }
})

router.get('/contacts', checkLogin, async function (req, res, next) {
    try {
        let currentUser = req.user;
        let contacts = [];

        if (currentUser.role === 'ADMIN') {
            contacts = await userSchema.find({ isDeleted: false, _id: { $ne: currentUser._id } });
        } else if (currentUser.role === 'TEACHER') {
            let admins = await userSchema.find({ role: 'ADMIN', isDeleted: false });
            contacts.push(...admins);

            let teacher = await teacherModel.findOne({ user: currentUser._id, isDeleted: false });
            if (teacher) {
                let courseClasses = await courseclassModel.find({ teacher: teacher._id, isDeleted: false });
                let ccIds = courseClasses.map(function (cc) { return cc._id });

                let enrollments = await enrollmentModel.find({ courseClass: { $in: ccIds }, isDeleted: false }).populate({
                    path: 'student',
                    populate: { path: 'user' }
                });

                let studentUserIds = new Set();
                enrollments.forEach(function (e) {
                    if (e.student && e.student.user) {
                        studentUserIds.add(e.student.user._id.toString());
                    }
                });

                let studentsUsers = await userSchema.find({ _id: { $in: Array.from(studentUserIds) }, isDeleted: false });
                contacts.push(...studentsUsers);
            }
        } else if (currentUser.role === 'STUDENT') {
            let student = await studentModel.findOne({ user: currentUser._id, isDeleted: false });
            if (student) {
                let enrollments = await enrollmentModel.find({ student: student._id, isDeleted: false }).populate('courseClass');
                let teacherIds = new Set();
                enrollments.forEach(function (e) {
                    if (e.courseClass && e.courseClass.teacher) {
                        teacherIds.add(e.courseClass.teacher.toString());
                    }
                });

                let teachers = await teacherModel.find({ _id: { $in: Array.from(teacherIds) }, isDeleted: false }).populate('user');
                let teacherUserIds = new Set();
                teachers.forEach(function (t) {
                    if (t.user && t.user._id) {
                        teacherUserIds.add(t.user._id.toString());
                    } else if (t.user) {
                        teacherUserIds.add(t.user.toString());
                    }
                });

                let teacherUsers = await userSchema.find({ _id: { $in: Array.from(teacherUserIds) }, isDeleted: false });
                contacts.push(...teacherUsers);
            }
        }

        let uniqueContactsMap = new Map();
        for (let u of contacts) {
            if (u._id.toString() !== currentUser._id.toString()) {
                uniqueContactsMap.set(u._id.toString(), u);
            }
        }
        res.send(Array.from(uniqueContactsMap.values()));
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});
router.get('/:userid', checkLogin, async function (req, res, next) {
    try {
        let user01 = req.user._id;
        let user02 = req.params.userid;
        let getUser = await userSchema.findById(user02);
        if (!getUser) {
            res.status(404).send({
                message: 'user khong ton tai'
            })
            return;
        }
        let messages = await messageSchema.find({
            $or: [{
                from: user01,
                to: user02
            }, {
                to: user01,
                from: user02
            }]
        }).sort({
            createdAt: -1
        })
        res.send(messages)
    } catch (error) {
        res.status(404).send({ message: error.message })
    }
})
router.get('/', checkLogin, async function (req, res, next) {
    try {
        let user01 = req.user._id;

        let messages = await messageSchema.find({
            $or: [{
                from: user01
            }, {
                to: user01
            }]
        }).sort({
            createdAt: -1
        })
        let messsageMap = new Map();
        for (const message of messages) {
            let user02 = user01.toString() == message.from.toString() ? message.to.toString() : message.from.toString();
            if (!messsageMap.has(user02)) {
                messsageMap.set(user02, message)
            }
        }

        let userIdsToFetch = Array.from(messsageMap.keys());
        let usersFullInfo = await userSchema.find({ _id: { $in: userIdsToFetch } });
        let userProfileMap = new Map();
        for (let u of usersFullInfo) {
            userProfileMap.set(u._id.toString(), u);
        }

        let result = [];
        messsageMap.forEach(function (value, key) {
            result.push({
                user: userProfileMap.get(key) || key,
                message: value
            })
        })
        res.send(result)
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

module.exports = router;