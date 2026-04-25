const model = require('../models/triviaPublicaModel');

const validarAcceso = async (req, res) => {
  try {
    const { codigo_trivia, dni } = req.body;
    if (!codigo_trivia || !dni) {
      return res.status(400).json({ error: 'codigo_trivia y dni son obligatorios' });
    }
    const resultado = await model.validarAcceso(codigo_trivia, dni);
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

module.exports = { validarAcceso, obtenerPartida, obtenerPregunta, responder, obtenerResultado, obtenerRanking };
