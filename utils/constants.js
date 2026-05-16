const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DOCENTE: 'DOCENTE',
  ALUMNO: 'ALUMNO',
};

const ESTADOS_ASISTENCIA = {
  PRESENTE: 'presente',
  AUSENTE: 'ausente',
  TARDANZA: 'tardanza',
};

const MODALIDADES_TRIVIA = {
  INDIVIDUAL: 'individual',
  PAREJAS: 'parejas',
  GRUPOS: 'grupos',
};

const ESTADOS_PARTIDA = {
  PREPARADA: 'preparada',
  EN_PROGRESO: 'en_progreso',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
};

const PUNTAJES_TRIVIA = {
  CORRECTO: 1.2,
  INCORRECTO: -0.4,
};

const TIPOS_CALIFICACION = {
  NUMERICO: 'numerico',
  LETRAS: 'letras',
};

const MODOS_REGISTRO_ASISTENCIA = {
  MANUAL: 'manual',
  QR: 'qr',
};

const MODOS_NOTA_FINAL = {
  CALCULADO: 'calculado',
  MANUAL: 'manual',
};

const MODALIDADES_ACCESO_TRIVIA = {
  EN_VIVO: 'en_vivo',
  CON_CODIGO: 'con_codigo',
};

const ESTADOS_SESION_TRIVIA = {
  EN_PROGRESO: 'en_progreso',
  FINALIZADA: 'finalizada',
  ABANDONADA: 'abandonada',
};

const TIPOS_REPORTE_WHATSAPP = {
  ASISTENCIA_DIA: 'asistencia_dia',
  REPORTE_GENERAL: 'reporte_general',
};

const ESTADOS_ENVIO_WHATSAPP = {
  ENVIADO: 'enviado',
  NO_ENVIADO: 'no_enviado',
};

const CODIGO_TRIVIA = {
  CARACTERES: 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789',
  LONGITUD: 4,
  PREFIJO: 'TRV-',
  MAX_REINTENTOS: 5,
};

const TIPOS_VALOR_ANTROPOMETRICO = {
  NUMERICO: 'numerico',
  TEXTO: 'texto',
};

const CONCURSOS = {
  MIN_OPCIONES: 2,
  MAX_OPCIONES: 6,
  MIN_PREGUNTAS_PARA_PUBLICAR: 1,
  ORDEN_FIJO: 'fijo',
  ORDEN_ALEATORIO: 'aleatorio',
  TEMAS_VISUALES: ['clasico', 'neon', 'kids', 'retro'],
  ESTADOS_INTENTO: {
    EN_PROGRESO: 'en_progreso',
    FINALIZADO: 'finalizado',
    ABANDONADO: 'abandonado',
  },
  MULTIMEDIA_TIPOS: ['imagen', 'video'],
  MULTIMEDIA_MAX_BYTES: 50 * 1024 * 1024, // 50 MB
  MULTIMEDIA_EXT_IMAGEN: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  MULTIMEDIA_EXT_VIDEO: ['.mp4', '.webm', '.ogg', '.mov'],
};

const TIPOS_EVENTO_SONIDO = ['correcto', 'incorrecto', 'cuenta_regresiva', 'victoria', 'racha'];
const ESTILOS_MUSICA = ['relajada', 'intensa', 'epica'];
const TIPOS_AVATAR_CATALOGO = ['avatar', 'personaje', 'marco'];
const SUBDIRS_WASABI = {
  TRIVIA_IMAGENES: 'trivia/imagenes',
  SISTEMA_SONIDOS: 'sistema/sonidos',
  MUSICA_FONDO: 'musica',
  AVATARES: 'avatares',
};
const LIMITES_UPLOAD = {
  IMAGEN_MB: 5,
  AUDIO_MB: 10,
  MIME_IMAGENES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MIME_AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/x-m4a'],
};

module.exports = {
  ROLES,
  ESTADOS_ASISTENCIA,
  MODALIDADES_TRIVIA,
  ESTADOS_PARTIDA,
  PUNTAJES_TRIVIA,
  TIPOS_CALIFICACION,
  MODOS_REGISTRO_ASISTENCIA,
  MODOS_NOTA_FINAL,
  MODALIDADES_ACCESO_TRIVIA,
  ESTADOS_SESION_TRIVIA,
  TIPOS_REPORTE_WHATSAPP,
  ESTADOS_ENVIO_WHATSAPP,
  CODIGO_TRIVIA,
  TIPOS_VALOR_ANTROPOMETRICO,
  CONCURSOS,
  TIPOS_EVENTO_SONIDO,
  ESTILOS_MUSICA,
  TIPOS_AVATAR_CATALOGO,
  SUBDIRS_WASABI,
  LIMITES_UPLOAD,
};
