const {
    query
} = require('express');
const e = require('express');
const express = require('express');
const router = express.Router();
const pool = require('../database');
const {
    isLoggedIn,
    isAdmin
} = require('../lib/auth');

router.get("/loan", isAdmin, async (req, res) => {
    res.render("loan");
});

router.get("/devolution", isAdmin, async (req, res) => {
    res.render("devolution");
});

router.post('/devolution', isAdmin, async (req, res) => {
    req.check('user_id', 'El solapín debe estar compuesto por números solamente').isNumeric();
    req.check('document_identifier', 'El ISBN/ISSN no es válido').notEmpty();

    const errors = req.validationErrors();
    if (errors.length > 0) {
        req.flash('message', errors[0].msg);
        res.redirect('/devolution');
        return;
    }

    let user = await pool.query('SELECT idusuario, NoSolapin FROM usuario WHERE NoSolapin = ?', [req.body.user_id]);
    if (user.length == 0) {
        req.flash('message', "El solapin especificado no corresponde a ningun usuario registrado");
        res.redirect('/devolution');
        return;
    }
    user = user[0].idusuario;

    const di = parseInt(req.body.document_identifier.replaceAll('-', ''));

    const book = await pool.query('SELECT iddoc, isbn FROM libro WHERE isbn = ?', [di]);
    let iddoc = null;

    if (book.length == 0) {
        const megazine = await pool.query('SELECT iddoc, issn FROM revista WHERE issn = ?', [di]);
        if (megazine.length == 0) {
            req.flash('message', 'No hay ningún documento con este identificador');
            res.redirect('/devolution');
            return;
        }

        iddoc = megazine[0].iddoc;
    } else {
        iddoc = book[0].iddoc;
    }

    if ((await pool.query('SELECT iddoc, idusuario, fechadevolucion FROM prestamoSala WHERE iddoc = ? AND idusuario = ? AND fechadevolucion is NULL', [iddoc, user])).length > 0) {
        await pool.query('UPDATE prestamoSala set ? WHERE iddoc = ? AND idusuario = ?', [{
            fechadevolucion: (new Date()).toISOString().slice(0, 19).replace('T', ' ')
        }, iddoc, user]);
    } else if ((await pool.query('SELECT idlibro, idusuario, fechadevolucion FROM prestamoExterno WHERE idlibro = ? AND idusuario = ? AND fechadevolucion is NULL', [iddoc, user])).length > 0) {
        await pool.query('UPDATE prestamoExterno set ? WHERE idlibro = ? AND idusuario = ?', [{
            fechadevolucion: (new Date()).toISOString().slice(0, 19).replace('T', ' ')
        }, iddoc, user]);
    } else {
        req.flash('message', 'Este usuario no ha retirado el documento especificado');
        res.redirect('/devolution');
        return;
    }

    const row = await pool.query('SELECT iddoc, ctdadejemplarea FROM acervo WHERE iddoc = ?', [iddoc]);
    await pool.query('UPDATE acervo set ? WHERE iddoc = ?', [{
        ctdadejemplarea: row[0].ctdadejemplarea + 1
    }, iddoc]);

    req.flash('success', 'Devolución de libro realizada correctamente');
    res.redirect('/devolution');
    return;

});

router.post('/loan', isAdmin, async (req, res) => {
    req.check('user_id', 'El solapín debe estar compuesto por números solamente').isNumeric();
    req.check('loan_type', 'El tipo de prestamo debe ser especificado').notEmpty();
    req.check('document_identifier', 'El ISBN/ISSN no es válido').notEmpty();

    const errors = req.validationErrors();
    if (errors.length > 0) {
        req.flash('message', errors[0].msg);
        res.redirect('/loan');
        return;
    }

    let user = await pool.query('SELECT idusuario, NoSolapin FROM usuario WHERE NoSolapin = ?', [req.body.user_id]);
    if (user.length == 0) {
        req.flash('message', "El solapin especificado no corresponde a ningun usuario registrado");
        res.redirect('/loan');
        return;
    }
    user = user[0].idusuario;

    let document = null;
    if (req.body.loan_type == 'extern') {
        const di = parseInt(req.body.document_identifier.replaceAll('-', ''));
        document = await pool.query('SELECT iddoc, isbn FROM libro WHERE isbn = ?', [di]);
        if (document.length == 0) {
            req.flash('message', 'No hay ningun libro registrado con este ISBN');
            res.redirect('/loan');
            return;
        }
    } else if (req.body.loan_type == 'normal') {
        const di = req.body.document_identifier.replaceAll('-', '');
        document = await pool.query('SELECT iddoc, isbn FROM libro WHERE isbn = ?', [di]);

        if (document.length == 0) {
            document = await pool.query('SELECT iddoc, issn FROM revista WHERE issn = ?', [di]);
            if (document.length == 0) {
                req.flash('message', 'No hay ningun documento registrado con este ISBN/ISSN');
                res.redirect('/loan');
                return;
            }
        }
    } else {
        req.flash('message', 'Tipo de prestamo no conocido');
        res.redirect('/loan');
        return;
    }

    document = document[0];
    let count = await pool.query('SELECT ctdadejemplarea, iddoc FROM acervo WHERE iddoc = ?', [document.iddoc]);
    count = count[0];
    if (count.ctdadejemplarea <= 0) {
        req.flash('message', 'Del documento requerido no quedan más ejemplares disponibles');
        res.redirect('/loan');
        return;
    }
    await pool.query('UPDATE acervo set ? WHERE iddoc = ?', [{
        ctdadejemplarea: count.ctdadejemplarea - 1
    }, document.iddoc]);

    if (req.body.loan_type == 'extern') {
        await pool.query('INSERT INTO prestamoExterno set ?', {
            idusuario: user,
            idlibro: document.iddoc,
            fecha: (new Date()).toISOString().slice(0, 19).replace('T', ' '),
            hora: (new Date()).toISOString().slice(0, 19).replace('T', ' '),
            fechadevolucion: null
        });
    } else {
        await pool.query('INSERT INTO prestamoSala set ?', {
            idusuario: user,
            iddoc: document.iddoc,
            fecha: (new Date()).toISOString().slice(0, 19).replace('T', ' '),
            hora: (new Date()).toISOString().slice(0, 19).replace('T', ' '),
            fechadevolucion: null
        });
    }

    req.flash('success', 'Prestamo registrado correctamente');
    res.redirect('/loan');
    return;
});

module.exports = router;