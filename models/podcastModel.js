const prisma = require('../config/prisma');
const { parseFechaCalendario } = require('../utils/fechas');

// ─── CONFIG (Logo) ───

const obtenerConfig = async () => {
  return prisma.tbl_podcast_config.findFirst({ where: { estado: 1 } });
};

const actualizarLogo = async (logoUrl, userId) => {
  const existente = await prisma.tbl_podcast_config.findFirst({ where: { estado: 1 } });

  if (existente) {
    return prisma.tbl_podcast_config.update({
      where: { id: existente.id },
      data: {
        logo_url: logoUrl,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });
  }

  return prisma.tbl_podcast_config.create({
    data: {
      logo_url: logoUrl,
      id_usuario_registro: userId,
    },
  });
};

const quitarLogo = async (userId) => {
  const existente = await prisma.tbl_podcast_config.findFirst({ where: { estado: 1 } });
  if (!existente) return null;

  return prisma.tbl_podcast_config.update({
    where: { id: existente.id },
    data: {
      logo_url: null,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

// ─── CATEGORIAS ───

const obtenerCategorias = async () => {
  return prisma.tbl_podcast_categorias.findMany({
    where: { estado: 1 },
    orderBy: { nombre: 'asc' },
  });
};

const crearCategoria = async (nombre, userId) => {
  return prisma.tbl_podcast_categorias.create({
    data: {
      nombre,
      id_usuario_registro: userId,
    },
  });
};

const actualizarCategoria = async (id, nombre, userId) => {
  return prisma.tbl_podcast_categorias.update({
    where: { id },
    data: {
      nombre,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const inactivarCategoria = async (id, userId) => {
  return prisma.tbl_podcast_categorias.update({
    where: { id },
    data: {
      estado: 0,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

// ─── ENTRADAS (PODCASTS) ───

const obtenerTodos = async (filtros = {}) => {
  const where = { estado: 1 };
  if (filtros.id_categoria) where.id_categoria = parseInt(filtros.id_categoria);
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.busqueda) {
    where.titulo = { contains: filtros.busqueda, mode: 'insensitive' };
  }

  return prisma.tbl_podcasts.findMany({
    where,
    include: {
      tbl_podcast_categorias: { select: { id: true, nombre: true } },
    },
    orderBy: { fecha_publicacion: 'desc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_podcasts.findFirst({
    where: { id, estado: 1 },
    include: {
      tbl_podcast_categorias: { select: { id: true, nombre: true } },
    },
  });
};

const crear = async (datos, userId) => {
  return prisma.tbl_podcasts.create({
    data: {
      titulo: datos.titulo,
      descripcion: datos.descripcion || null,
      url: datos.url,
      tipo: datos.tipo,
      id_categoria: datos.id_categoria ? parseInt(datos.id_categoria) : null,
      fecha_publicacion: parseFechaCalendario(datos.fecha_publicacion) || new Date(),
      id_usuario_registro: userId,
    },
  });
};

const actualizar = async (id, datos, userId) => {
  return prisma.tbl_podcasts.update({
    where: { id },
    data: {
      titulo: datos.titulo,
      descripcion: datos.descripcion || null,
      url: datos.url,
      tipo: datos.tipo,
      id_categoria: datos.id_categoria ? parseInt(datos.id_categoria) : null,
      fecha_publicacion: datos.fecha_publicacion ? parseFechaCalendario(datos.fecha_publicacion) : undefined,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const inactivar = async (id, userId) => {
  return prisma.tbl_podcasts.update({
    where: { id },
    data: {
      estado: 0,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

module.exports = {
  obtenerConfig, actualizarLogo, quitarLogo,
  obtenerCategorias, crearCategoria, actualizarCategoria, inactivarCategoria,
  obtenerTodos, obtenerPorId, crear, actualizar, inactivar,
};
