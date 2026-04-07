var express = require('express');
var router = express.Router();
const { checkLogin, checkRole } = require("../utils/authHandler");
let notificationModel = require('../schemas/notifications')
let userModel = require('../schemas/users')
let studentModel = require('../schemas/students')
let classModel = require('../schemas/classes')
let enrollmentModel = require('../schemas/enrollments')

router.get('/', checkLogin, async function (req, res, next) {
  let notifications = await notificationModel.find({
    user: req.user._id,
    isDeleted: false
  }).sort({ createdAt: -1 })
  res.send(notifications)
});
router.get('/unread', checkLogin, async function (req, res, next) {
  let notifications = await notificationModel.find({
    user: req.user._id,
    isRead: false,
    isDeleted: false
  }).sort({ createdAt: -1 })
  res.send(notifications)
});
router.put('/:id/read', checkLogin, async function (req, res, next) {
  try {
    let notification = await notificationModel.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    if (!notification) {
      res.status(404).send({ message: "notification khong ton tai" })
      return;
    }
    notification.isRead = true;
    await notification.save()
    res.send(notification)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.post('/', checkLogin, checkRole("ADMIN", "TEACHER"), async function (req, res, next) {
  try {
    let { title, content, targetType, targetId } = req.body;
    let targetUsers = [];
    if (targetType === 'all') {
      let users = await userModel.find({ isDeleted: false })
      targetUsers = users.map(function (u) { return u._id })
    } else if (targetType === 'class') {
      let students = await studentModel.find({ class: targetId, isDeleted: false }).populate('user')
      targetUsers = students.map(function (s) { return s.user._id })
    } else if (targetType === 'courseclass') {
      let enrollments = await enrollmentModel.find({ courseClass: targetId, isDeleted: false }).populate({
        path: 'student',
        populate: { path: 'user' }
      })
      targetUsers = enrollments.map(function (e) { return e.student.user._id })
    } else if (targetType === 'user') {
      targetUsers = [targetId]
    }
    let notifications = [];
    for (const userId of targetUsers) {
      let newNotif = new notificationModel({
        user: userId,
        title: title,
        content: content
      })
      await newNotif.save()
      notifications.push(newNotif)
      let io = global._io;
      if (io) {
        io.to('notification_' + userId.toString()).emit('new_notification', newNotif)
      }
    }
    res.send(notifications)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});
router.delete('/:id', checkLogin, async function (req, res, next) {
  try {
    let notification = await notificationModel.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    if (!notification) {
      res.status(404).send({ message: "notification khong ton tai" })
      return;
    }
    notification.isDeleted = true;
    await notification.save()
    res.send(notification)
  } catch (error) {
    res.status(404).send({ message: error.message })
  }
});

module.exports = router;
