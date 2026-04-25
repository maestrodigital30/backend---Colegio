const path = require('path');
const model = require('../models/alumnosModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES } = require('../utils/constants');
const { uploadFile, deleteFile } = require('../utils/storage');

const obtenerTodos = async (req, res) => {
  try {
    const filtros = {};
    if (req.user.rol === ROLES.DOCENTE && req.user.id_perfil_docente) {
      filtros.id_docente = req.user.id_perfil_docente;
    }
    if (req.query.id_docente && req.user.rol !== ROLES.DOCENTE) filtros.id_docente = parseInt(req.query.id_docente);
    res.json(await model.obtenerTodos(filtros));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const alumno = await model.obtenerPorId(parseInt(req.params.id));
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
    if (req.user.rol === ROLES.DOCENTE && alumno.id_docente !== req.user.id_perfil_docente) {
      return res.status(403).json({ error: 'No tiene acceso a este alumno' });
    }
    res.json(alumno);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener alumno' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombres, apellidos, dni, fecha_nacimiento, genero, direccion } = req.body;
    const faltantes = [];
    if (!nombres?.trim()) faltantes.push('nombres');
    if (!apellidos?.trim()) faltantes.push('apellidos');
    if (!dni?.trim()) faltantes.push('DNI');
    if (!fecha_nacimiento) faltantes.push('fecha de nacimiento');
    if (!genero) faltantes.push('género');
    if (!direccion?.trim()) faltantes.push('dirección');
    if (faltantes.length > 0) {
      return res.status(400).json({ error: `Campos obligatorios sin completar: ${faltantes.join(', ')}` });
    }

    const datos = { ...req.body };
    if (req.user.rol === ROLES.DOCENTE) {
      datos.id_docente = req.user.id_perfil_docente;
    }

    const alumno = await model.crear(datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_alumnos', id_entidad: alumno.id,
      tipo_accion: 'crear', datos_nuevos: { nombres, apellidos },
    });
    res.status(201).json(alumno);
  } catch (error) {
    if (error.message === 'DNI_DUPLICADO') {
      return res.status(409).json({ error: 'Ya existe un alumno con este DNI' });
    }
    if (error.message === 'CORREO_DUPLICADO') {
      return res.status(409).json({ error: 'Ya existe un usuario con este correo' });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear alumno' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const alumno = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_alumnos', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(alumno);
  } catch (error) {
    if (error.message === 'DNI_DUPLICADO') {
      return res.status(409).json({ error: 'Ya existe un alumno con este DNI' });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar alumno' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_alumnos', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Alumno inactivado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar alumno' });
  }
};

const asignarCursos = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { cursos } = req.body;
    if (!cursos || !cursos.length) return res.status(400).json({ error: 'Se requiere al menos un curso' });
    await model.asignarCursos(id, cursos, req.user.id);
    res.json({ mensaje: 'Cursos asignados correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al asignar cursos' });
  }
};

const regenerarCarnetQr = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const resultado = await model.regenerarCarnetQr(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_carnets_alumnos', id_entidad: resultado.carnet.id,
      tipo_accion: 'actualizar', datos_nuevos: { accion: 'regenerar_carnet_qr' },
    });
    res.json(resultado);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al regenerar carnet/QR' });
  }
};

const activar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.activar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_alumnos', id_entidad: id, tipo_accion: 'activar',
    });
    res.json({ mensaje: 'Alumno activado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al activar alumno' });
  }
};

const subirFoto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `alumno_${id}_${Date.now()}${ext}`;

    // Eliminar foto anterior si existe
    const alumnoActual = await model.obtenerPorId(id);
    if (alumnoActual?.foto_url) {
      await deleteFile(alumnoActual.foto_url);
    }

    const relativePath = await uploadFile(req.file, 'alumnos', filename);

    await model.actualizarFoto(id, relativePath, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_alumnos', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: { accion: 'subir_foto' },
    });
    res.json({ foto_url: relativePath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al subir foto' });
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar, asignarCursos, regenerarCarnetQr, subirFoto };
