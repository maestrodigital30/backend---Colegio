const { CONCURSOS } = require('../utils/constants');

function validarPayloadConcurso(body, { esCreacion = true } = {}) {
  const errores = [];

  if (esCreacion && (!body.titulo || !String(body.titulo).trim())) {
    errores.push('El titulo es obligatorio');
  }
  if (body.titulo != null && String(body.titulo).length > 200) {
    errores.push('El titulo no puede exceder 200 caracteres');
  }

  if (body.tema_visual != null && !CONCURSOS.TEMAS_VISUALES.includes(body.tema_visual)) {
    errores.push(`tema_visual debe ser uno de: ${CONCURSOS.TEMAS_VISUALES.join(', ')}`);
  }

  if (body.orden_preguntas != null && ![CONCURSOS.ORDEN_FIJO, CONCURSOS.ORDEN_ALEATORIO].includes(body.orden_preguntas)) {
    errores.push('orden_preguntas debe ser "fijo" o "aleatorio"');
  }
  if (body.orden_opciones != null && ![CONCURSOS.ORDEN_FIJO, CONCURSOS.ORDEN_ALEATORIO].includes(body.orden_opciones)) {
    errores.push('orden_opciones debe ser "fijo" o "aleatorio"');
  }

  ['tiempo_por_pregunta', 'puntos_base', 'comodin_tiempo_extra_segundos',
    'bonus_cantidad_tarjetas', 'bonus_premio_minimo', 'bonus_premio_maximo',
    'max_intentos_por_usuario', 'penalizacion_incorrecta']
    .forEach((campo) => {
      if (body[campo] != null) {
        const n = Number(body[campo]);
        if (!Number.isFinite(n) || n < 0) errores.push(`${campo} debe ser un numero >= 0`);
      }
    });

  if (body.tiempo_por_pregunta != null && Number(body.tiempo_por_pregunta) < 3) {
    errores.push('tiempo_por_pregunta debe ser >= 3 segundos');
  }
  if (body.bonus_habilitado && body.bonus_premio_minimo != null && body.bonus_premio_maximo != null) {
    if (Number(body.bonus_premio_minimo) > Number(body.bonus_premio_maximo)) {
      errores.push('bonus_premio_minimo no puede ser mayor a bonus_premio_maximo');
    }
  }
  if (body.bonus_habilitado && body.bonus_cantidad_tarjetas != null) {
    const t = Number(body.bonus_cantidad_tarjetas);
    if (t < 2 || t > 10) errores.push('bonus_cantidad_tarjetas debe estar entre 2 y 10');
  }

  return errores;
}

function validarPayloadPregunta(body, { esCreacion = true } = {}) {
  const errores = [];

  if (esCreacion && !body.id_concurso) {
    errores.push('id_concurso es obligatorio');
  }
  if (esCreacion && (!body.texto || !String(body.texto).trim())) {
    errores.push('El texto de la pregunta es obligatorio');
  }

  if (!Array.isArray(body.opciones)) {
    errores.push('opciones debe ser un arreglo');
  } else {
    if (body.opciones.length < CONCURSOS.MIN_OPCIONES || body.opciones.length > CONCURSOS.MAX_OPCIONES) {
      errores.push(`Una pregunta debe tener entre ${CONCURSOS.MIN_OPCIONES} y ${CONCURSOS.MAX_OPCIONES} opciones`);
    }
    const correctas = body.opciones.filter((o) => o && o.es_correcta);
    if (correctas.length < 1) {
      errores.push('Al menos una opcion debe ser marcada como correcta');
    }
    body.opciones.forEach((op, idx) => {
      if (!op) {
        errores.push(`opcion ${idx + 1}: faltan datos`);
        return;
      }
      const tieneTexto = op.texto && String(op.texto).trim();
      const tieneMedia = op.multimedia_url && String(op.multimedia_url).trim();
      if (!tieneTexto && !tieneMedia) {
        errores.push(`opcion ${idx + 1}: debe tener texto o multimedia`);
      }
    });
  }

  if (body.puntos != null) {
    const n = Number(body.puntos);
    if (!Number.isFinite(n) || n < 0) errores.push('puntos debe ser un numero >= 0');
  }
  if (body.tiempo_limite_segundos != null) {
    const n = Number(body.tiempo_limite_segundos);
    if (!Number.isFinite(n) || n < 3) errores.push('tiempo_limite_segundos debe ser >= 3');
  }

  return errores;
}

function validarArchivoMultimedia(file) {
  if (!file) return ['No se recibio archivo'];
  const errores = [];
  if (file.size > CONCURSOS.MULTIMEDIA_MAX_BYTES) {
    errores.push(`El archivo excede ${Math.round(CONCURSOS.MULTIMEDIA_MAX_BYTES / 1024 / 1024)} MB`);
  }
  const ext = (file.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0];
  const validas = [...CONCURSOS.MULTIMEDIA_EXT_IMAGEN, ...CONCURSOS.MULTIMEDIA_EXT_VIDEO];
  if (!ext || !validas.includes(ext)) {
    errores.push(`Extension no permitida. Permitidas: ${validas.join(', ')}`);
  }
  return errores;
}

function inferirTipoMultimedia(originalname) {
  const ext = (originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0];
  if (CONCURSOS.MULTIMEDIA_EXT_IMAGEN.includes(ext)) return 'imagen';
  if (CONCURSOS.MULTIMEDIA_EXT_VIDEO.includes(ext)) return 'video';
  return null;
}

module.exports = {
  validarPayloadConcurso,
  validarPayloadPregunta,
  validarArchivoMultimedia,
  inferirTipoMultimedia,
};
