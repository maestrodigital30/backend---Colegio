const path = require('path');
const multer = require('multer');
const { createMulterStorage, uploadFile, deleteFile } = require('./storage');
const { LIMITES_UPLOAD } = require('./constants');

function buildUploader({ subdir, maxMb, mimePermitidos }) {
  return multer({
    storage: createMulterStorage(subdir),
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!mimePermitidos.includes(file.mimetype)) {
        return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });
}

const uploaderImagen = (subdir) => buildUploader({
  subdir,
  maxMb: LIMITES_UPLOAD.IMAGEN_MB,
  mimePermitidos: LIMITES_UPLOAD.MIME_IMAGENES,
});

const uploaderAudio = (subdir) => buildUploader({
  subdir,
  maxMb: LIMITES_UPLOAD.AUDIO_MB,
  mimePermitidos: LIMITES_UPLOAD.MIME_AUDIO,
});

async function guardarArchivo(file, subdir, prefijo) {
  if (!file) throw new Error('Archivo requerido');
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${prefijo}_${Date.now()}${ext}`;
  return await uploadFile(file, subdir, filename);
}

async function reemplazarArchivo(rutaVieja, file, subdir, prefijo) {
  const nuevaRuta = await guardarArchivo(file, subdir, prefijo);
  if (rutaVieja && rutaVieja !== nuevaRuta) {
    await deleteFile(rutaVieja);
  }
  return nuevaRuta;
}

module.exports = { uploaderImagen, uploaderAudio, guardarArchivo, reemplazarArchivo };
