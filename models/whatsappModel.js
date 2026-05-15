const prisma = require('../config/prisma');
const { ESTADOS_ENVIO_WHATSAPP, ROLES } = require('../utils/constants');

const construirFiltroCursos = (rol, idPerfilDocente, idPeriodoEscolar) => {
  const where = { estado: 1 };
  if (idPeriodoEscolar) where.id_periodo_escolar = parseInt(idPeriodoEscolar);
  if (rol === ROLES.DOCENTE && idPerfilDocente) {
    where.id_docente = idPerfilDocente;
  }
  return where;
};

const obtenerGradosDisponibles = async ({ rol, idPerfilDocente, idPeriodoEscolar }) => {
  const cursos = await prisma.tbl_cursos.findMany({
    where: construirFiltroCursos(rol, idPerfilDocente, idPeriodoEscolar),
    select: { id: true, nombre: true, grado: true, seccion: true, id_periodo_escolar: true },
    orderBy: [{ grado: 'asc' }, { seccion: 'asc' }, { nombre: 'asc' }],
  });

  const mapa = new Map();
  for (const c of cursos) {
    const grado = c.grado || 'Sin grado';
    if (!mapa.has(grado)) mapa.set(grado, new Map());
    const seccionesMap = mapa.get(grado);
    const seccion = c.seccion || 'Sin sección';
    if (!seccionesMap.has(seccion)) seccionesMap.set(seccion, []);
    seccionesMap.get(seccion).push({ id: c.id, nombre: c.nombre, id_periodo_escolar: c.id_periodo_escolar });
  }

  const resultado = [];
  for (const [grado, seccionesMap] of mapa.entries()) {
    const secciones = [];
    for (const [seccion, cursosSeccion] of seccionesMap.entries()) {
      secciones.push({ seccion, cursos: cursosSeccion });
    }
    resultado.push({ grado, secciones });
  }
  return resultado;
};

const obtenerCursosAccesibles = async ({ rol, idPerfilDocente, idPeriodoEscolar, grado, secciones }) => {
  const where = construirFiltroCursos(rol, idPerfilDocente, idPeriodoEscolar);
  where.grado = grado;
  if (Array.isArray(secciones) && secciones.length > 0) {
    where.seccion = { in: secciones };
  }
  return prisma.tbl_cursos.findMany({
    where,
    include: {
      tbl_alumnos_cursos: {
        where: { estado: 1 },
        include: { tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } } },
      },
    },
    orderBy: [{ seccion: 'asc' }, { nombre: 'asc' }],
  });
};

const crearEnvio = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const lote = await tx.tbl_envios_whatsapp.create({
      data: {
        id_curso: datos.id_curso,
        id_periodo_escolar: datos.id_periodo_escolar,
        grado: datos.grado || null,
        secciones: datos.secciones || null,
        estado_envio: ESTADOS_ENVIO_WHATSAPP.ENVIADO,
        tipo_envio: datos.tipo_envio,
        id_usuario_registro: userId,
      },
    });

    const detalles = [];
    for (const alumnoData of datos.alumnos) {
      const tieneContacto = !!alumnoData.telefono;
      const detalle = await tx.tbl_envios_whatsapp_detalle.create({
        data: {
          id_envio_whatsapp: lote.id,
          id_alumno: alumnoData.id_alumno,
          id_curso: alumnoData.id_curso || datos.id_curso || null,
          id_padre: alumnoData.id_padre || null,
          telefono: alumnoData.telefono || null,
          contenido_mensaje: alumnoData.contenido_mensaje,
          estado_envio: tieneContacto ? ESTADOS_ENVIO_WHATSAPP.ENVIADO : ESTADOS_ENVIO_WHATSAPP.NO_ENVIADO,
          mensaje_error: tieneContacto ? null : 'Padre principal sin número de teléfono',
          id_usuario_registro: userId,
        },
      });
      detalles.push(detalle);
    }

    const todosNoEnviados = detalles.every(d => d.estado_envio === ESTADOS_ENVIO_WHATSAPP.NO_ENVIADO);
    if (todosNoEnviados) {
      await tx.tbl_envios_whatsapp.update({
        where: { id: lote.id },
        data: { estado_envio: ESTADOS_ENVIO_WHATSAPP.NO_ENVIADO },
      });
    }

    return { lote, detalles };
  });
};

const obtenerHistorial = async (idCurso) => {
  return prisma.tbl_envios_whatsapp.findMany({
    where: {
      id_curso: idCurso,
      estado: 1,
    },
    include: {
      tbl_envios_whatsapp_detalle: {
        include: {
          tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
          tbl_padres: { select: { id: true, nombres: true, apellidos: true } },
        },
      },
    },
    orderBy: { fecha_hora_registro: 'desc' },
  });
};

const obtenerHistorialMasivo = async ({ rol, idPerfilDocente, idPeriodoEscolar, grado }) => {
  const whereBase = { estado: 1, id_curso: null };
  if (idPeriodoEscolar) whereBase.id_periodo_escolar = parseInt(idPeriodoEscolar);
  if (grado) whereBase.grado = grado;

  const lotes = await prisma.tbl_envios_whatsapp.findMany({
    where: whereBase,
    include: {
      tbl_envios_whatsapp_detalle: {
        include: {
          tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
          tbl_padres: { select: { id: true, nombres: true, apellidos: true } },
          tbl_cursos: { select: { id: true, nombre: true, grado: true, seccion: true, id_docente: true } },
        },
      },
    },
    orderBy: { fecha_hora_registro: 'desc' },
  });

  if (rol === ROLES.DOCENTE && idPerfilDocente) {
    return lotes
      .map(lote => ({
        ...lote,
        tbl_envios_whatsapp_detalle: lote.tbl_envios_whatsapp_detalle.filter(
          d => d.tbl_cursos && d.tbl_cursos.id_docente === idPerfilDocente
        ),
      }))
      .filter(lote => lote.tbl_envios_whatsapp_detalle.length > 0);
  }

  return lotes;
};

module.exports = {
  obtenerGradosDisponibles,
  obtenerCursosAccesibles,
  crearEnvio,
  obtenerHistorial,
  obtenerHistorialMasivo,
};
