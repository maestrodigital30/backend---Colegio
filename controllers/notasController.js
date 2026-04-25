const model = require('../models/notasModel');
const { registrarAuditoria } = require('../models/auditoriaModel');

const obtenerNotasCursoBimestre = async (req, res) => {
  try {
    const { id_curso, id_periodo_calificacion } = req.query;
    if (!id_curso || !id_periodo_calificacion) {
      return res.status(400).json({ error: 'id_curso e id_periodo_calificacion son obligatorios' });
    }
    res.json(await model.obtenerNotasPorCursoBimestre(parseInt(id_curso), parseInt(id_periodo_calificacion)));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

const registrarNotas = async (req, res) => {
  try {
    const datos = req.body;
    if (!datos.id_alumno || !datos.id_curso || !datos.id_periodo_calificacion) {
      return res.status(400).json({ error: 'Campos obligatorios: id_alumno, id_curso, id_periodo_calificacion' });
    }

    if (!datos.id_periodo_escolar || !datos.id_esquema_calificacion) {
      const prisma = require('../config/prisma');
      const curso = await prisma.tbl_cursos.findUnique({ where: { id: datos.id_curso } });
      if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
      datos.id_periodo_escolar = curso.id_periodo_escolar;

      if (!datos.id_esquema_calificacion) {
        const esquema = await prisma.tbl_esquemas_calificacion.findFirst({
          where: { id_curso: datos.id_curso, estado: 1 },
        });
        if (esquema) datos.id_esquema_calificacion = esquema.id;
      }
    }

    const cabecera = await model.registrarNotas(datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_notas_cabecera', id_entidad: cabecera.id,
      tipo_accion: 'crear', datos_nuevos: datos,
    });
    res.json(cabecera);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al registrar notas' });
  }
};

const inactivarNota = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivarNota(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_notas_cabecera', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Nota inactivada correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar nota' });
  }
};

const obtenerNotasAlumno = async (req, res) => {
  try {
    const { id_alumno, id_curso } = req.query;
    if (!id_alumno || !id_curso) {
      return res.status(400).json({ error: 'id_alumno e id_curso son obligatorios' });
    }
    res.json(await model.obtenerNotasAlumnoCurso(parseInt(id_alumno), parseInt(id_curso)));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener notas del alumno' });
  }
};

module.exports = { obtenerNotasCursoBimestre, registrarNotas, inactivarNota, obtenerNotasAlumno };
