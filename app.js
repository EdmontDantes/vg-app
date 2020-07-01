const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

//non-standard packages apart from express-generator
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
let MongoStore = require('connect-mongo')(session);
require('./lib/passport');
// bring dotenv for usage here
require('dotenv').config();

// bring models here


// bring routes files here
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/userRoutes');

const app = express();

// connect to mongoDB via mongoose
mongoose
        .connect(process.env.MONGODB_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    useCreateIndex: true
        })
        .then(() => {
            console.log('Mongodb Connected')
        })
        .catch(err => console.log(`Mongo error: ${err}`));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// morgan package for development only can be deleted for production
app.use(morgan('dev'));

// express json translator
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// cookie parser usage here
app.use(cookieParser());
app.use(session({ //after cookieParser
  resave: false,
  saveUninitialized: false,
  useCreateIndex: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
      url: process.env.MONGODB_URI,
      mongooseConnection: mongoose.connection,
      autoReconnect: true
  }),
  cookie: {
      secure: false,
      maxAge: 1000 * 60 *60 * 24
  }
}));

// using flash, passport.initialize and pass.sess
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


// use path to make use of public folder for static files access in the app
app.use(express.static(path.join(__dirname, 'public')));


// declare base paths
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
