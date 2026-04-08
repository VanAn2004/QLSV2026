var express = require("express");
var router = express.Router();
let studentModel = require("../schemas/students");
let userController = require("../controllers/users");
const { checkLogin, checkRole } = require("../utils/authHandler");
let mongoose = require('mongoose')
let enrollmentModel = require('../schemas/enrollments')

router.get("/", checkLogin, async function (req, res, next) {
  let students = await studentModel.find({ isDeleted: false }).populate('user').populate('class');
  res.send(students);
});
router.get("/trash", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  let students = await studentModel.find({ isDeleted: true }).populate('user').populate('class');
  res.send(students);
});
router.put("/:id/restore", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await studentModel.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    await updatedItem.populate('user')
    await updatedItem.populate('class')
    res.send(updatedItem);
  } catch (err) {
    res.status(404).send({ message: err.message });
  }
});
router.get("/:id", async function (req, res, next) {
  try {
    let result = await studentModel.find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      await result[0].populate('user')
      await result[0].populate('class')
      res.send(result[0]);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});
router.post("/", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  let session = await mongoose.startSession();
  session.startTransaction()
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password || 'Default@123', req.body.email,
      'STUDENT', session, req.body.fullName
    )
    let newStudent = new studentModel({
      user: newUser._id,
      studentCode: req.body.studentCode,
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email,
      dateOfBirth: req.body.dateOfBirth,
      class: req.body.classId
    })
    await newStudent.save({ session })
    await newStudent.populate('user')
    await newStudent.populate('class')
    await session.commitTransaction()
    session.endSession()
    res.send(newStudent);
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    res.status(400).send({ message: err.message });
  }
});
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await studentModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedItem) return res.status(404).send({ message: "id not found" });
    await updatedItem.populate('user')
    await updatedItem.populate('class')
    res.send(updatedItem);
  } catch (err) {
    res.status(404).send({ message: err.message });
  }
});
router.delete("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let student = await studentModel.findOne({ _id: id, isDeleted: false })
    if (!student) {
      return res.status(404).send({ message: "id not found" });
    }
    let activeEnrollment = await enrollmentModel.findOne({ student: id, isDeleted: false })
    if (activeEnrollment) {
      return res.status(400).send({ message: "Khong the xoa. Sinh vien dang theo hoc lop hoc phan" })
    }
    student.isDeleted = true
    await student.save()
    res.send(student);
  } catch (err) {
    res.status(404).send({ message: err.message });
  }
});

module.exports = router;
