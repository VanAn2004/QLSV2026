var express = require('express');
var router = express.Router();
const { checkLogin, checkRole } = require("../utils/authHandler");
let attendanceModel = require('../schemas/attendances')
let enrollmentModel = require('../schemas/enrollments')

router.get('/enrollment/:enrollmentId', checkLogin, async function (req, res, next) {
  try {
    let attendances = await attendanceModel.find({
      enrollment: req.params.enrollmentId
    }).sort({ date: -1 })
    res.send(attendances)
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
    let attendances = await attendanceModel.find({
      enrollment: { $in: enrollmentIds }
    }).populate({
      path: 'enrollment',
      populate: { path: 'student' }
    }).sort({ date: -1 })
    res.send(attendances)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.post('/', checkLogin, checkRole("TEACHER", "ADMIN"), async function (req, res, next) {
  try {
    let { enrollmentId, date, status, note } = req.body;
    let enrollment = await enrollmentModel.findOne({
      _id: enrollmentId,
      isDeleted: false
    })
    if (!enrollment) {
      res.status(404).send({ message: "enrollment khong ton tai" })
      return;
    }
    let newItem = new attendanceModel({
      enrollment: enrollmentId,
      date: date,
      status: status,
      note: note
    })
    await newItem.save()
    res.send(newItem)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.post('/bulk', checkLogin, checkRole("TEACHER", "ADMIN"), async function (req, res, next) {
  try {
    let { records } = req.body;
    let result = [];
    for (const record of records) {
      let updatedItem = await attendanceModel.findOneAndUpdate(
        { enrollment: record.enrollmentId, date: new Date(record.date) },
        { status: record.status, note: record.note },
        { new: true, upsert: true }
      )
      result.push(updatedItem)
    }
    res.send(result)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.put('/:id', checkLogin, checkRole("TEACHER", "ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await attendanceModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});

module.exports = router;
