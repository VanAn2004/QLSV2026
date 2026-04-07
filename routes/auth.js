let express = require('express')
let router = express.Router()
let userController = require('../controllers/users')
let { RegisterValidator, validatedResult, ChangePasswordValidator } = require('../utils/validator')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')

router.post('/register', RegisterValidator, validatedResult, async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction()
    try {
        let { username, password, email, fullName, studentCode, classId } = req.body;
        let newUser = await userController.CreateAnUser(
            username, password, email, 'STUDENT', session,
            fullName
        )
        let newStudent = new studentModel({
            user: newUser._id,
            studentCode: studentCode || username,
            fullName: fullName || username,
            email: email,
            class: classId
        })
        await newStudent.save({ session });
        await newStudent.populate('user');
        await session.commitTransaction()
        session.endSession()
        res.send(newStudent)
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        res.status(404).send(error.message)
    }
})
router.post('/login', async function (req, res, next) {
    let { username, password } = req.body;
    let user = await userController.FindUserByUsername(username);
    if (!user) {
        res.status(404).send({
            message: "thong tin dang nhap khong dung"
        })
        return;
    }
    if (!user.lockTime || user.lockTime < Date.now()) {
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save();
            let token = jwt.sign({
                id: user._id,
            }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            })
            res.cookie("TOKEN_LOGIN", token, {
                maxAge: 24 * 3600 * 1000,
                httpOnly: true,
                secure: false
            })
            res.send(token)
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = new Date(Date.now() + 60 * 60 * 1000)
            }
            await user.save();
            res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
        }
    } else {
        res.status(404).send({
            message: "user dang bi ban"
        })
    }

})

router.post("/logout", checkLogin, function (req, res, next) {
    res.cookie("TOKEN_LOGIN", null, {
        maxAge: 0,
        httpOnly: true,
        secure: false
    })
    res.send("logout thanh cong")
})