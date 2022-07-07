const express = require('express');
const router = express.Router();
const pool = require('../database');

const {
    isLoggedIn,
    isAdmin
} = require('../lib/auth');

router.get('/features', isAdmin, async (req, res) => {
    res.render('features');
});

router.post('/features', isAdmin, async (req, res) => {
    // console.log(req.body);
    if (req.body.request == 'services_by_day') {
        const _a = await pool.query('SELECT NoSolapin, titulodoc, Servicio.nombre FROM Servicio, usuario, usando_otros_servicios WHERE usando_otros_servicios.idusuario = usuario.idusuario AND usando_otros_servicios.idservicio = Servicio.idservicio AND usando_otros_servicios.fecha = ?', [req.body.date]);
        const _b = await pool.query('SELECT NoSolapin, Titulo FROM acervo, usuario, prestamoExterno WHERE prestamoExterno.idusuario = usuario.idusuario AND prestamoExterno.idlibro = acervo.iddoc AND prestamoExterno.fecha = ?', [req.body.date]);
        const _c = await pool.query('SELECT NoSolapin, Titulo FROM acervo, usuario, prestamoSala WHERE prestamoSala.idusuario = usuario.idusuario AND prestamoSala.iddoc= acervo.iddoc AND prestamoSala.fecha = ?', [req.body.date]);
        
        const rows = [..._a.map((x) => {
            return {
                user_id: x.NoSolapin,
                document_title: x.titulodoc,
                service_name: x.nombre
            };
        }), ..._b.map((x) => {
            return {
                user_id: x.NoSolapin,
                document_title: x.Titulo,
                service_name: 'Prestamo Externo'
            }
        }), ..._c.map((x) => {
            return {
                user_id: x.NoSolapin,
                document_title: x.Titulo,
                service_name: 'Prestamo en sala'
            }
        })];
        
        res.render('features_output', {
            title: `Servicios ofrecidos el día ${req.body.date}`,
            services_by_day: true,
            rows: rows
        })
    }
    if (req.body.request == 'services_by_group') {
        const _a1 = await pool.query('select Servicio.nombre, usando_otros_servicios.fecha from Servicio, usando_otros_servicios,grupo, usuario, alumno_tiene_grupo where usando_otros_servicios.idusuario = usuario.idusuario and usando_otros_servicios.idservicio = Servicio.idservicio and alumno_tiene_grupo.idalumno = usuario.idusuario and grupo.idgrupo = alumno_tiene_grupo.idgrupo and grupo.nombre = ? order by usando_otros_servicios.fecha', [req.body.group]);

        const _a2 = await pool.query('select usuario.nombre, usuario.apellidos, usando_otros_servicios.fecha from Servicio, usando_otros_servicios,grupo, usuario, alumno_tiene_grupo where usando_otros_servicios.idusuario = usuario.idusuario and usando_otros_servicios.idservicio = Servicio.idservicio and alumno_tiene_grupo.idalumno = usuario.idusuario and grupo.idgrupo = alumno_tiene_grupo.idgrupo and grupo.nombre = ? order by usando_otros_servicios.fecha', [req.body.group]);

        const _b1 = await pool.query('select Servicio.nombre, usando_otros_servicios.fecha from Servicio, usando_otros_servicios,grupo, usuario, profesores_tiene_grupo where usando_otros_servicios.idusuario = usuario.idusuario and usando_otros_servicios.idservicio = Servicio.idservicio and profesores_tiene_grupo.idprofesor = usuario.idusuario and grupo.idgrupo = profesores_tiene_grupo.idgrupo and grupo.nombre = ? order by usando_otros_servicios.fecha', [req.body.group]);

        const _b2 = await pool.query('select usuario.nombre, usuario.apellidos, usando_otros_servicios.fecha from Servicio, usando_otros_servicios,grupo, usuario, profesores_tiene_grupo where usando_otros_servicios.idusuario = usuario.idusuario and usando_otros_servicios.idservicio = Servicio.idservicio and profesores_tiene_grupo.idprofesor = usuario.idusuario and grupo.idgrupo = profesores_tiene_grupo.idgrupo and grupo.nombre = ? order by usando_otros_servicios.fecha', [req.body.group]);

        const _c = await pool.query('select prestamoSala.fecha, usuario.nombre, usuario.apellidos from grupo, usuario, alumno_tiene_grupo, prestamoSala where prestamoSala.idusuario= usuario.idusuario and alumno_tiene_grupo.idalumno = usuario.idusuario and grupo.idgrupo = alumno_tiene_grupo.idgrupo and grupo.nombre = ? order by prestamoSala.fecha', [req.body.group]);

        const _d = await pool.query('select prestamoSala.fecha, usuario.nombre, usuario.apellidos from grupo, usuario, profesores_tiene_grupo, prestamoSala where prestamoSala.idusuario = usuario.idusuario and profesores_tiene_grupo.idprofesor = usuario.idusuario and grupo.idgrupo = profesores_tiene_grupo.idgrupo and grupo.nombre = ? order by prestamoSala.fecha', [req.body.group]);

        const _e = await pool.query('select prestamoExterno.fecha, usuario.nombre, usuario.apellidos from grupo, usuario, alumno_tiene_grupo,  prestamoExterno where prestamoExterno.idusuario = usuario.idusuario and alumno_tiene_grupo.idalumno = usuario.idusuario and grupo.idgrupo = alumno_tiene_grupo.idgrupo and grupo.nombre = ? order by prestamoExterno.fecha', [req.body.group]);

        const _f = await pool.query('select prestamoExterno.fecha, usuario.nombre, usuario.apellidos from grupo, usuario, profesores_tiene_grupo,  prestamoExterno where prestamoExterno.idusuario = usuario.idusuario and profesores_tiene_grupo.idprofesor = usuario.idusuario and grupo.idgrupo = profesores_tiene_grupo.idgrupo and grupo.nombre = ? order by prestamoExterno.fecha', [req.body.group]);

        const rows = [
            ..._a1.map((x, i) => {
                return {
                    date: x.fecha.toISOString().slice(0, 19).replace('T', ' '),
                    service_name: x.nombre,
                    username: `${_a2[i].nombre} ${_a2[i].apellidos}`
                };
            }),
            ..._b1.map((x, i) => {
                return {
                    date: x.fecha.toISOString().slice(0, 19).replace('T', ' '),
                    service_name: x.nombre,
                    username: `${_b2[i].nombre} ${_b2[i].apellidos}`
                };
            }),
            ..._c.map((x) => {
                return {
                    date: x.fecha.toISOString().slice(0, 19).replace('T', ' '),
                    service_name: 'Prestamo de sala',
                    username: `${x.nombre} ${x.apellidos}`
                }
            }),
            ..._d.map((x) => {
                return {
                    date: x.fecha.toISOString().slice(0, 19).replace('T', ' '),
                    service_name: 'Prestamo de sala',
                    username: `${x.nombre} ${x.apellidos}`
                }
            }),
            ..._e.map((x) => {
                return {
                    date: x.fecha.toISOString().slice(0, 19).replace('T', ' '),
                    service_name: 'Prestamo externo',
                    username: `${x.nombre} ${x.apellidos}`
                }
            }),
            ..._f.map((x) => {
                return {
                    date: x.fecha.toISOString().slice(0, 19).replace('T', ' '),
                    service_name: 'Prestamo externo',
                    username: `${x.nombre} ${x.apellidos}`
                }
            }),
        ];

        res.render('features_output', {
            title: `Servicios ofrecidos al grupo ${req.body.group}`,
            services_by_group: true,
            rows: rows
        });
    }
    if (req.body.request == 'more_often_users') {
        let sumAlumno = 0;
        const _a = await pool.query('SELECT COUNT (usuario.idusuario) FROM usuario, prestamoExterno, alumno WHERE usuario.idusuario = prestamoExterno.idusuario AND usuario.idusuario = alumno.idalumno UNION SELECT COUNT (usuario.idusuario) FROM usuario, prestamoSala, alumno WHERE usuario.idusuario = prestamoSala.idusuario AND usuario.idusuario = alumno.idalumno UNION SELECT COUNT (usuario.idusuario) FROM usuario, usando_otros_servicios, alumno WHERE usuario.idusuario = usando_otros_servicios.idusuario AND usuario.idusuario = alumno.idalumno');
        for (let i = 0; i < _a.length; i++)
            sumAlumno += _a[i]['COUNT (usuario.idusuario)'];

        let sumProfesor = 0;
        const _b = await pool.query('SELECT COUNT (usuario.idusuario) FROM usuario, prestamoExterno, profesor WHERE usuario.idusuario = prestamoExterno.idusuario AND usuario.idusuario = profesor.idautor UNION SELECT COUNT (usuario.idusuario) FROM usuario, prestamoSala, profesor WHERE usuario.idusuario = prestamoSala.idusuario AND usuario.idusuario = profesor.idautor UNION SELECT COUNT (usuario.idusuario) FROM usuario, usando_otros_servicios, profesor WHERE usuario.idusuario = usando_otros_servicios.idusuario AND usuario.idusuario = profesor.idautor');
        for (let i = 0; i < _b.length; i++)
            sumProfesor += _b[i]['COUNT (usuario.idusuario)'];
        
        const _c = await pool.query('SELECT COUNT (idusuario) FROM prestamoExterno UNION SELECT COUNT (idusuario) FROM prestamoSala UNION SELECT COUNT (idusuario) FROM usando_otros_servicios');
        let sumTotal = 0;
        for (let i = 0; i < _c.length; i++)
            sumTotal += _c[i]['COUNT (idusuario)'];
        

        req.flash('success', `Alumnos ${sumAlumno / sumTotal * 100}% | Profesores: ${sumProfesor / sumTotal * 100}%`);
        res.redirect('features');
    }
});

module.exports = router;