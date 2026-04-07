let mongoose = require('mongoose')
let userModel = require('./schemas/users')

mongoose.connect('mongodb://localhost:27017/QuanLySinhVien')

mongoose.connection.on('connected', async function () {
  console.log("connected")
  try {
    let found = await userModel.findOne({ username: 'admin' })
    if (found) {
      console.log("Admin da ton tai")
    } else {
      let admin = new userModel({
        username: 'admin',
        password: 'Admin123@',
        email: 'admin@qlsv.com',
        fullName: 'Administrator',
        role: 'ADMIN'
      })
      await admin.save()
      console.log("Tao admin thanh cong! username: admin / password: Admin123@")
    }
  } catch (err) {
    console.log("Loi:", err.message)
  }
  process.exit(0)
})
