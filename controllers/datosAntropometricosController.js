const model = require('../models/datosAntropometricosModel');
const alumnosModel = require('../models/alumnosModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES } = require('../utils/constants');

const _verificarAccesoAlumno = async (req, idAlumno) => {
  const alumno = await alumnosModel.obtenerPorId(idAlumno);
  if (!alumno) {
    return { ok: false, status: 404, error: 'Alumno no encontrado' };
  }
  if (req.user.rol === ROLES.DOCENTE && alumno.id_docente !== req.user.id_perfil_docente) {
    return { ok: false, status: 403, error: 'No tiene acceso a este alumno' };
  }
  return { ok: true, alumno };
};

const obtenerPorAlumno = async (req, res) => {
  try {
    const idAlumno = parseInt(req.params.idAlumno);
    const acceso = await _verificarAccesoAlumno(req, idAlumno);
    if (!acceso.ok) return res.status(acceso.status).json({ error: acceso.error });
    res.json(await model.obtenerPorAlumno(idAlumno));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener datos antropométricos' });
  }
};

const crear = async (req, res) => {
  try {
    const idAlumno = parseInt(req.params.idAlumno);
    const acceso = await _verificarAccesoAlumno(req, idAlumno);
    if (!acceso.ok) return res.status(acceso.status).json({ error: acceso.error });

    const dato = await model.crear(idAlumno, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_datos_antropometricos_alumno',
      id_entidad: dato.id,
      tipo_accion: 'crear',
      datos_nuevos: {
        id_alumno: idAlumno,
        id_tipo_dato_antropometrico: dato.id_tipo_dato_antropometrico,
        valor_numerico: dato.valor_numerico,
        valor_texto: dato.valor_texto,
      },
    });
    res.status(201).json(dato);
  } catch (error) {
    const mapaErrores = {
      TIPO_DATO_REQUERIDO: { status: 400, msg: 'El tipo de dato antropométrico es obligatorio' },
      TIPO_DATO_NO_ENCONTRADO: { status: 404, msg: 'Tipo de dato no encontrado o inactivo' },
      VALOR_NUMERICO_REQUERIDO: { status: 400, msg: 'El valor numérico es obligatorio para este tipo' },
      VALOR_NUMERICO_INVALIDO: { status: 400, msg: 'El valor numérico es inválido' },
      VALOR_TEXTO_REQUERIDO: { status: 400, msg: 'El valor de texto es obligatorio para este tipo' },
      DATO_DUPLICADO: { status: 409, msg: 'Este alumno ya tiene un valor para este tipo de dato' },
    };
    if (mapaErrores[error.message]) {
      return res.status(mapaErrores[error.message].status).json({ error: mapaErrores[error.message].msg });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear dato antropométrico' });
  }
};

const actualizar = async (req, res) => {
  try {
    const idAlumno = parseInt(req.params.idAlumno);
    const id = parseInt(req.params.id);
    const acceso = await _verificarAccesoAlumno(req, idAlumno);
    if (!acceso.ok) return res.status(acceso.status).json({ error: acceso.error });

    const existente = await model.obtenerPorId(id);
    if (!existente || existente.id_alumno !== idAlumno) {
      return res.status(404).json({ error: 'Dato antropométrico no encontrado' });
    }

    const dato = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_datos_antropometricos_alumno',
      id_entidad: id,
      tipo_accion: 'actualizar',
      datos_anteriores: {
        valor_numerico: existente.valor_numerico,
        valor_texto: existente.valor_texto,
        descripcion: existente.descripcion,
      },
      datos_nuevos: {
        valor_numerico: dato.valor_numerico,
        valor_texto: dato.valor_texto,
        descripcion: dato.descripcion,
      },
    });
    res.json(dato);
  } catch (error) {
    const mapaErrores = {
      NO_ENCONTRADO: { status: 404, msg: 'Dato antropométrico no encontrado' },
      TIPO_DATO_REQUERIDO: { status: 400, msg: 'El tipo de dato antropométrico es obligatorio' },
      TIPO_DATO_NO_ENCONTRADO: { status: 404, msg: 'Tipo de dato no encontrado o inactivo' },
      VALOR_NUMERICO_REQUERIDO: { status: 400, msg: 'El valor numérico es obligatorio para este tipo' },
      VALOR_NUMERICO_INVALIDO: { status: 400, msg: 'El valor numérico es inválido' },
      VALOR_TEXTO_REQUERIDO: { status: 400, msg: 'El valor de texto es obligatorio para este tipo' },
      DATO_DUPLICADO: { status: 409, msg: 'Este alumno ya tiene un valor para este tipo de dato' },
    };
    if (mapaErrores[error.message]) {
      return res.status(mapaErrores[error.message].status).json({ error: mapaErrores[error.message].msg });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar dato antropométrico' });
  }
};

const inactivar = async (req, res) => {
  try {
    const idAlumno = parseInt(req.params.idAlumno);
    const id = parseInt(req.params.id);
    const acceso = await _verificarAccesoAlumno(req, idAlumno);
    if (!acceso.ok) return res.status(acceso.status).json({ error: acceso.error });

    const existente = await model.obtenerPorId(id);
    if (!existente || existente.id_alumno !== idAlumno) {
      return res.status(404).json({ error: 'Dato antropométrico no encontrado' });
    }

    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_datos_antropometricos_alumno',
      id_entidad: id,
      tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Dato antropométrico eliminado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar dato antropométrico' });
  }
};

module.exports = { obtenerPorAlumno, crear, actualizar, inactivar };
