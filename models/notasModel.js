const prisma = require('../config/prisma');

const obtenerNotasPorCursoBimestre = async (idCurso, idPeriodoCalificacion) => {
  return prisma.tbl_notas_cabecera.findMany({
    where: { id_curso: idCurso, id_periodo_calificacion: idPeriodoCalificacion, estado: 1 },
    include: {
      tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
      tbl_notas_detalle: {
        where: { estado: 1 },
        include: { tbl_componentes_nota: { select: { id: true, nombre_componente: true, peso_porcentaje: true } } },
      },
      tbl_periodos_calificacion: { select: { nombre: true } },
    },
    orderBy: { tbl_alumnos: { apellidos: 'asc' } },
  });
};

const registrarNotas = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    let cabecera = await tx.tbl_notas_cabecera.findFirst({
      where: {
        id_alumno: datos.id_alumno,
        id_curso: datos.id_curso,
        id_periodo_calificacion: datos.id_periodo_calificacion,
        estado: 1,
      },
    });

    if (cabecera) {
      cabecera = await tx.tbl_notas_cabecera.update({
        where: { id: cabecera.id },
        data: {
          nota_final_numerica: datos.nota_final_numerica || null,
          nota_final_letra: datos.nota_final_letra || null,
          nota_final_manual: datos.nota_final_manual || false,
          id_usuario_modificacion: userId,
          fecha_hora_modificacion: new Date(),
        },
      });
    } else {
      cabecera = await tx.tbl_notas_cabecera.create({
        data: {
          id_alumno: datos.id_alumno,
          id_curso: datos.id_curso,
          id_periodo_escolar: datos.id_periodo_escolar,
          id_periodo_calificacion: datos.id_periodo_calificacion,
          id_esquema_calificacion: datos.id_esquema_calificacion,
          nota_final_numerica: datos.nota_final_numerica || null,
          nota_final_letra: datos.nota_final_letra || null,
          nota_final_manual: datos.nota_final_manual || false,
          id_usuario_registro: userId,
        },
      });
    }

    if (datos.detalles && datos.detalles.length > 0) {
      for (const detalle of datos.detalles) {
        const existente = await tx.tbl_notas_detalle.findFirst({
          where: {
            id_nota_cabecera: cabecera.id,
            id_componente_nota: detalle.id_componente_nota,
            estado: 1,
          },
        });

        if (existente) {
          await tx.tbl_notas_detalle.update({
            where: { id: existente.id },
            data: {
              valor_numerico: detalle.valor_numerico || null,
              valor_letra: detalle.valor_letra || null,
              id_usuario_modificacion: userId,
              fecha_hora_modificacion: new Date(),
            },
          });
        } else {
          await tx.tbl_notas_detalle.create({
            data: {
              id_nota_cabecera: cabecera.id,
              id_componente_nota: detalle.id_componente_nota,
              valor_numerico: detalle.valor_numerico || null,
              valor_letra: detalle.valor_letra || null,
              id_usuario_registro: userId,
            },
          });
        }
      }
    }

    return cabecera;
  });
};

const recalcularNotas = async (idEsquema, formula, userId) => {
  const cabeceras = await prisma.tbl_notas_cabecera.findMany({
    where: { id_esquema_calificacion: idEsquema, estado: 1 },
    include: {
      tbl_notas_detalle: {
        where: { estado: 1 },
        include: { tbl_componentes_nota: true },
      },
    },
  });

  const componentes = await prisma.tbl_componentes_nota.findMany({
    where: { id_esquema_calificacion: idEsquema, estado: 1 },
    orderBy: { orden: 'asc' },
  });

  return prisma.$transaction(async (tx) => {
    for (const cab of cabeceras) {
      const valores = {};
      for (const det of cab.tbl_notas_detalle) {
        valores[det.tbl_componentes_nota.nombre_componente] = parseFloat(det.valor_numerico) || 0;
      }

      let notaFinal = 0;
      if (formula && formula.includes('promedio_ponderado')) {
        let sumaPonderada = 0;
        let sumaPesos = 0;
        for (const comp of componentes) {
          const valor = valores[comp.nombre_componente] || 0;
          const peso = parseFloat(comp.peso_porcentaje) || 0;
          sumaPonderada += valor * peso;
          sumaPesos += peso;
        }
        notaFinal = sumaPesos > 0 ? sumaPonderada / sumaPesos : 0;
      } else {
        const vals = Object.values(valores);
        notaFinal = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }

      await tx.tbl_notas_cabecera.update({
        where: { id: cab.id },
        data: {
          nota_final_numerica: Math.round(notaFinal * 100) / 100,
          id_usuario_modificacion: userId,
          fecha_hora_modificacion: new Date(),
        },
      });
    }
  });
};

const inactivarNota = async (idCabecera, userId) => {
  return prisma.tbl_notas_cabecera.update({
    where: { id: idCabecera },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

const obtenerNotasAlumnoCurso = async (idAlumno, idCurso) => {
  return prisma.tbl_notas_cabecera.findMany({
    where: { id_alumno: idAlumno, id_curso: idCurso, estado: 1 },
    include: {
      tbl_periodos_calificacion: { select: { nombre: true, orden: true } },
      tbl_notas_detalle: {
        where: { estado: 1 },
        include: { tbl_componentes_nota: { select: { nombre_componente: true, peso_porcentaje: true } } },
      },
    },
    orderBy: { tbl_periodos_calificacion: { orden: 'asc' } },
  });
};

module.exports = { obtenerNotasPorCursoBimestre, registrarNotas, recalcularNotas, inactivarNota, obtenerNotasAlumnoCurso };
