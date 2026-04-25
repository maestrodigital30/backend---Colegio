const model = require('../models/usuariosModel');
const { registrarAuditoria } = require('../models/auditoriaModel');

const obtenerTodos = async (req, res) => {
  try {
    const usuarios = await model.obtenerTodos();
    res.json(usuarios);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const usuario = await model.obtenerPorId(parseInt(req.params.id));
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombres, correo, contrasena, id_rol, celular } = req.body;
    if (!nombres || !correo || !contrasena || !id_rol) {
      return res.status(400).json({ error: 'Campos obligatorios: nombres, correo, contrasena, id_rol' });
    }

    const usuario = await model.crear(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_usuarios', id_entidad: usuario.id,
      tipo_accion: 'crear', datos_nuevos: { nombres, correo, id_rol },
    });
    res.status(201).json(usuario);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El correo ya está registrado' });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuario = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_usuarios', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(usuario);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El correo ya está registrado' });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_usuarios', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Usuario inactivado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar usuario' });
  }
};

const activar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.activar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_usuarios', id_entidad: id, tipo_accion: 'activar',
    });
    res.json({ mensaje: 'Usuario activado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al activar usuario' });
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar };
