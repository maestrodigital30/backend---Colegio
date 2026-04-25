const prisma = require('../config/prisma');

const obtenerTodos = async (filtros = {}) => {
  const where = {};
  if (filtros.id_docente) where.id_docente = filtros.id_docente;
  if (filtros.id_periodo_escolar) where.id_periodo_escolar = filtros.id_periodo_escolar;

  return prisma.tbl_cursos.findMany({
    where,
    include: {
      tbl_perfiles_docente: { select: { id: true, nombres: true, apellidos: true, tbl_usuarios: { select: { id: true, nombres: true, apellidos: true, correo: true } } } },
      tbl_periodos_escolares: { select: { id: true, nombre: true } },
      _count: { select: { tbl_alumnos_cursos: { where: { estado: 1 } } } },
    },
    orderBy: { nombre: 'asc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_cursos.findFirst({
    where: { id },
    include: {
      tbl_perfiles_docente: { select: { id: true, nombres: true, apellidos: true, tbl_usuarios: { select: { id: true, nombres: true, apellidos: true, correo: true } } } },
      tbl_periodos_escolares: { select: { id: true, nombre: true } },
      tbl_alumnos_cursos: {
        where: { estado: 1 },
        include: { tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } } },
      },
    },
  });
};

const crear = async (datos, userId) => {
  const data = {
    id_periodo_escolar: datos.id_periodo_escolar,
    nombre: datos.nombre,
    descripcion: datos.descripcion || null,
    grado: datos.grado || null,
    seccion: datos.seccion || null,
    id_usuario_registro: userId,
  };
  if (datos.id_docente != null) data.id_docente = parseInt(datos.id_docente);
  return prisma.tbl_cursos.create({ data });
};

const actualizar = async (id, datos, userId) => {
  const data = {
    nombre: datos.nombre,
    descripcion: datos.descripcion || null,
    grado: datos.grado || null,
    seccion: datos.seccion || null,
    id_periodo_escolar: datos.id_periodo_escolar,
    id_usuario_modificacion: userId,
    fecha_hora_modificacion: new Date(),
  };
  if (datos.id_docente != null) data.id_docente = parseInt(datos.id_docente);
  return prisma.tbl_cursos.update({ where: { id }, data });
};

const inactivar = async (id, userId) => {
  return prisma.tbl_cursos.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

const activar = async (id, userId) => {
  return prisma.tbl_cursos.update({
    where: { id },
    data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar };
