require('dotenv').config({ path: 'F:\\NNPTUD\\quan_ly_sinh_vien\\QuanLySinhVien_2HDA\\.env' })
var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose')
let cors = require('cors')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/departments', require('./routes/departments'));
app.use('/api/v1/classes', require('./routes/classes'));
app.use('/api/v1/teachers', require('./routes/teachers'));
app.use('/api/v1/students', require('./routes/students'));
app.use('/api/v1/semesters', require('./routes/semesters'));
app.use('/api/v1/subjects', require('./routes/subjects'));
app.use('/api/v1/courseclasses', require('./routes/courseclasses'));
app.use('/api/v1/enrollments', require('./routes/enrollments'));
app.use('/api/v1/grades', require('./routes/grades'));
app.use('/api/v1/attendances', require('./routes/attendances'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/upload', require('./routes/upload'));

mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on('connected', function () {
  console.log("connected");
})
mongoose.connection.on('disconnecting', function () {
  console.log("disconnected");
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;
