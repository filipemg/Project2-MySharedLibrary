require('dotenv').config();

const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const session      = require("express-session");
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash")
const app = express();

// =====================================================================================================================================
// Connection with database
mongoose
  .connect('mongodb://localhost/SharedLibrary', {useNewUrlParser: true, useUnifiedTopology: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });
// =====================================================================================================================================

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

// =====================================================================================================================================
// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// =====================================================================================================================================
// Express View engine setup
app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));      

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// =====================================================================================================================================
// Configure a session
app.use(session({
  secret: "sharedlibrary3021",
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true,
}));
app.use(flash());

// =====================================================================================================================================
// Passport configuration
const User = require("./models/User")
const bcrypt = require("bcrypt");
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

passport.use(new LocalStrategy((username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect email" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  });
}));

// =====================================================================================================================================
// Initializate passport an passport session
app.use(passport.initialize());
app.use(passport.session());

// =====================================================================================================================================
// default value for title local
app.locals.title = 'TESTE';

// =====================================================================================================================================
// Call the routes
const auth = require('./routes/auth');
app.use('/', auth);

const index = require('./routes/index');
app.use('/', index);


module.exports = app;
