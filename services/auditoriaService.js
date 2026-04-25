const { registrarAuditoria } = require('../models/auditoriaModel');

const auditar = async ({ id_usuario, nombre_entidad, id_entidad, tipo_accion, datos_anteriores = null, datos_nuevos = null }) => {
  try {
    await registrarAuditoria({ id_usuario, nombre_entidad, id_entidad, tipo_accion, datos_anteriores, datos_nuevos });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

module.exports = { auditar };
