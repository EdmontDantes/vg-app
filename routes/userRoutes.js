const express = require('express');
const router = express.Router();
const User = require('./users/models/Users');
const passport = require('passport');
const bcrypt = require('bcryptjs');

// bring dotenv for usage here
require('dotenv').config();


// Validate user input for login
const { check, validationResult } = require('express-validator');
const { checkAuthentication } = require('./users/middlewares/isAuthenticated');
const loginCheck = [
    check('userName').not().isEmpty(),
    check('password').isLength({ min: 3})
];

const loginValidate = (req, res, next) => {
    const info = validationResult(req);
    if(!info.isEmpty()) {
        req.flash('errors', 'Invalid Email or Password');
        return res.redirect('/');
    }
    next();
}

const registerValidate = (req, res, next) => {
  const info = validationResult(req);
  if(!info.isEmpty()) {
    req.flash('errors', 'All Fields Must be Filled')
  }
  next();
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', loginCheck, loginValidate , passport.authenticate('local-login', {
  successRedirect: '/users/logged',
  failureRedirect: '/',
  failureFlash: true
  }));

  router.post('/register', (req, res) => {
    const { name, userName, email, password, adminSecret } = req.body
    if(!name || !userName || !email || !password) {
        req.flash('errors', 'All inputs Must Be Filled except Admin Secret')
        res.redirect('/')
    } else {
        User.findOne( { email: req.body.email }).then((user) => {
            if(user) {
                    req.flash('errors', 'account already exists');
                    res.redirect('/');
            } else {
                const newUser = new User();
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(req.body.password, salt);
    
                newUser.name = req.body.name;
                newUser.userName = req.body.userName;
                newUser.email = req.body.email;
                newUser.password = hash;
                if(adminSecret === process.env.ADMIN_SECRET) {
                  newUser.admin = true;
                }
    
                newUser.save().then((user) => {
                    req.flash('success', 'your account has been created please login')
                    res.redirect('/')
  
                })
                .catch((error) => console.log(error));
            }
        });
  
    }
  });

router.get('/logged', (req, res) => {
  if(req.isAuthenticated()) {
  
      res.render('main/logged');
  
  } else {
          return res.send('You are not authorized to view this page');
      }
  })

module.exports = router;
