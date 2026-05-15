const model = require('../models/whatsappModel');
const padresModel = require('../models/padresModel');
const notasModel = require('../models/notasModel');
const asistenciaModel = require('../models/asistenciaModel');
const prisma = require('../config/prisma');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { TIPOS_REPORTE_WHATSAPP, ESTADOS_ASISTENCIA, ESTADOS_ENVIO_WHATSAPP, ROLES } = require('../utils/constants');

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

const nombreCompletoCurso = (curso) => {
  return `${curso.nombre} - ${curso.grado || ''} ${curso.seccion || ''}`.trim();
};

const construirMensajeAsistenciaDia = (alumno, estadoAsistencia, nombreCurso, fecha) => {
  const label = LABELS_ESTADO[estadoAsistencia] || estadoAsistencia;
  let mensaje = `Asistencia de ${alumno.nombres} ${alumno.apellidos}\n`;
  mensaje += `Fecha: ${formatearFechaReporte(fecha)}\n`;
  mensaje += `Curso: ${nombreCurso}\n`;
  mensaje += `Estado: ${label}`;
  return mensaje;
};

const construirBloqueNotasCurso = (curso, notas) => {
  let bloque = `Curso: ${nombreCompletoCurso(curso)}\n`;
  if (notas.length === 0) {
    bloque += '  (Sin notas registradas)\n';
    return bloque;
  }
  for (const nota of notas) {
    bloque += `${nota.tbl_periodos_calificacion.nombre}: `;
    if (nota.nota_final_numerica) bloque += `${nota.nota_final_numerica}`;
    if (nota.nota_final_letra) bloque += `${nota.nota_final_letra}`;
    bloque += '\n';
    for (const det of nota.tbl_notas_detalle) {
      bloque += `  ${det.tbl_componentes_nota.nombre_componente}: ${det.valor_numerico || det.valor_letra || '-'}\n`;
    }
  }
  return bloque;
};

const construirBloqueAsistenciaCurso = (curso, resumen) => {
  let bloque = `Asistencia (${nombreCompletoCurso(curso)}):\n`;
  bloque += `${LABELS_ESTADO[ESTADOS_ASISTENCIA.PRESENTE]}: ${resumen.presente}, `;
  bloque += `${LABELS_ESTADO[ESTADOS_ASISTENCIA.AUSENTE]}: ${resumen.ausente}, `;
  bloque += `${LABELS_ESTADO[ESTADOS_ASISTENCIA.TARDANZA]}: ${resumen.tardanza}\n`;
  bloque += `Total sesiones: ${resumen.total}`;
  return bloque;
};

const construirMensajeGeneralUnCurso = (alumno, curso, notas, resumenAsistencia) => {
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

const construirMensajeConsolidadoMulticurso = async (alumno, cursos) => {
  let mensaje = `Reporte de ${alumno.nombres} ${alumno.apellidos}\n\n`;
  mensaje += `NOTAS:\n`;
  for (const curso of cursos) {
    const notas = await notasModel.obtenerNotasAlumnoCurso(alumno.id, curso.id);
    mensaje += construirBloqueNotasCurso(curso, notas);
    mensaje += '\n';
  }
  mensaje += `ASISTENCIA:\n`;
  for (const curso of cursos) {
    const resumen = await asistenciaModel.obtenerResumenAlumno(alumno.id, curso.id);
    mensaje += construirBloqueAsistenciaCurso(curso, resumen);
    mensaje += '\n';
  }
  return mensaje.trimEnd();
};

const construirEnlace = (telefono, contenido) => {
  if (!telefono) return null;
  const tel = telefono.replace(/[^0-9]/g, '');
  return `https://wa.me/${tel}?text=${encodeURIComponent(contenido)}`;
};

// =============================================
// ENDPOINT EXISTENTE: envío por curso individual
// =============================================
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
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    if (req.user.rol === ROLES.DOCENTE && curso.id_docente !== req.user.id_perfil_docente) {
      return res.status(403).json({ error: 'No tiene acceso a este curso' });
    }
    const nombreCurso = nombreCompletoCurso(curso);

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
        partesMensaje.push(construirMensajeGeneralUnCurso(alumno, curso, notas, resumenAsistencia));
      }

      alumnosData.push({
        id_alumno: alumno.id,
        id_curso,
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
      const enlace = construirEnlace(d.telefono, d.contenido_mensaje);
      if (enlace) return { ...base, whatsapp_url: enlace };
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

// =============================================
// ENDPOINT NUEVO: grados disponibles para envío masivo
// =============================================
const obtenerGradosDisponibles = async (req, res) => {
  try {
    const { id_periodo_escolar } = req.query;
    const grados = await model.obtenerGradosDisponibles({
      rol: req.user.rol,
      idPerfilDocente: req.user.id_perfil_docente,
      idPeriodoEscolar: id_periodo_escolar,
    });
    res.json(grados);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener grados disponibles' });
  }
};

// =============================================
// ENDPOINT NUEVO: preparar envío masivo (no persiste)
// =============================================
const prepararEnvioMasivo = async (req, res) => {
  try {
    const { grado, secciones, id_periodo_escolar } = req.body;

    if (!grado) return res.status(400).json({ error: 'El grado es obligatorio' });
    if (!id_periodo_escolar) return res.status(400).json({ error: 'El periodo escolar es obligatorio' });
    if (!Array.isArray(secciones) || secciones.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos una sección' });
    }

    const cursos = await model.obtenerCursosAccesibles({
      rol: req.user.rol,
      idPerfilDocente: req.user.id_perfil_docente,
      idPeriodoEscolar: parseInt(id_periodo_escolar),
      grado,
      secciones,
    });

    if (cursos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron cursos accesibles para el grado y secciones seleccionados' });
    }

    const cursosPorAlumno = new Map();
    for (const curso of cursos) {
      for (const ac of curso.tbl_alumnos_cursos) {
        const alumno = ac.tbl_alumnos;
        if (!cursosPorAlumno.has(alumno.id)) {
          cursosPorAlumno.set(alumno.id, { alumno, cursos: [] });
        }
        cursosPorAlumno.get(alumno.id).cursos.push(curso);
      }
    }

    const enlaces = [];
    for (const { alumno, cursos: cursosAlumno } of cursosPorAlumno.values()) {
      const padrePrincipal = await padresModel.obtenerPadrePrincipal(alumno.id);
      const contenido = await construirMensajeConsolidadoMulticurso(alumno, cursosAlumno);
      const telefono = padrePrincipal ? padrePrincipal.telefono : null;

      const base = {
        id_alumno: alumno.id,
        nombre_alumno: `${alumno.nombres} ${alumno.apellidos}`,
        id_padre: padrePrincipal ? padrePrincipal.id : null,
        telefono,
        id_curso_referencia: cursosAlumno[0].id,
        cursos_incluidos: cursosAlumno.map(c => ({ id: c.id, nombre: c.nombre, seccion: c.seccion })),
        contenido_mensaje: contenido,
      };

      const enlace = construirEnlace(telefono, contenido);
      if (enlace) enlaces.push({ ...base, whatsapp_url: enlace });
      else enlaces.push({ ...base, error: 'Padre principal sin número de teléfono' });
    }

    enlaces.sort((a, b) => a.nombre_alumno.localeCompare(b.nombre_alumno));

    res.json({
      grado,
      secciones,
      total_cursos: cursos.length,
      total_alumnos: enlaces.length,
      enlaces,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al preparar envío masivo' });
  }
};

// =============================================
// ENDPOINT NUEVO: confirmar envío masivo (persiste)
// =============================================
const confirmarEnvioMasivo = async (req, res) => {
  try {
    const { grado, secciones, id_periodo_escolar, alumnos } = req.body;

    if (!grado) return res.status(400).json({ error: 'El grado es obligatorio' });
    if (!id_periodo_escolar) return res.status(400).json({ error: 'El periodo escolar es obligatorio' });
    if (!Array.isArray(secciones) || secciones.length === 0) {
      return res.status(400).json({ error: 'Debe indicar las secciones del envío' });
    }
    if (!Array.isArray(alumnos) || alumnos.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un alumno' });
    }

    const seccionesCsv = secciones.join(',');
    const alumnosData = alumnos.map(a => ({
      id_alumno: a.id_alumno,
      id_curso: a.id_curso_referencia || null,
      id_padre: a.id_padre || null,
      telefono: a.telefono || null,
      contenido_mensaje: a.contenido_mensaje || '',
    }));

    const resultado = await model.crearEnvio({
      id_curso: null,
      id_periodo_escolar: parseInt(id_periodo_escolar),
      grado,
      secciones: seccionesCsv,
      tipo_envio: TIPOS_REPORTE_WHATSAPP.REPORTE_GENERAL,
      alumnos: alumnosData,
    }, req.user.id);

    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_envios_whatsapp',
      id_entidad: resultado.lote.id,
      tipo_accion: 'enviar_masivo',
      datos_nuevos: { grado, secciones, total_alumnos: alumnosData.length },
    });

    res.json({ lote: resultado.lote, total: resultado.detalles.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al registrar envío masivo' });
  }
};

// =============================================
// ENDPOINT EXISTENTE: historial por curso
// =============================================
const obtenerHistorial = async (req, res) => {
  try {
    const idCurso = parseInt(req.params.idCurso);
    res.json(await model.obtenerHistorial(idCurso));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// =============================================
// ENDPOINT NUEVO: historial de envíos masivos
// =============================================
const obtenerHistorialMasivo = async (req, res) => {
  try {
    const { id_periodo_escolar, grado } = req.query;
    const historial = await model.obtenerHistorialMasivo({
      rol: req.user.rol,
      idPerfilDocente: req.user.id_perfil_docente,
      idPeriodoEscolar: id_periodo_escolar,
      grado,
    });
    res.json(historial);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial masivo' });
  }
};

module.exports = {
  enviarReporte,
  obtenerHistorial,
  obtenerGradosDisponibles,
  prepararEnvioMasivo,
  confirmarEnvioMasivo,
  obtenerHistorialMasivo,
};
