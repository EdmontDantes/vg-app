module.exports = {
    checkAuthentication: (req, res, next) => {
        if(req.isAuthenticated()) {
            next();
        } else {
            req.flash('errors', 'You are not authorized to view this route please login')
            res.redirect('/')
        }
    }
}