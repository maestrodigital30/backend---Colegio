const prisma = require('../config/prisma');
const { TIPOS_VALOR_ANTROPOMETRICO } = require('../utils/constants');

const TIPOS_VALOR_VALIDOS = Object.values(TIPOS_VALOR_ANTROPOMETRICO);

const obtenerTodos = async () => {
  return prisma.tbl_tipos_dato_antropometrico.findMany({
    orderBy: { nombre: 'asc' },
  });
};

const obtenerActivos = async () => {
  return prisma.tbl_tipos_dato_antropometrico.findMany({
    where: { estado: 1 },
    orderBy: { nombre: 'asc' },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_tipos_dato_antropometrico.findFirst({ where: { id } });
};

const _normalizar = (datos) => {
  const tipo_valor = String(datos.tipo_valor || '').toLowerCase();
  if (!TIPOS_VALOR_VALIDOS.includes(tipo_valor)) {
    const err = new Error('TIPO_VALOR_INVALIDO');
    err.detalle = `tipo_valor debe ser uno de: ${TIPOS_VALOR_VALIDOS.join(', ')}`;
    throw err;
  }
  const nombre = String(datos.nombre || '').trim();
  if (!nombre) {
    const err = new Error('NOMBRE_REQUERIDO');
    throw err;
  }
  const unidad = tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO && datos.unidad
    ? String(datos.unidad).trim() || null
    : null;
  return { nombre, tipo_valor, unidad };
};

const crear = async (datos, userId) => {
  const { nombre, tipo_valor, unidad } = _normalizar(datos);
  try {
    return await prisma.tbl_tipos_dato_antropometrico.create({
      data: { nombre, tipo_valor, unidad, id_usuario_registro: userId },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('NOMBRE_DUPLICADO');
      throw err;
    }
    throw error;
  }
};

const actualizar = async (id, datos, userId) => {
  const { nombre, tipo_valor, unidad } = _normalizar(datos);
  try {
    return await prisma.tbl_tipos_dato_antropometrico.update({
      where: { id },
      data: {
        nombre,
        tipo_valor,
        unidad,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('NOMBRE_DUPLICADO');
      throw err;
    }
    throw error;
  }
};

const inactivar = async (id, userId) => {
  return prisma.tbl_tipos_dato_antropometrico.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

const activar = async (id, userId) => {
  return prisma.tbl_tipos_dato_antropometrico.update({
    where: { id },
    data: { estado: 1, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

module.exports = { obtenerTodos, obtenerActivos, obtenerPorId, crear, actualizar, inactivar, activar };
