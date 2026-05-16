require('dotenv').config();
// Forzar timezone del proceso
process.env.TZ = process.env.TZ || 'America/Lima';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { STORAGE_TYPE, createUploadProxy } = require('./utils/storage');

const app = express();
const PORT = process.env.PORT || 4000;

// Crear directorios de uploads si no existen (modo local)
const uploadsDir = path.join(__dirname, 'uploads');
if (STORAGE_TYPE === 'local') {
  [uploadsDir, path.join(uploadsDir, 'logos'), path.join(uploadsDir, 'alumnos'), path.join(uploadsDir, 'podcasts'), path.join(uploadsDir, 'biblioteca'), path.join(uploadsDir, 'concursos')].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos: proxy S3 (wasabi) o estático (local)
if (STORAGE_TYPE === 'wasabi') {
  app.use('/uploads', createUploadProxy());
} else {
  app.use('/uploads', express.static(uploadsDir));
}

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/usuarios', require('./routes/usuariosRoutes'));
app.use('/api/configuracion', require('./routes/configuracionRoutes'));
app.use('/api/docentes', require('./routes/docentesRoutes'));
app.use('/api/periodos', require('./routes/periodosRoutes'));
app.use('/api/cursos', require('./routes/cursosRoutes'));
app.use('/api/alumnos', require('./routes/alumnosRoutes'));
app.use('/api/alumnos', require('./routes/datosAntropometricosRoutes'));
app.use('/api/tipos-dato-antropometrico', require('./routes/tiposDatoAntropometricoRoutes'));
app.use('/api/padres', require('./routes/padresRoutes'));
app.use('/api/asistencia', require('./routes/asistenciaRoutes'));
app.use('/api/config-academica', require('./routes/configAcademicaRoutes'));
app.use('/api/notas', require('./routes/notasRoutes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api/trivia', require('./routes/triviaRoutes'));
app.use('/api/trivia/imagenes', require('./routes/triviaImagenRoutes'));
app.use('/api/trivia-publica', require('./routes/triviaPublicaRoutes'));
app.use('/api/concursos', require('./routes/concursoRoutes'));
app.use('/api/concursos-admin', require('./routes/concursoHistorialRoutes'));
app.use('/api/concursos-juego', require('./routes/concursoJuegoRoutes'));
app.use('/api/podcasts', require('./routes/podcastRoutes'));
app.use('/api/biblioteca', require('./routes/bibliotecaRoutes'));
app.use('/api/alumno-portal', require('./routes/alumnoPortalRoutes'));
app.use('/api/sistema/sonidos', require('./routes/sistemaSonidoRoutes'));
app.use('/api/musica', require('./routes/musicaCatalogoRoutes'));
app.use('/api/avatares', require('./routes/avatarCatalogoRoutes'));
app.use('/api/temas-visuales', require('./routes/temaVisualRoutes'));
app.use('/api/identidad-visual', require('./routes/identidadVisualRoutes'));

// Ruta de salud — útil para verificar TZ en producción vs local
app.get('/api/ping', async (req, res) => {
  const ahora = new Date();
  let dbTz = null;
  let dbNow = null;
  try {
    const prisma = require('./config/prisma');
    const result = await prisma.$queryRawUnsafe(
      "SELECT current_setting('TIMEZONE') AS tz, now() AS ahora"
    );
    dbTz = result[0]?.tz;
    dbNow = result[0]?.ahora;
  } catch (err) {
    dbTz = `error: ${err.message}`;
  }
  res.json({
    status: 'ok',
    timestamp_utc: ahora.toISOString(),
    timestamp_local: ahora.toLocaleString('es-PE', { timeZone: process.env.TZ || 'America/Lima' }),
    node_tz: process.env.TZ,
    db_tz: dbTz,
    db_now: dbNow,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
