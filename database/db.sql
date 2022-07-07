CREATE DATABASE biblioteca;

USE biblioteca;

CREATE TABLE Servicio (
	idservicio int(11) AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(50),
	descripcion VARCHAR(250),
	disponibilidad int(11)
);

CREATE TABLE acervo (
	iddoc int(11) AUTO_INCREMENT PRIMARY KEY,
	Titulo VARCHAR(100),
	Editorial VARCHAR(50),
	Anno int(11),
	ctdadejemplarea int(11)
);
CREATE TABLE alumno (
	idalumno int(11) PRIMARY KEY
);

CREATE TABLE alumno_tiene_grupo (
	idgrupo int(11),
	idalumno int(11),
	fecha date 
);
ALTER TABLE alumno_tiene_grupo
	add PRIMARY key (idgrupo,idalumno,fecha);

CREATE TABLE asignatura (
	idasign int(11) AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(50),
	UNIQUE i_nombre (nombre);
);
CREATE TABLE autores (
	idautor int(11) AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(50)
);
CREATE TABLE grupo (
	idgrupo int(11) AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(50),
	UNIQUE i_nombre (nombre)
);

CREATE TABLE libro (
	iddoc int(11)  PRIMARY KEY,
	isbn int(11)
);
CREATE TABLE libro_tiene_autores (
	idlibro int(11),
	idautor int(11)	 
);
ALTER TABLE libro_tiene_autores
	add PRIMARY key (idlibro,idautor);
CREATE TABLE prestamoExterno (
	idusuario int(11),
	idlibro int(11),
	fecha date,
	hora time,
	fechadevolucion date	 
);
ALTER TABLE prestamoExterno
	add PRIMARY key (idusuario,idlibro,fecha,hora);
CREATE TABLE prestamoSala (
	idusuario int(11),
	iddoc int(11),
	fecha date,
	hora time,
	fechadevolucion date	 
);
ALTER TABLE prestamoSala
	add PRIMARY key (idusuario,iddoc,fecha,hora);
CREATE TABLE profesor (
	idautor int(11) AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(50)
);
CREATE TABLE profesor_imparte_asignatura (
	idasign int(11),
	idprofesor int(11)	 
);
ALTER TABLE profesor_imparte_asignatura
	add PRIMARY key (idasign,idprofesor);
CREATE TABLE profesores_tiene_grupo (
	idgrupo int(11),
	idprofesor int(11)	 
);
ALTER TABLE profesores_tiene_grupo
	add PRIMARY key (idgrupo,idprofesor);
CREATE TABLE revista (
	iddoc int(11) PRIMARY KEY,
	issn int(11),
	cantArt int(11)
);
CREATE TABLE usuario (
	idusuario int(11) AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(50),
	apellidos VARCHAR(100),
	NoSolapin int(11),
	UNIQUE i_NoSolapin (NoSolapin)
);

CREATE TABLE usando_otros_servicios (
	idusuario int(11),
	idservicio int(11),
	fecha date,
	hora time,
	ctdadsolicitudes int(10),
	titulodoc VARCHAR(100)	 
);
ALTER TABLE usando_otros_servicios
	add PRIMARY key (idusuario,idservicio,fecha,hora);

CREATE TABLE usuarios_del_sistema (
	id INT(11) AUTO_INCREMENT PRIMARY KEY,
	usuario VARCHAR(50),
	UNIQUE i_usuario (usuario),
	contrasena VARCHAR(250),
	esAdmin BOOLEAN
);

DESCRIBE Servicio;
DESCRIBE acervo ;
DESCRIBE alumno ;
DESCRIBE alumno_tiene_grupo;
DESCRIBE asignatura ;
DESCRIBE autores ;
DESCRIBE grupo ;
DESCRIBE libro  ;
DESCRIBE libro_tiene_autores ;
DESCRIBE prestamoExterno  ;
DESCRIBE prestamoSala  ;
DESCRIBE profesor;
DESCRIBE profesor_imparte_asignatura  ;
DESCRIBE profesores_tiene_grupo  ;
DESCRIBE revista   ;
DESCRIBE usando_otros_servicios  ;
DESCRIBE usuario   ;

