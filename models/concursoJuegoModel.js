const crypto = require('crypto');
const prisma = require('../config/prisma');
const { CONCURSOS, ROLES } = require('../utils/constants');

const ESTADOS = CONCURSOS.ESTADOS_INTENTO;

const generarTokenIntento = () => crypto.randomBytes(32).toString('hex');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ===== Listado de concursos jugables =====
const listarParaJugar = async (usuario, alumnoId) => {
  const whereBase = { estado: 1, publicado: true };

  let cursosAlumno = [];
  if (usuario.rol === ROLES.ALUMNO && alumnoId) {
    const asignaciones = await prisma.tbl_alumnos_cursos.findMany({
      where: { id_alumno: alumnoId, estado: 1 },
      select: { id_curso: true },
    });
    cursosAlumno = asignaciones.map((a) => a.id_curso);
  }

  if (usuario.rol === ROLES.ALUMNO) {
    whereBase.OR = [{ id_curso: null }, { id_curso: { in: cursosAlumno.length ? cursosAlumno : [-1] } }];
  }

  const concursos = await prisma.tbl_concursos.findMany({
    where: whereBase,
    include: {
      tbl_cursos: { select: { id: true, nombre: true, grado: true, seccion: true } },
      _count: { select: { tbl_concurso_preguntas: { where: { estado: 1 } } } },
    },
    orderBy: { fecha_hora_registro: 'desc' },
  });

  // Filtrar concursos sin preguntas
  const validos = concursos.filter((c) => c._count.tbl_concurso_preguntas > 0);

  // Intentos previos del usuario
  const ids = validos.map((c) => c.id);
  const intentos = ids.length
    ? await prisma.tbl_concurso_intentos.findMany({
        where: { id_concurso: { in: ids }, id_usuario: usuario.id, estado: 1 },
        select: { id_concurso: true, estado_intento: true, puntaje_total: true },
      })
    : [];

  const intentosPorConcurso = {};
  for (const it of intentos) {
    if (!intentosPorConcurso[it.id_concurso]) intentosPorConcurso[it.id_concurso] = { total: 0, mejor_puntaje: 0, tiene_en_progreso: false };
    intentosPorConcurso[it.id_concurso].total += 1;
    if (it.estado_intento === ESTADOS.EN_PROGRESO) intentosPorConcurso[it.id_concurso].tiene_en_progreso = true;
    if (it.puntaje_total > intentosPorConcurso[it.id_concurso].mejor_puntaje) {
      intentosPorConcurso[it.id_concurso].mejor_puntaje = it.puntaje_total;
    }
  }

  return validos.map((c) => ({ ...c, mis_intentos: intentosPorConcurso[c.id] || { total: 0, mejor_puntaje: 0, tiene_en_progreso: false } }));
};

// ===== Iniciar intento =====
const iniciarIntento = async (idConcurso, usuario, alumnoId) => {
  const concurso = await prisma.tbl_concursos.findFirst({
    where: { id: idConcurso, estado: 1, publicado: true },
  });
  if (!concurso) throw new Error('Concurso no disponible');

  // Validar acceso por curso si el usuario es alumno
  if (usuario.rol === ROLES.ALUMNO && concurso.id_curso) {
    const tieneCurso = await prisma.tbl_alumnos_cursos.findFirst({
      where: { id_alumno: alumnoId, id_curso: concurso.id_curso, estado: 1 },
    });
    if (!tieneCurso) throw new Error('No tienes acceso a este concurso');
  }

  // Reabrir si ya hay intento en progreso
  const enProgreso = await prisma.tbl_concurso_intentos.findFirst({
    where: { id_concurso: idConcurso, id_usuario: usuario.id, estado_intento: ESTADOS.EN_PROGRESO, estado: 1 },
  });
  if (enProgreso) return enProgreso;

  // Validar limite de intentos
  if (concurso.max_intentos_por_usuario > 0) {
    const total = await prisma.tbl_concurso_intentos.count({
      where: { id_concurso: idConcurso, id_usuario: usuario.id, estado: 1 },
    });
    if (total >= concurso.max_intentos_por_usuario) {
      throw new Error('Has alcanzado el numero maximo de intentos para este concurso');
    }
  }

  const preguntas = await prisma.tbl_concurso_preguntas.findMany({
    where: { id_concurso: idConcurso, estado: 1 },
    select: { id: true },
  });
  if (preguntas.length === 0) throw new Error('El concurso no tiene preguntas');

  return prisma.tbl_concurso_intentos.create({
    data: {
      id_concurso: idConcurso,
      id_usuario: usuario.id,
      id_alumno: alumnoId || null,
      token_intento: generarTokenIntento(),
      preguntas_totales: preguntas.length,
      fecha_hora_inicio: new Date(),
    },
  });
};

// ===== Obtener intento + preguntas con orden y opciones =====
const obtenerIntentoDetalle = async (idIntento, usuario) => {
  const intento = await prisma.tbl_concurso_intentos.findFirst({
    where: { id: idIntento, id_usuario: usuario.id, estado: 1 },
    include: { tbl_concursos: true },
  });
  if (!intento) return null;

  const preguntas = await prisma.tbl_concurso_preguntas.findMany({
    where: { id_concurso: intento.id_concurso, estado: 1 },
    include: { tbl_concurso_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } } },
    orderBy: { orden: 'asc' },
  });

  const concurso = intento.tbl_concursos;
  const preguntasOrdenadas = concurso.orden_preguntas === CONCURSOS.ORDEN_ALEATORIO ? shuffle(preguntas) : preguntas;

  const respuestas = await prisma.tbl_concurso_respuestas.findMany({
    where: { id_intento: idIntento, estado: 1 },
  });
  const respuestasPorPregunta = Object.fromEntries(respuestas.map((r) => [r.id_pregunta, r]));

  const preguntasPayload = preguntasOrdenadas.map((p) => {
    const opciones = concurso.orden_opciones === CONCURSOS.ORDEN_ALEATORIO ? shuffle(p.tbl_concurso_opciones) : p.tbl_concurso_opciones;
    return {
      id: p.id,
      orden: p.orden,
      texto: p.texto,
      puntos: p.puntos ?? concurso.puntos_base,
      tiempo_limite_segundos: p.tiempo_limite_segundos ?? concurso.tiempo_por_pregunta,
      multimedia_url: p.multimedia_url,
      multimedia_tipo: p.multimedia_tipo,
      permite_multiple: p.permite_multiple,
      opciones: opciones.map((o) => ({
        id: o.id,
        texto: o.texto,
        orden: o.orden,
        multimedia_url: o.multimedia_url,
        multimedia_tipo: o.multimedia_tipo,
      })),
      respondida: respuestasPorPregunta[p.id] ? {
        id_opcion_seleccionada: respuestasPorPregunta[p.id].id_opcion_seleccionada,
        ids_opciones_seleccionadas: respuestasPorPregunta[p.id].ids_opciones_seleccionadas,
        es_correcta: respuestasPorPregunta[p.id].es_correcta,
        puntos_obtenidos: respuestasPorPregunta[p.id].puntos_obtenidos,
      } : null,
    };
  });

  return { intento, concurso, preguntas: preguntasPayload };
};

// ===== Aplicar comodin (50:50 / tiempo extra / doble puntaje) =====
const aplicarComodin = async (idIntento, usuario, tipo, idPregunta) => {
  const intento = await prisma.tbl_concurso_intentos.findFirst({
    where: { id: idIntento, id_usuario: usuario.id, estado_intento: ESTADOS.EN_PROGRESO, estado: 1 },
    include: { tbl_concursos: true },
  });
  if (!intento) throw new Error('Intento no encontrado o ya finalizado');

  const c = intento.tbl_concursos;
  let actualizacion = {};
  let payload = {};

  if (tipo === '50_50') {
    if (!c.comodin_50_50_habilitado) throw new Error('El comodin 50:50 no esta habilitado en este concurso');
    if (intento.comodin_50_50_usado) throw new Error('Ya usaste el comodin 50:50');
    actualizacion.comodin_50_50_usado = true;

    const pregunta = await prisma.tbl_concurso_preguntas.findFirst({
      where: { id: parseInt(idPregunta), id_concurso: c.id, estado: 1 },
      include: { tbl_concurso_opciones: { where: { estado: 1 } } },
    });
    if (!pregunta) throw new Error('Pregunta no encontrada');
    const correctas = pregunta.tbl_concurso_opciones.filter((o) => o.es_correcta);
    const incorrectas = pregunta.tbl_concurso_opciones.filter((o) => !o.es_correcta);
    const dejarIncorrectas = Math.max(0, Math.min(1, incorrectas.length - 1));
    const ocultar = shuffle(incorrectas).slice(0, incorrectas.length - dejarIncorrectas);
    payload.ocultar_ids = ocultar.map((o) => o.id);
    payload.mantener_ids = [...correctas.map((o) => o.id), ...incorrectas.filter((o) => !ocultar.includes(o)).map((o) => o.id)];
  } else if (tipo === 'tiempo_extra') {
    if (!c.comodin_tiempo_extra_habilitado) throw new Error('El comodin tiempo extra no esta habilitado');
    if (intento.comodin_tiempo_extra_usado) throw new Error('Ya usaste el comodin de tiempo extra');
    actualizacion.comodin_tiempo_extra_usado = true;
    payload.segundos_extra = c.comodin_tiempo_extra_segundos;
  } else if (tipo === 'doble_puntaje') {
    if (!c.comodin_doble_puntaje_habilitado) throw new Error('El comodin doble puntaje no esta habilitado');
    if (intento.comodin_doble_puntaje_usado) throw new Error('Ya usaste el comodin de doble puntaje');
    actualizacion.comodin_doble_puntaje_usado = true;
    payload.id_pregunta = parseInt(idPregunta);
  } else {
    throw new Error('Tipo de comodin invalido');
  }

  await prisma.tbl_concurso_intentos.update({ where: { id: idIntento }, data: actualizacion });
  return { tipo, ...payload };
};

// ===== Registrar respuesta a una pregunta =====
const registrarRespuesta = async (idIntento, usuario, datos) => {
  return prisma.$transaction(async (tx) => {
    const intento = await tx.tbl_concurso_intentos.findFirst({
      where: { id: idIntento, id_usuario: usuario.id, estado_intento: ESTADOS.EN_PROGRESO, estado: 1 },
      include: { tbl_concursos: true },
    });
    if (!intento) throw new Error('Intento no disponible');

    const pregunta = await tx.tbl_concurso_preguntas.findFirst({
      where: { id: parseInt(datos.id_pregunta), id_concurso: intento.id_concurso, estado: 1 },
      include: { tbl_concurso_opciones: { where: { estado: 1 } } },
    });
    if (!pregunta) throw new Error('Pregunta invalida');

    const existente = await tx.tbl_concurso_respuestas.findFirst({
      where: { id_intento: idIntento, id_pregunta: pregunta.id, estado: 1 },
    });
    if (existente) throw new Error('Esta pregunta ya fue respondida');

    const concurso = intento.tbl_concursos;
    const puntosPregunta = pregunta.puntos ?? concurso.puntos_base;

    // Calcular si es correcta
    let esCorrecta = false;
    let idOpcionSeleccionada = null;
    let idsSeleccionadasJson = null;

    if (pregunta.permite_multiple) {
      const ids = Array.isArray(datos.ids_opciones_seleccionadas)
        ? datos.ids_opciones_seleccionadas.map((x) => parseInt(x))
        : [];
      idsSeleccionadasJson = JSON.stringify(ids);
      const correctas = pregunta.tbl_concurso_opciones.filter((o) => o.es_correcta).map((o) => o.id).sort();
      const seleccionadas = [...ids].sort();
      esCorrecta = correctas.length > 0 && correctas.length === seleccionadas.length && correctas.every((id, i) => id === seleccionadas[i]);
    } else if (datos.id_opcion_seleccionada != null) {
      idOpcionSeleccionada = parseInt(datos.id_opcion_seleccionada);
      const op = pregunta.tbl_concurso_opciones.find((o) => o.id === idOpcionSeleccionada);
      esCorrecta = !!op?.es_correcta;
    }

    // Comodin doble puntaje: solo aplica si el alumno lo activo y fue para ESTA pregunta
    const dobleAplicado = !!datos.comodin_doble_puntaje_aplicado;
    const cincuentaAplicado = !!datos.comodin_50_50_aplicado;
    const tiempoExtraAplicado = !!datos.comodin_tiempo_extra_aplicado;

    let puntosObtenidos = 0;
    if (esCorrecta) {
      puntosObtenidos = puntosPregunta * (dobleAplicado ? 2 : 1);
    } else if (idOpcionSeleccionada != null || idsSeleccionadasJson != null) {
      puntosObtenidos = -1 * (concurso.penalizacion_incorrecta || 0);
    }

    const tiempoUsado = Math.max(0, parseInt(datos.tiempo_usado_segundos || 0));

    await tx.tbl_concurso_respuestas.create({
      data: {
        id_intento: idIntento,
        id_pregunta: pregunta.id,
        id_opcion_seleccionada: idOpcionSeleccionada,
        ids_opciones_seleccionadas: idsSeleccionadasJson,
        es_correcta: esCorrecta,
        puntos_obtenidos: puntosObtenidos,
        tiempo_usado_segundos: tiempoUsado,
        comodin_50_50_aplicado: cincuentaAplicado,
        comodin_tiempo_extra_aplicado: tiempoExtraAplicado,
        comodin_doble_puntaje_aplicado: dobleAplicado,
      },
    });

    const incRespuestas = esCorrecta
      ? { respuestas_correctas: { increment: 1 } }
      : (idOpcionSeleccionada != null || idsSeleccionadasJson != null
          ? { respuestas_incorrectas: { increment: 1 } }
          : {});

    await tx.tbl_concurso_intentos.update({
      where: { id: idIntento },
      data: {
        puntaje_preguntas: { increment: puntosObtenidos },
        puntaje_total: { increment: puntosObtenidos },
        tiempo_total_segundos: { increment: tiempoUsado },
        ...incRespuestas,
      },
    });

    const opcionesCorrectas = pregunta.tbl_concurso_opciones.filter((o) => o.es_correcta).map((o) => o.id);

    return {
      es_correcta: esCorrecta,
      puntos_obtenidos: puntosObtenidos,
      opciones_correctas: opcionesCorrectas,
    };
  });
};

// ===== Generar tarjetas de ronda bonus =====
const generarBonus = async (idIntento, usuario) => {
  return prisma.$transaction(async (tx) => {
    const intento = await tx.tbl_concurso_intentos.findFirst({
      where: { id: idIntento, id_usuario: usuario.id, estado_intento: ESTADOS.EN_PROGRESO, estado: 1 },
      include: { tbl_concursos: true },
    });
    if (!intento) throw new Error('Intento no disponible');

    const c = intento.tbl_concursos;
    if (!c.bonus_habilitado) throw new Error('La ronda bonus no esta habilitada');

    const existentes = await tx.tbl_concurso_bonus_tarjetas.findMany({
      where: { id_intento: idIntento, estado: 1 },
      orderBy: { orden: 'asc' },
    });
    if (existentes.length > 0) return existentes;

    const tarjetas = [];
    const cantidad = Math.max(2, Math.min(10, c.bonus_cantidad_tarjetas || 5));
    for (let i = 1; i <= cantidad; i++) {
      const puntos = Math.floor(c.bonus_premio_minimo + Math.random() * (c.bonus_premio_maximo - c.bonus_premio_minimo + 1));
      tarjetas.push({ id_intento: idIntento, orden: i, puntos });
    }
    await tx.tbl_concurso_bonus_tarjetas.createMany({ data: tarjetas });
    return tx.tbl_concurso_bonus_tarjetas.findMany({
      where: { id_intento: idIntento, estado: 1 },
      orderBy: { orden: 'asc' },
    });
  });
};

// ===== Seleccionar tarjeta bonus =====
const seleccionarBonus = async (idIntento, usuario, idTarjeta) => {
  return prisma.$transaction(async (tx) => {
    const intento = await tx.tbl_concurso_intentos.findFirst({
      where: { id: idIntento, id_usuario: usuario.id, estado_intento: ESTADOS.EN_PROGRESO, estado: 1 },
    });
    if (!intento) throw new Error('Intento no disponible');

    const yaSeleccionada = await tx.tbl_concurso_bonus_tarjetas.findFirst({
      where: { id_intento: idIntento, seleccionada: true, estado: 1 },
    });
    if (yaSeleccionada) throw new Error('Ya seleccionaste una tarjeta bonus');

    const tarjeta = await tx.tbl_concurso_bonus_tarjetas.findFirst({
      where: { id: parseInt(idTarjeta), id_intento: idIntento, estado: 1 },
    });
    if (!tarjeta) throw new Error('Tarjeta invalida');

    await tx.tbl_concurso_bonus_tarjetas.update({
      where: { id: tarjeta.id },
      data: { seleccionada: true, fecha_hora_seleccion: new Date() },
    });

    await tx.tbl_concurso_intentos.update({
      where: { id: idIntento },
      data: {
        puntaje_bonus: { increment: tarjeta.puntos },
        puntaje_total: { increment: tarjeta.puntos },
      },
    });

    const todas = await tx.tbl_concurso_bonus_tarjetas.findMany({
      where: { id_intento: idIntento, estado: 1 },
      orderBy: { orden: 'asc' },
    });
    return { seleccionada: tarjeta, todas };
  });
};

// ===== Finalizar intento =====
const finalizarIntento = async (idIntento, usuario) => {
  return prisma.$transaction(async (tx) => {
    const intento = await tx.tbl_concurso_intentos.findFirst({
      where: { id: idIntento, id_usuario: usuario.id, estado: 1 },
    });
    if (!intento) throw new Error('Intento no encontrado');
    if (intento.estado_intento !== ESTADOS.EN_PROGRESO) return intento;

    return tx.tbl_concurso_intentos.update({
      where: { id: idIntento },
      data: { estado_intento: ESTADOS.FINALIZADO, fecha_hora_fin: new Date() },
    });
  });
};

// ===== Obtener resultado final con detalle =====
const obtenerResultado = async (idIntento, usuario) => {
  const intento = await prisma.tbl_concurso_intentos.findFirst({
    where: { id: idIntento, id_usuario: usuario.id, estado: 1 },
    include: {
      tbl_concursos: { include: { tbl_cursos: { select: { id: true, nombre: true } } } },
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
  return intento;
};

module.exports = {
  listarParaJugar,
  iniciarIntento,
  obtenerIntentoDetalle,
  aplicarComodin,
  registrarRespuesta,
  generarBonus,
  seleccionarBonus,
  finalizarIntento,
  obtenerResultado,
};
