const prisma = require('../config/prisma');

// ===== Selectors auxiliares =====
const incluirConPreguntas = {
  tbl_cursos: { select: { id: true, nombre: true, grado: true, seccion: true } },
  tbl_concurso_preguntas: {
    where: { estado: 1 },
    orderBy: { orden: 'asc' },
    include: {
      tbl_concurso_opciones: {
        where: { estado: 1 },
        orderBy: { orden: 'asc' },
      },
    },
  },
};

// ===== CONCURSOS =====
const listar = async (filtros = {}) => {
  const where = { estado: 1 };
  if (filtros.solo_publicados) where.publicado = true;
  if (filtros.id_curso) where.id_curso = parseInt(filtros.id_curso);
  if (filtros.busqueda) {
    where.OR = [
      { titulo: { contains: String(filtros.busqueda), mode: 'insensitive' } },
      { descripcion: { contains: String(filtros.busqueda), mode: 'insensitive' } },
      { area: { contains: String(filtros.busqueda), mode: 'insensitive' } },
      { nivel: { contains: String(filtros.busqueda), mode: 'insensitive' } },
    ];
  }

  return prisma.tbl_concursos.findMany({
    where,
    include: {
      tbl_cursos: { select: { id: true, nombre: true, grado: true, seccion: true } },
      _count: { select: { tbl_concurso_preguntas: { where: { estado: 1 } } } },
    },
    orderBy: [{ publicado: 'desc' }, { fecha_hora_registro: 'desc' }],
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_concursos.findFirst({
    where: { id, estado: 1 },
    include: incluirConPreguntas,
  });
};

const crear = async (datos, userId) => {
  const data = construirDatosConcurso(datos);
  data.id_usuario_registro = userId;
  return prisma.tbl_concursos.create({ data });
};

const actualizar = async (id, datos, userId) => {
  const data = construirDatosConcurso(datos, { parcial: true });
  data.id_usuario_modificacion = userId;
  data.fecha_hora_modificacion = new Date();
  return prisma.tbl_concursos.update({ where: { id }, data });
};

const inactivar = async (id, userId) => {
  return prisma.tbl_concursos.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

const publicar = async (id, publicado, userId) => {
  return prisma.tbl_concursos.update({
    where: { id },
    data: { publicado: !!publicado, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

function construirDatosConcurso(datos, { parcial = false } = {}) {
  const data = {};
  const campos = [
    'titulo', 'descripcion', 'id_curso', 'area', 'nivel', 'tema_visual', 'publicado',
    'multimedia_url', 'multimedia_tipo',
    'tiempo_por_pregunta', 'puntos_base', 'penalizacion_incorrecta',
    'orden_preguntas', 'orden_opciones', 'permite_reintentos', 'max_intentos_por_usuario',
    'comodin_50_50_habilitado', 'comodin_tiempo_extra_habilitado', 'comodin_tiempo_extra_segundos',
    'comodin_doble_puntaje_habilitado',
    'bonus_habilitado', 'bonus_cantidad_tarjetas', 'bonus_premio_minimo', 'bonus_premio_maximo',
  ];
  for (const campo of campos) {
    if (datos[campo] === undefined) {
      if (parcial) continue;
      continue;
    }
    const valor = datos[campo];
    if (['id_curso', 'tiempo_por_pregunta', 'puntos_base', 'penalizacion_incorrecta',
         'max_intentos_por_usuario', 'comodin_tiempo_extra_segundos',
         'bonus_cantidad_tarjetas', 'bonus_premio_minimo', 'bonus_premio_maximo'].includes(campo)) {
      data[campo] = valor === null || valor === '' ? null : parseInt(valor);
    } else if (['publicado', 'permite_reintentos', 'comodin_50_50_habilitado',
                'comodin_tiempo_extra_habilitado', 'comodin_doble_puntaje_habilitado',
                'bonus_habilitado'].includes(campo)) {
      data[campo] = !!valor;
    } else {
      data[campo] = valor === '' ? null : valor;
    }
  }
  return data;
}

// ===== PREGUNTAS =====
const listarPreguntas = async (idConcurso) => {
  return prisma.tbl_concurso_preguntas.findMany({
    where: { id_concurso: idConcurso, estado: 1 },
    orderBy: { orden: 'asc' },
    include: {
      tbl_concurso_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } },
    },
  });
};

const crearPregunta = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const ultima = await tx.tbl_concurso_preguntas.findFirst({
      where: { id_concurso: datos.id_concurso, estado: 1 },
      orderBy: { orden: 'desc' },
    });
    const orden = datos.orden ?? ((ultima?.orden || 0) + 1);

    const pregunta = await tx.tbl_concurso_preguntas.create({
      data: {
        id_concurso: parseInt(datos.id_concurso),
        texto: datos.texto,
        orden,
        puntos: datos.puntos != null && datos.puntos !== '' ? parseInt(datos.puntos) : null,
        tiempo_limite_segundos: datos.tiempo_limite_segundos != null && datos.tiempo_limite_segundos !== ''
          ? parseInt(datos.tiempo_limite_segundos) : null,
        multimedia_url: datos.multimedia_url || null,
        multimedia_tipo: datos.multimedia_tipo || null,
        permite_multiple: !!datos.permite_multiple,
        id_usuario_registro: userId,
      },
    });

    for (let i = 0; i < datos.opciones.length; i++) {
      const op = datos.opciones[i];
      await tx.tbl_concurso_opciones.create({
        data: {
          id_pregunta: pregunta.id,
          texto: op.texto || null,
          es_correcta: !!op.es_correcta,
          orden: i + 1,
          multimedia_url: op.multimedia_url || null,
          multimedia_tipo: op.multimedia_tipo || null,
          id_usuario_registro: userId,
        },
      });
    }

    return tx.tbl_concurso_preguntas.findFirst({
      where: { id: pregunta.id },
      include: { tbl_concurso_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } } },
    });
  });
};

const actualizarPregunta = async (idPregunta, datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const update = { id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() };
    if (datos.texto != null) update.texto = datos.texto;
    if (datos.orden != null) update.orden = parseInt(datos.orden);
    if (datos.puntos !== undefined) update.puntos = datos.puntos === null || datos.puntos === '' ? null : parseInt(datos.puntos);
    if (datos.tiempo_limite_segundos !== undefined) {
      update.tiempo_limite_segundos = datos.tiempo_limite_segundos === null || datos.tiempo_limite_segundos === '' ? null : parseInt(datos.tiempo_limite_segundos);
    }
    if (datos.multimedia_url !== undefined) update.multimedia_url = datos.multimedia_url || null;
    if (datos.multimedia_tipo !== undefined) update.multimedia_tipo = datos.multimedia_tipo || null;
    if (datos.permite_multiple !== undefined) update.permite_multiple = !!datos.permite_multiple;

    await tx.tbl_concurso_preguntas.update({ where: { id: idPregunta }, data: update });

    if (Array.isArray(datos.opciones)) {
      // Inactivar opciones anteriores y crear nuevas (estrategia simple sin perder respuestas pasadas)
      await tx.tbl_concurso_opciones.updateMany({
        where: { id_pregunta: idPregunta, estado: 1 },
        data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });

      for (let i = 0; i < datos.opciones.length; i++) {
        const op = datos.opciones[i];
        await tx.tbl_concurso_opciones.create({
          data: {
            id_pregunta: idPregunta,
            texto: op.texto || null,
            es_correcta: !!op.es_correcta,
            orden: i + 1,
            multimedia_url: op.multimedia_url || null,
            multimedia_tipo: op.multimedia_tipo || null,
            id_usuario_registro: userId,
          },
        });
      }
    }

    return tx.tbl_concurso_preguntas.findFirst({
      where: { id: idPregunta },
      include: { tbl_concurso_opciones: { where: { estado: 1 }, orderBy: { orden: 'asc' } } },
    });
  });
};

const inactivarPregunta = async (idPregunta, userId) => {
  return prisma.$transaction(async (tx) => {
    await tx.tbl_concurso_opciones.updateMany({
      where: { id_pregunta: idPregunta, estado: 1 },
      data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });
    return tx.tbl_concurso_preguntas.update({
      where: { id: idPregunta },
      data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });
  });
};

const reordenarPreguntas = async (idConcurso, orden, userId) => {
  return prisma.$transaction(async (tx) => {
    for (let i = 0; i < orden.length; i++) {
      await tx.tbl_concurso_preguntas.update({
        where: { id: parseInt(orden[i]) },
        data: { orden: i + 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }
    return tx.tbl_concurso_preguntas.findMany({
      where: { id_concurso: idConcurso, estado: 1 },
      orderBy: { orden: 'asc' },
    });
  });
};

const obtenerMultimediaUrlPregunta = async (idPregunta) => {
  const p = await prisma.tbl_concurso_preguntas.findFirst({ where: { id: idPregunta }, select: { multimedia_url: true } });
  return p?.multimedia_url || null;
};
const obtenerMultimediaUrlOpcion = async (idOpcion) => {
  const o = await prisma.tbl_concurso_opciones.findFirst({ where: { id: idOpcion }, select: { multimedia_url: true } });
  return o?.multimedia_url || null;
};
const obtenerMultimediaUrlConcurso = async (idConcurso) => {
  const c = await prisma.tbl_concursos.findFirst({ where: { id: idConcurso }, select: { multimedia_url: true } });
  return c?.multimedia_url || null;
};

module.exports = {
  listar, obtenerPorId, crear, actualizar, inactivar, publicar,
  listarPreguntas, crearPregunta, actualizarPregunta, inactivarPregunta, reordenarPreguntas,
  obtenerMultimediaUrlConcurso, obtenerMultimediaUrlPregunta, obtenerMultimediaUrlOpcion,
};
