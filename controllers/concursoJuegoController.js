const juego = require('../models/concursoJuegoModel');
const historial = require('../models/concursoHistorialModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES } = require('../utils/constants');
const prisma = require('../config/prisma');

// Resuelve id_alumno si el usuario es alumno
async function resolverAlumnoId(usuario) {
  if (usuario.rol !== ROLES.ALUMNO) return null;
  const alumno = await prisma.tbl_alumnos.findFirst({
    where: { id_usuario: usuario.id, estado: 1 },
    select: { id: true },
  });
  return alumno?.id || null;
}

const listarDisponibles = async (req, res) => {
  try {
    const alumnoId = await resolverAlumnoId(req.user);
    res.json(await juego.listarParaJugar(req.user, alumnoId));
  } catch (error) {
    console.error('Error listar disponibles:', error);
    res.status(500).json({ error: 'Error al listar concursos disponibles' });
  }
};

const iniciar = async (req, res) => {
  try {
    const idConcurso = parseInt(req.params.idConcurso);
    const alumnoId = await resolverAlumnoId(req.user);
    const intento = await juego.iniciarIntento(idConcurso, req.user, alumnoId);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concurso_intentos', id_entidad: intento.id,
      tipo_accion: 'crear', datos_nuevos: { id_concurso: idConcurso },
    });
    res.status(201).json(intento);
  } catch (error) {
    const status = /alcanzado|maximo|no tienes|no disponible|no tiene preguntas/i.test(error.message) ? 400 : 500;
    if (status === 500) console.error('Error iniciar intento:', error);
    res.status(status).json({ error: error.message || 'Error al iniciar intento' });
  }
};

const obtenerDetalle = async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const detalle = await juego.obtenerIntentoDetalle(idIntento, req.user);
    if (!detalle) return res.status(404).json({ error: 'Intento no encontrado' });
    res.json(detalle);
  } catch (error) {
    console.error('Error obtener detalle intento:', error);
    res.status(500).json({ error: 'Error al obtener intento' });
  }
};

const aplicarComodin = async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const { tipo, id_pregunta } = req.body;
    const resultado = await juego.aplicarComodin(idIntento, req.user, tipo, id_pregunta);
    res.json(resultado);
  } catch (error) {
    const status = /habilitado|usaste|invalido|no encontr/i.test(error.message) ? 400 : 500;
    if (status === 500) console.error('Error aplicar comodin:', error);
    res.status(status).json({ error: error.message || 'Error al aplicar comodin' });
  }
};

const responder = async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const resultado = await juego.registrarRespuesta(idIntento, req.user, req.body);
    res.json(resultado);
  } catch (error) {
    const status = /respondida|disponible|invalida/i.test(error.message) ? 400 : 500;
    if (status === 500) console.error('Error registrar respuesta:', error);
    res.status(status).json({ error: error.message || 'Error al registrar respuesta' });
  }
};

const obtenerBonus = async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const tarjetas = await juego.generarBonus(idIntento, req.user);
    res.json(tarjetas.map((t) => ({ id: t.id, orden: t.orden, seleccionada: t.seleccionada, puntos: t.seleccionada ? t.puntos : null })));
  } catch (error) {
    const status = /habilitada|disponible/i.test(error.message) ? 400 : 500;
    if (status === 500) console.error('Error obtener bonus:', error);
    res.status(status).json({ error: error.message || 'Error al obtener bonus' });
  }
};

const seleccionarBonus = async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const { id_tarjeta } = req.body;
    const resultado = await juego.seleccionarBonus(idIntento, req.user, id_tarjeta);
    res.json({
      seleccionada: {
        id: resultado.seleccionada.id,
        orden: resultado.seleccionada.orden,
        puntos: resultado.seleccionada.puntos,
      },
      todas: resultado.todas.map((t) => ({ id: t.id, orden: t.orden, puntos: t.puntos, seleccionada: t.seleccionada })),
    });
  } catch (error) {
    const status = /seleccionaste|invalida|disponible/i.test(error.message) ? 400 : 500;
    if (status === 500) console.error('Error seleccionar bonus:', error);
    res.status(status).json({ error: error.message || 'Error al seleccionar bonus' });
  }
};

const finalizar = async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const intento = await juego.finalizarIntento(idIntento, req.user);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_concurso_intentos', id_entidad: intento.id,
      tipo_accion: 'actualizar', datos_nuevos: { estado_intento: intento.estado_intento, puntaje_total: intento.puntaje_total },
    });
    res.json(intento);
  } catch (error) {
    console.error('Error finalizar intento:', error);
    res.status(500).json({ error: error.message || 'Error al finalizar intento' });
  }
};

const obtenerResultado = async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const resultado = await juego.obtenerResultado(idIntento, req.user);
    if (!resultado) return res.status(404).json({ error: 'Resultado no encontrado' });
    res.json(resultado);
  } catch (error) {
    console.error('Error obtener resultado:', error);
    res.status(500).json({ error: 'Error al obtener resultado' });
  }
};

const obtenerMiHistorial = async (req, res) => {
  try {
    const alumnoId = await resolverAlumnoId(req.user);
    const filtros = {
      id_usuario: req.user.id,
      id_concurso: req.query.id_concurso ? parseInt(req.query.id_concurso) : null,
      desde: req.query.desde || null,
      hasta: req.query.hasta || null,
      id_curso: req.query.id_curso ? parseInt(req.query.id_curso) : null,
      id_alumno: alumnoId,
    };
    res.json(await historial.obtenerHistorial(filtros));
  } catch (error) {
    console.error('Error mi historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

const obtenerRanking = async (req, res) => {
  try {
    const idConcurso = parseInt(req.params.idConcurso);
    const filtros = {
      id_concurso: idConcurso,
      id_curso: req.query.id_curso ? parseInt(req.query.id_curso) : null,
    };
    res.json(await historial.obtenerRanking(filtros));
  } catch (error) {
    console.error('Error ranking:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
};

module.exports = {
  listarDisponibles,
  iniciar,
  obtenerDetalle,
  aplicarComodin,
  responder,
  obtenerBonus,
  seleccionarBonus,
  finalizar,
  obtenerResultado,
  obtenerMiHistorial,
  obtenerRanking,
};
