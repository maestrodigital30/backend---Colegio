// models/avatarCatalogoModel.js
const prisma = require('../config/prisma');

async function listar({ tipo, soloActivos = true } = {}) {
  return prisma.tbl_avatares_catalogo.findMany({
    where: {
      estado: 1,
      ...(tipo ? { tipo } : {}),
      ...(soloActivos ? { esta_activo: true } : {}),
    },
    orderBy: [{ tipo: 'asc' }, { orden: 'asc' }, { nombre: 'asc' }],
  });
}

async function obtenerPorId(id) {
  return prisma.tbl_avatares_catalogo.findUnique({ where: { id } });
}

async function obtenerDefault(tipo) {
  return prisma.tbl_avatares_catalogo.findFirst({
    where: { tipo, es_default: true, esta_activo: true, estado: 1 },
  });
}

async function crear(datos, idUsuario) {
  if (datos.es_default) {
    await prisma.tbl_avatares_catalogo.updateMany({
      where: { tipo: datos.tipo, es_default: true },
      data: { es_default: false },
    });
  }
  return prisma.tbl_avatares_catalogo.create({ data: { ...datos, id_usuario_registro: idUsuario } });
}

async function actualizar(id, datos, idUsuario) {
  if (datos.es_default) {
    const actual = await obtenerPorId(id);
    if (actual) {
      await prisma.tbl_avatares_catalogo.updateMany({
        where: { tipo: actual.tipo, es_default: true, id: { not: id } },
        data: { es_default: false },
      });
    }
  }
  return prisma.tbl_avatares_catalogo.update({
    where: { id },
    data: { ...datos, id_usuario_modificacion: idUsuario, fecha_hora_modificacion: new Date() },
  });
}

async function inactivar(id, idUsuario) {
  return prisma.tbl_avatares_catalogo.update({
    where: { id },
    data: { estado: 0, esta_activo: false, id_usuario_modificacion: idUsuario, fecha_hora_modificacion: new Date() },
  });
}

module.exports = { listar, obtenerPorId, obtenerDefault, crear, actualizar, inactivar };
