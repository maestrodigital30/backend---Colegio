const path = require('path');
const model = require('../models/podcastModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { uploadFile, deleteFile } = require('../utils/storage');

// ─── CONFIG (Logo) ───

const obtenerConfig = async (req, res) => {
  try {
    const config = await model.obtenerConfig();
    res.json({ logo_url: config?.logo_url || null });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener configuración del podcast' });
  }
};

const subirLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo de logo requerido' });

    const configActual = await model.obtenerConfig();
    if (configActual?.logo_url) {
      await deleteFile(configActual.logo_url);
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `podcast_logo_${Date.now()}${ext}`;
    const relativePath = await uploadFile(req.file, 'podcasts', filename);

    const config = await model.actualizarLogo(relativePath, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcast_config', id_entidad: config.id,
      tipo_accion: 'actualizar', datos_nuevos: { logo_url: relativePath },
    });
    res.json({ mensaje: 'Logo del podcast actualizado', logo_url: relativePath });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al subir logo del podcast' });
  }
};

const quitarLogo = async (req, res) => {
  try {
    const configActual = await model.obtenerConfig();
    if (configActual?.logo_url) {
      await deleteFile(configActual.logo_url);
    }

    await model.quitarLogo(req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcast_config', id_entidad: configActual?.id || 0,
      tipo_accion: 'actualizar', datos_nuevos: { logo_url: null },
    });
    res.json({ mensaje: 'Logo del podcast eliminado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al quitar logo' });
  }
};

// ─── CATEGORIAS ───

const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await model.obtenerCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const categoria = await model.crearCategoria(nombre.trim(), req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcast_categorias', id_entidad: categoria.id,
      tipo_accion: 'crear', datos_nuevos: { nombre },
    });
    res.status(201).json(categoria);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const categoria = await model.actualizarCategoria(id, nombre.trim(), req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcast_categorias', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: { nombre },
    });
    res.json(categoria);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

const inactivarCategoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivarCategoria(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcast_categorias', id_entidad: id,
      tipo_accion: 'inactivar', datos_nuevos: {},
    });
    res.json({ mensaje: 'Categoría inactivada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar categoría' });
  }
};

// ─── ENTRADAS ───

const obtenerTodos = async (req, res) => {
  try {
    const filtros = {
      id_categoria: req.query.id_categoria,
      tipo: req.query.tipo,
      busqueda: req.query.busqueda,
    };
    const podcasts = await model.obtenerTodos(filtros);
    res.json(podcasts);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener podcasts' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const podcast = await model.obtenerPorId(id);
    if (!podcast) return res.status(404).json({ error: 'Podcast no encontrado' });
    res.json(podcast);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener podcast' });
  }
};

const crear = async (req, res) => {
  try {
    const { titulo, url } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
    if (!url?.trim()) return res.status(400).json({ error: 'La URL es obligatoria' });

    const podcast = await model.crear(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcasts', id_entidad: podcast.id,
      tipo_accion: 'crear', datos_nuevos: req.body,
    });
    res.status(201).json(podcast);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear podcast' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, url } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
    if (!url?.trim()) return res.status(400).json({ error: 'La URL es obligatoria' });

    const podcast = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcasts', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(podcast);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar podcast' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_podcasts', id_entidad: id,
      tipo_accion: 'inactivar', datos_nuevos: {},
    });
    res.json({ mensaje: 'Podcast inactivado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar podcast' });
  }
};

module.exports = {
  obtenerConfig, subirLogo, quitarLogo,
  obtenerCategorias, crearCategoria, actualizarCategoria, inactivarCategoria,
  obtenerTodos, obtenerPorId, crear, actualizar, inactivar,
};
