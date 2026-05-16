// controllers/triviaImagenController.js
const model = require('../models/triviaImagenModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { SUBDIRS_WASABI } = require('../utils/constants');
const { guardarArchivo } = require('../utils/uploadHelper');
const { deleteFile } = require('../utils/storage');

const listar = async (req, res) => {
  try {
    const idPartida = parseInt(req.params.idPartida);
    res.json(await model.listarPorPartida(idPartida));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al listar imágenes' }); }
};

const subir = async (req, res) => {
  try {
    const idPartida = parseInt(req.params.idPartida);
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const orden = req.body.orden != null ? parseInt(req.body.orden) : 0;

    const ruta = await guardarArchivo(req.file, SUBDIRS_WASABI.TRIVIA_IMAGENES, `partida_${idPartida}`);
    const reg = await model.crear({
      id_partida: idPartida,
      ruta_archivo: ruta,
      nombre_archivo_original: req.file.originalname,
      tipo_mime: req.file.mimetype,
      tamano_bytes: BigInt(req.file.size),
      orden,
      idUsuario: req.user.id,
    });

    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_imagenes', id_entidad: reg.id, tipo_accion: 'crear', datos_nuevos: { id_partida: idPartida } });
    res.status(201).json(reg);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Error al subir imagen' }); }
};

const eliminar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const imagen = await model.obtenerPorId(id);
    if (!imagen) return res.status(404).json({ error: 'Imagen no encontrada' });
    if (imagen.ruta_archivo) await deleteFile(imagen.ruta_archivo);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_imagenes', id_entidad: id, tipo_accion: 'eliminar' });
    res.json({ mensaje: 'Imagen eliminada' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al eliminar imagen' }); }
};

module.exports = { listar, subir, eliminar };
