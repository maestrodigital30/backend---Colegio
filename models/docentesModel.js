const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { getDocenteRolId } = require('../utils/roles');

const obtenerTodos = async () => {
  return prisma.tbl_perfiles_docente.findMany({
    include: {
      tbl_usuarios: {
        select: { id: true, nombres: true, correo: true, celular: true, estado: true },
      },
    },
    orderBy: { apellidos: 'asc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_perfiles_docente.findFirst({
    where: { id, estado: 1 },
    include: {
      tbl_usuarios: {
        select: { id: true, nombres: true, correo: true, celular: true, estado: true },
      },
    },
  });
};

const crear = async (datos, userId) => {
  const docenteRolId = await getDocenteRolId();
  return prisma.$transaction(async (tx) => {
    const hash = await bcrypt.hash(datos.contrasena, 10);
    const usuario = await tx.tbl_usuarios.create({
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos || null,
        correo: datos.correo,
        contrasena: hash,
        id_rol: docenteRolId,
        celular: datos.celular || null,
        id_usuario_registro: userId,
      },
    });

    const perfil = await tx.tbl_perfiles_docente.create({
      data: {
        id_usuario: usuario.id,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        especialidad: datos.especialidad || null,
        telefono: datos.telefono || null,
        id_usuario_registro: userId,
      },
    });

    return { usuario, perfil };
  });
};

const actualizar = async (id, datos, userId) => {
  return prisma.$transaction(async (tx) => {
    const perfil = await tx.tbl_perfiles_docente.update({
      where: { id },
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        especialidad: datos.especialidad || null,
        telefono: datos.telefono || null,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });

    const updateData = {
      nombres: datos.nombres,
      apellidos: datos.apellidos || null,
      correo: datos.correo,
      celular: datos.celular || null,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    };

    if (datos.contrasena) {
      updateData.contrasena = await bcrypt.hash(datos.contrasena, 10);
    }

    await tx.tbl_usuarios.update({
      where: { id: perfil.id_usuario },
      data: updateData,
    });

    return perfil;
  });
};

const inactivar = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const perfil = await tx.tbl_perfiles_docente.update({
      where: { id },
      data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });

    await tx.tbl_usuarios.update({
      where: { id: perfil.id_usuario },
      data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });

    return perfil;
  });
};

const activar = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const perfil = await tx.tbl_perfiles_docente.update({
      where: { id },
      data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });

    await tx.tbl_usuarios.update({
      where: { id: perfil.id_usuario },
      data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });

    return perfil;
  });
};

const actualizarFoto = async (id, fotoUrl, userId) => {
  return prisma.tbl_perfiles_docente.update({
    where: { id },
    data: {
      foto_url: fotoUrl,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar, actualizarFoto };
