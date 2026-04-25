const model = require('../models/whatsappModel');
const padresModel = require('../models/padresModel');
const notasModel = require('../models/notasModel');
const asistenciaModel = require('../models/asistenciaModel');
const prisma = require('../config/prisma');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { TIPOS_REPORTE_WHATSAPP, ESTADOS_ASISTENCIA } = require('../utils/constants');

const LABELS_ESTADO = {
  [ESTADOS_ASISTENCIA.PRESENTE]: 'Presente',
  [ESTADOS_ASISTENCIA.AUSENTE]: 'Ausente',
  [ESTADOS_ASISTENCIA.TARDANZA]: 'Tardanza',
};

const formatearFechaReporte = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Lima',
  });
};

const construirMensajeAsistenciaDia = (alumno, estadoAsistencia, nombreCurso, fecha) => {
  const label = LABELS_ESTADO[estadoAsistencia] || estadoAsistencia;
  let mensaje = `Asistencia de ${alumno.nombres} ${alumno.apellidos}\n`;
  mensaje += `Fecha: ${formatearFechaReporte(fecha)}\n`;
  mensaje += `Curso: ${nombreCurso}\n`;
  mensaje += `Estado: ${label}`;
  return mensaje;
};

const construirMensajeGeneral = (alumno, notas, resumenAsistencia) => {
  let mensaje = `Reporte de ${alumno.nombres} ${alumno.apellidos}\n\n`;
  mensaje += `NOTAS:\n`;
  for (const nota of notas) {
    mensaje += `${nota.tbl_periodos_calificacion.nombre}: `;
    if (nota.nota_final_numerica) mensaje += `${nota.nota_final_numerica}`;
    if (nota.nota_final_letra) mensaje += `${nota.nota_final_letra}`;
    mensaje += '\n';
    for (const det of nota.tbl_notas_detalle) {
      mensaje += `  ${det.tbl_componentes_nota.nombre_componente}: ${det.valor_numerico || det.valor_letra || '-'}\n`;
    }
  }
  mensaje += `\nASISTENCIA:\n`;
  mensaje += `${LABELS_ESTADO[ESTADOS_ASISTENCIA.PRESENTE]}: ${resumenAsistencia.presente}, `;
  mensaje += `${LABELS_ESTADO[ESTADOS_ASISTENCIA.AUSENTE]}: ${resumenAsistencia.ausente}, `;
  mensaje += `${LABELS_ESTADO[ESTADOS_ASISTENCIA.TARDANZA]}: ${resumenAsistencia.tardanza}\n`;
  mensaje += `Total sesiones: ${resumenAsistencia.total}`;
  return mensaje;
};

const enviarReporte = async (req, res) => {
  try {
    const { id_curso, id_periodo_escolar, tipos_reporte, fecha } = req.body;
    if (!id_curso || !id_periodo_escolar) {
      return res.status(400).json({ error: 'id_curso e id_periodo_escolar son obligatorios' });
    }
    if (!tipos_reporte || !Array.isArray(tipos_reporte) || tipos_reporte.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un tipo de reporte' });
    }

    const tiposValidos = Object.values(TIPOS_REPORTE_WHATSAPP);
    const tiposInvalidos = tipos_reporte.filter(t => !tiposValidos.includes(t));
    if (tiposInvalidos.length > 0) {
      return res.status(400).json({ error: `Tipos de reporte no válidos: ${tiposInvalidos.join(', ')}` });
    }

    const incluyeAsistenciaDia = tipos_reporte.includes(TIPOS_REPORTE_WHATSAPP.ASISTENCIA_DIA);
    const incluyeGeneral = tipos_reporte.includes(TIPOS_REPORTE_WHATSAPP.REPORTE_GENERAL);

    if (incluyeAsistenciaDia && !fecha) {
      return res.status(400).json({ error: 'La fecha es obligatoria para el reporte de asistencia del día' });
    }

    const curso = await prisma.tbl_cursos.findUnique({ where: { id: id_curso } });
    const nombreCurso = curso ? `${curso.nombre} - ${curso.grado || ''} ${curso.seccion || ''}`.trim() : '';

    const alumnosCurso = await prisma.tbl_alumnos_cursos.findMany({
      where: { id_curso, estado: 1 },
      include: { tbl_alumnos: { select: { id: true, nombres: true, apellidos: true } } },
    });

    let asistenciaDiaMap = {};
    if (incluyeAsistenciaDia) {
      const registrosDia = await asistenciaModel.obtenerAsistenciaDiaCurso(id_curso, fecha);
      for (const r of registrosDia) {
        asistenciaDiaMap[r.id_alumno] = r.estado_asistencia;
      }
    }

    const alumnosData = [];
    for (const ac of alumnosCurso) {
      const alumno = ac.tbl_alumnos;
      const padrePrincipal = await padresModel.obtenerPadrePrincipal(alumno.id);

      const partesMensaje = [];

      if (incluyeAsistenciaDia) {
        const estadoDia = asistenciaDiaMap[alumno.id] || ESTADOS_ASISTENCIA.AUSENTE;
        partesMensaje.push(construirMensajeAsistenciaDia(alumno, estadoDia, nombreCurso, fecha));
      }

      if (incluyeGeneral) {
        const notas = await notasModel.obtenerNotasAlumnoCurso(alumno.id, id_curso);
        const resumenAsistencia = await asistenciaModel.obtenerResumenAlumno(alumno.id, id_curso);
        partesMensaje.push(construirMensajeGeneral(alumno, notas, resumenAsistencia));
      }

      alumnosData.push({
        id_alumno: alumno.id,
        id_padre: padrePrincipal ? padrePrincipal.id : null,
        telefono: padrePrincipal ? padrePrincipal.telefono : null,
        contenido_mensaje: partesMensaje.join('\n\n---\n\n'),
      });
    }

    const tipoEnvioLabel = tipos_reporte.sort().join(',');

    const resultado = await model.crearEnvio({
      id_curso,
      id_periodo_escolar,
      tipo_envio: tipoEnvioLabel,
      alumnos: alumnosData,
    }, req.user.id);

    const nombresMap = {};
    for (const ac of alumnosCurso) {
      nombresMap[ac.tbl_alumnos.id] = `${ac.tbl_alumnos.nombres} ${ac.tbl_alumnos.apellidos}`;
    }

    const enlaces = resultado.detalles.map(d => {
      const base = {
        id_alumno: d.id_alumno,
        nombre_alumno: nombresMap[d.id_alumno] || `Alumno ${d.id_alumno}`,
        estado_envio: d.estado_envio,
        contenido_mensaje: d.contenido_mensaje,
      };
      if (d.telefono) {
        const tel = d.telefono.replace(/[^0-9]/g, '');
        const textoEncoded = encodeURIComponent(d.contenido_mensaje);
        return { ...base, whatsapp_url: `https://wa.me/${tel}?text=${textoEncoded}` };
      }
      return { ...base, error: d.mensaje_error };
    });

    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_envios_whatsapp', id_entidad: resultado.lote.id,
      tipo_accion: 'enviar', datos_nuevos: { id_curso, tipos_reporte, total_alumnos: alumnosData.length },
    });

    res.json({ lote: resultado.lote, enlaces });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al enviar reportes' });
  }
};

const obtenerHistorial = async (req, res) => {
  try {
    const idCurso = parseInt(req.params.idCurso);
    res.json(await model.obtenerHistorial(idCurso));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = { enviarReporte, obtenerHistorial };
