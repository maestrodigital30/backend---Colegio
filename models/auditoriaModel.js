const prisma = require('../config/prisma');

const registrarAuditoria = async ({ id_usuario, nombre_entidad, id_entidad, tipo_accion, datos_anteriores = null, datos_nuevos = null }) => {
  try {
    await prisma.tbl_auditoria.create({
      data: {
        id_usuario,
        nombre_entidad,
        id_entidad,
        tipo_accion,
        datos_anteriores,
        datos_nuevos,
      },
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

module.exports = { registrarAuditoria, prisma };
