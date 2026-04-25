const prisma = require('../config/prisma');

const obtenerTodos = async () => {
  return prisma.tbl_periodos_escolares.findMany({
    orderBy: { fecha_inicio: 'desc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_periodos_escolares.findFirst({ where: { id, estado: 1 } });
};

const crear = async (datos, userId) => {
  return prisma.tbl_periodos_escolares.create({
    data: {
      nombre: datos.nombre,
      anio: datos.anio || null,
      fecha_inicio: new Date(datos.fecha_inicio),
      fecha_fin: new Date(datos.fecha_fin),
      id_usuario_registro: userId,
    },
  });
};

const actualizar = async (id, datos, userId) => {
  return prisma.tbl_periodos_escolares.update({
    where: { id },
    data: {
      nombre: datos.nombre,
      anio: datos.anio || null,
      fecha_inicio: new Date(datos.fecha_inicio),
      fecha_fin: new Date(datos.fecha_fin),
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const inactivar = async (id, userId) => {
  return prisma.tbl_periodos_escolares.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

const activar = async (id, userId) => {
  return prisma.tbl_periodos_escolares.update({
    where: { id },
    data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar };
