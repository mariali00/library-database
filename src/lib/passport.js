const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    const rows = await pool.query('SELECT * FROM usuarios_del_sistema WHERE usuario = ?', [username]);
    if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.contrasena)
        if (validPassword) {
            done(null, user, req.flash('success', 'Bienvenido ' + user.usuario));
        } else {
            done(null, false, req.flash('message', 'Contraseña incorrecta'));
        }
    } else {
        return done(null, false, req.flash('message', 'El nombre de usuario no existe'));
    }
}));

// passport.use('local.signup', new LocalStrategy({
//     usernameField: 'username',
//     passwordField: 'password',
//     passReqToCallback: true
// }, async (req, username, password, done) => {
//     let newUser = {
//         usuario: username,
//         contrasena: await helpers.encryptPassword(password),
//         esAdmin: true,
//     };
//     // Saving in the Database
//     const result = await pool.query('INSERT INTO usuarios_del_sistema SET ? ', newUser);
//     newUser.id = result.insertId;
//     return done(null, newUser);
// }));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM usuarios_del_sistema WHERE id = ?', [id]);
    done(null, rows[0]);
});