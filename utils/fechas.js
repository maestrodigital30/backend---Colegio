// Utilidades de fecha para garantizar precisión entre local y Railway.
// La aplicación opera en zona America/Lima (UTC-5, sin DST).

const TIMEZONE = process.env.TZ || 'America/Lima';

// Instante actual UTC. Sirve para columnas timestamptz (almacena epoch absoluto).
const ahora = () => new Date();

// Convierte una fecha tipo "YYYY-MM-DD" (calendario, sin hora) en un Date
// anclado a mediodía UTC. Así, sin importar la TZ del servidor Postgres,
// la columna @db.Date conservará exactamente el día indicado por el usuario
// (offset máximo seguro: ±11h).
//
// Acepta también valores ya tipo Date o ISO con hora — en esos casos extrae
// la fecha de calendario en la zona America/Lima y la re-ancla a mediodía UTC.
const parseFechaCalendario = (valor) => {
  if (valor == null || valor === '') return null;

  // String "YYYY-MM-DD"
  if (typeof valor === 'string') {
    const soloFecha = valor.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(soloFecha)) {
      return new Date(`${soloFecha}T12:00:00.000Z`);
    }
    // ISO con hora → reducir a la fecha de calendario en TZ Lima
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return null;
    return parseFechaCalendario(formatearFechaEnTZ(d));
  }

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return parseFechaCalendario(formatearFechaEnTZ(valor));
  }

  return null;
};

// Devuelve "YYYY-MM-DD" extraído en la zona horaria de la app.
const formatearFechaEnTZ = (date) => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const obj = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
};

module.exports = {
  TIMEZONE,
  ahora,
  parseFechaCalendario,
  formatearFechaEnTZ,
};
