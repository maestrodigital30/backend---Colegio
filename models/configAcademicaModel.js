const prisma = require('../config/prisma');
const { TIPOS_CALIFICACION, MODOS_NOTA_FINAL } = require('../utils/constants');

const obtenerEsquema = async (idCurso) => {
  const esquema = await prisma.tbl_esquemas_calificacion.findFirst({
    where: { id_curso: idCurso, estado: 1 },
    include: {
      tbl_periodos_calificacion: { where: { estado: 1 }, orderBy: { orden: 'asc' } },
      tbl_componentes_nota: { where: { estado: 1 }, orderBy: { orden: 'asc' } },
      _count: { select: { tbl_notas_cabecera: true } },
    },
  });
  if (esquema) {
    esquema.tiene_notas = esquema._count.tbl_notas_cabecera > 0;
    delete esquema._count;
  }
  return esquema;
};

const crearEsquema = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.tbl_esquemas_calificacion.findFirst({
      where: { id_curso: datos.id_curso, estado: 1 },
    });

    if (existente) {
      await tx.tbl_esquemas_calificacion.update({
        where: { id: existente.id },
        data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }

    const esquemaData = {
      id_curso: datos.id_curso,
      id_periodo_escolar: datos.id_periodo_escolar,
      tipo_calificacion: datos.tipo_calificacion,
      escala_letras: datos.escala_letras || null,
      formula: datos.tipo_calificacion === TIPOS_CALIFICACION.NUMERICO ? (datos.formula || null) : null,
      modo_nota_final: datos.tipo_calificacion === TIPOS_CALIFICACION.NUMERICO ? MODOS_NOTA_FINAL.CALCULADO : MODOS_NOTA_FINAL.MANUAL,
      id_usuario_registro: userId,
    };
    if (datos.id_docente != null) esquemaData.id_docente = parseInt(datos.id_docente);
    const esquema = await tx.tbl_esquemas_calificacion.create({ data: esquemaData });

    if (datos.periodos && datos.periodos.length > 0) {
      for (let i = 0; i < datos.periodos.length; i++) {
        await tx.tbl_periodos_calificacion.create({
          data: {
            id_esquema_calificacion: esquema.id,
            nombre: datos.periodos[i].nombre,
            orden: i + 1,
            id_usuario_registro: userId,
          },
        });
      }
    }

    if (datos.componentes && datos.componentes.length > 0) {
      for (let i = 0; i < datos.componentes.length; i++) {
        await tx.tbl_componentes_nota.create({
          data: {
            id_esquema_calificacion: esquema.id,
            nombre_componente: datos.componentes[i].nombre_componente,
            peso_porcentaje: datos.componentes[i].peso_porcentaje || null,
            orden: i + 1,
            id_usuario_registro: userId,
          },
        });
      }
    }

    return esquema;
  });
};

const actualizarFormula = async (idEsquema, formula, userId) => {
  return prisma.tbl_esquemas_calificacion.update({
    where: { id: idEsquema },
    data: {
      formula: formula,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

module.exports = { obtenerEsquema, crearEsquema, actualizarFormula };
