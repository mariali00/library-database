module.exports = {
    isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/signin');
    },
    isAdmin(req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.esAdmin == 1)
                return next();
            else {
                req.flash('message', 'Debes ser administrador para acceder a esta funcionalidad');
                return res.redirect('/');
            }
        }
        return res.redirect('/signin');
    },
    isLibrarian(req, res, next) {
        if (req.isAuthenticated()) {
            if (req.user.esAdmin == 0)
                return next();
            else {
                req.flash('message', 'Debes ser bibliotecario para acceder a esta funcionalidad');
                return res.redirect('/');
            }
        }
        return res.redirect('/signin');
    }
};