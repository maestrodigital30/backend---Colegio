const prisma = require('../config/prisma');
const { CONCURSOS } = require('../utils/constants');

// Historial de intentos (admin: ve todos; alumno/docente: solo los suyos)
const obtenerHistorial = async (filtros = {}) => {
  const where = { estado: 1 };
  if (filtros.id_usuario) where.id_usuario = filtros.id_usuario;
  if (filtros.id_concurso) where.id_concurso = filtros.id_concurso;
  if (filtros.desde || filtros.hasta) {
    where.fecha_hora_inicio = {};
    if (filtros.desde) where.fecha_hora_inicio.gte = new Date(filtros.desde);
    if (filtros.hasta) where.fecha_hora_inicio.lte = new Date(filtros.hasta);
  }
  if (filtros.puntaje_min != null) where.puntaje_total = { gte: parseInt(filtros.puntaje_min) };

  const include = {
    tbl_concursos: { select: { id: true, titulo: true, tema_visual: true } },
    tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
    tbl_usuarios: { select: { id: true, nombres: true, apellidos: true, correo: true } },
  };

  let intentos = await prisma.tbl_concurso_intentos.findMany({
    where,
    include,
    orderBy: { fecha_hora_inicio: 'desc' },
  });

  // Filtro por id_curso: a traves de alumno -> alumnos_cursos
  if (filtros.id_curso) {
    const alumnos = await prisma.tbl_alumnos_cursos.findMany({
      where: { id_curso: filtros.id_curso, estado: 1 },
      select: { id_alumno: true },
    });
    const ids = new Set(alumnos.map((a) => a.id_alumno));
    intentos = intentos.filter((i) => i.id_alumno && ids.has(i.id_alumno));
  }

  return intentos.map((i) => ({
    id: i.id,
    id_concurso: i.id_concurso,
    titulo_concurso: i.tbl_concursos?.titulo,
    tema_visual: i.tbl_concursos?.tema_visual,
    id_usuario: i.id_usuario,
    usuario: i.tbl_usuarios ? `${i.tbl_usuarios.nombres} ${i.tbl_usuarios.apellidos || ''}`.trim() : null,
    correo_usuario: i.tbl_usuarios?.correo,
    id_alumno: i.id_alumno,
    nombre_alumno: i.tbl_alumnos ? `${i.tbl_alumnos.nombres} ${i.tbl_alumnos.apellidos}`.trim() : null,
    estado_intento: i.estado_intento,
    puntaje_total: i.puntaje_total,
    puntaje_preguntas: i.puntaje_preguntas,
    puntaje_bonus: i.puntaje_bonus,
    respuestas_correctas: i.respuestas_correctas,
    respuestas_incorrectas: i.respuestas_incorrectas,
    preguntas_totales: i.preguntas_totales,
    tiempo_total_segundos: i.tiempo_total_segundos,
    fecha_hora_inicio: i.fecha_hora_inicio,
    fecha_hora_fin: i.fecha_hora_fin,
  }));
};

// Ranking por concurso: mejor puntaje por usuario
const obtenerRanking = async (filtros = {}) => {
  const where = { estado: 1, estado_intento: CONCURSOS.ESTADOS_INTENTO.FINALIZADO };
  if (filtros.id_concurso) where.id_concurso = filtros.id_concurso;

  const intentos = await prisma.tbl_concurso_intentos.findMany({
    where,
    include: {
      tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
      tbl_usuarios: { select: { id: true, nombres: true, apellidos: true } },
    },
    orderBy: { puntaje_total: 'desc' },
  });

  // Filtro curso
  let lista = intentos;
  if (filtros.id_curso) {
    const alumnos = await prisma.tbl_alumnos_cursos.findMany({
      where: { id_curso: filtros.id_curso, estado: 1 },
      select: { id_alumno: true },
    });
    const ids = new Set(alumnos.map((a) => a.id_alumno));
    lista = intentos.filter((i) => i.id_alumno && ids.has(i.id_alumno));
  }

  // Agregamos: mejor puntaje por usuario
  const mejorPorUsuario = new Map();
  for (const i of lista) {
    const key = i.id_usuario;
    const actual = mejorPorUsuario.get(key);
    if (!actual || i.puntaje_total > actual.puntaje_total) {
      mejorPorUsuario.set(key, i);
    }
  }

  const ranking = Array.from(mejorPorUsuario.values())
    .sort((a, b) => b.puntaje_total - a.puntaje_total)
    .map((i, idx) => ({
      posicion: idx + 1,
      id_usuario: i.id_usuario,
      nombre_usuario: i.tbl_usuarios ? `${i.tbl_usuarios.nombres} ${i.tbl_usuarios.apellidos || ''}`.trim() : 'Usuario',
      id_alumno: i.id_alumno,
      nombre_alumno: i.tbl_alumnos ? `${i.tbl_alumnos.nombres} ${i.tbl_alumnos.apellidos}`.trim() : null,
      puntaje_total: i.puntaje_total,
      respuestas_correctas: i.respuestas_correctas,
      respuestas_incorrectas: i.respuestas_incorrectas,
      tiempo_total_segundos: i.tiempo_total_segundos,
      fecha_hora_fin: i.fecha_hora_fin,
      id_intento: i.id,
    }));

  return ranking;
};

const obtenerDetalleIntento = async (idIntento) => {
  return prisma.tbl_concurso_intentos.findFirst({
    where: { id: idIntento, estado: 1 },
    include: {
      tbl_concursos: true,
      tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
      tbl_usuarios: { select: { id: true, nombres: true, apellidos: true, correo: true } },
      tbl_concurso_respuestas: {
        where: { estado: 1 },
        include: {
          tbl_concurso_preguntas: true,
          tbl_concurso_opciones: true,
        },
      },
      tbl_concurso_bonus_tarjetas: { where: { estado: 1 }, orderBy: { orden: 'asc' } },
    },
  });
};

module.exports = { obtenerHistorial, obtenerRanking, obtenerDetalleIntento };
