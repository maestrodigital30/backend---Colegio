const prisma = require('../config/prisma');
const { ROLES } = require('./constants');

const getRolIdByNombre = async (nombre) => {
  const rol = await prisma.tbl_roles.findFirst({ where: { nombre, estado: 1 } });
  return rol?.id;
};

const getDocenteRolId = () => getRolIdByNombre(ROLES.DOCENTE);
const getAlumnoRolId = () => getRolIdByNombre(ROLES.ALUMNO);

module.exports = { getRolIdByNombre, getDocenteRolId, getAlumnoRolId };
