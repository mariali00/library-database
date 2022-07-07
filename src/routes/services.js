const express = require('express');
const router = express.Router();
const pool = require('../database');

const {
    isLoggedIn,
    isAdmin
} = require('../lib/auth');

router.get('/services', isAdmin, async (req, res) => {
    const rows = await pool.query('SELECT * FROM Servicio');

    res.render('services', {
        rows: rows.map((x) => {
            return {
                name: x.nombre,
                description: x.descripcion,
                availability: (x.disponibilidad == 0 ? 'Profesores' : (x.disponibilidad == 1 ? 'Estudiantes' : 'Todos'))
            }
        }),
        empty: rows.length > 0 ? false : true
    });
});

router.get('/service_request', isAdmin, async (req, res) => {
    const rows = await pool.query('SELECT * FROM Servicio');

    res.render('service_request', {
        services_list: rows.map((x) => {
            return {
                name: x.nombre
            };
        })
    });
});

router.post('/service_request', isAdmin, async (req, res) => {  
    req.check('user', 'El número del solapín no es válido').isNumeric();
    req.check('doc_title', 'El titulo del documento es requerido').notEmpty();
    req.check('count', 'La cantidad de solicitudes debe ser un número').isNumeric();

    const errors = req.validationErrors();
    if (errors.length > 0) {
        req.flash('message', errors[0].msg);
        res.redirect('/service_request');
        return;
    }    
    const count = parseInt(req.body.count);
    const user_id = parseInt(req.body.user);

    const user = await pool.query('SELECT * FROM usuario WHERE NoSolapin = ?', [user_id]);
    if (user.length == 0) {
        req.flash('message', 'El número del solapín ingresado no corresponde a ningun usuario registrado');
        res.redirect('/service_request');
        return;
    }

    const service = await pool.query('SELECT * FROM Servicio WHERE nombre = ?', [req.body.service]);
    if (service.length == 0) {
        req.flash('message', 'Este servicio no está regonocido');
        res.redirect('/service_request');
        return;
    }
    const now = (new Date()).toISOString().slice(0, 19).replace('T', ' ');

    if (req.body.service == 'Impresion') {
        const _ = await pool.query('SELECT ctdadsolicitudes FROM usando_otros_servicios WHERE usando_otros_servicios.idservicio = ? AND usando_otros_servicios.fecha = ?', [service[0].idservicio, now.slice(0, now.indexOf(' '))]);
        let sum = 0;
        for (let i = 0; i < _.length; i++)
            sum += _[i].ctdadsolicitudes;

        if ((await pool.query('SELECT idalumno FROM alumno WHERE idalumno = ?', [user[0].idusuario])).length > 0 &&
            sum + count > 60) {
            req.flash('message', 'Los alumnos solo pueden imprimir hasta 60 cuartillas diariamente');
            res.redirect('/service_request');
            return;
        } else if (sum + count > 100) {
            req.flash('message', 'Los profesores solo pueden imprimir hasta 100 cuartillas diariamente');
            res.redirect('/service_request');
            return;
        }
    }   
    const newServiceRequest = {
        idusuario: user[0].idusuario,
        idservicio: service[0].idservicio,
        fecha: now,
        hora: now,
        ctdadsolicitudes: count,
        titulodoc: req.body.doc_title
    };
    await pool.query('INSERT INTO usando_otros_servicios set ?', [newServiceRequest]);

    req.flash('success', 'Pedición almacenada correctamente');
    res.redirect('/service_request');
});

module.exports = router;