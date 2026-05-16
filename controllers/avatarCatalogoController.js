// controllers/avatarCatalogoController.js
const model = require('../models/avatarCatalogoModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { TIPOS_AVATAR_CATALOGO, SUBDIRS_WASABI } = require('../utils/constants');
const { guardarArchivo, reemplazarArchivo } = require('../utils/uploadHelper');
const { deleteFile } = require('../utils/storage');

const listar = async (req, res) => {
  try {
    const tipo = req.query.tipo;
    if (tipo && !TIPOS_AVATAR_CATALOGO.includes(tipo)) {
      return res.status(400).json({ error: `tipo debe ser uno de ${TIPOS_AVATAR_CATALOGO.join(', ')}` });
    }
    res.json(await model.listar({ tipo }));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al listar avatares' }); }
};

const obtenerDefault = async (req, res) => {
  try {
    const tipo = req.params.tipo;
    if (!TIPOS_AVATAR_CATALOGO.includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });
    const item = await model.obtenerDefault(tipo);
    res.json(item || null);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener default' }); }
};

const crear = async (req, res) => {
  try {
    const { tipo, nombre, orden, es_default } = req.body;
    if (!TIPOS_AVATAR_CATALOGO.includes(tipo) || !nombre) {
      return res.status(400).json({ error: `tipo y nombre requeridos` });
    }
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const ruta = await guardarArchivo(req.file, `${SUBDIRS_WASABI.AVATARES}/${tipo}`, `${tipo}`);
    const reg = await model.crear({
      tipo, nombre,
      ruta_archivo: ruta,
      nombre_archivo_original: req.file.originalname,
      tipo_mime: req.file.mimetype,
      orden: orden != null ? parseInt(orden) : 0,
      es_default: es_default === 'true' || es_default === true,
      esta_activo: true,
    }, req.user.id);

    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_avatares_catalogo', id_entidad: reg.id, tipo_accion: 'crear', datos_nuevos: { tipo, nombre } });
    res.status(201).json(reg);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Error al crear' }); }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'No encontrado' });

    const datos = {};
    if (req.body.nombre) datos.nombre = req.body.nombre;
    if (req.body.orden != null) datos.orden = parseInt(req.body.orden);
    if (req.body.es_default !== undefined) datos.es_default = req.body.es_default === 'true' || req.body.es_default === true;
    if (req.body.esta_activo !== undefined) datos.esta_activo = req.body.esta_activo === 'true' || req.body.esta_activo === true;
    if (req.file) {
      datos.ruta_archivo = await reemplazarArchivo(existente.ruta_archivo, req.file, `${SUBDIRS_WASABI.AVATARES}/${existente.tipo}`, existente.tipo);
      datos.nombre_archivo_original = req.file.originalname;
      datos.tipo_mime = req.file.mimetype;
    }

    const upd = await model.actualizar(id, datos, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_avatares_catalogo', id_entidad: id, tipo_accion: 'actualizar', datos_nuevos: datos });
    res.json(upd);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al actualizar' }); }
};

const eliminar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'No encontrado' });
    if (existente.ruta_archivo) await deleteFile(existente.ruta_archivo);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_avatares_catalogo', id_entidad: id, tipo_accion: 'eliminar' });
    res.json({ mensaje: 'Eliminado' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al eliminar' }); }
};

module.exports = { listar, obtenerDefault, crear, actualizar, eliminar };
