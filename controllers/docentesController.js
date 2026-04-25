const path = require('path');
const model = require('../models/docentesModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { uploadFile, deleteFile } = require('../utils/storage');

const obtenerTodos = async (req, res) => {
  try {
    res.json(await model.obtenerTodos());
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener docentes' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const docente = await model.obtenerPorId(parseInt(req.params.id));
    if (!docente) return res.status(404).json({ error: 'Docente no encontrado' });
    res.json(docente);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener docente' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombres, apellidos, correo, contrasena } = req.body;
    if (!nombres || !apellidos || !correo || !contrasena) {
      return res.status(400).json({ error: 'Campos obligatorios: nombres, apellidos, correo, contrasena' });
    }
    const resultado = await model.crear(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_perfiles_docente', id_entidad: resultado.perfil.id,
      tipo_accion: 'crear', datos_nuevos: { nombres, apellidos, correo },
    });
    res.status(201).json(resultado);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El correo ya está registrado' });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear docente' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const resultado = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_perfiles_docente', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(resultado);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El correo ya está registrado' });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar docente' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_perfiles_docente', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Docente inactivado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar docente' });
  }
};

const activar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.activar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_perfiles_docente', id_entidad: id, tipo_accion: 'activar',
    });
    res.json({ mensaje: 'Docente activado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al activar docente' });
  }
};

const subirFoto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `docente_${id}_${Date.now()}${ext}`;

    const docenteActual = await model.obtenerPorId(id);
    if (!docenteActual) return res.status(404).json({ error: 'Docente no encontrado' });

    if (docenteActual.foto_url) {
      await deleteFile(docenteActual.foto_url);
    }

    const relativePath = await uploadFile(req.file, 'docentes', filename);
    await model.actualizarFoto(id, relativePath, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_perfiles_docente', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: { accion: 'subir_foto' },
    });
    res.json({ foto_url: relativePath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al subir foto' });
  }
};

const eliminarFoto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const docenteActual = await model.obtenerPorId(id);
    if (!docenteActual) return res.status(404).json({ error: 'Docente no encontrado' });

    if (docenteActual.foto_url) {
      await deleteFile(docenteActual.foto_url);
      await model.actualizarFoto(id, null, req.user.id);
      await registrarAuditoria({
        id_usuario: req.user.id, nombre_entidad: 'tbl_perfiles_docente', id_entidad: id,
        tipo_accion: 'actualizar', datos_nuevos: { accion: 'eliminar_foto' },
      });
    }

    res.json({ mensaje: 'Foto eliminada correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar foto' });
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar, subirFoto, eliminarFoto };
