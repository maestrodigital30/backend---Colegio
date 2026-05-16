// controllers/identidadVisualController.js
const model = require('../models/identidadVisualModel');
const avatarModel = require('../models/avatarCatalogoModel');
const temaModel = require('../models/temaVisualModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES } = require('../utils/constants');

function obtenerIdAlumnoDeUsuario(req) {
  if (req.user.rol === ROLES.ALUMNO) return req.user.id_alumno;
  if (req.params.idAlumno) return parseInt(req.params.idAlumno);
  return null;
}

const obtener = async (req, res) => {
  try {
    const idAlumno = obtenerIdAlumnoDeUsuario(req);
    if (!idAlumno) return res.status(400).json({ error: 'idAlumno requerido' });
    const ident = await model.obtenerPorAlumno(idAlumno);

    // Si no hay identidad guardada, devolver defaults dinámicos
    if (!ident) {
      const [avatarDef, personajeDef, marcoDef] = await Promise.all([
        avatarModel.obtenerDefault('avatar'),
        avatarModel.obtenerDefault('personaje'),
        avatarModel.obtenerDefault('marco'),
      ]);
      const temas = await temaModel.listar();
      const temaDefault = temas.find(t => t.codigo === 'minimalista') || temas[0] || null;
      return res.json({
        id_alumno: idAlumno,
        avatar: avatarDef,
        personaje: personajeDef,
        marco: marcoDef,
        color_personal: null,
        tbl_temas_visuales: temaDefault,
        musica_habilitada: true,
        sonidos_habilitados: true,
        es_default: true,
      });
    }

    res.json(ident);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener identidad' }); }
};

const guardar = async (req, res) => {
  try {
    const idAlumno = obtenerIdAlumnoDeUsuario(req);
    if (!idAlumno) return res.status(400).json({ error: 'idAlumno requerido' });

    const datos = {};
    if (req.body.id_avatar !== undefined) datos.id_avatar = req.body.id_avatar ? parseInt(req.body.id_avatar) : null;
    if (req.body.id_personaje !== undefined) datos.id_personaje = req.body.id_personaje ? parseInt(req.body.id_personaje) : null;
    if (req.body.id_marco !== undefined) datos.id_marco = req.body.id_marco ? parseInt(req.body.id_marco) : null;
    if (req.body.id_tema_visual !== undefined) datos.id_tema_visual = req.body.id_tema_visual ? parseInt(req.body.id_tema_visual) : null;
    if (req.body.color_personal !== undefined) {
      const color = req.body.color_personal;
      if (color !== null && !/^#[0-9A-Fa-f]{6}$/.test(color)) return res.status(400).json({ error: 'color_personal debe ser #RRGGBB' });
      datos.color_personal = color;
    }
    if (typeof req.body.musica_habilitada === 'boolean') datos.musica_habilitada = req.body.musica_habilitada;
    if (typeof req.body.sonidos_habilitados === 'boolean') datos.sonidos_habilitados = req.body.sonidos_habilitados;

    const guardado = await model.upsert(idAlumno, datos);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_alumno_identidad_visual', id_entidad: idAlumno, tipo_accion: 'actualizar', datos_nuevos: datos });

    const full = await model.obtenerPorAlumno(idAlumno);
    res.json(full);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al guardar identidad' }); }
};

module.exports = { obtener, guardar };
