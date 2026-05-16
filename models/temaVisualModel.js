// models/temaVisualModel.js
const prisma = require('../config/prisma');

async function listar() {
  return prisma.tbl_temas_visuales.findMany({
    where: { estado: 1, esta_activo: true },
    orderBy: { orden: 'asc' },
  });
}

async function obtenerPorCodigo(codigo) {
  return prisma.tbl_temas_visuales.findUnique({ where: { codigo } });
}

async function obtenerPorId(id) {
  return prisma.tbl_temas_visuales.findUnique({ where: { id } });
}

async function actualizar(id, datos, idUsuario) {
  return prisma.tbl_temas_visuales.update({
    where: { id },
    data: { ...datos, id_usuario_modificacion: idUsuario, fecha_hora_modificacion: new Date() },
  });
}

module.exports = { listar, obtenerPorCodigo, obtenerPorId, actualizar };
