var express = require('express');
var router = express.Router();
const { checkLogin, checkRole } = require("../utils/authHandler");
let gradeModel = require('../schemas/grades')
let enrollmentModel = require('../schemas/enrollments')
let notificationModel = require('../schemas/notifications')
let studentModel = require('../schemas/students')

router.get('/enrollment/:enrollmentId', checkLogin, async function (req, res, next) {
  try {
    let grade = await gradeModel.findOne({
      enrollment: req.params.enrollmentId,
      isDeleted: false
    }).populate({
      path: 'enrollment',
      populate: [
        { path: 'student' },
        {
          path: 'courseClass',
          populate: [{ path: 'subject' }, { path: 'semester' }]
        }
      ]
    })
    if (grade) {
      res.send(grade)
    } else {
      res.status(404).send({ message: "grade khong ton tai" })
    }
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.get('/courseclass/:courseClassId', checkLogin, checkRole("TEACHER", "ADMIN"), async function (req, res, next) {
  try {
    let enrollments = await enrollmentModel.find({
      courseClass: req.params.courseClassId,
      isDeleted: false
    })
    let enrollmentIds = enrollments.map(function (e) { return e._id })
    let grades = await gradeModel.find({
      enrollment: { $in: enrollmentIds },
      isDeleted: false
    }).populate({
      path: 'enrollment',
      populate: { path: 'student' }
    })
    res.send(grades)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.get('/my', checkLogin, checkRole("STUDENT"), async function (req, res, next) {
  try {
    let student = await studentModel.findOne({ user: req.user._id, isDeleted: false })
    if (!student) {
      res.status(404).send({ message: "student profile khong ton tai" })
      return;
    }
    let enrollments = await enrollmentModel.find({ student: student._id, isDeleted: false })
    let enrollmentIds = enrollments.map(function (e) { return e._id })
    let grades = await gradeModel.find({
      enrollment: { $in: enrollmentIds },
      isDeleted: false
    }).populate({
      path: 'enrollment',
      populate: {
        path: 'courseClass',
        populate: [{ path: 'subject' }, { path: 'semester' }]
      }
    })
    res.send(grades)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.put('/bulk', checkLogin, checkRole("TEACHER", "ADMIN"), async function (req, res, next) {
  try {
    let { grades } = req.body;
    if (!grades || !Array.isArray(grades)) {
      res.status(400).send({ message: "grades array la bat buoc" })
      return;
    }
    let result = [];
    for (const item of grades) {
      let grade = await gradeModel.findOne({ _id: item.gradeId, isDeleted: false })
      if (!grade) continue;
      if (item.attendanceScore !== undefined) grade.attendanceScore = item.attendanceScore;
      if (item.midtermScore !== undefined) grade.midtermScore = item.midtermScore;
      if (item.finalScore !== undefined) grade.finalScore = item.finalScore;
      if (grade.attendanceScore !== undefined && grade.midtermScore !== undefined && grade.finalScore !== undefined) {
        grade.averageScore = Math.round((grade.attendanceScore * 0.1 + grade.midtermScore * 0.3 + grade.finalScore * 0.6) * 100) / 100;
      }
      await grade.save();
      result.push(grade)
      let enrollment = await enrollmentModel.findById(grade.enrollment).populate('student')
      if (enrollment && enrollment.student) {
        let student = await studentModel.findById(enrollment.student._id).populate('user')
        if (student && student.user) {
          let newNotif = new notificationModel({
            user: student.user._id,
            title: "Cap nhat diem",
            content: "Giao vien vua cap nhat diem cua ban"
          })
          await newNotif.save()
          let io = global._io;
          if (io) {
            io.to('notification_' + student.user._id.toString()).emit('grade_updated', {
              gradeId: grade._id,
              message: "Giao vien vua cap nhat diem cua ban"
            })
          }
        }
      }
    }
    res.send(result)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.put('/:id', checkLogin, checkRole("TEACHER", "ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let grade = await gradeModel.findOne({ _id: id, isDeleted: false })
    if (!grade) {
      res.status(404).send({ message: "grade khong ton tai" })
      return;
    }
    if (req.body.attendanceScore !== undefined) grade.attendanceScore = req.body.attendanceScore;
    if (req.body.midtermScore !== undefined) grade.midtermScore = req.body.midtermScore;
    if (req.body.finalScore !== undefined) grade.finalScore = req.body.finalScore;
    if (grade.attendanceScore !== undefined && grade.midtermScore !== undefined && grade.finalScore !== undefined) {
      grade.averageScore = Math.round((grade.attendanceScore * 0.1 + grade.midtermScore * 0.3 + grade.finalScore * 0.6) * 100) / 100;
    }
    await grade.save();
    let enrollment = await enrollmentModel.findById(grade.enrollment).populate('student')
    if (enrollment && enrollment.student) {
      let student = await studentModel.findById(enrollment.student._id).populate('user')
      if (student && student.user) {
        let newNotif = new notificationModel({
          user: student.user._id,
          title: "Cap nhat diem",
          content: "Giao vien vua cap nhat diem cua ban"
        })
        await newNotif.save()
        let io = global._io;
        if (io) {
          io.to('notification_' + student.user._id.toString()).emit('grade_updated', {
            gradeId: grade._id,
            message: "Giao vien vua cap nhat diem cua ban"
          })
        }
      }
    }
    res.send(grade)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});

module.exports = router;
