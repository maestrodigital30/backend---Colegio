const model = require('../models/asistenciaModel');
const alumnosModel = require('../models/alumnosModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES, ESTADOS_ASISTENCIA, MODOS_REGISTRO_ASISTENCIA } = require('../utils/constants');

const obtenerSesion = async (req, res) => {
  try {
    const { id_curso, fecha } = req.query;
    if (!id_curso || !fecha) return res.status(400).json({ error: 'id_curso y fecha son obligatorios' });
    const sesion = await model.obtenerSesion(parseInt(id_curso), fecha);
    res.json(sesion);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
};

const registrarManual = async (req, res) => {
  try {
    const { id_curso, id_docente, id_periodo_escolar, fecha, registros } = req.body;
    if (!id_curso || !fecha || !registros) {
      return res.status(400).json({ error: 'Campos obligatorios: id_curso, fecha, registros' });
    }

    const docenteId = req.user.rol === ROLES.DOCENTE ? req.user.id_perfil_docente : id_docente;
    const sesion = await model.crearOObtenerSesion(id_curso, docenteId, id_periodo_escolar, fecha, req.user.id);
    const resultados = await model.registrarAsistenciaManualMasiva(sesion.id, registros, req.user.id);

    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_sesiones_asistencia', id_entidad: sesion.id,
      tipo_accion: 'crear', datos_nuevos: { total_registros: resultados.length },
    });

    res.json({ sesion, registros: resultados });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
};

const registrarPorQr = async (req, res) => {
  try {
    const { id_curso, id_periodo_escolar, fecha, valor_qr } = req.body;
    if (!id_curso || !fecha || !valor_qr) {
      return res.status(400).json({ error: 'Campos obligatorios: id_curso, fecha, valor_qr' });
    }

    const qr = await alumnosModel.buscarPorQr(valor_qr);
    if (!qr) return res.status(404).json({ error: 'QR no válido o inactivo' });
    if (qr.tbl_alumnos.estado !== 1) return res.status(400).json({ error: 'Alumno inactivo' });

    // E1: Validar que el alumno pertenece al curso
    const prisma = require('../config/prisma');
    const perteneceACurso = await prisma.tbl_alumnos_cursos.findFirst({
      where: { id_alumno: qr.tbl_alumnos.id, id_curso: parseInt(id_curso), estado: 1 },
    });
    if (!perteneceACurso) {
      return res.status(400).json({ error: 'Este alumno no pertenece al curso seleccionado', alumno: qr.tbl_alumnos });
    }

    const docenteId = req.user.rol === ROLES.DOCENTE ? req.user.id_perfil_docente : req.body.id_docente;
    const sesion = await model.crearOObtenerSesion(id_curso, docenteId, id_periodo_escolar, fecha, req.user.id);
    const resultado = await model.registrarAsistencia(sesion.id, qr.tbl_alumnos.id, ESTADOS_ASISTENCIA.PRESENTE, MODOS_REGISTRO_ASISTENCIA.QR, req.user.id);

    if (resultado.duplicado) {
      return res.status(409).json({
        error: 'La asistencia de este alumno ya fue registrada en esta sesión',
        alumno: qr.tbl_alumnos,
      });
    }

    res.json({
      mensaje: 'Asistencia registrada correctamente',
      alumno: qr.tbl_alumnos,
      registro: resultado.registro,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al registrar asistencia por QR' });
  }
};

const editarRegistro = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { estado_asistencia } = req.body;
    if (!estado_asistencia) return res.status(400).json({ error: 'estado_asistencia es obligatorio' });

    const registro = await model.editarRegistro(id, estado_asistencia, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_registros_asistencia', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: { estado_asistencia },
    });
    res.json(registro);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al editar registro' });
  }
};

const obtenerHistorial = async (req, res) => {
  try {
    const idCurso = parseInt(req.params.idCurso);
    const filtros = {};
    if (req.query.id_periodo_escolar) filtros.id_periodo_escolar = parseInt(req.query.id_periodo_escolar);
    res.json(await model.obtenerHistorial(idCurso, filtros));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = { obtenerSesion, registrarManual, registrarPorQr, editarRegistro, obtenerHistorial };
