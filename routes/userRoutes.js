const express = require('express');
const router = express.Router();
const User = require('./users/models/Users');
const Game = require('../routes/games/models/Games');
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

router.get('/logged', async (req, res, next) => {
  try {
    if(req.isAuthenticated()) {
      let games = await Game.find({});
      let findOutIfUserIsAdmin = req.user.admin;
      return res.render('main/logged', { games, findOutIfUserIsAdmin });
  
    } else {
          return res.send('You are not authorized to view this page');
    }
  } catch(err){
    return res.status(500).json({ message: 'failed', error });
  }}
)

router.get('/logout',(req,res)=>{
    req.logout();
    
    req.session.destroy()
    return res.redirect('/')
  });

router.post('/make-favorite/:title', (req, res) => {
  let requestedId = req.params.title
  let favouritesGameInUser = User.games
  let sessionUserId = req.user._id
  Game.findOne({ title: req.params.title }).then((foundGame) => {
    // console.log('I have found the game via the title', foundGame)
    // console.log('current user in session logged in', req.user);

    if(!foundGame) {
    
      req.flash('errors', 'Sorry We cant find a game you requested to make it favorite');
      return res.redirect('/users/logged');
    
    } else if (foundGame) {
      
      User.findOne({ _id: sessionUserId}).then((foundCurrUser) => {
        // console.log(FoundCurrUser)
        for(let i = 0; i < foundCurrUser.favoriteGames.length; i++) {
          if(!foundCurrUser.favoriteGames[i]._id) {

            foundCurrUser.favoriteGames.push(foundGame._id);
            foundCurrUser.save().then((savedUserWFavID) =>{
              
              req.flash('success', 'We have added the game to your favorites');
              return res.redirect('/users/logged');
    
            }).catch(err => console.log(err));
          
          } else {
            req.flash('errors', 'We have Already added the game to your favorites, No need to do so again');
            return res.redirect('/users/logged');
          }
        
        }
      }).catch(err => console.log(err));
    }
  }).catch((err) => {
    res.status(500).json({ message: 'Making a requested game favorite failed' });
  })
})

router.post('/un-make-favorite/:title', (req, res) => {
  let sessionUserId = req.user._id
  Game.findOne({ title: req.params.title }).then((foundGame) => {
    // console.log('I have found the game via the title', foundGame)
    // console.log('current user in session logged in', req.user);

    if(!foundGame) {
    
      req.flash('errors', 'Sorry We cant find a game you requested to Un-make it favorite');
      return res.redirect('/users/logged');
    
    } else if (foundGame) {
      
      User.findOne({ _id: sessionUserId}).then((foundCurrUser) => {
        // console.log(FoundCurrUser)
        let arrayOfFavGamesInUser = foundCurrUser.favoriteGames

          if(arrayOfFavGamesInUser.includes(foundGame._id)) {
            let indexNeeded = arrayOfFavGamesInUser.indexOf(foundGame._id)
            arrayOfFavGamesInUser.splice(indexNeeded, 1);
            foundCurrUser.save().then((savedUserWRemovedFavID) =>{
              console.log(savedUserWRemovedFavID)
              req.flash('success', 'We have removed the game from your favorites');
              return res.redirect('/users/logged');
    
            }).catch(err => console.log(err));
          
          } else {
            req.flash('errors', 'We have Already removed the game from your favorites, No need to do so again');
            return res.redirect('/users/logged');
          }
        
        }
      ).catch(err => console.log(err));
    }
  }).catch((err) => {
    res.status(500).json({ message: 'UN-Making a requested game favorite failed' });
  })
})



module.exports = router;
