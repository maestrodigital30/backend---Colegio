const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const { ESTADOS_PARTIDA, ESTADOS_SESION_TRIVIA, MODALIDADES_ACCESO_TRIVIA, MODALIDADES_TRIVIA, CODIGO_TRIVIA } = require('../utils/constants');

const TRIVIA_SECRET = () => process.env.JWT_SECRET_TRIVIA || process.env.JWT_SECRET;

// Generate unique trivia access code (app-level uniqueness against active partidas only)
const generarCodigoAcceso = async () => {
  for (let i = 0; i < CODIGO_TRIVIA.MAX_REINTENTOS; i++) {
    let codigo = CODIGO_TRIVIA.PREFIJO;
    for (let j = 0; j < CODIGO_TRIVIA.LONGITUD; j++) {
      codigo += CODIGO_TRIVIA.CARACTERES.charAt(
        Math.floor(Math.random() * CODIGO_TRIVIA.CARACTERES.length)
      );
    }
    const existe = await prisma.tbl_trivia_partidas.findFirst({
      where: {
        codigo_acceso: codigo,
        estado_partida: { notIn: [ESTADOS_PARTIDA.FINALIZADA, ESTADOS_PARTIDA.CANCELADA] },
        estado: 1,
      },
    });
    if (!existe) return codigo;
  }
  throw new Error('No se pudo generar un codigo unico');
};

// Validate access: codigo_trivia + dni -> create/resume session
const validarAcceso = async (codigoTrivia, dni) => {
  // 1. Find partida by code (any state first, then validate)
  const partida = await prisma.tbl_trivia_partidas.findFirst({
    where: {
      codigo_acceso: codigoTrivia.toUpperCase(),
      modalidad_acceso: MODALIDADES_ACCESO_TRIVIA.CON_CODIGO,
      estado: 1,
    },
    include: {
      tbl_trivia_temas: { select: { nombre: true } },
    },
  });

  if (!partida) {
    throw { status: 404, message: 'Codigo de trivia invalido' };
  }

  if (partida.estado_partida === ESTADOS_PARTIDA.FINALIZADA) {
    throw { status: 410, message: 'Esta trivia ya fue finalizada' };
  }

  if (partida.estado_partida === ESTADOS_PARTIDA.CANCELADA) {
    throw { status: 410, message: 'Esta trivia fue cancelada' };
  }

  // 2. Find student by DNI scoped to the teacher who created the partida
  const alumno = await prisma.tbl_alumnos.findFirst({
    where: { dni, id_docente: partida.id_docente, estado: 1 },
  });

  if (!alumno) {
    throw { status: 404, message: 'DNI no encontrado' };
  }

  const esEquipo = partida.modalidad !== MODALIDADES_TRIVIA.INDIVIDUAL;

  if (esEquipo) {
    return _validarAccesoEquipo(partida, alumno);
  }

  return _validarAccesoIndividual(partida, alumno);
};

// --- Flow for GROUPS / PAIRS ---
const _validarAccesoEquipo = async (partida, alumno) => {
  // 1. Find pre-existing participant for this student
  const participante = await prisma.tbl_trivia_participantes.findFirst({
    where: { id_partida: partida.id, id_alumno: alumno.id, estado: 1 },
  });

  if (!participante) {
    throw { status: 403, message: 'No estas registrado en esta trivia' };
  }

  // 2. Find all team members (same numero_equipo)
  // When numero_equipo is null, scope to only this participant to avoid
  // Prisma's IS NULL matching ALL participants and blocking other teams
  if (participante.numero_equipo == null) {
    console.warn(`[trivia] participante id=${participante.id} partida=${partida.id} tiene numero_equipo=null en modalidad equipo`);
  }
  const equipoFilter = participante.numero_equipo != null
    ? { numero_equipo: participante.numero_equipo }
    : { id_alumno: alumno.id };

  const companerosEquipo = await prisma.tbl_trivia_participantes.findMany({
    where: { id_partida: partida.id, ...equipoFilter, estado: 1 },
    select: { id: true, id_alumno: true },
  });
  const idsAlumnosEquipo = companerosEquipo.map(c => c.id_alumno).filter(Boolean);

  // 3. Check for active session among team members
  const sesionActivaEquipo = await prisma.tbl_trivia_sesiones.findFirst({
    where: {
      id_partida: partida.id,
      id_alumno: { in: idsAlumnosEquipo },
      estado_sesion: ESTADOS_SESION_TRIVIA.EN_PROGRESO,
      estado: 1,
    },
  });

  if (sesionActivaEquipo) {
    throw { status: 409, message: 'Tu trivia ya esta activa en otra sesion' };
  }

  // 4. Count finished team attempts
  const intentosUsados = await prisma.tbl_trivia_sesiones.count({
    where: {
      id_partida: partida.id,
      id_alumno: { in: idsAlumnosEquipo },
      estado_sesion: ESTADOS_SESION_TRIVIA.FINALIZADA,
      estado: 1,
    },
  });

  if (intentosUsados >= partida.max_intentos) {
    throw { status: 403, message: `Sin intentos disponibles (${intentosUsados}/${partida.max_intentos})` };
  }

  // 5. Create session linked to existing participant (no new participant)
  const numeroIntento = intentosUsados + 1;
  return _crearSesion(partida, alumno, participante, numeroIntento);
};

// --- Flow for INDIVIDUAL ---
const _validarAccesoIndividual = async (partida, alumno) => {
  // 1. Check for existing in-progress session (block duplicate)
  const sesionActiva = await prisma.tbl_trivia_sesiones.findFirst({
    where: {
      id_partida: partida.id,
      id_alumno: alumno.id,
      estado_sesion: ESTADOS_SESION_TRIVIA.EN_PROGRESO,
      estado: 1,
    },
  });

  if (sesionActiva) {
    throw { status: 409, message: 'Tu trivia ya esta activa en otra sesion' };
  }

  // 2. Count finished attempts
  const intentosUsados = await prisma.tbl_trivia_sesiones.count({
    where: {
      id_partida: partida.id,
      id_alumno: alumno.id,
      estado_sesion: ESTADOS_SESION_TRIVIA.FINALIZADA,
      estado: 1,
    },
  });

  if (intentosUsados >= partida.max_intentos) {
    throw { status: 403, message: `Sin intentos disponibles (${intentosUsados}/${partida.max_intentos})` };
  }

  // 3. Create new participant for this attempt
  const numeroIntento = intentosUsados + 1;

  const participante = await prisma.tbl_trivia_participantes.create({
    data: {
      id_partida: partida.id,
      tipo_participante: 'alumno',
      id_alumno: alumno.id,
      etiqueta_participante: `${alumno.apellidos}, ${alumno.nombres}`,
    },
  });

  return _crearSesion(partida, alumno, participante, numeroIntento);
};

// --- Shared: create new session ---
const _crearSesion = async (partida, alumno, participante, numeroIntento) => {
  const tokenPayload = { id_partida: partida.id, id_alumno: alumno.id, numero_intento: numeroIntento };
  const tokenTmp = jwt.sign(tokenPayload, TRIVIA_SECRET(), { expiresIn: '4h' });

  const sesion = await prisma.tbl_trivia_sesiones.create({
    data: {
      id_partida: partida.id,
      id_alumno: alumno.id,
      id_participante: participante.id,
      numero_intento: numeroIntento,
      token_sesion: tokenTmp,
    },
  });

  const tokenFinal = jwt.sign(
    { ...tokenPayload, id_sesion: sesion.id },
    TRIVIA_SECRET(),
    { expiresIn: '4h' }
  );

  await prisma.tbl_trivia_sesiones.update({
    where: { id: sesion.id },
    data: { token_sesion: tokenFinal },
  });

  // If partida is 'preparada', change to 'en_progreso'
  if (partida.estado_partida === ESTADOS_PARTIDA.PREPARADA) {
    await prisma.tbl_trivia_partidas.update({
      where: { id: partida.id },
      data: { estado_partida: ESTADOS_PARTIDA.EN_PROGRESO, fecha_hora_inicio: new Date() },
    });
  }

  return {
    token: tokenFinal,
    nombre_partida: partida.tbl_trivia_temas.nombre,
    nombre_alumno: `${alumno.nombres} ${alumno.apellidos}`,
    total_preguntas: partida.cantidad_preguntas,
    tiempo_por_pregunta: partida.tiempo_por_pregunta,
    pregunta_actual: 0,
    es_reconexion: false,
  };
};

// Get match info
const obtenerPartidaPublica = async (sesionTrivia) => {
  const partida = await prisma.tbl_trivia_partidas.findFirst({
    where: { id: sesionTrivia.id_partida },
    include: { tbl_trivia_temas: { select: { nombre: true } } },
  });

  return {
    nombre_tema: partida.tbl_trivia_temas.nombre,
    total_preguntas: partida.cantidad_preguntas,
    tiempo_por_pregunta: partida.tiempo_por_pregunta,
    pregunta_actual: sesionTrivia.pregunta_actual,
    puntaje_acumulado: sesionTrivia.puntaje_acumulado,
    mostrar_puntaje: partida.mostrar_puntaje,
    mostrar_resumen: partida.mostrar_resumen,
    mostrar_ranking: partida.mostrar_ranking,
  };
};

// Get current question (no correct answer leaked)
const obtenerPregunta = async (sesionTrivia) => {
  const preguntasPartida = await prisma.tbl_trivia_partidas_preguntas.findMany({
    where: { id_partida: sesionTrivia.id_partida },
    orderBy: { orden: 'asc' },
    include: {
      tbl_trivia_preguntas: {
        include: {
          tbl_trivia_opciones: {
            where: { estado: 1 },
            orderBy: { orden: 'asc' },
            select: { id: true, texto_opcion: true, orden: true },
          },
        },
      },
    },
  });

  if (sesionTrivia.pregunta_actual >= preguntasPartida.length) {
    throw { status: 400, message: 'Trivia ya finalizada' };
  }

  const pp = preguntasPartida[sesionTrivia.pregunta_actual];

  return {
    id_partida_pregunta: pp.id,
    texto_pregunta: pp.tbl_trivia_preguntas.texto_pregunta,
    opciones: pp.tbl_trivia_preguntas.tbl_trivia_opciones,
    pregunta_numero: sesionTrivia.pregunta_actual + 1,
    total_preguntas: preguntasPartida.length,
    tiempo_por_pregunta: sesionTrivia.partida.tiempo_por_pregunta,
  };
};

// Register answer with transaction (fix review #6: duplicate prevention)
const registrarRespuestaPublica = async (sesionTrivia, idOpcionSeleccionada) => {
  return prisma.$transaction(async (tx) => {
    // Re-read session inside transaction for consistency
    const sesion = await tx.tbl_trivia_sesiones.findFirst({
      where: { id: sesionTrivia.id_sesion },
    });

    const preguntasPartida = await tx.tbl_trivia_partidas_preguntas.findMany({
      where: { id_partida: sesionTrivia.id_partida },
      orderBy: { orden: 'asc' },
    });

    if (sesion.pregunta_actual >= preguntasPartida.length) {
      throw { status: 400, message: 'Trivia ya finalizada' };
    }

    const ppActual = preguntasPartida[sesion.pregunta_actual];

    // Check for duplicate answer (fix review #6)
    const respuestaExistente = await tx.tbl_trivia_respuestas.findFirst({
      where: {
        id_partida_pregunta: ppActual.id,
        id_participante: sesion.id_participante,
      },
    });

    if (respuestaExistente) {
      // Already answered — just return current state without re-processing
      const nuevaPregunta = sesion.pregunta_actual + 1;
      return {
        es_correcta: respuestaExistente.es_correcta,
        delta_puntaje: parseFloat(respuestaExistente.delta_puntaje),
        puntaje_acumulado: Math.round(parseFloat(sesion.puntaje_acumulado) * 100) / 100,
        es_ultima_pregunta: nuevaPregunta >= preguntasPartida.length,
      };
    }

    // Calculate score
    let esCorrecta = false;
    let deltaPuntaje = 0;

    if (idOpcionSeleccionada) {
      const opcion = await tx.tbl_trivia_opciones.findFirst({
        where: { id: idOpcionSeleccionada },
      });
      esCorrecta = opcion?.es_correcta || false;
      deltaPuntaje = esCorrecta
        ? parseFloat(sesionTrivia.partida.puntaje_correcto)
        : parseFloat(sesionTrivia.partida.puntaje_incorrecto);
    }

    // Save response
    await tx.tbl_trivia_respuestas.create({
      data: {
        id_partida_pregunta: ppActual.id,
        id_participante: sesion.id_participante,
        id_opcion_seleccionada: idOpcionSeleccionada || null,
        es_correcta: esCorrecta,
        delta_puntaje: deltaPuntaje,
        fecha_hora_respuesta: new Date(),
      },
    });

    // Advance session
    const nuevaPregunta = sesion.pregunta_actual + 1;
    const nuevoPuntaje = parseFloat(sesion.puntaje_acumulado) + deltaPuntaje;
    const esUltima = nuevaPregunta >= preguntasPartida.length;

    const updateData = {
      pregunta_actual: nuevaPregunta,
      puntaje_acumulado: nuevoPuntaje,
    };

    if (esUltima) {
      updateData.estado_sesion = ESTADOS_SESION_TRIVIA.FINALIZADA;
      updateData.fecha_hora_fin = new Date();

      await tx.tbl_trivia_participantes.update({
        where: { id: sesion.id_participante },
        data: { puntaje_final: nuevoPuntaje },
      });
    }

    await tx.tbl_trivia_sesiones.update({
      where: { id: sesion.id },
      data: updateData,
    });

    return {
      es_correcta: esCorrecta,
      delta_puntaje: deltaPuntaje,
      puntaje_acumulado: Math.round(nuevoPuntaje * 100) / 100,
      es_ultima_pregunta: esUltima,
    };
  });
};

// Get results (respects teacher config)
const obtenerResultado = async (sesionTrivia) => {
  const sesion = await prisma.tbl_trivia_sesiones.findFirst({
    where: { id: sesionTrivia.id_sesion },
    include: {
      tbl_trivia_partidas: {
        select: { mostrar_puntaje: true, mostrar_resumen: true, mostrar_ranking: true, max_intentos: true },
      },
      tbl_alumnos: { select: { nombres: true, apellidos: true } },
    },
  });

  const config = sesion.tbl_trivia_partidas;
  const resultado = {
    nombre_alumno: `${sesion.tbl_alumnos.nombres} ${sesion.tbl_alumnos.apellidos}`,
    config_visualizacion: {
      mostrar_puntaje: config.mostrar_puntaje,
      mostrar_resumen: config.mostrar_resumen,
      mostrar_ranking: config.mostrar_ranking,
    },
  };

  if (config.mostrar_puntaje) {
    resultado.puntaje_final = Math.round(parseFloat(sesion.puntaje_acumulado) * 100) / 100;
  }

  if (config.mostrar_resumen && sesion.id_participante) {
    const respuestas = await prisma.tbl_trivia_respuestas.findMany({
      where: { id_participante: sesion.id_participante },
      include: {
        tbl_trivia_partidas_preguntas: {
          include: {
            tbl_trivia_preguntas: {
              include: { tbl_trivia_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } } },
            },
          },
        },
        tbl_trivia_opciones: { select: { texto_opcion: true } },
      },
      orderBy: { tbl_trivia_partidas_preguntas: { orden: 'asc' } },
    });

    resultado.resumen = respuestas.map((r) => {
      const pregunta = r.tbl_trivia_partidas_preguntas.tbl_trivia_preguntas;
      const opcionCorrecta = pregunta.tbl_trivia_opciones.find((o) => o.es_correcta);
      return {
        texto_pregunta: pregunta.texto_pregunta,
        respuesta_alumno: r.tbl_trivia_opciones?.texto_opcion || 'Tiempo agotado',
        respuesta_correcta: opcionCorrecta?.texto_opcion || '',
        es_correcta: r.es_correcta,
      };
    });
  }

  // Check remaining attempts
  const intentosUsados = await prisma.tbl_trivia_sesiones.count({
    where: {
      id_partida: sesionTrivia.id_partida,
      id_alumno: sesionTrivia.id_alumno,
      estado_sesion: ESTADOS_SESION_TRIVIA.FINALIZADA,
      estado: 1,
    },
  });

  resultado.intentos_usados = intentosUsados;
  resultado.max_intentos = config.max_intentos;
  resultado.puede_reintentar = intentosUsados < config.max_intentos;

  // Fallback message when all checkboxes off (fix review #10)
  if (!config.mostrar_puntaje && !config.mostrar_resumen && !config.mostrar_ranking) {
    resultado.mensaje_sin_datos = 'Trivia completada. Tu docente revisara los resultados.';
  }

  return resultado;
};

// Get cumulative ranking across ALL partidas of the same course (personal, sum of all trivias)
const obtenerRankingPublico = async (sesionTrivia) => {
  const partida = await prisma.tbl_trivia_partidas.findFirst({
    where: { id: sesionTrivia.id_partida },
    select: { id_curso: true, mostrar_ranking: true },
  });

  if (!partida.mostrar_ranking) {
    throw { status: 403, message: 'Ranking no habilitado para esta trivia' };
  }

  // Get ALL partidas for the same course (finalized + en_progreso for con_codigo with finished sessions)
  const partidas = await prisma.tbl_trivia_partidas.findMany({
    where: {
      id_curso: partida.id_curso,
      estado_partida: { in: [ESTADOS_PARTIDA.FINALIZADA, ESTADOS_PARTIDA.EN_PROGRESO] },
      estado: 1,
    },
    include: {
      tbl_trivia_participantes: {
        where: { estado: 1, id_alumno: { not: null } },
        select: { id_alumno: true, puntaje_final: true, numero_equipo: true },
      },
    },
  });

  // Calculate cumulative score per student across all partidas
  const acumulado = {};
  for (const p of partidas) {
    if (p.modalidad === MODALIDADES_TRIVIA.INDIVIDUAL) {
      // Individual: best score per student per partida (handles multiple attempts)
      const mejorPorAlumno = {};
      for (const part of p.tbl_trivia_participantes) {
        const puntaje = parseFloat(part.puntaje_final);
        if (puntaje === 0) continue;
        if (!mejorPorAlumno[part.id_alumno] || puntaje > mejorPorAlumno[part.id_alumno]) {
          mejorPorAlumno[part.id_alumno] = puntaje;
        }
      }
      for (const [idAlumno, puntaje] of Object.entries(mejorPorAlumno)) {
        if (!acumulado[idAlumno]) acumulado[idAlumno] = 0;
        acumulado[idAlumno] += puntaje;
      }
    } else {
      // Groups/Pairs: group total assigned to all members
      const equipos = {};
      for (const part of p.tbl_trivia_participantes) {
        const eq = part.numero_equipo || 0;
        if (!equipos[eq]) equipos[eq] = { puntaje: 0, miembros: [] };
        equipos[eq].puntaje += parseFloat(part.puntaje_final);
        if (part.id_alumno) equipos[eq].miembros.push(part.id_alumno);
      }
      for (const eq of Object.values(equipos)) {
        const puntajeGrupo = Math.round(eq.puntaje * 100) / 100;
        if (puntajeGrupo === 0) continue;
        for (const idAlumno of eq.miembros) {
          if (!acumulado[idAlumno]) acumulado[idAlumno] = 0;
          acumulado[idAlumno] += puntajeGrupo;
        }
      }
    }
  }

  // Get student names
  const alumnoIds = Object.keys(acumulado).map(Number);
  if (alumnoIds.length === 0) return [];

  const alumnos = await prisma.tbl_alumnos.findMany({
    where: { id: { in: alumnoIds } },
    select: { id: true, nombres: true, apellidos: true },
  });

  // Build sorted ranking
  const ranking = alumnos
    .map(a => ({
      posicion: 0,
      nombre: `${a.nombres} ${a.apellidos}`,
      puntaje: Math.round((acumulado[a.id] || 0) * 100) / 100,
      es_actual: a.id === sesionTrivia.id_alumno,
    }))
    .sort((a, b) => b.puntaje - a.puntaje);

  ranking.forEach((r, idx) => { r.posicion = idx + 1; });

  return ranking;
};

module.exports = {
  generarCodigoAcceso,
  validarAcceso,
  obtenerPartidaPublica,
  obtenerPregunta,
  registrarRespuestaPublica,
  obtenerResultado,
  obtenerRankingPublico,
};
