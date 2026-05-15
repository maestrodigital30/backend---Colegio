const prisma = require('../config/prisma');
const { TIPOS_VALOR_ANTROPOMETRICO } = require('../utils/constants');

const _selectTipo = {
  select: { id: true, nombre: true, tipo_valor: true, unidad: true, estado: true },
};

const obtenerPorAlumno = async (idAlumno) => {
  return prisma.tbl_datos_antropometricos_alumno.findMany({
    where: { id_alumno: idAlumno, estado: 1 },
    include: { tbl_tipos_dato_antropometrico: _selectTipo },
    orderBy: { tbl_tipos_dato_antropometrico: { nombre: 'asc' } },
  });
};

const obtenerPorId = async (id) => {
  return prisma.tbl_datos_antropometricos_alumno.findFirst({
    where: { id },
    include: { tbl_tipos_dato_antropometrico: _selectTipo },
  });
};

const _validarYNormalizar = async (datos) => {
  const id_tipo_dato_antropometrico = parseInt(datos.id_tipo_dato_antropometrico);
  if (!Number.isInteger(id_tipo_dato_antropometrico) || id_tipo_dato_antropometrico <= 0) {
    const err = new Error('TIPO_DATO_REQUERIDO');
    throw err;
  }

  const tipo = await prisma.tbl_tipos_dato_antropometrico.findFirst({
    where: { id: id_tipo_dato_antropometrico, estado: 1 },
  });
  if (!tipo) {
    const err = new Error('TIPO_DATO_NO_ENCONTRADO');
    throw err;
  }

  let valor_numerico = null;
  let valor_texto = null;

  if (tipo.tipo_valor === TIPOS_VALOR_ANTROPOMETRICO.NUMERICO) {
    if (datos.valor_numerico === undefined || datos.valor_numerico === null || datos.valor_numerico === '') {
      const err = new Error('VALOR_NUMERICO_REQUERIDO');
      throw err;
    }
    const num = Number(datos.valor_numerico);
    if (!Number.isFinite(num)) {
      const err = new Error('VALOR_NUMERICO_INVALIDO');
      throw err;
    }
    valor_numerico = num;
  } else {
    const texto = String(datos.valor_texto || '').trim();
    if (!texto) {
      const err = new Error('VALOR_TEXTO_REQUERIDO');
      throw err;
    }
    valor_texto = texto;
  }

  const descripcion = datos.descripcion ? String(datos.descripcion).trim() || null : null;

  return { id_tipo_dato_antropometrico, valor_numerico, valor_texto, descripcion };
};

const crear = async (idAlumno, datos, userId) => {
  const normalizado = await _validarYNormalizar(datos);
  try {
    return await prisma.tbl_datos_antropometricos_alumno.create({
      data: {
        id_alumno: idAlumno,
        ...normalizado,
        id_usuario_registro: userId,
      },
      include: { tbl_tipos_dato_antropometrico: _selectTipo },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('DATO_DUPLICADO');
      throw err;
    }
    throw error;
  }
};

const actualizar = async (id, datos, userId) => {
  const existente = await prisma.tbl_datos_antropometricos_alumno.findFirst({ where: { id } });
  if (!existente) {
    const err = new Error('NO_ENCONTRADO');
    throw err;
  }
  const id_tipo_dato_antropometrico = datos.id_tipo_dato_antropometrico !== undefined
    ? parseInt(datos.id_tipo_dato_antropometrico)
    : existente.id_tipo_dato_antropometrico;
  const normalizado = await _validarYNormalizar({ ...datos, id_tipo_dato_antropometrico });
  try {
    return await prisma.tbl_datos_antropometricos_alumno.update({
      where: { id },
      data: {
        ...normalizado,
        id_usuario_modificacion: userId,
        fecha_hora_modificacion: new Date(),
      },
      include: { tbl_tipos_dato_antropometrico: _selectTipo },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('DATO_DUPLICADO');
      throw err;
    }
    throw error;
  }
};

const inactivar = async (id, userId) => {
  return prisma.tbl_datos_antropometricos_alumno.update({
    where: { id },
    data: { estado: 0, id_usuario_modificacion: userId, fecha_hora_modificacion: new Date() },
  });
};

module.exports = { obtenerPorAlumno, obtenerPorId, crear, actualizar, inactivar };
