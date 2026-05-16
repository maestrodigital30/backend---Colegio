// models/musicaCatalogoModel.js
const prisma = require('../config/prisma');

async function listar({ estilo } = {}) {
  return prisma.tbl_musica_fondo_catalogo.findMany({
    where: { estado: 1, ...(estilo ? { estilo } : {}) },
    orderBy: [{ estilo: 'asc' }, { nombre: 'asc' }],
  });
}

async function obtenerPorId(id) {
  return prisma.tbl_musica_fondo_catalogo.findUnique({ where: { id } });
}

async function crear(datos, idUsuario) {
  return prisma.tbl_musica_fondo_catalogo.create({
    data: { ...datos, id_usuario_registro: idUsuario },
  });
}

async function actualizar(id, datos, idUsuario) {
  return prisma.tbl_musica_fondo_catalogo.update({
    where: { id },
    data: { ...datos, id_usuario_modificacion: idUsuario, fecha_hora_modificacion: new Date() },
  });
}

async function inactivar(id, idUsuario) {
  return prisma.tbl_musica_fondo_catalogo.update({
    where: { id },
    data: { estado: 0, esta_activo: false, id_usuario_modificacion: idUsuario, fecha_hora_modificacion: new Date() },
  });
}

module.exports = { listar, obtenerPorId, crear, actualizar, inactivar };
