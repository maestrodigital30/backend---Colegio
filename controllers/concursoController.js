const path = require('path');
const model = require('../models/concursoModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { uploadFile, deleteFile } = require('../utils/storage');
const {
  validarPayloadConcurso,
  validarPayloadPregunta,
  validarArchivoMultimedia,
  inferirTipoMultimedia,
} = require('../validators/concursoValidators');
const { CONCURSOS } = require('../utils/constants');

const SUBDIR_MULTIMEDIA = 'concursos';

// ===== CONCURSOS =====
const listar = async (req, res) => {
  try {
    const filtros = {
      solo_publicados: false,
      id_curso: req.query.id_curso,
      busqueda: req.query.busqueda,
    };
    res.json(await model.listar(filtros));
  } catch (error) {
    console.error('Error listar concursos:', error);
    res.status(500).json({ error: 'Error al listar concursos' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const concurso = await model.obtenerPorId(id);
    if (!concurso) return res.status(404).json({ error: 'Concurso no encontrado' });
    res.json(concurso);
  } catch (error) {
    console.error('Error obtener concurso:', error);
    res.status(500).json({ error: 'Error al obtener concurso' });
  }
};

const crear = async (req, res) => {
  try {
    const errores = validarPayloadConcurso(req.body, { esCreacion: true });
    if (errores.length) return res.status(400).json({ error: errores.join('; ') });

    const concurso = await model.crear(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concursos', id_entidad: concurso.id,
      tipo_accion: 'crear', datos_nuevos: { titulo: concurso.titulo },
    });
    res.status(201).json(concurso);
  } catch (error) {
    console.error('Error crear concurso:', error);
    res.status(500).json({ error: 'Error al crear concurso' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const errores = validarPayloadConcurso(req.body, { esCreacion: false });
    if (errores.length) return res.status(400).json({ error: errores.join('; ') });

    const concurso = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concursos', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(concurso);
  } catch (error) {
    console.error('Error actualizar concurso:', error);
    res.status(500).json({ error: 'Error al actualizar concurso' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Limpieza de multimedia: concurso, preguntas y opciones
    const detalle = await model.obtenerPorId(id);
    if (detalle) {
      await safeDeleteUpload(detalle.multimedia_url);
      for (const p of detalle.tbl_concurso_preguntas || []) {
        await safeDeleteUpload(p.multimedia_url);
        for (const o of p.tbl_concurso_opciones || []) {
          await safeDeleteUpload(o.multimedia_url);
        }
      }
    }

    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concursos', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Concurso inactivado' });
  } catch (error) {
    console.error('Error inactivar concurso:', error);
    res.status(500).json({ error: 'Error al inactivar concurso' });
  }
};

const cambiarPublicacion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { publicado } = req.body;

    if (publicado) {
      const preguntas = await model.listarPreguntas(id);
      if (preguntas.length < CONCURSOS.MIN_PREGUNTAS_PARA_PUBLICAR) {
        return res.status(400).json({
          error: `El concurso debe tener al menos ${CONCURSOS.MIN_PREGUNTAS_PARA_PUBLICAR} pregunta(s) valida(s) antes de publicarse`,
        });
      }
      for (const p of preguntas) {
        const opciones = p.tbl_concurso_opciones.filter((o) => o.estado === 1);
        if (opciones.length < CONCURSOS.MIN_OPCIONES) {
          return res.status(400).json({
            error: `La pregunta "${p.texto.slice(0, 40)}" no tiene suficientes opciones (min ${CONCURSOS.MIN_OPCIONES})`,
          });
        }
        if (!opciones.some((o) => o.es_correcta)) {
          return res.status(400).json({
            error: `La pregunta "${p.texto.slice(0, 40)}" no tiene una opcion correcta`,
          });
        }
      }
    }

    const concurso = await model.publicar(id, publicado, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concursos', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: { publicado: !!publicado },
    });
    res.json(concurso);
  } catch (error) {
    console.error('Error cambiar publicacion:', error);
    res.status(500).json({ error: 'Error al cambiar publicacion' });
  }
};

// ===== PREGUNTAS =====
const listarPreguntas = async (req, res) => {
  try {
    const idConcurso = parseInt(req.params.idConcurso);
    res.json(await model.listarPreguntas(idConcurso));
  } catch (error) {
    console.error('Error listar preguntas:', error);
    res.status(500).json({ error: 'Error al listar preguntas' });
  }
};

const crearPregunta = async (req, res) => {
  try {
    const errores = validarPayloadPregunta(req.body, { esCreacion: true });
    if (errores.length) return res.status(400).json({ error: errores.join('; ') });

    const pregunta = await model.crearPregunta(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concurso_preguntas', id_entidad: pregunta.id,
      tipo_accion: 'crear', datos_nuevos: { id_concurso: req.body.id_concurso },
    });
    res.status(201).json(pregunta);
  } catch (error) {
    console.error('Error crear pregunta:', error);
    res.status(500).json({ error: 'Error al crear pregunta' });
  }
};

const actualizarPregunta = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const errores = validarPayloadPregunta(req.body, { esCreacion: false });
    if (errores.length) return res.status(400).json({ error: errores.join('; ') });

    const pregunta = await model.actualizarPregunta(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concurso_preguntas', id_entidad: id, tipo_accion: 'actualizar',
    });
    res.json(pregunta);
  } catch (error) {
    console.error('Error actualizar pregunta:', error);
    res.status(500).json({ error: 'Error al actualizar pregunta' });
  }
};

const inactivarPregunta = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await safeDeleteUpload(await model.obtenerMultimediaUrlPregunta(id));

    await model.inactivarPregunta(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concurso_preguntas', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Pregunta inactivada' });
  } catch (error) {
    console.error('Error inactivar pregunta:', error);
    res.status(500).json({ error: 'Error al inactivar pregunta' });
  }
};

const reordenarPreguntas = async (req, res) => {
  try {
    const idConcurso = parseInt(req.params.idConcurso);
    const { orden } = req.body;
    if (!Array.isArray(orden)) return res.status(400).json({ error: 'orden debe ser un arreglo de ids' });
    const preguntas = await model.reordenarPreguntas(idConcurso, orden, req.user.id);
    res.json(preguntas);
  } catch (error) {
    console.error('Error reordenar preguntas:', error);
    res.status(500).json({ error: 'Error al reordenar preguntas' });
  }
};

// ===== MULTIMEDIA =====
const subirMultimedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio archivo' });
    const errores = validarArchivoMultimedia(req.file);
    if (errores.length) return res.status(400).json({ error: errores.join('; ') });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `concurso_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
    const relativePath = await uploadFile(req.file, SUBDIR_MULTIMEDIA, filename);
    const tipo = inferirTipoMultimedia(req.file.originalname);
    res.status(201).json({ url: relativePath, tipo });
  } catch (error) {
    console.error('Error subir multimedia:', error);
    res.status(500).json({ error: 'Error al subir multimedia' });
  }
};

const eliminarMultimedia = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url es obligatoria' });
    await safeDeleteUpload(url);
    res.json({ mensaje: 'Archivo eliminado' });
  } catch (error) {
    console.error('Error eliminar multimedia:', error);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
};

async function safeDeleteUpload(url) {
  if (!url) return;
  try {
    await deleteFile(url);
  } catch (err) {
    console.warn('No se pudo eliminar archivo:', url, err.message);
  }
}

module.exports = {
  listar, obtenerPorId, crear, actualizar, inactivar, cambiarPublicacion,
  listarPreguntas, crearPregunta, actualizarPregunta, inactivarPregunta, reordenarPreguntas,
  subirMultimedia, eliminarMultimedia,
};
