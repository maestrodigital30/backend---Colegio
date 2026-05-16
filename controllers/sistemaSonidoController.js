// controllers/sistemaSonidoController.js
const model = require('../models/sistemaSonidoModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { TIPOS_EVENTO_SONIDO, SUBDIRS_WASABI } = require('../utils/constants');
const { guardarArchivo, reemplazarArchivo } = require('../utils/uploadHelper');
const { deleteFile } = require('../utils/storage');

const listar = async (_req, res) => {
  try {
    res.json(await model.listar());
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al listar sonidos del sistema' }); }
};

const subirSonido = async (req, res) => {
  try {
    const { tipo_evento } = req.body;
    if (!TIPOS_EVENTO_SONIDO.includes(tipo_evento)) {
      return res.status(400).json({ error: `tipo_evento inválido. Permitidos: ${TIPOS_EVENTO_SONIDO.join(', ')}` });
    }
    if (!req.file) return res.status(400).json({ error: 'Archivo de audio requerido' });

    const existente = await model.obtenerPorEvento(tipo_evento);
    const ruta = existente
      ? await reemplazarArchivo(existente.ruta_archivo, req.file, SUBDIRS_WASABI.SISTEMA_SONIDOS, `sonido_${tipo_evento}`)
      : await guardarArchivo(req.file, SUBDIRS_WASABI.SISTEMA_SONIDOS, `sonido_${tipo_evento}`);

    const sonido = await model.upsertSonido({
      tipo_evento,
      ruta_archivo: ruta,
      nombre_archivo_original: req.file.originalname,
      tipo_mime: req.file.mimetype,
      tamano_bytes: BigInt(req.file.size),
      idUsuario: req.user.id,
    });

    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_sistema_sonidos',
      id_entidad: sonido.id,
      tipo_accion: existente ? 'actualizar' : 'crear',
      datos_nuevos: { tipo_evento, ruta_archivo: ruta },
    });

    res.status(existente ? 200 : 201).json(sonido);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Error al subir sonido' });
  }
};

const eliminarSonido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const sonido = await model.obtenerPorId(id);
    if (!sonido) return res.status(404).json({ error: 'Sonido no encontrado' });
    if (sonido.ruta_archivo) await deleteFile(sonido.ruta_archivo);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_sistema_sonidos', id_entidad: id, tipo_accion: 'eliminar',
    });
    res.json({ mensaje: 'Sonido eliminado' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al eliminar sonido' }); }
};

module.exports = { listar, subirSonido, eliminarSonido };
