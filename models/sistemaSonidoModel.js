// models/sistemaSonidoModel.js
const prisma = require('../config/prisma');

async function listar() {
  return prisma.tbl_sistema_sonidos.findMany({
    where: { estado: 1 },
    orderBy: { tipo_evento: 'asc' },
  });
}

async function obtenerPorEvento(tipoEvento) {
  return prisma.tbl_sistema_sonidos.findFirst({
    where: { tipo_evento: tipoEvento, estado: 1, esta_activo: true },
  });
}

async function upsertSonido({ tipo_evento, ruta_archivo, nombre_archivo_original, tipo_mime, tamano_bytes, idUsuario }) {
  return prisma.tbl_sistema_sonidos.upsert({
    where: { tipo_evento },
    update: {
      ruta_archivo, nombre_archivo_original, tipo_mime, tamano_bytes,
      id_usuario_modificacion: idUsuario,
      fecha_hora_modificacion: new Date(),
      esta_activo: true,
      estado: 1,
    },
    create: {
      tipo_evento, ruta_archivo, nombre_archivo_original, tipo_mime, tamano_bytes,
      id_usuario_registro: idUsuario,
      esta_activo: true,
    },
  });
}

async function obtenerPorId(id) {
  return prisma.tbl_sistema_sonidos.findUnique({ where: { id } });
}

async function inactivar(id, idUsuario) {
  return prisma.tbl_sistema_sonidos.update({
    where: { id },
    data: { estado: 0, esta_activo: false, id_usuario_modificacion: idUsuario, fecha_hora_modificacion: new Date() },
  });
}

module.exports = { listar, obtenerPorEvento, upsertSonido, obtenerPorId, inactivar };
