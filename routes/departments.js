var express = require('express');
var router = express.Router();
let departmentModel = require('../schemas/departments')
const { checkLogin, checkRole } = require("../utils/authHandler");
let mongoose = require('mongoose')
let classModel = require('../schemas/classes')
let teacherModel = require('../schemas/teachers')
let studentModel = require('../schemas/students')

router.get('/', async function (req, res, next) {
  let data = await departmentModel.find({
    isDeleted: false
  });
  res.send(data);
});
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await departmentModel.find({
      isDeleted: false,
      _id: id
    });
    if (result.length) {
      res.send(result[0])
    } else {
      res.status(404).send({
        message: "ID NOT FOUND"
      })
    }
  } catch (error) {
    res.status(404).send({
      message: error.message
    })
  }
});
router.post('/', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let newItem = new departmentModel({
      name: req.body.name,
      description: req.body.description
    })
    await newItem.save()
    res.send(newItem)
  } catch (error) {
    res.status(404).send({
      message: error.message
    })
  }
})
router.put('/:id', checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;
    let result = await departmentModel.findByIdAndUpdate(
      id, req.body, {
      new: true
    })
    res.send(result)
  } catch (error) {
    res.status(404).send({
      message: error.message
    })
  }
})
router.delete('/:id', checkLogin, checkRole("ADMIN"), async function (req, res) {
  let session = await mongoose.startSession();
  session.startTransaction()
  try {
    let id = req.params.id;
    let result = await departmentModel.findOne({
      isDeleted: false,
      _id: id
    });
    if (result) {
      let hasTeachers = await teacherModel.findOne({ department: id, isDeleted: false })
      let hasClasses = await classModel.findOne({ department: id, isDeleted: false })
      if (hasTeachers || hasClasses) {
        let classes = await classModel.find({ department: id, isDeleted: false })
        let classIds = classes.map(function (c) { return c._id })
        if (classIds.length > 0) {
          await studentModel.updateMany({ class: { $in: classIds }, isDeleted: false }, { isDeleted: true }, { session })
        }
        await classModel.updateMany({ department: id }, { isDeleted: true }, { session })
        await teacherModel.updateMany({ department: id }, { isDeleted: true }, { session })
      }
      result.isDeleted = true
      await result.save({ session });
      await session.commitTransaction()
      session.endSession()
      res.send(result)
    } else {
      await session.abortTransaction()
      session.endSession()
      res.status(404).send({
        message: "ID NOT FOUND"
      })
    }
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    res.status(404).send({
      message: error.message
    })
  }
})

module.exports = router;
