const model = require('../models/triviaPublicaModel');
const avatarCatalogoModel = require('../models/avatarCatalogoModel');

const validarAcceso = async (req, res) => {
  try {
    const { codigo_trivia, dni } = req.body;
    if (!codigo_trivia || !dni) {
      return res.status(400).json({ error: 'codigo_trivia y dni son obligatorios' });
    }
    const identidadPublica = {
      id_avatar_publico: req.body.id_avatar_publico ? parseInt(req.body.id_avatar_publico) : null,
      id_personaje_publico: req.body.id_personaje_publico ? parseInt(req.body.id_personaje_publico) : null,
      id_marco_publico: req.body.id_marco_publico ? parseInt(req.body.id_marco_publico) : null,
      color_publico: req.body.color_publico && /^#[0-9A-Fa-f]{6}$/.test(req.body.color_publico) ? req.body.color_publico : null,
    };
    const resultado = await model.validarAcceso(codigo_trivia, dni, identidadPublica);
    res.json(resultado);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error en validarAcceso:', error);
    res.status(500).json({ error: 'Error al validar acceso' });
  }
};

const obtenerPartida = async (req, res) => {
  try {
    const resultado = await model.obtenerPartidaPublica(req.sesionTrivia);
    res.json(resultado);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener partida' });
  }
};

const obtenerPregunta = async (req, res) => {
  try {
    const resultado = await model.obtenerPregunta(req.sesionTrivia);
    res.json(resultado);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener pregunta' });
  }
};

const responder = async (req, res) => {
  try {
    const { id_opcion_seleccionada } = req.body;
    const resultado = await model.registrarRespuestaPublica(
      req.sesionTrivia,
      id_opcion_seleccionada ? parseInt(id_opcion_seleccionada) : null
    );
    res.json(resultado);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al registrar respuesta' });
  }
};

const obtenerResultado = async (req, res) => {
  try {
    const resultado = await model.obtenerResultado(req.sesionTrivia);
    res.json(resultado);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener resultado' });
  }
};

const obtenerRanking = async (req, res) => {
  try {
    const resultado = await model.obtenerRankingPublico(req.sesionTrivia);
    res.json(resultado);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
};

const listarAvataresPublicos = async (_req, res) => {
  try {
    const avatares = await avatarCatalogoModel.listar({ tipo: 'avatar' });
    res.json(avatares);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al listar avatares' }); }
};

module.exports = { validarAcceso, obtenerPartida, obtenerPregunta, responder, obtenerResultado, obtenerRanking, listarAvataresPublicos };
