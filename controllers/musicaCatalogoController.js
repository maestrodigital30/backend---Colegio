// controllers/musicaCatalogoController.js
const model = require('../models/musicaCatalogoModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ESTILOS_MUSICA, SUBDIRS_WASABI } = require('../utils/constants');
const { guardarArchivo, reemplazarArchivo } = require('../utils/uploadHelper');
const { deleteFile } = require('../utils/storage');

const listar = async (req, res) => {
  try {
    res.json(await model.listar({ estilo: req.query.estilo }));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al listar música' }); }
};

const crear = async (req, res) => {
  try {
    const { nombre, estilo } = req.body;
    if (!nombre || !ESTILOS_MUSICA.includes(estilo)) {
      return res.status(400).json({ error: `nombre requerido y estilo en ${ESTILOS_MUSICA.join(', ')}` });
    }
    if (!req.file) return res.status(400).json({ error: 'Archivo de música requerido' });

    const ruta = await guardarArchivo(req.file, SUBDIRS_WASABI.MUSICA_FONDO, `musica_${estilo}`);
    const reg = await model.crear({
      nombre, estilo, ruta_archivo: ruta,
      nombre_archivo_original: req.file.originalname,
      tipo_mime: req.file.mimetype,
      tamano_bytes: BigInt(req.file.size),
      esta_activo: true,
    }, req.user.id);

    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_musica_fondo_catalogo', id_entidad: reg.id, tipo_accion: 'crear', datos_nuevos: { nombre, estilo } });
    res.status(201).json(reg);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Error al crear música' }); }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'Música no encontrada' });

    const datos = {};
    if (req.body.nombre) datos.nombre = req.body.nombre;
    if (req.body.estilo && ESTILOS_MUSICA.includes(req.body.estilo)) datos.estilo = req.body.estilo;
    if (typeof req.body.esta_activo === 'boolean') datos.esta_activo = req.body.esta_activo;

    if (req.file) {
      datos.ruta_archivo = await reemplazarArchivo(existente.ruta_archivo, req.file, SUBDIRS_WASABI.MUSICA_FONDO, `musica_${existente.estilo}`);
      datos.nombre_archivo_original = req.file.originalname;
      datos.tipo_mime = req.file.mimetype;
      datos.tamano_bytes = BigInt(req.file.size);
    }

    const upd = await model.actualizar(id, datos, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_musica_fondo_catalogo', id_entidad: id, tipo_accion: 'actualizar', datos_nuevos: datos });
    res.json(upd);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al actualizar música' }); }
};

const eliminar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'Música no encontrada' });
    if (existente.ruta_archivo) await deleteFile(existente.ruta_archivo);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_musica_fondo_catalogo', id_entidad: id, tipo_accion: 'eliminar' });
    res.json({ mensaje: 'Música eliminada' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al eliminar música' }); }
};

module.exports = { listar, crear, actualizar, eliminar };
