const { ESTADOS_ASISTENCIA, TIPOS_CALIFICACION, MODALIDADES_TRIVIA } = require('../utils/constants');

const validarCamposObligatorios = (campos, body) => {
  const faltantes = campos.filter(campo => !body[campo] && body[campo] !== 0 && body[campo] !== false);
  if (faltantes.length > 0) {
    return `Campos obligatorios faltantes: ${faltantes.join(', ')}`;
  }
  return null;
};

const validarEmail = (correo) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
};

const validarEstadoAsistencia = (estado) => {
  return Object.values(ESTADOS_ASISTENCIA).includes(estado);
};

const validarTipoCalificacion = (tipo) => {
  return Object.values(TIPOS_CALIFICACION).includes(tipo);
};

const validarModalidadTrivia = (modalidad) => {
  return Object.values(MODALIDADES_TRIVIA).includes(modalidad);
};

module.exports = {
  validarCamposObligatorios,
  validarEmail,
  validarEstadoAsistencia,
  validarTipoCalificacion,
  validarModalidadTrivia,
};
