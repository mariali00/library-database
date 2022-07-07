const express = require('express');
const router = express.Router();

const passport = require('passport');
const helpers = require('../lib/helpers');
const pool = require('../database');
const {
    isLoggedIn,
    isAdmin
} = require('../lib/auth');

// SIGNUP
router.get('/signup', isAdmin, (req, res) => {
    res.render('auth/signup');
});

router.post('/signup', isAdmin, async (req, res) => {
    req.check('username', 'El Usuario es requerido').notEmpty();
    req.check('password', 'La contraseña es requerida').notEmpty();
    req.check('role', 'El rol debe ser administrador o bibliotecario').isIn(['admin', 'librarian']);

    let newUser = {
        usuario: req.body.username,
        contrasena: await helpers.encryptPassword(req.body.password),
        esAdmin: (req.body.role === 'admin'),
    };
    // Saving in the Database
    try {
        await pool.query('INSERT INTO usuarios_del_sistema SET ? ', newUser);
        req.flash('success', 'Usuario registrado correctamente');
    } catch (e) {
        req.flash('message', 'Error al insertar el usuario');
        console.log(e);
    }

    res.redirect('/signup');
});

// SINGIN
router.get('/signin', (req, res) => {
    res.render('auth/signin');
});

router.post('/signin', (req, res, next) => {
    req.check('username', 'El Usuario es requerido').notEmpty();
    req.check('password', 'La contraseña es requerida').notEmpty();
    const errors = req.validationErrors();
    if (errors.length > 0) {
        req.flash('message', errors[0].msg);
        res.redirect('/signin');
    }
    passport.authenticate('local.signin', {
        successRedirect: '/',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
});

module.exports = router;