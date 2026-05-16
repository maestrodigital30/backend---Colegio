// models/triviaImagenModel.js
const prisma = require('../config/prisma');

async function listarPorPartida(idPartida) {
  return prisma.tbl_trivia_imagenes.findMany({
    where: { id_partida: idPartida, estado: 1 },
    orderBy: { orden: 'asc' },
  });
}

async function crear({ id_partida, ruta_archivo, nombre_archivo_original, tipo_mime, tamano_bytes, orden, idUsuario }) {
  return prisma.tbl_trivia_imagenes.create({
    data: { id_partida, ruta_archivo, nombre_archivo_original, tipo_mime, tamano_bytes, orden, id_usuario_registro: idUsuario },
  });
}

async function obtenerPorId(id) {
  return prisma.tbl_trivia_imagenes.findUnique({ where: { id } });
}

async function inactivar(id, idUsuario) {
  return prisma.tbl_trivia_imagenes.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: idUsuario, fecha_hora_modificacion: new Date() },
  });
}

module.exports = { listarPorPartida, crear, obtenerPorId, inactivar };
