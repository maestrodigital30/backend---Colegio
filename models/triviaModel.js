const prisma = require('../config/prisma');
const { PUNTAJES_TRIVIA, ESTADOS_PARTIDA } = require('../utils/constants');

// ===== TEMAS =====
const obtenerTemas = async (userId) => {
  return prisma.tbl_trivia_temas.findMany({
    where: { estado: 1, id_usuario_registro: userId },
    include: { _count: { select: { tbl_trivia_preguntas: { where: { estado: 1 } } } } },
    orderBy: { nombre: 'asc' },
  });
};

const crearTema = async (datos, userId) => {
  const data = { nombre: datos.nombre, descripcion: datos.descripcion || null, id_usuario_registro: userId };
  if (datos.id_docente != null) data.id_docente = parseInt(datos.id_docente);
  return prisma.tbl_trivia_temas.create({ data });
};

const actualizarTema = async (id, datos, userId) => {
  return prisma.tbl_trivia_temas.update({
    where: { id },
    data: { nombre: datos.nombre, descripcion: datos.descripcion !== undefined ? datos.descripcion : undefined, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

const inactivarTema = async (id, userId) => {
  return prisma.tbl_trivia_temas.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

// ===== PREGUNTAS =====
const obtenerPreguntas = async (idTema) => {
  return prisma.tbl_trivia_preguntas.findMany({
    where: { id_tema: idTema, estado: 1 },
    include: { tbl_trivia_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } } },
    orderBy: { id: 'asc' },
  });
};

const crearPregunta = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const pregunta = await tx.tbl_trivia_preguntas.create({
      data: { id_tema: datos.id_tema, texto_pregunta: datos.texto_pregunta, id_usuario_registro: userId },
    });

    for (let i = 0; i < datos.opciones.length; i++) {
      await tx.tbl_trivia_opciones.create({
        data: {
          id_pregunta: pregunta.id,
          texto_opcion: datos.opciones[i].texto_opcion,
          es_correcta: datos.opciones[i].es_correcta,
          orden: i + 1,
          id_usuario_registro: userId,
        },
      });
    }

    return pregunta;
  });
};

const actualizarPregunta = async (id, datos, userId) => {
  return prisma.$transaction(async (tx) => {
    await tx.tbl_trivia_preguntas.update({
      where: { id },
      data: { texto_pregunta: datos.texto_pregunta, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });

    if (datos.opciones) {
      await tx.tbl_trivia_opciones.updateMany({
        where: { id_pregunta: id },
        data: { estado: 0 },
      });

      for (let i = 0; i < datos.opciones.length; i++) {
        await tx.tbl_trivia_opciones.create({
          data: {
            id_pregunta: id,
            texto_opcion: datos.opciones[i].texto_opcion,
            es_correcta: datos.opciones[i].es_correcta,
            orden: i + 1,
            id_usuario_registro: userId,
          },
        });
      }
    }
  });
};

const inactivarPregunta = async (id, userId) => {
  return prisma.tbl_trivia_preguntas.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

// ===== PARTIDAS =====
const crearPartida = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const preguntas = await tx.tbl_trivia_preguntas.findMany({
      where: { id_tema: datos.id_tema, estado: 1 },
      include: { tbl_trivia_opciones: { where: { estado: 1 } } },
    });

    const shuffled = preguntas.sort(() => Math.random() - 0.5);
    const cantidad = datos.cantidad_preguntas || 10;
    const seleccionadas = shuffled.slice(0, Math.min(cantidad, shuffled.length));

    const partidaData = {
      id_curso: datos.id_curso,
      id_periodo_escolar: datos.id_periodo_escolar,
      id_tema: datos.id_tema,
      modalidad: datos.modalidad,
      cantidad_grupos: datos.cantidad_grupos || null,
      cantidad_preguntas: seleccionadas.length,
      tiempo_por_pregunta: datos.tiempo_por_pregunta || 20,
      puntaje_correcto: datos.puntaje_correcto || PUNTAJES_TRIVIA.CORRECTO,
      puntaje_incorrecto: datos.puntaje_incorrecto || PUNTAJES_TRIVIA.INCORRECTO,
      estado_partida: ESTADOS_PARTIDA.PREPARADA,
      modalidad_acceso: datos.modalidad_acceso || 'en_vivo',
      codigo_acceso: datos._codigo_acceso || null,
      max_intentos: datos.max_intentos || 1,
      mostrar_puntaje: datos.mostrar_puntaje !== undefined ? datos.mostrar_puntaje : true,
      mostrar_resumen: datos.mostrar_resumen !== undefined ? datos.mostrar_resumen : false,
      mostrar_ranking: datos.mostrar_ranking !== undefined ? datos.mostrar_ranking : false,
      id_musica_fondo: datos.id_musica_fondo != null ? parseInt(datos.id_musica_fondo) : null,
      id_usuario_registro: userId,
    };
    if (datos.id_docente != null) partidaData.id_docente = parseInt(datos.id_docente);
    const partida = await tx.tbl_trivia_partidas.create({ data: partidaData });

    for (let i = 0; i < seleccionadas.length; i++) {
      await tx.tbl_trivia_partidas_preguntas.create({
        data: {
          id_partida: partida.id,
          id_pregunta: seleccionadas[i].id,
          orden: i + 1,
        },
      });
    }

    if (datos.participantes) {
      for (const part of datos.participantes) {
        await tx.tbl_trivia_participantes.create({
          data: {
            id_partida: partida.id,
            tipo_participante: part.tipo,
            id_alumno: part.id_alumno || null,
            etiqueta_participante: part.etiqueta,
            numero_equipo: part.numero_equipo || null,
            id_usuario_registro: userId,
          },
        });
      }
    }

    return partida;
  });
};

const iniciarPartida = async (idPartida, userId) => {
  return prisma.tbl_trivia_partidas.update({
    where: { id: idPartida },
    data: {
      estado_partida: ESTADOS_PARTIDA.EN_PROGRESO,
      fecha_hora_inicio: new Date(),
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const registrarRespuesta = async (datos) => {
  return prisma.tbl_trivia_respuestas.create({
    data: {
      id_partida_pregunta: datos.id_partida_pregunta,
      id_participante: datos.id_participante,
      id_opcion_seleccionada: datos.id_opcion_seleccionada || null,
      es_correcta: datos.es_correcta,
      delta_puntaje: datos.delta_puntaje,
      fecha_hora_respuesta: new Date(),
    },
  });
};

const finalizarPartida = async (idPartida, userId) => {
  return prisma.$transaction(async (tx) => {
    const participantes = await tx.tbl_trivia_participantes.findMany({
      where: { id_partida: idPartida, estado: 1 },
      include: {
        tbl_trivia_respuestas: { select: { delta_puntaje: true, es_correcta: true } },
        tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
      },
    });

    let maxPuntaje = -Infinity;
    const puntajes = [];

    for (const p of participantes) {
      const total = p.tbl_trivia_respuestas.reduce((sum, r) => sum + parseFloat(r.delta_puntaje), 0);
      const puntajeFinal = Math.round(total * 100) / 100;
      const correctas = p.tbl_trivia_respuestas.filter(r => r.es_correcta).length;
      const incorrectas = p.tbl_trivia_respuestas.filter(r => !r.es_correcta).length;
      puntajes.push({ id: p.id, puntaje: puntajeFinal, correctas, incorrectas });
      if (puntajeFinal > maxPuntaje) maxPuntaje = puntajeFinal;
    }

    const ganadores = puntajes.filter(p => p.puntaje === maxPuntaje);
    const modoGanador = ganadores.length > 1 ? 'multiple' : 'unico';

    for (const p of puntajes) {
      await tx.tbl_trivia_participantes.update({
        where: { id: p.id },
        data: {
          puntaje_final: p.puntaje,
          es_ganador: p.puntaje === maxPuntaje,
        },
      });
    }

    // Abandon active trivia sessions and free codigo_acceso (fix review #7, #8)
    await tx.tbl_trivia_sesiones.updateMany({
      where: { id_partida: idPartida, estado_sesion: 'en_progreso', estado: 1 },
      data: { estado_sesion: 'abandonada', fecha_hora_fin: new Date() },
    });

    await tx.tbl_trivia_partidas.update({
      where: { id: idPartida },
      data: {
        estado_partida: ESTADOS_PARTIDA.FINALIZADA,
        modo_ganador: modoGanador,
        fecha_hora_fin: new Date(),
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });

    // Return full participant data for results screen
    const participantesResultado = participantes.map(p => {
      const stats = puntajes.find(pj => pj.id === p.id);
      return {
        id: p.id,
        tipo_participante: p.tipo_participante,
        id_alumno: p.id_alumno,
        etiqueta_participante: p.etiqueta_participante,
        numero_equipo: p.numero_equipo,
        puntaje_final: stats.puntaje,
        es_ganador: stats.puntaje === maxPuntaje,
        respuestas_correctas: stats.correctas,
        respuestas_incorrectas: stats.incorrectas,
        tbl_alumnos: p.tbl_alumnos,
      };
    });

    return { modoGanador, participantes: participantesResultado };
  });
};

const cancelarPartida = async (idPartida, userId) => {
  // Abandon active trivia sessions (fix review #7)
  await prisma.tbl_trivia_sesiones.updateMany({
    where: { id_partida: idPartida, estado_sesion: 'en_progreso', estado: 1 },
    data: { estado_sesion: 'abandonada', fecha_hora_fin: new Date() },
  });

  return prisma.tbl_trivia_partidas.update({
    where: { id: idPartida },
    data: {
      estado_partida: ESTADOS_PARTIDA.CANCELADA,
      fecha_hora_fin: new Date(),
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const obtenerPartida = async (idPartida) => {
  return prisma.tbl_trivia_partidas.findFirst({
    where: { id: idPartida },
    include: {
      tbl_trivia_temas: { select: { nombre: true } },
      tbl_cursos: { select: { nombre: true } },
      tbl_trivia_participantes: {
        where: { estado: 1 },
        include: { tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } } },
      },
      tbl_trivia_partidas_preguntas: {
        orderBy: { orden: 'asc' },
        include: {
          tbl_trivia_preguntas: {
            include: { tbl_trivia_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } } },
          },
          tbl_trivia_respuestas: true,
        },
      },
    },
  });
};

async function obtenerPartidaConMultimedia(id) {
  return prisma.tbl_trivia_partidas.findUnique({
    where: { id },
    include: {
      tbl_trivia_temas: true,
      tbl_trivia_imagenes: { where: { estado: 1 }, orderBy: { orden: 'asc' } },
      tbl_musica_fondo_catalogo: true,
    },
  });
}

// ===== HISTORIAL =====
const obtenerHistorial = async (filtros = {}) => {
  const where = {};
  if (filtros.id_usuario) where.id_usuario_registro = filtros.id_usuario;
  if (filtros.id_curso) where.id_curso = filtros.id_curso;
  if (filtros.id_periodo_escolar) where.id_periodo_escolar = filtros.id_periodo_escolar;

  return prisma.tbl_trivia_partidas.findMany({
    where,
    include: {
      tbl_trivia_temas: { select: { nombre: true } },
      tbl_cursos: { select: { nombre: true } },
      tbl_trivia_participantes: {
        where: { estado: 1 },
        include: {
          tbl_alumnos: {
            include: {
              tbl_alumno_identidad_visual: {
                include: {
                  avatar: true,
                  personaje: true,
                  marco: true,
                  tbl_temas_visuales: true,
                },
              },
            },
          },
          avatar_publico: true,
          personaje_publico: true,
          marco_publico: true,
        },
      },
    },
    orderBy: { fecha_hora_registro: 'desc' },
  });
};

// ===== RESPUESTAS POR PARTICIPANTE =====
const obtenerRespuestasParticipante = async (idPartida, idParticipante) => {
  const participante = await prisma.tbl_trivia_participantes.findFirst({
    where: { id: idParticipante, id_partida: idPartida, estado: 1 },
    include: {
      tbl_alumnos: {
        include: {
          tbl_alumno_identidad_visual: {
            include: {
              avatar: true,
              personaje: true,
              marco: true,
              tbl_temas_visuales: true,
            },
          },
        },
      },
      avatar_publico: true,
      personaje_publico: true,
      marco_publico: true,
    },
  });
  if (!participante) return null;

  const preguntas = await prisma.tbl_trivia_partidas_preguntas.findMany({
    where: { id_partida: idPartida },
    orderBy: { orden: 'asc' },
    include: {
      tbl_trivia_preguntas: {
        include: { tbl_trivia_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } } },
      },
      tbl_trivia_respuestas: {
        where: { id_participante: idParticipante },
      },
    },
  });

  return { participante, preguntas };
};

// ===== RANKING =====
// Helper: compute points per alumno for a single partida (handles groups)
const _calcularPuntajePartida = (partida) => {
  const participantes = partida.tbl_trivia_participantes;
  const resultado = {}; // { id_alumno: puntaje }

  if (partida.modalidad === 'individual') {
    // Best score per student (handles multiple attempts in con_codigo mode)
    for (const p of participantes) {
      const puntaje = parseFloat(p.puntaje_final);
      if (puntaje === 0) continue;
      if (!resultado[p.id_alumno] || puntaje > resultado[p.id_alumno]) {
        resultado[p.id_alumno] = puntaje;
      }
    }
  } else {
    // Groups/Pairs: sum group total, assign to ALL members
    const equipos = {};
    for (const p of participantes) {
      const eq = p.numero_equipo || 0;
      if (!equipos[eq]) equipos[eq] = { puntaje: 0, miembros: [] };
      equipos[eq].puntaje += parseFloat(p.puntaje_final);
      equipos[eq].miembros.push(p.id_alumno);
    }
    for (const eq of Object.values(equipos)) {
      const puntajeGrupo = Math.round(eq.puntaje * 100) / 100;
      if (puntajeGrupo === 0) continue;
      for (const idAlumno of eq.miembros) {
        resultado[idAlumno] = puntajeGrupo;
      }
    }
  }

  return resultado;
};

const obtenerRanking = async (idCurso, idPeriodoEscolar) => {
  // Include en_progreso partidas so con_codigo trivia scores appear before docente finalizes
  const where = { id_curso: idCurso, estado_partida: { in: [ESTADOS_PARTIDA.FINALIZADA, ESTADOS_PARTIDA.EN_PROGRESO] } };
  if (idPeriodoEscolar) where.id_periodo_escolar = idPeriodoEscolar;

  const partidas = await prisma.tbl_trivia_partidas.findMany({
    where,
    include: {
      tbl_trivia_participantes: {
        where: { estado: 1, id_alumno: { not: null } },
        select: { id_alumno: true, puntaje_final: true, numero_equipo: true },
      },
    },
  });

  const acumulado = {};
  for (const partida of partidas) {
    const puntajes = _calcularPuntajePartida(partida);
    for (const [idAlumno, puntaje] of Object.entries(puntajes)) {
      if (!acumulado[idAlumno]) acumulado[idAlumno] = 0;
      acumulado[idAlumno] += puntaje;
    }
  }

  const alumnoIds = Object.keys(acumulado).map(Number);
  const alumnos = await prisma.tbl_alumnos.findMany({
    where: { id: { in: alumnoIds } },
    include: {
      tbl_alumno_identidad_visual: {
        include: {
          avatar: true,
          personaje: true,
          marco: true,
          tbl_temas_visuales: true,
        },
      },
    },
  });

  const ranking = alumnos.map(a => ({
    id_alumno: a.id,
    nombres: a.nombres,
    apellidos: a.apellidos,
    puntaje_acumulado: Math.round(acumulado[a.id] * 100) / 100,
    tbl_alumno_identidad_visual: a.tbl_alumno_identidad_visual || null,
  }));

  ranking.sort((a, b) => b.puntaje_acumulado - a.puntaje_acumulado);
  return ranking;
};

// ===== HISTORIAL DE PUNTOS POR ALUMNO =====
const obtenerHistorialAlumno = async (idCurso, idAlumno) => {
  const partidas = await prisma.tbl_trivia_partidas.findMany({
    where: {
      id_curso: idCurso,
      estado_partida: ESTADOS_PARTIDA.FINALIZADA,
      tbl_trivia_participantes: { some: { id_alumno: idAlumno, estado: 1 } },
    },
    include: {
      tbl_trivia_temas: { select: { nombre: true } },
      tbl_trivia_participantes: {
        where: { estado: 1, id_alumno: { not: null } },
        select: { id_alumno: true, puntaje_final: true, numero_equipo: true },
      },
    },
    orderBy: { fecha_hora_fin: 'desc' },
  });

  return partidas.map(partida => {
    const puntajes = _calcularPuntajePartida(partida);
    const puntajeAlumno = puntajes[idAlumno] || 0;

    return {
      id_partida: partida.id,
      nombre_tema: partida.tbl_trivia_temas?.nombre || 'Sin tema',
      modalidad: partida.modalidad,
      fecha: partida.fecha_hora_fin,
      puntaje: puntajeAlumno,
    };
  });
};

module.exports = {
  obtenerTemas, crearTema, actualizarTema, inactivarTema,
  obtenerPreguntas, crearPregunta, actualizarPregunta, inactivarPregunta,
  crearPartida, iniciarPartida, registrarRespuesta, finalizarPartida, cancelarPartida, obtenerPartida,
  obtenerPartidaConMultimedia,
  obtenerHistorial, obtenerRespuestasParticipante, obtenerRanking, obtenerHistorialAlumno,
};
