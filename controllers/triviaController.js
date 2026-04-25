const model = require('../models/triviaModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES, PUNTAJES_TRIVIA, ESTADOS_PARTIDA } = require('../utils/constants');
const prisma = require('../config/prisma');

// ===== TEMAS =====
const obtenerTemas = async (req, res) => {
  try {
    res.json(await model.obtenerTemas(req.user.id));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener temas' });
  }
};

const crearTema = async (req, res) => {
  try {
    const datos = { ...req.body };
    datos.id_docente = req.user.rol === ROLES.DOCENTE ? req.user.id_perfil_docente : (datos.id_docente || null);
    if (!datos.nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
    const tema = await model.crearTema(datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_temas', id_entidad: tema.id,
      tipo_accion: 'crear', datos_nuevos: datos,
    });
    res.status(201).json(tema);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear tema' });
  }
};

const actualizarTema = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.actualizarTema(id, req.body, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_temas', id_entidad: id, tipo_accion: 'actualizar', datos_nuevos: req.body });
    res.json({ mensaje: 'Tema actualizado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar tema' });
  }
};

const inactivarTema = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivarTema(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_temas', id_entidad: id, tipo_accion: 'inactivar' });
    res.json({ mensaje: 'Tema inactivado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar tema' });
  }
};

// ===== PREGUNTAS =====
const obtenerPreguntas = async (req, res) => {
  try {
    const idTema = parseInt(req.params.idTema);
    res.json(await model.obtenerPreguntas(idTema));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener preguntas' });
  }
};

const crearPregunta = async (req, res) => {
  try {
    const datos = req.body;
    if (!datos.id_tema || !datos.texto_pregunta || !datos.opciones || datos.opciones.length !== 4) {
      return res.status(400).json({ error: 'Se requiere id_tema, texto_pregunta y exactamente 4 opciones' });
    }
    const correctas = datos.opciones.filter(o => o.es_correcta);
    if (correctas.length !== 1) return res.status(400).json({ error: 'Exactamente 1 opción debe ser correcta' });

    const pregunta = await model.crearPregunta(datos, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_preguntas', id_entidad: pregunta.id, tipo_accion: 'crear', datos_nuevos: { id_tema: datos.id_tema, texto_pregunta: datos.texto_pregunta } });
    res.status(201).json(pregunta);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear pregunta' });
  }
};

const actualizarPregunta = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.actualizarPregunta(id, req.body, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_preguntas', id_entidad: id, tipo_accion: 'actualizar' });
    res.json({ mensaje: 'Pregunta actualizada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar pregunta' });
  }
};

const inactivarPregunta = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivarPregunta(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_preguntas', id_entidad: id, tipo_accion: 'inactivar' });
    res.json({ mensaje: 'Pregunta inactivada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar pregunta' });
  }
};

// ===== PARTIDAS =====
const crearPartida = async (req, res) => {
  try {
    const datos = { ...req.body };
    datos.id_docente = req.user.rol === ROLES.DOCENTE ? req.user.id_perfil_docente : (datos.id_docente || null);

    // Resolve id_periodo_escolar from the curso if not provided
    if (!datos.id_periodo_escolar && datos.id_curso) {
      const curso = await prisma.tbl_cursos.findUnique({ where: { id: parseInt(datos.id_curso) }, select: { id_periodo_escolar: true } });
      if (curso) datos.id_periodo_escolar = curso.id_periodo_escolar;
    }

    // Generate access code for con_codigo modality
    if (datos.modalidad_acceso === 'con_codigo') {
      const { generarCodigoAcceso } = require('../models/triviaPublicaModel');
      datos._codigo_acceso = await generarCodigoAcceso();
    }

    const partida = await model.crearPartida(datos, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_partidas', id_entidad: partida.id, tipo_accion: 'crear', datos_nuevos: { modalidad: datos.modalidad, modalidad_acceso: datos.modalidad_acceso, id_curso: datos.id_curso, id_tema: datos.id_tema } });

    // Re-fetch to include codigo_acceso
    const partidaCompleta = await model.obtenerPartida(partida.id);
    res.status(201).json(partidaCompleta);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear partida' });
  }
};

const iniciarPartida = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const partida = await model.iniciarPartida(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_partidas', id_entidad: id, tipo_accion: 'actualizar', datos_nuevos: { estado_partida: ESTADOS_PARTIDA.EN_PROGRESO } });
    res.json(partida);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al iniciar partida' });
  }
};

const obtenerPartida = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const partida = await model.obtenerPartida(id);
    if (!partida) return res.status(404).json({ error: 'Partida no encontrada' });
    res.json(partida);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener partida' });
  }
};

const registrarRespuesta = async (req, res) => {
  try {
    const { id_partida, id_participante, id_pregunta, id_opcion_seleccionada } = req.body;

    if (!id_participante) return res.status(400).json({ error: 'id_participante es obligatorio' });

    // Find the partida_pregunta record
    const prisma = require('../config/prisma');
    let idPartidaPregunta = req.body.id_partida_pregunta;

    if (!idPartidaPregunta && id_partida && id_pregunta) {
      const pp = await prisma.tbl_trivia_partidas_preguntas.findFirst({
        where: { id_partida: parseInt(id_partida), id_pregunta: parseInt(id_pregunta) },
      });
      if (!pp) return res.status(404).json({ error: 'Pregunta no encontrada en la partida' });
      idPartidaPregunta = pp.id;
    }

    // Calculate correctness and score
    let esCorrecta = false;
    let deltaPuntaje = 0;

    if (id_opcion_seleccionada) {
      const opcion = await prisma.tbl_trivia_opciones.findFirst({
        where: { id: parseInt(id_opcion_seleccionada) },
      });
      esCorrecta = opcion?.es_correcta || false;

      const partida = await prisma.tbl_trivia_partidas.findFirst({
        where: { id: parseInt(id_partida) },
        select: { puntaje_correcto: true, puntaje_incorrecto: true },
      });
      deltaPuntaje = esCorrecta
        ? parseFloat(partida?.puntaje_correcto || PUNTAJES_TRIVIA.CORRECTO)
        : parseFloat(partida?.puntaje_incorrecto || PUNTAJES_TRIVIA.INCORRECTO);
    }

    const respuesta = await model.registrarRespuesta({
      id_partida_pregunta: idPartidaPregunta,
      id_participante: parseInt(id_participante),
      id_opcion_seleccionada: id_opcion_seleccionada ? parseInt(id_opcion_seleccionada) : null,
      es_correcta: esCorrecta,
      delta_puntaje: deltaPuntaje,
    });
    res.json(respuesta);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al registrar respuesta' });
  }
};

const finalizarPartida = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const resultado = await model.finalizarPartida(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_partidas', id_entidad: id, tipo_accion: 'actualizar', datos_nuevos: { estado_partida: ESTADOS_PARTIDA.FINALIZADA, modo_ganador: resultado.modoGanador } });
    res.json(resultado);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al finalizar partida' });
  }
};

const cancelarPartida = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.cancelarPartida(id, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_trivia_partidas', id_entidad: id, tipo_accion: 'actualizar', datos_nuevos: { estado_partida: ESTADOS_PARTIDA.CANCELADA } });
    res.json({ mensaje: 'Partida cancelada' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cancelar partida' });
  }
};

// ===== HISTORIAL =====
const obtenerHistorial = async (req, res) => {
  try {
    const filtros = { id_usuario: req.user.id };
    if (req.query.id_curso) filtros.id_curso = parseInt(req.query.id_curso);
    if (req.query.id_periodo_escolar) filtros.id_periodo_escolar = parseInt(req.query.id_periodo_escolar);
    res.json(await model.obtenerHistorial(filtros));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// ===== RESPUESTAS POR PARTICIPANTE =====
const obtenerRespuestasParticipante = async (req, res) => {
  try {
    const idPartida = parseInt(req.params.id);
    const idParticipante = parseInt(req.params.idParticipante);
    const resultado = await model.obtenerRespuestasParticipante(idPartida, idParticipante);
    if (!resultado) return res.status(404).json({ error: 'Participante no encontrado' });
    res.json(resultado);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener respuestas del participante' });
  }
};

// ===== RANKING =====
const obtenerRanking = async (req, res) => {
  try {
    const idCurso = parseInt(req.params.idCurso);
    const idPeriodo = req.query.id_periodo_escolar ? parseInt(req.query.id_periodo_escolar) : null;
    res.json(await model.obtenerRanking(idCurso, idPeriodo));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
};

const obtenerHistorialAlumno = async (req, res) => {
  try {
    const idCurso = parseInt(req.params.idCurso);
    const idAlumno = parseInt(req.params.idAlumno);
    res.json(await model.obtenerHistorialAlumno(idCurso, idAlumno));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial del alumno' });
  }
};

module.exports = {
  obtenerTemas, crearTema, actualizarTema, inactivarTema,
  obtenerPreguntas, crearPregunta, actualizarPregunta, inactivarPregunta,
  crearPartida, iniciarPartida, obtenerPartida, registrarRespuesta, finalizarPartida, cancelarPartida,
  obtenerHistorial, obtenerRespuestasParticipante, obtenerRanking, obtenerHistorialAlumno,
};
