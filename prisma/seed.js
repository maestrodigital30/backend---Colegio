// ============================================================
// SEED MÍNIMO DE PRODUCCIÓN - Colegio Jose
// Solo crea data 100% indispensable para arrancar el sistema:
//   1) Roles (SUPER_ADMIN, DOCENTE, ALUMNO)
//   2) Permisos (catálogo alineado con rutas frontend)
//   3) Roles-Permisos (asignaciones por rol)
//   4) Usuario SUPER_ADMIN (configurable por env vars)
//   5) Configuración del sistema (1 fila con branding inicial)
// ============================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@colegiojose.edu.pe';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NOMBRES = process.env.ADMIN_NOMBRES || 'ADMINISTRADOR';
const ADMIN_APELLIDOS = process.env.ADMIN_APELLIDOS || 'SISTEMA';

const NOMBRE_SISTEMA = process.env.NOMBRE_SISTEMA || 'Colegio Jose';
const COLOR_PRIMARIO = process.env.COLOR_PRIMARIO || '#1976D2';
const COLOR_SECUNDARIO = process.env.COLOR_SECUNDARIO || '#42A5F5';
const COLOR_ACENTO = process.env.COLOR_ACENTO || '#0D47A1';

async function main() {
  console.log('Iniciando seed mínimo de producción...');

  // =============================================
  // 1. ROLES (obligatorios con nombres exactos)
  // =============================================
  await prisma.tbl_roles.createMany({
    data: [
      { nombre: 'SUPER_ADMIN', descripcion: 'Administra el sistema completo a nivel global. Crea usuarios, configura identidad visual, gestiona todo.' },
      { nombre: 'DOCENTE', descripcion: 'Opera su propio entorno independiente dentro del sistema. Gestiona cursos, alumnos, asistencia, notas y trivia.' },
      { nombre: 'ALUMNO', descripcion: 'Accede a su portal para ver notas, asistencia, trivias y carnet digital.' },
    ],
    skipDuplicates: true,
  });
  console.log('  Roles creados (3)');

  const rolSuperAdmin = await prisma.tbl_roles.findFirst({ where: { nombre: 'SUPER_ADMIN' } });
  if (!rolSuperAdmin) throw new Error('No se pudo crear el rol SUPER_ADMIN');

  // =============================================
  // 2. PERMISOS (catálogo alineado con rutas frontend)
  // =============================================
  const permisosData = [
    // SUPER_ADMIN
    { codigo: 'admin.dashboard',          nombre: 'Dashboard Admin',           tipo: 'ruta', recurso: '/admin/dashboard' },
    { codigo: 'admin.usuarios',           nombre: 'Gestión de Usuarios',       tipo: 'ruta', recurso: '/admin/usuarios' },
    { codigo: 'admin.configuracion',      nombre: 'Configuración del Sistema', tipo: 'ruta', recurso: '/admin/configuracion' },
    { codigo: 'admin.profesores',         nombre: 'Gestión de Profesores',     tipo: 'ruta', recurso: '/admin/profesores' },
    { codigo: 'admin.periodos',           nombre: 'Periodos Escolares',        tipo: 'ruta', recurso: '/admin/periodos' },
    { codigo: 'admin.cursos',             nombre: 'Gestión de Cursos',         tipo: 'ruta', recurso: '/admin/cursos' },
    { codigo: 'admin.alumnos',            nombre: 'Gestión de Alumnos',        tipo: 'ruta', recurso: '/admin/alumnos' },
    { codigo: 'admin.padres',             nombre: 'Gestión de Padres',         tipo: 'ruta', recurso: '/admin/padres' },
    { codigo: 'admin.carnets',            nombre: 'Carnets QR',                tipo: 'ruta', recurso: '/admin/carnets' },
    { codigo: 'admin.asistencia',         nombre: 'Asistencia',                tipo: 'ruta', recurso: '/admin/asistencia' },
    { codigo: 'admin.config_academica',   nombre: 'Configuración Académica',   tipo: 'ruta', recurso: '/admin/config-academica' },
    { codigo: 'admin.notas',              nombre: 'Registro de Notas',         tipo: 'ruta', recurso: '/admin/notas' },
    { codigo: 'admin.whatsapp',           nombre: 'Envío WhatsApp',            tipo: 'ruta', recurso: '/admin/whatsapp' },
    { codigo: 'admin.trivia',             nombre: 'Trivia',                    tipo: 'ruta', recurso: '/admin/trivia' },
    { codigo: 'admin.historial_trivia',   nombre: 'Historial Trivia',          tipo: 'ruta', recurso: '/admin/historial-trivia' },
    { codigo: 'admin.ranking',            nombre: 'Ranking',                   tipo: 'ruta', recurso: '/admin/ranking' },
    { codigo: 'admin.podcast',            nombre: 'Podcast',                   tipo: 'ruta', recurso: '/admin/podcast' },
    { codigo: 'admin.biblioteca',         nombre: 'Biblioteca Digital',        tipo: 'ruta', recurso: '/admin/biblioteca' },
    // DOCENTE
    { codigo: 'docente.dashboard',        nombre: 'Dashboard Docente',         tipo: 'ruta', recurso: '/docente/dashboard' },
    { codigo: 'docente.periodos',         nombre: 'Periodos Escolares',        tipo: 'ruta', recurso: '/docente/periodos' },
    { codigo: 'docente.cursos',           nombre: 'Mis Cursos',                tipo: 'ruta', recurso: '/docente/cursos' },
    { codigo: 'docente.alumnos',          nombre: 'Mis Alumnos',               tipo: 'ruta', recurso: '/docente/alumnos' },
    { codigo: 'docente.padres',           nombre: 'Padres/Contactos',          tipo: 'ruta', recurso: '/docente/padres' },
    { codigo: 'docente.carnets',          nombre: 'Carnets QR',                tipo: 'ruta', recurso: '/docente/carnets' },
    { codigo: 'docente.asistencia',       nombre: 'Asistencia',                tipo: 'ruta', recurso: '/docente/asistencia' },
    { codigo: 'docente.config_academica', nombre: 'Config Académica',          tipo: 'ruta', recurso: '/docente/config-academica' },
    { codigo: 'docente.notas',            nombre: 'Notas',                     tipo: 'ruta', recurso: '/docente/notas' },
    { codigo: 'docente.whatsapp',         nombre: 'Envío WhatsApp',            tipo: 'ruta', recurso: '/docente/whatsapp' },
    { codigo: 'docente.trivia_config',    nombre: 'Config Trivia',             tipo: 'ruta', recurso: '/docente/trivia-config' },
    { codigo: 'docente.trivia_jugar',     nombre: 'Jugar Trivia',              tipo: 'ruta', recurso: '/docente/trivia-jugar' },
    { codigo: 'docente.historial_trivia', nombre: 'Historial Trivia',          tipo: 'ruta', recurso: '/docente/historial-trivia' },
    { codigo: 'docente.ranking',          nombre: 'Ranking Acumulado',         tipo: 'ruta', recurso: '/docente/ranking' },
    { codigo: 'docente.podcast',          nombre: 'Podcast',                   tipo: 'ruta', recurso: '/docente/podcast' },
    { codigo: 'docente.biblioteca',       nombre: 'Biblioteca Digital',        tipo: 'ruta', recurso: '/docente/biblioteca' },
    // ALUMNO
    { codigo: 'alumno.dashboard',         nombre: 'Dashboard Alumno',          tipo: 'ruta', recurso: '/alumno/dashboard' },
    { codigo: 'alumno.cursos',            nombre: 'Mis Cursos',                tipo: 'ruta', recurso: '/alumno/cursos' },
    { codigo: 'alumno.notas',             nombre: 'Mis Notas',                 tipo: 'ruta', recurso: '/alumno/notas' },
    { codigo: 'alumno.trivias',           nombre: 'Mis Trivias',               tipo: 'ruta', recurso: '/alumno/trivias' },
    { codigo: 'alumno.asistencia',        nombre: 'Mi Asistencia',             tipo: 'ruta', recurso: '/alumno/asistencia' },
    { codigo: 'alumno.carnet',            nombre: 'Mi Carnet',                 tipo: 'ruta', recurso: '/alumno/carnet' },
    { codigo: 'alumno.perfil',            nombre: 'Mi Perfil',                 tipo: 'ruta', recurso: '/alumno/perfil' },
    { codigo: 'alumno.biblioteca',        nombre: 'Biblioteca Digital',        tipo: 'ruta', recurso: '/alumno/biblioteca' },
  ];
  await prisma.tbl_permisos.createMany({ data: permisosData, skipDuplicates: true });
  console.log(`  Permisos creados (${permisosData.length})`);

  // =============================================
  // 3. ROLES_PERMISOS (asignaciones por prefijo)
  // =============================================
  const roles = await prisma.tbl_roles.findMany();
  const permisos = await prisma.tbl_permisos.findMany();

  const idRolByNombre = Object.fromEntries(roles.map((r) => [r.nombre, r.id]));
  const asignaciones = [];
  for (const p of permisos) {
    asignaciones.push({ id_rol: idRolByNombre.SUPER_ADMIN, id_permiso: p.id });
    if (p.codigo.startsWith('docente.')) asignaciones.push({ id_rol: idRolByNombre.DOCENTE, id_permiso: p.id });
    if (p.codigo.startsWith('alumno.'))  asignaciones.push({ id_rol: idRolByNombre.ALUMNO,  id_permiso: p.id });
  }
  await prisma.tbl_roles_permisos.createMany({ data: asignaciones, skipDuplicates: true });
  console.log(`  Roles-Permisos asignados (${asignaciones.length})`);

  // =============================================
  // 4. USUARIO SUPER_ADMIN
  // =============================================
  const adminExistente = await prisma.tbl_usuarios.findUnique({ where: { correo: ADMIN_EMAIL } });
  if (!adminExistente) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.tbl_usuarios.create({
      data: {
        nombres: ADMIN_NOMBRES,
        apellidos: ADMIN_APELLIDOS,
        correo: ADMIN_EMAIL,
        contrasena: hash,
        id_rol: idRolByNombre.SUPER_ADMIN,
      },
    });
    console.log(`  Usuario SUPER_ADMIN creado: ${ADMIN_EMAIL}`);
  } else {
    console.log(`  Usuario SUPER_ADMIN ya existe: ${ADMIN_EMAIL} (sin cambios)`);
  }

  // =============================================
  // 5. CONFIGURACIÓN DEL SISTEMA
  // =============================================
  const configExistente = await prisma.tbl_configuracion_sistema.findFirst({ where: { estado: 1 } });
  if (!configExistente) {
    await prisma.tbl_configuracion_sistema.create({
      data: {
        nombre_sistema: NOMBRE_SISTEMA,
        color_primario: COLOR_PRIMARIO,
        color_secundario: COLOR_SECUNDARIO,
        color_acento: COLOR_ACENTO,
      },
    });
    console.log('  Configuración del sistema creada');
  } else {
    console.log('  Configuración del sistema ya existe (sin cambios)');
  }

  console.log('\n========================================');
  console.log('SEED MÍNIMO COMPLETADO');
  console.log('========================================');
  console.log(`  Login: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('  Cambia ADMIN_EMAIL y ADMIN_PASSWORD via env vars en producción.');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Error en el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
