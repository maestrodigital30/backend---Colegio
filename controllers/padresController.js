const model = require('../models/padresModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES } = require('../utils/constants');
const { validarEmail } = require('../validators/commonValidators');

const obtenerTodos = async (req, res) => {
  try {
    const filtros = {};
    if (req.user.rol === ROLES.DOCENTE && req.user.id_perfil_docente) {
      filtros.id_docente = req.user.id_perfil_docente;
    }
    if (req.query.id_docente && req.user.rol !== ROLES.DOCENTE) filtros.id_docente = parseInt(req.query.id_docente);
    res.json(await model.obtenerTodos(filtros));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener padres' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const padre = await model.obtenerPorId(parseInt(req.params.id));
    if (!padre) return res.status(404).json({ error: 'Padre no encontrado' });
    res.json(padre);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener padre' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombres, apellidos, telefono, correo } = req.body;

    const campos = {};
    if (!nombres || !nombres.trim()) campos.nombres = 'El nombre es obligatorio';
    if (!apellidos || !apellidos.trim()) campos.apellidos = 'El apellido es obligatorio';
    if (!telefono || !telefono.trim()) campos.telefono = 'El teléfono es obligatorio';
    else if (!/^\d{7,15}$/.test(telefono.replace(/\s/g, '')))
      campos.telefono = 'El teléfono debe contener solo números (7 a 15 dígitos)';
    if (!correo || !correo.trim()) campos.correo = 'El correo es obligatorio';
    else if (!validarEmail(correo)) campos.correo = 'El formato del correo no es válido';

    if (Object.keys(campos).length > 0) {
      const detalles = Object.values(campos).join('. ');
      return res.status(400).json({ error: detalles, campos });
    }

    const datos = { ...req.body };
    if (req.user.rol === ROLES.DOCENTE) {
      datos.id_docente = req.user.id_perfil_docente;
    } else if (!datos.id_docente) {
      datos.id_docente = req.user.id_perfil_docente || req.user.id;
    }

    const padre = await model.crear(datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_padres', id_entidad: padre.id,
      tipo_accion: 'crear', datos_nuevos: { nombres, apellidos },
    });
    res.status(201).json(padre);
  } catch (error) {
    console.error('Error al crear padre:', error);
    let mensaje = 'Error al crear padre';
    if (error.code === 'P2003') {
      mensaje = 'Error de referencia: el docente asociado no existe. Verifique la asignación.';
    } else if (error.code === 'P2002') {
      mensaje = 'Ya existe un padre registrado con estos datos.';
    } else if (error.code === 'P2000') {
      mensaje = 'Uno de los campos excede la longitud máxima permitida.';
    } else if (error.message) {
      mensaje = `Error al crear padre: ${error.message}`;
    }
    res.status(500).json({ error: mensaje });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombres, apellidos, telefono, correo } = req.body;

    const campos = {};
    if (!nombres || !nombres.trim()) campos.nombres = 'El nombre es obligatorio';
    if (!apellidos || !apellidos.trim()) campos.apellidos = 'El apellido es obligatorio';
    if (!telefono || !telefono.trim()) campos.telefono = 'El teléfono es obligatorio';
    else if (!/^\d{7,15}$/.test(telefono.replace(/\s/g, '')))
      campos.telefono = 'El teléfono debe contener solo números (7 a 15 dígitos)';
    if (!correo || !correo.trim()) campos.correo = 'El correo es obligatorio';
    else if (!validarEmail(correo)) campos.correo = 'El formato del correo no es válido';

    if (Object.keys(campos).length > 0) {
      const detalles = Object.values(campos).join('. ');
      return res.status(400).json({ error: detalles, campos });
    }

    const padre = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_padres', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(padre);
  } catch (error) {
    console.error('Error al actualizar padre:', error);
    let mensaje = 'Error al actualizar padre';
    if (error.code === 'P2003') {
      mensaje = 'Error de referencia: el docente asociado no existe.';
    } else if (error.code === 'P2025') {
      mensaje = 'El padre que intenta actualizar no fue encontrado.';
    } else if (error.code === 'P2000') {
      mensaje = 'Uno de los campos excede la longitud máxima permitida.';
    } else if (error.message) {
      mensaje = `Error al actualizar padre: ${error.message}`;
    }
    res.status(500).json({ error: mensaje });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_padres', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Padre inactivado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar padre' });
  }
};

const vincularAlumno = async (req, res) => {
  try {
    const idPadre = parseInt(req.params.id);
    const { id_alumno, es_principal, parentesco } = req.body;
    if (!id_alumno) return res.status(400).json({ error: 'id_alumno es obligatorio' });
    const resultado = await model.vincularAlumno(idPadre, id_alumno, es_principal || false, parentesco || null, req.user.id);
    res.json(resultado);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al vincular alumno' });
  }
};

const activar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.activar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_padres', id_entidad: id, tipo_accion: 'activar',
    });
    res.json({ mensaje: 'Padre activado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al activar padre' });
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar, vincularAlumno };
