const path = require('path');
const model = require('../models/configuracionModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { uploadFile } = require('../utils/storage');

const obtener = async (req, res) => {
  try {
    const config = await model.obtener();
    const logo = await model.obtenerLogo();
    const fondoLogin = await model.obtenerFondoLogin();
    res.json({
      configuracion: config,
      logo: logo ? logo.url_archivo : null,
      fondo_login: fondoLogin ? fondoLogin.url_archivo : null,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

const actualizar = async (req, res) => {
  try {
    const config = await model.obtener();
    if (!config) return res.status(404).json({ error: 'Configuración no encontrada' });

    const resultado = await model.actualizar(config.id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_configuracion_sistema', id_entidad: config.id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(resultado);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

const subirLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo de logo requerido' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `logo_${Date.now()}${ext}`;
    const relativePath = await uploadFile(req.file, 'logos', filename);

    const logo = await model.actualizarLogo(relativePath, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_activos_marca', id_entidad: logo.id,
      tipo_accion: 'actualizar', datos_nuevos: { url_archivo: relativePath },
    });
    res.json({ mensaje: 'Logo actualizado', url: relativePath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al subir logo' });
  }
};

const subirFondoLogin = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo de fondo requerido' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `fondo_login_${Date.now()}${ext}`;
    const relativePath = await uploadFile(req.file, 'fondos', filename);

    const fondo = await model.actualizarFondoLogin(relativePath, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_activos_marca', id_entidad: fondo.id,
      tipo_accion: 'actualizar', datos_nuevos: { url_archivo: relativePath, tipo_activo: 'fondo_login' },
    });
    res.json({ mensaje: 'Fondo de login actualizado', url: relativePath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al subir fondo de login' });
  }
};

const eliminarFondoLogin = async (req, res) => {
  try {
    await model.eliminarFondoLogin();
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_activos_marca', id_entidad: 0,
      tipo_accion: 'eliminar', datos_nuevos: { tipo_activo: 'fondo_login' },
    });
    res.json({ mensaje: 'Fondo de login eliminado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar fondo de login' });
  }
};

module.exports = { obtener, actualizar, subirLogo, subirFondoLogin, eliminarFondoLogin };
