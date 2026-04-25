const model = require('../models/configAcademicaModel');
const notasModel = require('../models/notasModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES, TIPOS_CALIFICACION } = require('../utils/constants');

const obtenerEsquema = async (req, res) => {
  try {
    const idCurso = parseInt(req.params.idCurso);
    const esquema = await model.obtenerEsquema(idCurso);
    res.json(esquema);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener esquema' });
  }
};

const crearEsquema = async (req, res) => {
  try {
    const datos = { ...req.body };

    if (!datos.id_curso || !datos.tipo_calificacion) {
      return res.status(400).json({ error: 'Campos obligatorios: id_curso, tipo_calificacion' });
    }

    const curso = await require('../config/prisma').tbl_cursos.findUnique({ where: { id: datos.id_curso } });
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const esquemaExistente = await model.obtenerEsquema(datos.id_curso);
    if (esquemaExistente && esquemaExistente.tiene_notas) {
      return res.status(400).json({ error: 'No se puede modificar la configuración académica porque ya tiene notas registradas' });
    }

    if (datos.tipo_calificacion !== TIPOS_CALIFICACION.LETRAS && datos.componentes && datos.componentes.length > 0) {
      const sumaPesos = datos.componentes.reduce((sum, c) => sum + (parseFloat(c.peso_porcentaje) || 0), 0);
      if (sumaPesos !== 100) {
        return res.status(400).json({ error: `La suma de los porcentajes es ${sumaPesos}%. Debe ser exactamente 100%` });
      }
    }

    datos.id_periodo_escolar = curso.id_periodo_escolar;
    if (req.user.rol === ROLES.DOCENTE) datos.id_docente = req.user.id_perfil_docente;
    else datos.id_docente = curso.id_docente;

    const esquema = await model.crearEsquema(datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_esquemas_calificacion', id_entidad: esquema.id,
      tipo_accion: 'crear', datos_nuevos: datos,
    });
    res.status(201).json(esquema);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear esquema' });
  }
};

const actualizarFormula = async (req, res) => {
  try {
    const idEsquema = parseInt(req.params.id);
    const { formula } = req.body;

    const prisma = require('../config/prisma');
    const cantNotas = await prisma.tbl_notas_cabecera.count({ where: { id_esquema_calificacion: idEsquema, estado: 1 } });
    if (cantNotas > 0) {
      return res.status(400).json({ error: 'No se puede modificar la configuración académica porque ya tiene notas registradas' });
    }

    await model.actualizarFormula(idEsquema, formula, req.user.id);
    await notasModel.recalcularNotas(idEsquema, formula, req.user.id);

    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_esquemas_calificacion', id_entidad: idEsquema,
      tipo_accion: 'recalcular', datos_nuevos: { formula },
    });
    res.json({ mensaje: 'Fórmula actualizada y notas recalculadas' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar fórmula' });
  }
};

module.exports = { obtenerEsquema, crearEsquema, actualizarFormula };
