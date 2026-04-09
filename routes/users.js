var express = require("express");
var router = express.Router();
let { validatedResult, CreateUserValidator, ModifyUserValidator } = require("../utils/validator")
let userModel = require("../schemas/users");
let userController = require("../controllers/users");
const { checkLogin, checkRole } = require("../utils/authHandler");
let teacherModel = require("../schemas/teachers");
let studentModel = require("../schemas/students");

router.get("/", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
  res.send(users);
});
router.get("/trash", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  let users = await userModel.find({ isDeleted: true })
  res.send(users);
});
router.put("/:id/restore", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(404).send({ message: err.message });
  }
});
router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});
router.post("/", checkLogin, checkRole("ADMIN"), CreateUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email,
      req.body.role, null, req.body.fullname, req.body.avatarUrl
    )
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
router.put("/:id", checkLogin, checkRole("ADMIN"), ModifyUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedItem) return res.status(404).send({ message: "id not found" });
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
router.delete("/:id", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  try {
    let id = req.params.id;
    let user = await userModel.findOne({ _id: id, isDeleted: false })
    if (!user) {
      return res.status(404).send({ message: "id not found" });
    }
    if (user.role === 'ADMIN') {
      return res.status(400).send({ message: "Khong the xoa tai khoan ADMIN" })
    }
    let activeTeacher = await teacherModel.findOne({ user: id, isDeleted: false })
    if (activeTeacher) {
      return res.status(400).send({ message: "Khong the xoa. Tai khoan dang lien ket voi giao vien" })
    }
    let activeStudent = await studentModel.findOne({ user: id, isDeleted: false })
    if (activeStudent) {
      return res.status(400).send({ message: "Khong the xoa. Tai khoan dang lien ket voi sinh vien" })
    }
    user.isDeleted = true
    await user.save()
    res.send(user);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;