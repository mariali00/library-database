const express = require('express');
const router = express.Router();
const pool = require('../database');

const {
    isLoggedIn,
    isAdmin,
    isLibrarian
} = require('../lib/auth');
const { route } = require('./services');

router.get('/register_user', isAdmin, async (req, res) => {
    res.render('register_user');
});

router.post('/register_user', isAdmin, async (req, res) => {
    req.check('name', 'El nombre del usuario es requerido').notEmpty();
    req.check('lastname', 'Los apellidos del usuario son requeridos').notEmpty();
    req.check('user_id', 'El solapín debe estar compuesto por números solamente').isNumeric();
    req.check('group', 'El grupo es requerido').notEmpty();
    req.check('user_type', 'El tipo de usuario es requerido').notEmpty();

    if (req.body.user_type === 'teacher')
        req.check('course', 'Las asignaturas son requeridas').notEmpty();

    const errors = req.validationErrors();
    if (errors.length > 0) {
        req.flash('message', errors[0].msg);
        res.redirect('/register_user');
        return;
    }

    const id = parseInt(req.body.user_id);
    if ((await pool.query('SELECT NoSolapin FROM usuario WHERE NoSolapin = ?', [id])).length != 0) {
        req.flash('message', 'Ya existe un usuario que poseé este número de solapín');
        res.redirect('/register_user');
        return;
    }

    const group = await pool.query('SELECT idgrupo, nombre FROM grupo WHERE nombre = ?', [req.body.group]);
    let group_id = null;
    if (group.length == 0) {
        // insert group if is missing
        await pool.query('INSERT INTO grupo set ?', {
            nombre: req.body.group
        });
        group_id = (await pool.query('SELECT idgrupo, nombre FROM grupo WHERE nombre = ?', [req.body.group]))[0].idgrupo;
    } else {
        group_id = group[0].idgrupo;
    }

    // insert user
    let new_user_id = null;
    const user_id = parseInt(req.body.user_id);
    await pool.query('INSERT INTO usuario set ?', {
        nombre: req.body.name,
        apellidos: req.body.lastname,
        NoSolapin: user_id,
    });
    new_user_id = (await pool.query('SELECT idusuario, NoSolapin FROM usuario WHERE NoSolapin = ?', [user_id]))[0].idusuario;

    if (req.body.user_type === 'student') {
        await pool.query('INSERT INTO alumno set ?', {
            idalumno: new_user_id
        });
        await pool.query('INSERT INTO alumno_tiene_grupo set ?', {
            idgrupo: group_id,
            idalumno: new_user_id,
            fecha: (new Date()).toISOString().slice(0, 19).replace('T', ' ')
        });

        req.flash('success', 'Alumno registrado correctamente');
    } else {
        await pool.query('INSERT INTO profesor set ?', {
            idautor: new_user_id
        });
        await pool.query('INSERT INTO profesores_tiene_grupo set ?', {
            idgrupo: group_id,
            idprofesor: new_user_id,
        });

        const course = await pool.query('SELECT idasign, nombre FROM asignatura WHERE nombre = ?', [req.body.course]);
        let course_id = null;
        if (course.length == 0) {
            // insert course if is missing
            await pool.query('INSERT INTO asignatura set ?', {
                nombre: req.body.course
            });
            course_id = (await pool.query('SELECT idasign, nombre FROM asignatura WHERE nombre = ?', [req.body.course]))[0].idasign;
        } else {
            course_id = course[0].idasign;
        }

        await pool.query('INSERT INTO profesor_imparte_asignatura set ?', {
            idasign: course_id,
            idprofesor: new_user_id
        });

        req.flash('success', 'Profesor registrado correctamente');
    }

    res.redirect('/service_request');
});

router.get('/register_document', isLibrarian,async (req, res) => {
    res.render('register_document');
});

router.post('/register_document', isLibrarian, async (req, res) => {
    req.check('title', 'El titulo es requerido').notEmpty();
    req.check('editorial', 'La editorial es requerido').notEmpty();
    req.check('year', 'El año debe ser un número').isNumeric();
    req.check('count', 'La cantidad de ejemplares debe ser un número').isNumeric();
    req.check('document_type', 'El tipo de documento debe ser libro o revista').matches("(book|megazine)");
    req.check('document_identifier', 'El ISBN/ISSN es requerido').notEmpty();

    if (req.body.document_type === 'book') {
        req.check('document_identifier', 'El ISBN no es válido').isISBN();
        req.check('book_authors', 'Los autores son requeridos').notEmpty();
    }
    if (req.body.document_type === 'megazine') {
        req.check('document_identifier', 'El ISSN no es válido').isISSN();
        req.check('megazine_article_count', 'La cantidad de articulos debe ser un número').isNumeric();
    }

    const errors = req.validationErrors();
    if (errors.length > 0) {
        req.flash('message', errors[0].msg);
        res.redirect('/register_document');
        return;
    }

    const count = parseInt(req.body.count);
    const iddoc = parseInt(req.body.document_identifier.replaceAll('-', ''));
    const _ = await pool.query('SELECT acervo.iddoc, ctdadejemplarea FROM acervo, libro WHERE acervo.iddoc = libro.iddoc AND libro.isbn = ? UNION SELECT acervo.iddoc, ctdadejemplarea FROM acervo, revista WHERE acervo.iddoc = revista.iddoc AND revista.issn = ?', [iddoc, iddoc]);
    if (_.length > 0) {
        // increace documents count;
        await pool.query('UPDATE acervo set ? where iddoc = ?', [{
            ctdadejemplarea: _[0].ctdadejemplarea + count
        }, _[0].iddoc]);

        req.flash('success', 'Cantidad de libros actualizada correctamente');
        res.redirect('/register_document');
        return;
    }

    const row = await pool.query('INSERT INTO acervo set ?', {
        Titulo: req.body.title,
        Editorial: req.body.editorial,
        Anno: req.body.year,
        ctdadejemplarea: count,        
    });

    if (req.body.document_type == 'megazine') {
        await pool.query('INSERT INTO revista set ?', {
            iddoc: row.insertId,
            issn: parseInt(req.body.document_identifier.replaceAll('-', '')),
            cantArt: parseInt(req.body.megazine_article_count)
        });

        req.flash('success', 'Revista registrada correctamente');
        res.redirect('/register_document');
        return;
    } else {
        // TODO
        const book = await pool.query('INSERT INTO libro set ?', {
            iddoc: row.insertId,
            isbn: parseInt(req.body.document_identifier.replaceAll('-', '')),
        });
        
        const author = await pool.query('SELECT idautor, nombre FROM autores WHERE nombre = ?', [req.body.book_authors]);
        let author_id = null;
        if (author.length == 0) {
            // insert course if is missing
            author_id = await pool.query('INSERT INTO autores set ?', {
                nombre: req.body.book_authors
            });
            author_id = author_id.insertId;
        } else {
            author_id = author[0].idautor;
        }

        await pool.query('INSERT INTO libro_tiene_autores set ?', {
            idlibro: book.insertId,
            idautor: author_id
        });

        req.flash('success', 'Libro registrada correctamente');
        res.redirect('/register_document');
        return;
    }
});

module.exports = router;