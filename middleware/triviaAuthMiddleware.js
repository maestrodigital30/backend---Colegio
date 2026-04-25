const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const TRIVIA_SECRET = () => process.env.JWT_SECRET_TRIVIA || process.env.JWT_SECRET;

function verificarTokenTrivia(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de trivia no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, TRIVIA_SECRET());
    req.triviaPayload = payload;
  } catch (err) {
    return res.status(403).json({ error: 'Token de trivia invalido o expirado' });
  }

  prisma.tbl_trivia_sesiones.findFirst({
    where: {
      id: req.triviaPayload.id_sesion,
      token_sesion: token,
      estado: 1,
      tbl_trivia_partidas: { estado: 1 },
    },
    include: {
      tbl_trivia_partidas: {
        select: {
          id: true,
          id_docente: true,
          cantidad_preguntas: true,
          tiempo_por_pregunta: true,
          puntaje_correcto: true,
          puntaje_incorrecto: true,
          mostrar_puntaje: true,
          mostrar_resumen: true,
          mostrar_ranking: true,
          estado_partida: true,
        },
      },
    },
  })
    .then((sesion) => {
      if (!sesion) {
        return res.status(403).json({ error: 'Sesion de trivia no valida' });
      }
      req.sesionTrivia = {
        id_sesion: sesion.id,
        id_partida: sesion.id_partida,
        id_alumno: sesion.id_alumno,
        id_participante: sesion.id_participante,
        numero_intento: sesion.numero_intento,
        pregunta_actual: sesion.pregunta_actual,
        puntaje_acumulado: parseFloat(sesion.puntaje_acumulado),
        estado_sesion: sesion.estado_sesion,
        partida: sesion.tbl_trivia_partidas,
      };
      next();
    })
    .catch((err) => {
      console.error('Error validando sesion trivia:', err);
      res.status(500).json({ error: 'Error al validar sesion' });
    });
}

module.exports = { verificarTokenTrivia };
