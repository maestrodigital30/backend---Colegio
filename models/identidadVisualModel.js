// models/identidadVisualModel.js
const prisma = require('../config/prisma');

async function obtenerPorAlumno(idAlumno) {
  return prisma.tbl_alumno_identidad_visual.findUnique({
    where: { id_alumno: idAlumno },
    include: {
      avatar: true,
      personaje: true,
      marco: true,
      tbl_temas_visuales: true,
    },
  });
}

async function upsert(idAlumno, datos) {
  return prisma.tbl_alumno_identidad_visual.upsert({
    where: { id_alumno: idAlumno },
    update: { ...datos, fecha_hora_actualizacion: new Date() },
    create: { id_alumno: idAlumno, ...datos, fecha_hora_actualizacion: new Date() },
  });
}

module.exports = { obtenerPorAlumno, upsert };
