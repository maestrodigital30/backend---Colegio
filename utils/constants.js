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
};
