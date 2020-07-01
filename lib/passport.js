const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../routes/users/models/Users');
const bcrypt = require('bcryptjs');

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    await User.findById(id, (err, user) => {
        done(err, user);
    });
});


const authenticatePassword = async (inputPassword, user, done, req) => {
    const exists = await bcrypt.compare(inputPassword, user.password);

    if(!exists) {
        console.log('Invalid Log');

        return done(null, false, req.flash('errors', 'Check email or password'));
    }

    return done(null, user);
}

const verifyCallback = async (req, userName, password, done) => {
    await User.findOne({ userName }, (err, user) => {
        try {
            // if(err) return done(err, null);
            if(!user) {
                console.log('No User has been found');
                return done(null, false, req.flash('errors', 'No user has been found'));
            }
            authenticatePassword(password, user, done, req);
        } catch(err) {
            done(error, null);
        }
    });
};

passport.use('local-login', new LocalStrategy({
    usernameField: 'userName',
    passwordField: 'password',
    passReqToCallback: true
    },
    verifyCallback
))