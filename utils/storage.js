const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');

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

function getUploadsBucket() {
  const bucket = process.env.WASABI_BUCKET;
  if (!bucket) throw new Error('Falta variable de entorno: WASABI_BUCKET');
  return bucket;
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
 * Sube un archivo al destino configurado (local o Wasabi/S3).
 * @returns {Promise<string>} ruta relativa (subdir/filename)
 */
async function uploadFile(file, subdir, filename) {
  const relativePath = getRelativePath(subdir, filename);

  if (STORAGE_TYPE === 'wasabi') {
    const client = getS3Client();
    const bucket = getUploadsBucket();

    if (!file.buffer) {
      throw new Error('El archivo no contiene buffer; STORAGE_TYPE=wasabi requiere memoryStorage');
    }

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: relativePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size ?? file.buffer.length,
      Metadata: file.originalname ? { 'original-name': encodeURIComponent(file.originalname) } : undefined,
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
      const bucket = getUploadsBucket();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: relativePath }));
    } catch (err) {
      // Ignoramos NoSuchKey para que la lógica de negocio no falle si ya no existe
      if (err.name !== 'NoSuchKey' && err.$metadata?.httpStatusCode !== 404) {
        console.error('Error al eliminar archivo de S3:', err.message);
      }
    }
    return;
  }

  const fullPath = path.join(__dirname, '..', 'uploads', relativePath);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

/**
 * Middleware Express que sirve archivos desde Wasabi (proxy autenticado).
 *
 * Funcionalidades:
 *  - GET /<key>                  → inline (Content-Disposition omitido)
 *  - GET /<key>?download=1       → fuerza descarga
 *  - GET /<key>?download=foo.pdf → fuerza descarga con nombre custom
 *  - Soporta Range requests (streaming de PDFs, video, audio)
 *  - Cache-Control: 1 día
 *
 * Uso: app.use('/uploads', createUploadProxy())
 */
function createUploadProxy() {
  return async (req, res) => {
    const key = decodeURIComponent(req.path.replace(/^\//, ''));
    if (!key) return res.status(400).end();

    try {
      const client = getS3Client();
      const bucket = getUploadsBucket();

      const range = req.headers.range;
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key, Range: range });
      const result = await client.send(getCmd);

      // Cabeceras estandar
      if (result.ContentType) res.set('Content-Type', result.ContentType);
      if (result.ContentLength != null) res.set('Content-Length', String(result.ContentLength));
      if (result.ETag) res.set('ETag', result.ETag);
      if (result.LastModified) res.set('Last-Modified', new Date(result.LastModified).toUTCString());
      if (result.AcceptRanges) res.set('Accept-Ranges', result.AcceptRanges);
      if (result.ContentRange) res.set('Content-Range', result.ContentRange);
      res.set('Cache-Control', 'public, max-age=86400, immutable');

      // Forzar descarga si se solicita
      const download = req.query.download;
      if (download) {
        const baseName = path.basename(key);
        const filename = (typeof download === 'string' && download !== '1') ? download : baseName;
        const safe = filename.replace(/[\r\n"]/g, '');
        res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safe)}`);
      }

      if (range && result.ContentRange) {
        res.status(206);
      }

      result.Body.pipe(res);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return res.status(404).end();
      }
      console.error('Error proxy S3:', err.name, err.message);
      res.status(500).end();
    }
  };
}

/**
 * Verifica que un objeto exista en el storage.
 * @returns {Promise<boolean>}
 */
async function fileExists(relativePath) {
  if (!relativePath) return false;

  if (STORAGE_TYPE === 'wasabi') {
    try {
      const client = getS3Client();
      const bucket = getUploadsBucket();
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: relativePath }));
      return true;
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') return false;
      throw err;
    }
  }

  const fullPath = path.join(__dirname, '..', 'uploads', relativePath);
  return fs.existsSync(fullPath);
}

module.exports = {
  STORAGE_TYPE,
  getUploadDir,
  getRelativePath,
  createMulterStorage,
  uploadFile,
  deleteFile,
  createUploadProxy,
  fileExists,
};
