const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// ─── Tipo de almacenamiento: 'local' o 'wasabi' ───
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

// ─── Cliente S3 (solo se crea si STORAGE_TYPE === 'wasabi') ───
let s3Client = null;

function getS3Client() {
  if (s3Client) return s3Client;

  const { WASABI_ACCESS_KEY, WASABI_SECRET_KEY, WASABI_REGION, WASABI_ENDPOINT } = process.env;

  if (!WASABI_ACCESS_KEY || !WASABI_SECRET_KEY) {
    throw new Error('Faltan variables de entorno: WASABI_ACCESS_KEY y WASABI_SECRET_KEY');
  }

  if (!WASABI_REGION || !WASABI_ENDPOINT) {
    throw new Error('Faltan variables de entorno: WASABI_REGION y WASABI_ENDPOINT');
  }

  s3Client = new S3Client({
    region: WASABI_REGION,
    endpoint: WASABI_ENDPOINT,
    credentials: {
      accessKeyId: WASABI_ACCESS_KEY,
      secretAccessKey: WASABI_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  return s3Client;
}

// ─── Directorio local ───
function getUploadDir(subdir) {
  const dir = path.join(__dirname, '..', 'uploads', subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ─── Ruta relativa para la BD ───
function getRelativePath(subdir, filename) {
  return `${subdir}/${filename}`;
}

// ─── Crear almacenamiento multer según el tipo ───
function createMulterStorage(subdir) {
  if (STORAGE_TYPE === 'wasabi') {
    return multer.memoryStorage();
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, getUploadDir(subdir)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${subdir}_${Date.now()}${ext}`);
    },
  });
}

/**
 * Sube un archivo al destino configurado (local o S3/Wasabi).
 */
async function uploadFile(file, subdir, filename) {
  const relativePath = getRelativePath(subdir, filename);

  if (STORAGE_TYPE === 'wasabi') {
    const client = getS3Client();
    const bucket = process.env.WASABI_BUCKET;

    if (!bucket) throw new Error('Falta variable de entorno: WASABI_BUCKET');

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: relativePath,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return relativePath;
  }

  // Local: si multer usó memoryStorage, guardar manualmente
  if (file.buffer) {
    const destDir = getUploadDir(subdir);
    const destPath = path.join(destDir, filename);
    fs.writeFileSync(destPath, file.buffer);
  }

  return relativePath;
}

/**
 * Elimina un archivo del destino configurado.
 */
async function deleteFile(relativePath) {
  if (!relativePath) return;

  if (STORAGE_TYPE === 'wasabi') {
    try {
      const client = getS3Client();
      const bucket = process.env.WASABI_BUCKET;
      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: relativePath,
      }));
    } catch (err) {
      console.error('Error al eliminar archivo de S3:', err.message);
    }
    return;
  }

  const fullPath = path.join(__dirname, '..', 'uploads', relativePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

/**
 * Middleware Express que sirve archivos desde Wasabi (proxy).
 * La cuenta Wasabi no permite acceso público directo,
 * así que el backend actúa como proxy autenticado.
 *
 * Uso: app.use('/uploads', createUploadProxy())
 */
function createUploadProxy() {
  return async (req, res) => {
    const key = req.path.replace(/^\//, '');
    if (!key) return res.status(400).end();

    try {
      const client = getS3Client();
      const result = await client.send(new GetObjectCommand({
        Bucket: process.env.WASABI_BUCKET,
        Key: key,
      }));

      if (result.ContentType) res.set('Content-Type', result.ContentType);
      if (result.ContentLength) res.set('Content-Length', String(result.ContentLength));
      if (result.ETag) res.set('ETag', result.ETag);
      res.set('Cache-Control', 'public, max-age=86400');

      result.Body.pipe(res);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return res.status(404).end();
      }
      console.error('Error proxy S3:', err.message);
      res.status(500).end();
    }
  };
}

module.exports = {
  STORAGE_TYPE,
  getUploadDir,
  getRelativePath,
  createMulterStorage,
  uploadFile,
  deleteFile,
  createUploadProxy,
};
