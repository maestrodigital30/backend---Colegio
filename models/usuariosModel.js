const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { getDocenteRolId, getAlumnoRolId } = require('../utils/roles');

const obtenerTodos = async () => {
  return prisma.tbl_usuarios.findMany({
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      correo: true,
      id_rol: true,
      celular: true,
      estado: true,
      fecha_hora_registro: true,
      tbl_roles: { select: { nombre: true } },
      tbl_perfil_docente: { select: { id: true, nombres: true, apellidos: true, especialidad: true, telefono: true } },
    },
    orderBy: { id: 'asc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_usuarios.findFirst({
    where: { id, estado: 1 },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      correo: true,
      id_rol: true,
      celular: true,
      estado: true,
      fecha_hora_registro: true,
      tbl_roles: { select: { nombre: true } },
      tbl_perfil_docente: { select: { id: true, nombres: true, apellidos: true, especialidad: true, telefono: true } },
    },
  });
};

const crear = async (datos, userId) => {
  const hash = await bcrypt.hash(datos.contrasena, 10);
  const docenteRolId = await getDocenteRolId();

  if (datos.id_rol === docenteRolId) {
    return prisma.$transaction(async (tx) => {
      const usuario = await tx.tbl_usuarios.create({
        data: {
          nombres: datos.nombres,
          apellidos: datos.apellidos || null,
          correo: datos.correo,
          contrasena: hash,
          id_rol: datos.id_rol,
          celular: datos.celular || null,
          id_usuario_registro: userId,
        },
      });

      await tx.tbl_perfiles_docente.create({
        data: {
          id_usuario: usuario.id,
          nombres: datos.nombres,
          apellidos: datos.apellidos || datos.nombres,
          especialidad: datos.especialidad || null,
          telefono: datos.telefono || null,
          id_usuario_registro: userId,
        },
      });

      return usuario;
    });
  }

  return prisma.tbl_usuarios.create({
    data: {
      nombres: datos.nombres,
      apellidos: datos.apellidos || null,
      correo: datos.correo,
      contrasena: hash,
      id_rol: datos.id_rol,
      celular: datos.celular || null,
      id_usuario_registro: userId,
    },
  });
};

const actualizar = async (id, datos, userId) => {
  const docenteRolId = await getDocenteRolId();

  return prisma.$transaction(async (tx) => {
    const usuarioActual = await tx.tbl_usuarios.findUnique({
      where: { id },
      include: { tbl_perfil_docente: true },
    });

    const dataToUpdate = {
      nombres: datos.nombres,
      apellidos: datos.apellidos || null,
      correo: datos.correo,
      id_rol: datos.id_rol,
      celular: datos.celular || null,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    };

    if (datos.contrasena) {
      dataToUpdate.contrasena = await bcrypt.hash(datos.contrasena, 10);
    }

    const usuario = await tx.tbl_usuarios.update({
      where: { id },
      data: dataToUpdate,
    });

    const cambiaADocente = datos.id_rol === docenteRolId;
    const tienePerfilDocente = !!usuarioActual.tbl_perfil_docente;

    if (cambiaADocente && !tienePerfilDocente) {
      await tx.tbl_perfiles_docente.create({
        data: {
          id_usuario: id,
          nombres: datos.nombres,
          apellidos: datos.apellidos || datos.nombres,
          especialidad: datos.especialidad || null,
          telefono: datos.telefono || null,
          id_usuario_registro: userId,
        },
      });
    } else if (cambiaADocente && tienePerfilDocente) {
      await tx.tbl_perfiles_docente.update({
        where: { id_usuario: id },
        data: {
          nombres: datos.nombres,
          apellidos: datos.apellidos || datos.nombres,
          especialidad: datos.especialidad !== undefined ? (datos.especialidad || null) : undefined,
          telefono: datos.telefono !== undefined ? (datos.telefono || null) : undefined,
          id_usuario_modificacion: userId,
          fecha_hora_modificacion: new Date(),
        },
      });
    }

    // Sincronizar con alumno vinculado
    const alumnoVinculado = await tx.tbl_alumnos.findUnique({ where: { id_usuario: id } });
    if (alumnoVinculado) {
      await tx.tbl_alumnos.update({
        where: { id: alumnoVinculado.id },
        data: {
          nombres: datos.nombres,
          apellidos: datos.apellidos || null,
          id_usuario_modificacion: userId,
          fecha_hora_modificacion: new Date(),
        },
      });
    }

    return usuario;
  });
};

const inactivar = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const usuario = await tx.tbl_usuarios.update({
      where: { id },
      data: {
        estado: 0,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });

    const perfil = await tx.tbl_perfiles_docente.findUnique({ where: { id_usuario: id } });
    if (perfil) {
      await tx.tbl_perfiles_docente.update({
        where: { id_usuario: id },
        data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }

    // Sincronizar con alumno vinculado
    const alumno = await tx.tbl_alumnos.findUnique({ where: { id_usuario: id } });
    if (alumno) {
      await tx.tbl_alumnos.update({
        where: { id: alumno.id },
        data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }

    return usuario;
  });
};

const activar = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const usuario = await tx.tbl_usuarios.update({
      where: { id },
      data: {
        estado: 1,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });

    const perfil = await tx.tbl_perfiles_docente.findUnique({ where: { id_usuario: id } });
    if (perfil) {
      await tx.tbl_perfiles_docente.update({
        where: { id_usuario: id },
        data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }

    // Sincronizar con alumno vinculado
    const alumno = await tx.tbl_alumnos.findUnique({ where: { id_usuario: id } });
    if (alumno) {
      await tx.tbl_alumnos.update({
        where: { id: alumno.id },
        data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }

    return usuario;
  });
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar };
