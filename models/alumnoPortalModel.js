const prisma = require('../config/prisma');

const obtenerDashboard = async (idAlumno) => {
  const [alumno, cursos, notasRecientes, triviasRecientes, asistenciaResumen] = await Promise.all([
    prisma.tbl_alumnos.findFirst({
      where: { id: idAlumno, estado: 1 },
      select: { id: true, nombres: true, apellidos: true, dni: true, foto_url: true },
    }),
    prisma.tbl_alumnos_cursos.findMany({
      where: { id_alumno: idAlumno, estado: 1 },
      include: {
        tbl_cursos: {
          select: {
            id: true, nombre: true, grado: true, seccion: true,
            tbl_perfiles_docente: { select: { nombres: true, apellidos: true } },
          },
        },
      },
    }),
    prisma.tbl_notas_cabecera.findMany({
      where: { id_alumno: idAlumno, estado: 1 },
      orderBy: { fecha_hora_registro: 'desc' },
      take: 5,
      include: {
        tbl_cursos: { select: { nombre: true } },
        tbl_periodos_calificacion: { select: { nombre: true } },
      },
    }),
    prisma.tbl_trivia_participantes.findMany({
      where: { id_alumno: idAlumno, estado: 1 },
      orderBy: { fecha_hora_registro: 'desc' },
      take: 5,
      include: {
        tbl_trivia_partidas: {
          select: {
            id: true, estado_partida: true,
            tbl_trivia_temas: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.tbl_registros_asistencia.groupBy({
      by: ['estado_asistencia'],
      where: { id_alumno: idAlumno, estado: 1 },
      _count: { id: true },
    }),
  ]);

  const asistencia = {};
  for (const item of asistenciaResumen) {
    asistencia[item.estado_asistencia] = item._count.id;
  }

  return {
    alumno,
    totalCursos: cursos.length,
    cursos: cursos.map(ac => ac.tbl_cursos),
    notasRecientes,
    triviasRecientes,
    asistencia,
  };
};

const obtenerMisCursos = async (idAlumno) => {
  const asignaciones = await prisma.tbl_alumnos_cursos.findMany({
    where: { id_alumno: idAlumno, estado: 1 },
    include: {
      tbl_cursos: {
        select: {
          id: true, nombre: true, descripcion: true, grado: true, seccion: true, estado: true,
          tbl_perfiles_docente: { select: { id: true, nombres: true, apellidos: true, especialidad: true, foto_url: true } },
          tbl_periodos_escolares: { select: { id: true, nombre: true, anio: true } },
        },
      },
    },
  });
  return asignaciones.map(a => a.tbl_cursos).filter(c => c && c.estado === 1);
};

const obtenerMisNotas = async (idAlumno, idCurso) => {
  const where = { id_alumno: idAlumno, estado: 1 };
  if (idCurso) where.id_curso = parseInt(idCurso);

  return prisma.tbl_notas_cabecera.findMany({
    where,
    include: {
      tbl_cursos: { select: { id: true, nombre: true, grado: true, seccion: true } },
      tbl_periodos_calificacion: { select: { id: true, nombre: true, orden: true } },
      tbl_periodos_escolares: { select: { id: true, nombre: true, anio: true } },
      tbl_esquemas_calificacion: { select: { tipo_calificacion: true } },
      tbl_notas_detalle: {
        where: { estado: 1 },
        include: {
          tbl_componentes_nota: { select: { id: true, nombre_componente: true, peso_porcentaje: true, orden: true } },
        },
        orderBy: { tbl_componentes_nota: { orden: 'asc' } },
      },
    },
    orderBy: [
      { tbl_cursos: { nombre: 'asc' } },
      { tbl_periodos_calificacion: { orden: 'asc' } },
    ],
  });
};

const obtenerMisTrivias = async (idAlumno) => {
  const participaciones = await prisma.tbl_trivia_participantes.findMany({
    where: { id_alumno: idAlumno, estado: 1 },
    include: {
      tbl_trivia_partidas: {
        select: {
          id: true, modalidad: true, estado_partida: true, cantidad_preguntas: true,
          fecha_hora_registro: true,
          tbl_trivia_temas: { select: { id: true, nombre: true } },
          tbl_cursos: { select: { id: true, nombre: true } },
        },
      },
      tbl_trivia_respuestas: {
        select: { delta_puntaje: true, es_correcta: true },
      },
    },
    orderBy: { fecha_hora_registro: 'desc' },
  });

  return participaciones.map(p => {
    const respuestas = p.tbl_trivia_respuestas || [];
    const puntajeCalculado = respuestas.reduce((sum, r) => sum + Number(r.delta_puntaje), 0);
    const totalRespondidas = respuestas.length;
    const correctas = respuestas.filter(r => r.es_correcta).length;

    const { tbl_trivia_respuestas, ...rest } = p;
    return {
      ...rest,
      puntaje_real: puntajeCalculado,
      total_respondidas: totalRespondidas,
      respuestas_correctas: correctas,
    };
  });
};

const obtenerDetalleTriviaAlumno = async (idAlumno, idPartida) => {
  const participante = await prisma.tbl_trivia_participantes.findFirst({
    where: { id_alumno: idAlumno, id_partida: parseInt(idPartida), estado: 1 },
  });
  if (!participante) return null;

  const [partida, respuestas] = await Promise.all([
    prisma.tbl_trivia_partidas.findFirst({
      where: { id: parseInt(idPartida), estado: 1 },
      include: {
        tbl_trivia_temas: { select: { nombre: true } },
        tbl_cursos: { select: { nombre: true } },
        tbl_trivia_partidas_preguntas: {
          orderBy: { orden: 'asc' },
          include: {
            tbl_trivia_preguntas: {
              select: {
                id: true, texto_pregunta: true,
                tbl_trivia_opciones: { select: { id: true, texto_opcion: true, es_correcta: true, orden: true }, orderBy: { orden: 'asc' } },
              },
            },
          },
        },
      },
    }),
    prisma.tbl_trivia_respuestas.findMany({
      where: { id_participante: participante.id },
      include: {
        tbl_trivia_opciones: { select: { id: true, texto_opcion: true } },
      },
    }),
  ]);

  return { participante, partida, respuestas };
};

const obtenerMiAsistencia = async (idAlumno, idCurso, fechaDesde, fechaHasta) => {
  const whereRegistro = { id_alumno: idAlumno, estado: 1 };
  const whereSesion = {};

  if (idCurso) whereSesion.id_curso = parseInt(idCurso);
  if (fechaDesde || fechaHasta) {
    whereSesion.fecha_asistencia = {};
    if (fechaDesde) whereSesion.fecha_asistencia.gte = new Date(fechaDesde);
    if (fechaHasta) whereSesion.fecha_asistencia.lte = new Date(fechaHasta);
  }

  return prisma.tbl_registros_asistencia.findMany({
    where: {
      ...whereRegistro,
      tbl_sesiones_asistencia: whereSesion,
    },
    include: {
      tbl_sesiones_asistencia: {
        select: {
          id: true, fecha_asistencia: true,
          tbl_cursos: { select: { id: true, nombre: true } },
        },
      },
    },
    orderBy: { tbl_sesiones_asistencia: { fecha_asistencia: 'desc' } },
  });
};

const obtenerMiCarnet = async (idAlumno) => {
  const [alumno, carnet, qr] = await Promise.all([
    prisma.tbl_alumnos.findFirst({
      where: { id: idAlumno, estado: 1 },
      select: { id: true, nombres: true, apellidos: true, dni: true, foto_url: true, genero: true, fecha_nacimiento: true },
    }),
    prisma.tbl_carnets_alumnos.findFirst({
      where: { id_alumno: idAlumno, esta_activo: true, estado: 1 },
    }),
    prisma.tbl_qr_alumnos.findFirst({
      where: { id_alumno: idAlumno, esta_activo: true, estado: 1 },
    }),
  ]);

  return { alumno, carnet, qr };
};

const obtenerMiPerfil = async (idAlumno) => {
  return prisma.tbl_alumnos.findFirst({
    where: { id: idAlumno, estado: 1 },
    select: {
      id: true, nombres: true, apellidos: true, dni: true, fecha_nacimiento: true,
      genero: true, direccion: true, foto_url: true,
      tbl_alumnos_cursos: {
        where: { estado: 1 },
        include: { tbl_cursos: { select: { id: true, nombre: true, grado: true, seccion: true } } },
      },
      tbl_padres_alumnos: {
        where: { estado: 1 },
        include: {
          tbl_padres: { select: { id: true, nombres: true, apellidos: true, telefono: true, correo: true } },
        },
      },
    },
  });
};

module.exports = {
  obtenerDashboard,
  obtenerMisCursos,
  obtenerMisNotas,
  obtenerMisTrivias,
  obtenerDetalleTriviaAlumno,
  obtenerMiAsistencia,
  obtenerMiCarnet,
  obtenerMiPerfil,
};
