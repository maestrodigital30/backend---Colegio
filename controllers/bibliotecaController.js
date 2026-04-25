const path = require('path');
const model = require('../models/bibliotecaModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { uploadFile, deleteFile } = require('../utils/storage');

// --- CATEGORIAS ---

const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await model.obtenerCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener categorias de biblioteca' });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const categoria = await model.crearCategoria(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_biblioteca_categorias', id_entidad: categoria.id,
      tipo_accion: 'crear', datos_nuevos: { nombre },
    });
    res.status(201).json(categoria);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear categoria' });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const categoria = await model.actualizarCategoria(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_biblioteca_categorias', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: { nombre },
    });
    res.json(categoria);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar categoria' });
  }
};

const inactivarCategoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivarCategoria(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_biblioteca_categorias', id_entidad: id,
      tipo_accion: 'inactivar', datos_nuevos: {},
    });
    res.json({ mensaje: 'Categoria inactivada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar categoria' });
  }
};

// --- MATERIALES ---

const obtenerTodos = async (req, res) => {
  try {
    const filtros = {
      id_categoria: req.query.id_categoria,
      extension: req.query.extension,
      busqueda: req.query.busqueda,
    };
    const materiales = await model.obtenerTodos(filtros);
    const resultado = materiales.map(m => ({
      ...m,
      tamano_bytes: m.tamano_bytes.toString(),
    }));
    res.json(resultado);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const material = await model.obtenerPorId(id);
    if (!material) return res.status(404).json({ error: 'Material no encontrado' });
    res.json({ ...material, tamano_bytes: material.tamano_bytes.toString() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener material' });
  }
};

const crear = async (req, res) => {
  try {
    const { titulo, url } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El titulo es obligatorio' });

    const datos = {
      id_categoria: req.body.id_categoria || null,
      titulo: titulo.trim(),
      descripcion: req.body.descripcion || null,
    };

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      // En modo local, multer diskStorage ya asigno req.file.filename; en wasabi (memoryStorage) generamos uno
      const filename = req.file.filename || `biblioteca_${Date.now()}${ext}`;
      const ruta = await uploadFile(req.file, 'biblioteca', filename);

      Object.assign(datos, {
        nombre_archivo_original: req.file.originalname,
        ruta_archivo: ruta,
        tipo_mime: req.file.mimetype,
        extension: ext.replace('.', ''),
        tamano_bytes: req.file.size,
      });
    } else if (url?.trim()) {
      const trimmedUrl = url.trim();
      try {
        const parsed = new URL(trimmedUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return res.status(400).json({ error: 'La URL debe comenzar con http o https' });
        }
      } catch {
        return res.status(400).json({ error: 'URL invalida' });
      }

      Object.assign(datos, {
        nombre_archivo_original: trimmedUrl,
        ruta_archivo: trimmedUrl,
        tipo_mime: 'enlace/video',
        extension: 'enlace',
        tamano_bytes: 0,
      });
    } else {
      return res.status(400).json({ error: 'Selecciona un archivo o ingresa una URL' });
    }

    const material = await model.crear(datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_biblioteca_materiales', id_entidad: material.id,
      tipo_accion: 'crear', datos_nuevos: { titulo, archivo: datos.nombre_archivo_original },
    });
    res.status(201).json({ ...material, tamano_bytes: material.tamano_bytes.toString() });
  } catch (error) {
    console.error('Error al subir material:', error);
    const detalle = error.Code === 'PoorAccountStanding'
      ? 'El servicio de almacenamiento no esta disponible. Contacta al administrador.'
      : error.message;
    res.status(500).json({ error: 'Error al subir material', detalle });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: 'El titulo es obligatorio' });

    const material = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_biblioteca_materiales', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: { titulo },
    });
    res.json({ ...material, tamano_bytes: material.tamano_bytes.toString() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar material' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const material = await model.obtenerPorId(id);
    // No intentar borrar si es un enlace externo
    if (material?.ruta_archivo && material.extension !== 'enlace') {
      await deleteFile(material.ruta_archivo);
    }
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_biblioteca_materiales', id_entidad: id,
      tipo_accion: 'inactivar', datos_nuevos: {},
    });
    res.json({ mensaje: 'Material eliminado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar material' });
  }
};

const descargar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const material = await model.obtenerPorId(id);
    if (!material) return res.status(404).json({ error: 'Material no encontrado' });

    await model.incrementarDescargas(id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_biblioteca_materiales', id_entidad: id,
      tipo_accion: 'otro', datos_nuevos: { accion: 'descarga' },
    });

    if (material.extension === 'enlace') {
      return res.redirect(material.ruta_archivo);
    }
    res.redirect(`/uploads/${material.ruta_archivo}`);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al descargar material' });
  }
};

module.exports = {
  obtenerCategorias, crearCategoria, actualizarCategoria, inactivarCategoria,
  obtenerTodos, obtenerPorId, crear, actualizar, inactivar, descargar,
};
