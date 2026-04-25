const prisma = require('../config/prisma');
const { ESTADOS_ENVIO_WHATSAPP } = require('../utils/constants');

const crearEnvio = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const lote = await tx.tbl_envios_whatsapp.create({
      data: {
        id_curso: datos.id_curso,
        id_periodo_escolar: datos.id_periodo_escolar,
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
    where: { id_curso: idCurso, estado: 1 },
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

module.exports = { crearEnvio, obtenerHistorial };
