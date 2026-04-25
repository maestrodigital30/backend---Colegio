const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getAlumnoRolId } = require('../utils/roles');

const obtenerTodos = async (filtros = {}) => {
  const where = {};
  if (filtros.id_docente) where.id_docente = filtros.id_docente;

  return prisma.tbl_alumnos.findMany({
    where,
    include: {
      tbl_alumnos_cursos: {
        where: { estado: 1 },
        include: { tbl_cursos: { select: { id: true, nombre: true } } },
      },
      tbl_carnets_alumnos: { where: { esta_activo: true, estado: 1 }, take: 1 },
      tbl_qr_alumnos: { where: { esta_activo: true, estado: 1 }, take: 1 },
      tbl_usuarios: { select: { id: true, correo: true, estado: true } },
    },
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_alumnos.findFirst({
    where: { id, estado: 1 },
    include: {
      tbl_alumnos_cursos: {
        where: { estado: 1 },
        include: { tbl_cursos: { select: { id: true, nombre: true } } },
      },
      tbl_carnets_alumnos: { where: { esta_activo: true, estado: 1 }, take: 1 },
      tbl_qr_alumnos: { where: { esta_activo: true, estado: 1 }, take: 1 },
      tbl_padres_alumnos: {
        where: { estado: 1 },
        include: { tbl_padres: { select: { id: true, nombres: true, apellidos: true, telefono: true } } },
      },
    },
  });
};

const verificarDniUnico = async (dni, idExcluir = null) => {
  if (!dni) return true;
  const where = { dni, estado: 1 };
  if (idExcluir) where.id = { not: idExcluir };
  const existente = await prisma.tbl_alumnos.findFirst({ where });
  return !existente;
};

const crear = async (datos, userId) => {
  // Validar DNI único
  if (datos.dni) {
    const dniDisponible = await verificarDniUnico(datos.dni);
    if (!dniDisponible) {
      throw new Error('DNI_DUPLICADO');
    }
  }

  return prisma.$transaction(async (tx) => {
    // Crear usuario para el alumno
    let idUsuarioAlumno = null;
    const correoAlumno = datos.correo_acceso?.trim() || (datos.dni ? `alumno.${datos.dni}@colegio.edu` : null);
    const contrasenaAlumno = datos.contrasena_acceso || datos.dni;

    if (correoAlumno && contrasenaAlumno) {
      // Validar correo único
      const correoExiste = await tx.tbl_usuarios.findFirst({ where: { correo: correoAlumno } });
      if (correoExiste) throw new Error('CORREO_DUPLICADO');

      const alumnoRolId = await getAlumnoRolId();
      const hashContrasena = await bcrypt.hash(contrasenaAlumno, 10);

      const usuario = await tx.tbl_usuarios.create({
        data: {
          nombres: datos.nombres,
          apellidos: datos.apellidos || null,
          correo: correoAlumno,
          contrasena: hashContrasena,
          id_rol: alumnoRolId,
          id_usuario_registro: userId,
        },
      });
      idUsuarioAlumno = usuario.id;
    }

    const alumnoData = {
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      dni: datos.dni || null,
      fecha_nacimiento: datos.fecha_nacimiento ? new Date(datos.fecha_nacimiento) : null,
      genero: datos.genero || null,
      direccion: datos.direccion || null,
      id_usuario_registro: userId,
      id_usuario: idUsuarioAlumno,
    };
    if (datos.id_docente != null) alumnoData.id_docente = parseInt(datos.id_docente);
    const alumno = await tx.tbl_alumnos.create({ data: alumnoData });

    const codigoCarnet = `TC-${alumno.id.toString().padStart(6, '0')}`;
    await tx.tbl_carnets_alumnos.create({
      data: {
        id_alumno: alumno.id,
        codigo_carnet: codigoCarnet,
        esta_activo: true,
        id_usuario_registro: userId,
      },
    });

    const valorQr = uuidv4();
    await tx.tbl_qr_alumnos.create({
      data: {
        id_alumno: alumno.id,
        valor_qr: valorQr,
        esta_activo: true,
        id_usuario_registro: userId,
      },
    });

    if (datos.cursos && datos.cursos.length > 0) {
      for (const idCurso of datos.cursos) {
        await tx.tbl_alumnos_cursos.create({
          data: { id_curso: idCurso, id_alumno: alumno.id, id_usuario_registro: userId },
        });
      }
    }

    return { ...alumno, correo_generado: correoAlumno || null };
  });
};

const actualizar = async (id, datos, userId) => {
  // Validar DNI único (excluyendo el propio registro)
  if (datos.dni) {
    const dniDisponible = await verificarDniUnico(datos.dni, id);
    if (!dniDisponible) {
      throw new Error('DNI_DUPLICADO');
    }
  }

  return prisma.$transaction(async (tx) => {
    // Obtener estado actual antes de actualizar
    const alumnoAntes = await tx.tbl_alumnos.findUnique({ where: { id } });

    const alumno = await tx.tbl_alumnos.update({
      where: { id },
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        dni: datos.dni || null,
        fecha_nacimiento: datos.fecha_nacimiento ? new Date(datos.fecha_nacimiento) : null,
        genero: datos.genero || null,
        direccion: datos.direccion || null,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });

    if (alumno.id_usuario) {
      // Tiene usuario vinculado: sincronizar datos
      const updateData = {
        nombres: datos.nombres,
        apellidos: datos.apellidos || null,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      };
      // Si cambió el DNI, actualizar también el correo
      if (datos.dni && datos.dni !== alumnoAntes.dni) {
        updateData.correo = `alumno.${datos.dni}@colegio.edu`;
      }
      await tx.tbl_usuarios.update({ where: { id: alumno.id_usuario }, data: updateData });
    } else if (datos.dni) {
      // No tiene usuario pero ahora tiene DNI: crear usuario
      const alumnoRolId = await getAlumnoRolId();
      const correoAlumno = `alumno.${datos.dni}@colegio.edu`;
      const hashContrasena = await bcrypt.hash(datos.dni, 10);

      const nuevoUsuario = await tx.tbl_usuarios.create({
        data: {
          nombres: datos.nombres,
          apellidos: datos.apellidos || null,
          correo: correoAlumno,
          contrasena: hashContrasena,
          id_rol: alumnoRolId,
          id_usuario_registro: userId,
        },
      });
      await tx.tbl_alumnos.update({
        where: { id },
        data: { id_usuario: nuevoUsuario.id },
      });
    }

    return alumno;
  });
};

const inactivar = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const alumno = await tx.tbl_alumnos.update({
      where: { id },
      data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });
    if (alumno.id_usuario) {
      await tx.tbl_usuarios.update({
        where: { id: alumno.id_usuario },
        data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }
    return alumno;
  });
};

const asignarCursos = async (idAlumno, cursos, userId) => {
  return prisma.$transaction(async (tx) => {
    for (const idCurso of cursos) {
      await tx.tbl_alumnos_cursos.upsert({
        where: { id_curso_id_alumno: { id_curso: idCurso, id_alumno: idAlumno } },
        update: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
        create: { id_curso: idCurso, id_alumno: idAlumno, id_usuario_registro: userId },
      });
    }
  });
};

const regenerarCarnetQr = async (idAlumno, userId) => {
  return prisma.$transaction(async (tx) => {
    await tx.tbl_carnets_alumnos.updateMany({
      where: { id_alumno: idAlumno, esta_activo: true },
      data: { esta_activo: false, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });
    await tx.tbl_qr_alumnos.updateMany({
      where: { id_alumno: idAlumno, esta_activo: true },
      data: { esta_activo: false, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });

    const codigoCarnet = `TC-${idAlumno.toString().padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`;
    const carnet = await tx.tbl_carnets_alumnos.create({
      data: { id_alumno: idAlumno, codigo_carnet: codigoCarnet, esta_activo: true, id_usuario_registro: userId },
    });

    const valorQr = uuidv4();
    const qr = await tx.tbl_qr_alumnos.create({
      data: { id_alumno: idAlumno, valor_qr: valorQr, esta_activo: true, id_usuario_registro: userId },
    });

    return { carnet, qr };
  });
};

const buscarPorQr = async (valorQr) => {
  // Buscar por valor_qr (UUID del QR escaneado)
  const qr = await prisma.tbl_qr_alumnos.findFirst({
    where: { valor_qr: valorQr, esta_activo: true, estado: 1 },
    include: {
      tbl_alumnos: {
        select: { id: true, nombres: true, apellidos: true, id_docente: true, estado: true },
      },
    },
  });
  if (qr) return qr;

  // Si no se encuentra, buscar por codigo_carnet (ingreso manual)
  const carnet = await prisma.tbl_carnets_alumnos.findFirst({
    where: { codigo_carnet: valorQr, esta_activo: true, estado: 1 },
    include: {
      tbl_alumnos: {
        select: { id: true, nombres: true, apellidos: true, id_docente: true, estado: true },
      },
    },
  });
  if (!carnet) return null;

  // Retornar en el mismo formato que el QR para compatibilidad
  return { tbl_alumnos: carnet.tbl_alumnos };
};

const activar = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const alumno = await tx.tbl_alumnos.update({
      where: { id },
      data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
    });
    if (alumno.id_usuario) {
      await tx.tbl_usuarios.update({
        where: { id: alumno.id_usuario },
        data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
      });
    }
    return alumno;
  });
};

const actualizarFoto = async (id, fotoUrl, userId) => {
  return prisma.tbl_alumnos.update({
    where: { id },
    data: {
      foto_url: fotoUrl,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar, asignarCursos, regenerarCarnetQr, buscarPorQr, actualizarFoto, verificarDniUnico };
