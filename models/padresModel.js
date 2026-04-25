const prisma = require('../config/prisma');

const obtenerTodos = async (filtros = {}) => {
  const where = {};
  if (filtros.id_docente) where.id_docente = filtros.id_docente;

  return prisma.tbl_padres.findMany({
    where,
    include: {
      tbl_padres_alumnos: {
        where: { estado: 1 },
        include: {
          tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
        },
      },
    },
    orderBy: { apellidos: 'asc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_padres.findFirst({
    where: { id, estado: 1 },
    include: {
      tbl_padres_alumnos: {
        where: { estado: 1 },
        include: {
          tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } },
        },
      },
    },
  });
};

const crear = async (datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const padreData = {
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      telefono: datos.telefono || null,
      correo: datos.correo || null,
      es_contacto_principal: datos.es_principal || false,
      id_usuario_registro: userId,
    };
    if (datos.id_docente != null) padreData.id_docente = parseInt(datos.id_docente);
    const padre = await tx.tbl_padres.create({ data: padreData });

    if (datos.alumnos && datos.alumnos.length > 0) {
      for (const vinculo of datos.alumnos) {
        await tx.tbl_padres_alumnos.create({
          data: {
            id_alumno: vinculo.id_alumno,
            id_padre: padre.id,
            es_principal: vinculo.es_principal || false,
            id_usuario_registro: userId,
          },
        });
      }
    }

    return padre;
  });
};

const actualizar = async (id, datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const padre = await tx.tbl_padres.update({
      where: { id },
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        telefono: datos.telefono || null,
        correo: datos.correo || null,
        es_contacto_principal: datos.es_principal ?? false,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });

    if (datos.es_principal !== undefined) {
      const vinculos = await tx.tbl_padres_alumnos.findMany({
        where: { id_padre: id, estado: 1 },
        select: { id_alumno: true },
      });

      if (datos.es_principal && vinculos.length > 0) {
        // Unset other padres as principal for these alumnos
        await tx.tbl_padres_alumnos.updateMany({
          where: { id_alumno: { in: vinculos.map(v => v.id_alumno) }, es_principal: true, estado: 1, id_padre: { not: id } },
          data: { es_principal: false, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
        });
      }

      await tx.tbl_padres_alumnos.updateMany({
        where: { id_padre: id, estado: 1 },
        data: { es_principal: datos.es_principal, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }

    return padre;
  });
};

const inactivar = async (id, userId) => {
  return prisma.tbl_padres.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

const vincularAlumno = async (idPadre, idAlumno, esPrincipal, parentesco, userId) => {
  if (esPrincipal) {
    await prisma.tbl_padres_alumnos.updateMany({
      where: { id_alumno: idAlumno, es_principal: true, estado: 1 },
      data: { es_principal: false, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });
  }

  return prisma.tbl_padres_alumnos.create({
    data: {
      id_alumno: idAlumno,
      id_padre: idPadre,
      parentesco: parentesco,
      es_principal: esPrincipal,
      id_usuario_registro: userId,
    },
  });
};

const obtenerPadrePrincipal = async (idAlumno) => {
  const vinculo = await prisma.tbl_padres_alumnos.findFirst({
    where: { id_alumno: idAlumno, es_principal: true, estado: 1 },
    include: { tbl_padres: true },
  });
  return vinculo ? vinculo.tbl_padres : null;
};

const activar = async (id, userId) => {
  return prisma.tbl_padres.update({
    where: { id },
    data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar, vincularAlumno, obtenerPadrePrincipal };
