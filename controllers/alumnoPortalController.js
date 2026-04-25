const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const model = require('../models/alumnoPortalModel');

const dashboard = async (req, res) => {
  try {
    const data = await model.obtenerDashboard(req.user.id_alumno);
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

const misCursos = async (req, res) => {
  try {
    const cursos = await model.obtenerMisCursos(req.user.id_alumno);
    res.json(cursos);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }
};

const misNotas = async (req, res) => {
  try {
    const notas = await model.obtenerMisNotas(req.user.id_alumno, req.query.id_curso);
    res.json(notas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

const misTrivias = async (req, res) => {
  try {
    const trivias = await model.obtenerMisTrivias(req.user.id_alumno);
    res.json(trivias);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener trivias' });
  }
};

const detalleTrivia = async (req, res) => {
  try {
    const detalle = await model.obtenerDetalleTriviaAlumno(req.user.id_alumno, req.params.idPartida);
    if (!detalle) return res.status(404).json({ error: 'Participacion no encontrada' });
    res.json(detalle);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener detalle de trivia' });
  }
};

const miAsistencia = async (req, res) => {
  try {
    const { id_curso, fecha_desde, fecha_hasta } = req.query;
    const registros = await model.obtenerMiAsistencia(req.user.id_alumno, id_curso, fecha_desde, fecha_hasta);
    res.json(registros);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener asistencia' });
  }
};

const miCarnet = async (req, res) => {
  try {
    const data = await model.obtenerMiCarnet(req.user.id_alumno);
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener carnet' });
  }
};

const miPerfil = async (req, res) => {
  try {
    const perfil = await model.obtenerMiPerfil(req.user.id_alumno);
    if (!perfil) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

const cambiarContrasena = async (req, res) => {
  try {
    const { contrasena_actual, contrasena_nueva } = req.body;
    if (!contrasena_actual || !contrasena_nueva) {
      return res.status(400).json({ error: 'Se requiere la contrasena actual y la nueva' });
    }
    if (contrasena_nueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contrasena debe tener al menos 6 caracteres' });
    }

    const usuario = await prisma.tbl_usuarios.findFirst({ where: { id: req.user.id, estado: 1 } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const coincide = await bcrypt.compare(contrasena_actual, usuario.contrasena);
    if (!coincide) return res.status(401).json({ error: 'Contrasena actual incorrecta' });

    const hash = await bcrypt.hash(contrasena_nueva, 10);
    await prisma.tbl_usuarios.update({
      where: { id: req.user.id },
      data: { contrasena: hash, id_usuario_modificacion: req.user.id, fecha_hora_modificacion: new Date() },
    });

    res.json({ mensaje: 'Contrasena actualizada correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cambiar contrasena' });
  }
};

module.exports = { dashboard, misCursos, misNotas, misTrivias, detalleTrivia, miAsistencia, miCarnet, miPerfil, cambiarContrasena };
