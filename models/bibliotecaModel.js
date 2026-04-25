const prisma = require('../config/prisma');

// --- CATEGORIAS ---

const obtenerCategorias = async () => {
  return prisma.tbl_biblioteca_categorias.findMany({
    where: { estado: 1 },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  });
};

const crearCategoria = async (datos, userId) => {
  return prisma.tbl_biblioteca_categorias.create({
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion || null,
      icono: datos.icono || null,
      color: datos.color || null,
      orden: datos.orden || 0,
      id_usuario_registro: userId,
    },
  });
};

const actualizarCategoria = async (id, datos, userId) => {
  return prisma.tbl_biblioteca_categorias.update({
    where: { id },
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion || null,
      icono: datos.icono || null,
      color: datos.color || null,
      orden: datos.orden !== undefined ? datos.orden : undefined,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const inactivarCategoria = async (id, userId) => {
  return prisma.tbl_biblioteca_categorias.update({
    where: { id },
    data: {
      estado: 0,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

// --- MATERIALES ---

const obtenerTodos = async (filtros = {}) => {
  const where = { estado: 1 };
  if (filtros.id_categoria) where.id_categoria = parseInt(filtros.id_categoria);
  if (filtros.extension) where.extension = filtros.extension;
  if (filtros.busqueda) {
    where.OR = [
      { titulo: { contains: filtros.busqueda, mode: 'insensitive' } },
      { descripcion: { contains: filtros.busqueda, mode: 'insensitive' } },
      { nombre_archivo_original: { contains: filtros.busqueda, mode: 'insensitive' } },
    ];
  }

  return prisma.tbl_biblioteca_materiales.findMany({
    where,
    include: {
      tbl_biblioteca_categorias: { select: { id: true, nombre: true, icono: true, color: true } },
    },
    orderBy: { fecha_hora_registro: 'desc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_biblioteca_materiales.findFirst({
    where: { id, estado: 1 },
    include: {
      tbl_biblioteca_categorias: { select: { id: true, nombre: true, icono: true, color: true } },
    },
  });
};

const crear = async (datos, userId) => {
  return prisma.tbl_biblioteca_materiales.create({
    data: {
      id_categoria: datos.id_categoria ? parseInt(datos.id_categoria) : null,
      titulo: datos.titulo,
      descripcion: datos.descripcion || null,
      nombre_archivo_original: datos.nombre_archivo_original,
      ruta_archivo: datos.ruta_archivo,
      tipo_mime: datos.tipo_mime,
      extension: datos.extension,
      tamano_bytes: BigInt(datos.tamano_bytes),
      id_usuario_registro: userId,
    },
    include: {
      tbl_biblioteca_categorias: { select: { id: true, nombre: true, icono: true, color: true } },
    },
  });
};

const actualizar = async (id, datos, userId) => {
  return prisma.tbl_biblioteca_materiales.update({
    where: { id },
    data: {
      titulo: datos.titulo,
      descripcion: datos.descripcion || null,
      id_categoria: datos.id_categoria ? parseInt(datos.id_categoria) : null,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
    include: {
      tbl_biblioteca_categorias: { select: { id: true, nombre: true, icono: true, color: true } },
    },
  });
};

const inactivar = async (id, userId) => {
  return prisma.tbl_biblioteca_materiales.update({
    where: { id },
    data: {
      estado: 0,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const incrementarDescargas = async (id) => {
  return prisma.tbl_biblioteca_materiales.update({
    where: { id },
    data: { total_descargas: { increment: 1 } },
  });
};

module.exports = {
  obtenerCategorias, crearCategoria, actualizarCategoria, inactivarCategoria,
  obtenerTodos, obtenerPorId, crear, actualizar, inactivar, incrementarDescargas,
};
