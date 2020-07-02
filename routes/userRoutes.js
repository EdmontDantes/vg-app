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

router.get('/logout', checkAuthentication, (req,res)=>{
    req.logout();
    
    req.session.destroy()
    return res.redirect('/')
  });

router.post('/make-favorite/:title', checkAuthentication, (req, res) => {
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
        let arrayOfFavGamesInUser = foundCurrUser.favoriteGames

          if(!arrayOfFavGamesInUser.includes(foundGame._id)) {
            arrayOfFavGamesInUser.push(foundGame._id);
            foundCurrUser.save().then((savedUserWFavID) =>{
              console.log(savedUserWFavID)
              req.flash('success', 'We have added the game to your favorites');
              return res.redirect('/users/logged');
    
            }).catch(err => console.log(err));
          
          } else {
            req.flash('errors', 'We have Already added the game to your favorites, No need to do so again');
            return res.redirect('/users/logged');
          }
        
        }
      ).catch(err => console.log(err));
    }
  }).catch((err) => {
    res.status(500).json({ message: 'Making a requested game favorite failed' });
  })
})

router.post('/un-make-favorite/:title', checkAuthentication, (req, res) => {
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


router.get('/favorites-list', checkAuthentication, (req, res, next) => {
  let sessionUserId = req.user._id
  User.findOne({_id: sessionUserId}).populate('favoriteGames').exec((err, game) => {
    if(err) return next();
    let findOutIfUserIsAdmin = req.user.admin;
    let games = game.favoriteGames;
    console.log(game);
    res.render('main/favoriteList', { games, findOutIfUserIsAdmin })
  })
})

router.post('/remove-game/:title', checkAuthentication, (req, res, next) => {
  let sessionUserId = req.user._id
  // Game.find({ title: req.params.title }).then((foundGame) => {
  //   // console.log('I have found the game via the title', foundGame)
  //   // console.log('current user in session logged in', req.user);

  //   if(!foundGame) {
    
  //     req.flash('errors', 'The Requested game to be removed is not found');
  //     return res.redirect('/users/logged');
    
  //   } else if (foundGame) {
      
  //     User.findOne({ _id: sessionUserId}).then((foundCurrUser) => {
  //       // console.log(FoundCurrUser)
  //       let arrayOfFavGamesInUser = foundCurrUser.favoriteGames

  //         if(arrayOfFavGamesInUser.includes(foundGame._id)) {
  //           let indexNeeded = arrayOfFavGamesInUser.indexOf(foundGame._id)
  //           arrayOfFavGamesInUser.splice(indexNeeded, 1);
  //           foundCurrUser.save().then((savedUserWRemovedFavID) =>{
  //             console.log(savedUserWRemovedFavID)
  //             req.flash('success', 'We have removed the game from your favorites');

    
  //           }).catch(err => console.log(err));
          
  //         } else {
  //           req.flash('errors', 'We have Already removed the game from your favorites, No need to do so again');

  //         }
        
  //       }).catch(err => console.log(err));
  //   }
  // }).catch((err) => {
  //   res.status(500).json({ message: 'Delete Game went awry' });
  // });

  Game.findOneAndRemove({ title: req.params.title }).then((foundGame) => {
    console.log('whateverLeft:', foundGame);
    if(!foundGame) {
    
      req.flash('errors', 'The Requested game to be removed is not found');
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
              next();
    
            }).catch(err => console.log(err));
          
          } else {
            req.flash('errors', 'We have Already removed the game from your favorites, No need to do so again');
            next();
          }
          
        }).catch(err => console.log(err));
        req.flash('success', 'We most likely deleted the game you requested to do so');
        res.redirect('/users/logged');
    }
  }).catch((err) => {
    res.status(500).json({ message: 'Delete Game went awry' });
  }).catch(err => console.log(err));

})


router.get('/add-game', (req, res) => {
  req.flash('success', 'We think we work, maybe?');
  res.render('main/addGameToDB');
})

router.post('/add-game', (req, res) => {
  Game.findOne({ title: req.body.title }).then((foundGame) => {
    console.log('I have found the game via the title', foundGame)
    // console.log('current user in session logged in', req.user);

    if(foundGame) {
    
      req.flash('errors', 'Sorry but we already have Game with this exact title you have inputted, please try another game');
      return res.redirect('/users/logged');
    
    } else if (!foundGame) {
      let newGame = new Game();
      newGame.title = req.body.title;
      newGame.description = req.body.description || '';
      newGame.yearReleased = req.body.yearReleased || '';
      newGame.playTime = req.body.playTime || '';
      newGame.image = req.body.image || '';

      newGame.save().then((game) => {
        console.log(game)
        req.flash('success', 'We have successfully add the game to our database');
        res.redirect('/users/logged')
      })
    }
  }
      ).catch(err => console.log(err));
    });

module.exports = router;
