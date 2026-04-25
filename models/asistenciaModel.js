const prisma = require('../config/prisma');
const { ESTADOS_ASISTENCIA, MODOS_REGISTRO_ASISTENCIA } = require('../utils/constants');

const obtenerSesion = async (idCurso, fecha) => {
  return prisma.tbl_sesiones_asistencia.findFirst({
    where: {
      id_curso: idCurso,
      fecha_asistencia: new Date(fecha),
      estado: 1,
    },
    include: {
      tbl_registros_asistencia: {
        where: { estado: 1 },
        include: { tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } } },
      },
    },
  });
};

const crearOObtenerSesion = async (idCurso, idDocente, idPeriodoEscolar, fecha, userId) => {
  const existente = await prisma.tbl_sesiones_asistencia.findFirst({
    where: { id_curso: idCurso, fecha_asistencia: new Date(fecha), estado: 1 },
  });

  if (existente) return existente;

  const data = {
    id_curso: idCurso,
    id_periodo_escolar: idPeriodoEscolar,
    fecha_asistencia: new Date(fecha),
    id_usuario_registro: userId,
  };
  if (idDocente != null) data.id_docente = parseInt(idDocente);
  return prisma.tbl_sesiones_asistencia.create({ data });
};

const registrarAsistencia = async (idSesion, idAlumno, estadoAsistencia, modoRegistro, userId) => {
  const existente = await prisma.tbl_registros_asistencia.findFirst({
    where: { id_sesion_asistencia: idSesion, id_alumno: idAlumno, estado: 1 },
  });

  if (existente) {
    return { duplicado: true, registro: existente };
  }

  const registro = await prisma.tbl_registros_asistencia.create({
    data: {
      id_sesion_asistencia: idSesion,
      id_alumno: idAlumno,
      estado_asistencia: estadoAsistencia,
      modo_registro: modoRegistro,
      id_usuario_registro: userId,
    },
  });

  return { duplicado: false, registro };
};

const registrarAsistenciaManualMasiva = async (idSesion, registros, userId) => {
  return prisma.$transaction(async (tx) => {
    const resultados = [];
    for (const reg of registros) {
      const existente = await tx.tbl_registros_asistencia.findFirst({
        where: { id_sesion_asistencia: idSesion, id_alumno: reg.id_alumno, estado: 1 },
      });

      if (existente) {
        const actualizado = await tx.tbl_registros_asistencia.update({
          where: { id: existente.id },
          data: {
            estado_asistencia: reg.estado_asistencia,
            id_usuario_modificacion: userId,
            fecha_hora_modificacion: new Date(),
          },
        });
        resultados.push(actualizado);
      } else {
        const nuevo = await tx.tbl_registros_asistencia.create({
          data: {
            id_sesion_asistencia: idSesion,
            id_alumno: reg.id_alumno,
            estado_asistencia: reg.estado_asistencia,
            modo_registro: MODOS_REGISTRO_ASISTENCIA.MANUAL,
            id_usuario_registro: userId,
          },
        });
        resultados.push(nuevo);
      }
    }
    return resultados;
  });
};

const editarRegistro = async (idRegistro, nuevoEstado, userId) => {
  return prisma.tbl_registros_asistencia.update({
    where: { id: idRegistro },
    data: {
      estado_asistencia: nuevoEstado,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const obtenerHistorial = async (idCurso, filtros = {}) => {
  const where = { id_curso: idCurso, estado: 1 };
  if (filtros.id_periodo_escolar) where.id_periodo_escolar = filtros.id_periodo_escolar;

  return prisma.tbl_sesiones_asistencia.findMany({
    where,
    include: {
      tbl_registros_asistencia: {
        where: { estado: 1 },
        include: { tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } } },
      },
    },
    orderBy: { fecha_asistencia: 'desc' },
  });
};

const obtenerResumenAlumno = async (idAlumno, idCurso) => {
  const registros = await prisma.tbl_registros_asistencia.findMany({
    where: {
      id_alumno: idAlumno,
      estado: 1,
      tbl_sesiones_asistencia: { id_curso: idCurso, estado: 1 },
    },
    select: { estado_asistencia: true },
  });

  const resumen = { presente: 0, ausente: 0, tardanza: 0, total: registros.length };
  for (const r of registros) {
    if (resumen[r.estado_asistencia] !== undefined) resumen[r.estado_asistencia]++;
  }
  return resumen;
};

const obtenerPresentesCurso = async (idCurso, fecha) => {
  const sesion = await prisma.tbl_sesiones_asistencia.findFirst({
    where: { id_curso: idCurso, fecha_asistencia: new Date(fecha), estado: 1 },
  });

  if (!sesion) return [];

  const registros = await prisma.tbl_registros_asistencia.findMany({
    where: {
      id_sesion_asistencia: sesion.id,
      estado_asistencia: ESTADOS_ASISTENCIA.PRESENTE,
      estado: 1,
    },
    select: { id_alumno: true },
  });

  return registros.map(r => r.id_alumno);
};

const obtenerAsistenciaDiaCurso = async (idCurso, fecha) => {
  const sesion = await prisma.tbl_sesiones_asistencia.findFirst({
    where: { id_curso: idCurso, fecha_asistencia: new Date(fecha), estado: 1 },
    include: {
      tbl_registros_asistencia: {
        where: { estado: 1 },
        include: { tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } } },
      },
    },
  });

  if (!sesion) return [];

  return sesion.tbl_registros_asistencia.map(r => ({
    id_alumno: r.id_alumno,
    nombres: r.tbl_alumnos.nombres,
    apellidos: r.tbl_alumnos.apellidos,
    estado_asistencia: r.estado_asistencia,
  }));
};

module.exports = {
  obtenerSesion,
  crearOObtenerSesion,
  registrarAsistencia,
  registrarAsistenciaManualMasiva,
  editarRegistro,
  obtenerHistorial,
  obtenerResumenAlumno,
  obtenerPresentesCurso,
  obtenerAsistenciaDiaCurso,
};
