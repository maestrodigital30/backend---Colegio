const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { ESTADOS_ENVIO_WHATSAPP, TIPOS_REPORTE_WHATSAPP } = require('../utils/constants');
const prisma = new PrismaClient();

// Helper: fecha Lima
const limaDate = (dateStr) => new Date(`${dateStr}T05:00:00.000Z`);
const limaDateTime = (dateStr, time = '08:00:00') => new Date(`${dateStr}T${time}.000Z`);

async function main() {
  console.log('Iniciando seed completo...');

  // =============================================
  // 1. ROLES
  // =============================================
  await prisma.tbl_roles.createMany({
    data: [
      { nombre: 'SUPER_ADMIN', descripcion: 'Administra el sistema completo a nivel global. Crea usuarios, configura identidad visual, gestiona todo.', id_usuario_registro: 1 },
      { nombre: 'DOCENTE', descripcion: 'Opera su propio entorno independiente dentro del sistema. Gestiona cursos, alumnos, asistencia, notas y trivia.', id_usuario_registro: 1 },
      { nombre: 'ALUMNO', descripcion: 'Accede a su portal para ver notas, asistencia, trivias y carnet digital.', id_usuario_registro: 1 },
    ],
    skipDuplicates: true,
  });
  console.log('✓ Roles creados');

  // =============================================
  // 2. PERMISOS
  // =============================================
  await prisma.tbl_permisos.createMany({
    data: [
      // SUPER_ADMIN
      { codigo: 'admin.dashboard', nombre: 'Dashboard Admin', tipo: 'ruta', recurso: '/admin/dashboard', id_usuario_registro: 1 },
      { codigo: 'admin.usuarios', nombre: 'Gestión de Usuarios', tipo: 'ruta', recurso: '/admin/usuarios', id_usuario_registro: 1 },
      { codigo: 'admin.configuracion', nombre: 'Configuración del Sistema', tipo: 'ruta', recurso: '/admin/configuracion', id_usuario_registro: 1 },
      { codigo: 'admin.profesores', nombre: 'Gestión de Profesores', tipo: 'ruta', recurso: '/admin/profesores', id_usuario_registro: 1 },
      { codigo: 'admin.periodos', nombre: 'Periodos Escolares', tipo: 'ruta', recurso: '/admin/periodos', id_usuario_registro: 1 },
      { codigo: 'admin.cursos', nombre: 'Gestión de Cursos', tipo: 'ruta', recurso: '/admin/cursos', id_usuario_registro: 1 },
      { codigo: 'admin.alumnos', nombre: 'Gestión de Alumnos', tipo: 'ruta', recurso: '/admin/alumnos', id_usuario_registro: 1 },
      { codigo: 'admin.padres', nombre: 'Gestión de Padres', tipo: 'ruta', recurso: '/admin/padres', id_usuario_registro: 1 },
      { codigo: 'admin.asistencia', nombre: 'Asistencia', tipo: 'ruta', recurso: '/admin/asistencia', id_usuario_registro: 1 },
      { codigo: 'admin.config_academica', nombre: 'Configuración Académica', tipo: 'ruta', recurso: '/admin/config-academica', id_usuario_registro: 1 },
      { codigo: 'admin.notas', nombre: 'Registro de Notas', tipo: 'ruta', recurso: '/admin/notas', id_usuario_registro: 1 },
      { codigo: 'admin.whatsapp', nombre: 'Envío WhatsApp', tipo: 'ruta', recurso: '/admin/whatsapp', id_usuario_registro: 1 },
      { codigo: 'admin.trivia', nombre: 'Trivia', tipo: 'ruta', recurso: '/admin/trivia', id_usuario_registro: 1 },
      { codigo: 'admin.historial_trivia', nombre: 'Historial Trivia', tipo: 'ruta', recurso: '/admin/historial-trivia', id_usuario_registro: 1 },
      { codigo: 'admin.ranking', nombre: 'Ranking', tipo: 'ruta', recurso: '/admin/ranking', id_usuario_registro: 1 },
      { codigo: 'admin.biblioteca', nombre: 'Biblioteca Digital', tipo: 'ruta', recurso: '/admin/biblioteca', id_usuario_registro: 1 },
      // DOCENTE
      { codigo: 'docente.dashboard', nombre: 'Dashboard Docente', tipo: 'ruta', recurso: '/docente/dashboard', id_usuario_registro: 1 },
      { codigo: 'docente.periodos', nombre: 'Periodos Escolares Docente', tipo: 'ruta', recurso: '/docente/periodos', id_usuario_registro: 1 },
      { codigo: 'docente.cursos', nombre: 'Mis Cursos', tipo: 'ruta', recurso: '/docente/cursos', id_usuario_registro: 1 },
      { codigo: 'docente.alumnos', nombre: 'Mis Alumnos', tipo: 'ruta', recurso: '/docente/alumnos', id_usuario_registro: 1 },
      { codigo: 'docente.padres', nombre: 'Padres/Contactos', tipo: 'ruta', recurso: '/docente/padres', id_usuario_registro: 1 },
      { codigo: 'docente.carnets', nombre: 'Carnets QR', tipo: 'ruta', recurso: '/docente/carnets', id_usuario_registro: 1 },
      { codigo: 'docente.asistencia', nombre: 'Asistencia', tipo: 'ruta', recurso: '/docente/asistencia', id_usuario_registro: 1 },
      { codigo: 'docente.config_academica', nombre: 'Config Académica', tipo: 'ruta', recurso: '/docente/config-academica', id_usuario_registro: 1 },
      { codigo: 'docente.notas', nombre: 'Notas', tipo: 'ruta', recurso: '/docente/notas', id_usuario_registro: 1 },
      { codigo: 'docente.whatsapp', nombre: 'Envío WhatsApp', tipo: 'ruta', recurso: '/docente/whatsapp', id_usuario_registro: 1 },
      { codigo: 'docente.trivia_config', nombre: 'Config Trivia', tipo: 'ruta', recurso: '/docente/trivia-config', id_usuario_registro: 1 },
      { codigo: 'docente.trivia_jugar', nombre: 'Jugar Trivia', tipo: 'ruta', recurso: '/docente/trivia-jugar', id_usuario_registro: 1 },
      { codigo: 'docente.historial_trivia', nombre: 'Historial Trivia', tipo: 'ruta', recurso: '/docente/historial-trivia', id_usuario_registro: 1 },
      { codigo: 'docente.ranking', nombre: 'Ranking Acumulado', tipo: 'ruta', recurso: '/docente/ranking', id_usuario_registro: 1 },
      { codigo: 'docente.biblioteca', nombre: 'Biblioteca Digital', tipo: 'ruta', recurso: '/docente/biblioteca', id_usuario_registro: 1 },
      // ALUMNO
      { codigo: 'alumno.dashboard', nombre: 'Dashboard Alumno', tipo: 'ruta', recurso: '/alumno/dashboard', id_usuario_registro: 1 },
      { codigo: 'alumno.biblioteca', nombre: 'Biblioteca Digital', tipo: 'ruta', recurso: '/alumno/biblioteca', id_usuario_registro: 1 },
    ],
    skipDuplicates: true,
  });
  console.log('✓ Permisos creados');

  // =============================================
  // 3. ROLES_PERMISOS
  // =============================================
  const permisos = await prisma.tbl_permisos.findMany();
  const dataRolesPermisos = [];
  permisos.forEach((p) => {
    dataRolesPermisos.push({ id_rol: 1, id_permiso: p.id, id_usuario_registro: 1 });
  });
  permisos.filter(p => p.codigo.startsWith('docente.')).forEach((p) => {
    dataRolesPermisos.push({ id_rol: 2, id_permiso: p.id, id_usuario_registro: 1 });
  });
  permisos.filter(p => p.codigo.startsWith('alumno.')).forEach((p) => {
    dataRolesPermisos.push({ id_rol: 3, id_permiso: p.id, id_usuario_registro: 1 });
  });
  await prisma.tbl_roles_permisos.createMany({ data: dataRolesPermisos, skipDuplicates: true });
  console.log('✓ Roles-Permisos asignados');

  // =============================================
  // 4. USUARIOS
  // =============================================
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashDocente = await bcrypt.hash('docente123', 10);

  await prisma.tbl_usuarios.createMany({
    data: [
      { nombres: 'JOSE LUIS', apellidos: 'MARTINEZ VARGAS', correo: 'admin@colegiojose.edu.pe', contrasena: hashAdmin, id_rol: 1, celular: '987654321', id_usuario_registro: 1 },
      { nombres: 'CARLOS EDUARDO', apellidos: 'RAMIREZ SALAZAR', correo: 'carlos.ramirez@colegiojose.edu.pe', contrasena: hashDocente, id_rol: 2, celular: '956123478', id_usuario_registro: 1 },
      { nombres: 'MARIA ELENA', apellidos: 'LOPEZ GUTIERREZ', correo: 'maria.lopez@colegiojose.edu.pe', contrasena: hashDocente, id_rol: 2, celular: '945678123', id_usuario_registro: 1 },
    ],
    skipDuplicates: true,
  });
  console.log('✓ Usuarios creados');

  // =============================================
  // 5. PERFILES DOCENTE
  // =============================================
  await prisma.tbl_perfiles_docente.createMany({
    data: [
      { id_usuario: 2, nombres: 'CARLOS EDUARDO', apellidos: 'RAMIREZ SALAZAR', especialidad: 'Matemáticas y Razonamiento', telefono: '956123478', id_usuario_registro: 1 },
      { id_usuario: 3, nombres: 'MARIA ELENA', apellidos: 'LOPEZ GUTIERREZ', especialidad: 'Comunicación y Literatura', telefono: '945678123', id_usuario_registro: 1 },
    ],
    skipDuplicates: true,
  });
  console.log('✓ Perfiles docente creados');

  // =============================================
  // 6. CONFIGURACIÓN DEL SISTEMA
  // =============================================
  await prisma.tbl_configuracion_sistema.create({
    data: {
      nombre_sistema: 'Colegio Jose',
      color_primario: '#1976D2',
      color_secundario: '#42A5F5',
      color_acento: '#0D47A1',
      id_usuario_modificacion: 1,
    },
  });
  console.log('✓ Configuración del sistema');

  // =============================================
  // 7. PERIODOS ESCOLARES
  // =============================================
  await prisma.tbl_periodos_escolares.createMany({
    data: [
      { nombre: 'Año Escolar 2025', anio: 2025, fecha_inicio: limaDate('2025-03-03'), fecha_fin: limaDate('2025-12-19'), id_usuario_registro: 1 },
      { nombre: 'Año Escolar 2026', anio: 2026, fecha_inicio: limaDate('2026-03-02'), fecha_fin: limaDate('2026-12-18'), id_usuario_registro: 1 },
    ],
    skipDuplicates: true,
  });
  console.log('✓ Periodos escolares creados');

  // =============================================
  // 8. CURSOS - Docente 1 (Carlos): Matemática
  //           - Docente 2 (María): Comunicación
  // =============================================
  await prisma.tbl_cursos.createMany({
    data: [
      // Docente 1 - Carlos (id_docente=1)
      { id_docente: 1, id_periodo_escolar: 2, nombre: 'Matemática', descripcion: 'Aritmética, álgebra y geometría básica', grado: '3°', seccion: 'A', id_usuario_registro: 2 },
      { id_docente: 1, id_periodo_escolar: 2, nombre: 'Razonamiento Matemático', descripcion: 'Lógica, series y problemas de razonamiento', grado: '3°', seccion: 'A', id_usuario_registro: 2 },
      { id_docente: 1, id_periodo_escolar: 2, nombre: 'Matemática', descripcion: 'Aritmética y geometría para 4to grado', grado: '4°', seccion: 'B', id_usuario_registro: 2 },
      // Docente 2 - María (id_docente=2)
      { id_docente: 2, id_periodo_escolar: 2, nombre: 'Comunicación', descripcion: 'Comprensión lectora, gramática y redacción', grado: '3°', seccion: 'A', id_usuario_registro: 3 },
      { id_docente: 2, id_periodo_escolar: 2, nombre: 'Literatura', descripcion: 'Análisis literario y producción de textos creativos', grado: '5°', seccion: 'A', id_usuario_registro: 3 },
      { id_docente: 2, id_periodo_escolar: 2, nombre: 'Comunicación', descripcion: 'Comprensión lectora nivel avanzado', grado: '4°', seccion: 'A', id_usuario_registro: 3 },
      // Un curso inactivo
      { id_docente: 1, id_periodo_escolar: 1, nombre: 'Matemática 2025', descripcion: 'Curso del año pasado', grado: '2°', seccion: 'A', id_usuario_registro: 2, estado: 0 },
    ],
    skipDuplicates: true,
  });
  console.log('✓ Cursos creados');

  // =============================================
  // 9. ALUMNOS - 15 para Docente 1, 12 para Docente 2
  // =============================================
  const alumnosDocente1 = [
    { nombres: 'JUAN PABLO', apellidos: 'GARCIA MENDOZA', dni: '72345601', fecha_nacimiento: limaDate('2014-03-15'), genero: 'Masculino', direccion: 'Av. Los Pinos 234, Surco' },
    { nombres: 'ANA MARIA', apellidos: 'TORRES QUISPE', dni: '72345602', fecha_nacimiento: limaDate('2014-07-22'), genero: 'Femenino', direccion: 'Jr. Las Flores 567, Miraflores' },
    { nombres: 'PEDRO LUIS', apellidos: 'FERNANDEZ ROJAS', dni: '72345603', fecha_nacimiento: limaDate('2014-01-10'), genero: 'Masculino', direccion: 'Calle Sol 123, San Isidro' },
    { nombres: 'LUCIA ISABEL', apellidos: 'CASTILLO NUÑEZ', dni: '72345604', fecha_nacimiento: limaDate('2014-11-05'), genero: 'Femenino', direccion: 'Av. Primavera 890, La Molina' },
    { nombres: 'DIEGO ANDRES', apellidos: 'VELASQUEZ SOTO', dni: '72345605', fecha_nacimiento: limaDate('2014-05-18'), genero: 'Masculino', direccion: 'Jr. Los Olivos 456, San Miguel' },
    { nombres: 'CAMILA SOFIA', apellidos: 'MORALES ESPINOZA', dni: '72345606', fecha_nacimiento: limaDate('2014-09-25'), genero: 'Femenino', direccion: 'Av. Arequipa 1023, Lince' },
    { nombres: 'MATEO JOSE', apellidos: 'NAVARRO BUSTAMANTE', dni: '72345607', fecha_nacimiento: limaDate('2014-02-14'), genero: 'Masculino', direccion: 'Calle Luna 789, Pueblo Libre' },
    { nombres: 'VALENTINA', apellidos: 'RODRIGUEZ VALDEZ', dni: '72345608', fecha_nacimiento: limaDate('2014-08-30'), genero: 'Femenino', direccion: 'Jr. Libertad 321, Jesús María' },
    { nombres: 'SANTIAGO', apellidos: 'LOPEZ MARTINEZ', dni: '72345609', fecha_nacimiento: limaDate('2014-04-12'), genero: 'Masculino', direccion: 'Av. Brasil 567, Breña' },
    { nombres: 'ISABELLA', apellidos: 'RAMIREZ CAMACHO', dni: '72345610', fecha_nacimiento: limaDate('2014-12-01'), genero: 'Femenino', direccion: 'Calle Bolognesi 234, Magdalena' },
    { nombres: 'SEBASTIAN ALONSO', apellidos: 'HUAMAN PAREDES', dni: '72345611', fecha_nacimiento: limaDate('2013-06-20'), genero: 'Masculino', direccion: 'Av. Colonial 1456, Callao' },
    { nombres: 'MARIANA ALEJANDRA', apellidos: 'QUISPE FLORES', dni: '72345612', fecha_nacimiento: limaDate('2013-10-08'), genero: 'Femenino', direccion: 'Jr. Cusco 678, Lima Cercado' },
    { nombres: 'NICOLAS FABIAN', apellidos: 'DIAZ CORONEL', dni: '72345613', fecha_nacimiento: limaDate('2013-03-28'), genero: 'Masculino', direccion: 'Av. Salaverry 234, San Isidro' },
    { nombres: 'RENATA', apellidos: 'VARGAS RIOS', dni: '72345614', fecha_nacimiento: limaDate('2013-07-15'), genero: 'Femenino', direccion: 'Calle Los Laureles 890, Surquillo' },
    { nombres: 'THIAGO ALEJANDRO', apellidos: 'CAMPOS SILVA', dni: '72345615', fecha_nacimiento: limaDate('2013-11-22'), genero: 'Masculino', direccion: 'Av. Petit Thouars 1567, Santa Beatriz' },
  ];

  const alumnosDocente2 = [
    { nombres: 'FERNANDA', apellidos: 'GUTIERREZ LUNA', dni: '72345616', fecha_nacimiento: limaDate('2014-04-03'), genero: 'Femenino', direccion: 'Av. Javier Prado 2340, San Borja' },
    { nombres: 'GABRIEL MARTIN', apellidos: 'CHAVEZ RAMOS', dni: '72345617', fecha_nacimiento: limaDate('2014-08-17'), genero: 'Masculino', direccion: 'Jr. Huallaga 456, Lima' },
    { nombres: 'SOFIA NICOLE', apellidos: 'MENDOZA HERRERA', dni: '72345618', fecha_nacimiento: limaDate('2014-01-29'), genero: 'Femenino', direccion: 'Calle Las Palmeras 789, La Molina' },
    { nombres: 'EMILIANO', apellidos: 'PONCE SALCEDO', dni: '72345619', fecha_nacimiento: limaDate('2014-06-11'), genero: 'Masculino', direccion: 'Av. Angamos 1234, Surquillo' },
    { nombres: 'VALERIA LUCIA', apellidos: 'ORTEGA MEDINA', dni: '72345620', fecha_nacimiento: limaDate('2014-10-25'), genero: 'Femenino', direccion: 'Jr. Camaná 567, Lima' },
    { nombres: 'JOAQUIN DAVID', apellidos: 'SALAZAR PINEDA', dni: '72345621', fecha_nacimiento: limaDate('2014-02-07'), genero: 'Masculino', direccion: 'Av. La Marina 3456, San Miguel' },
    { nombres: 'MIA VALENTINA', apellidos: 'REYES AGUILAR', dni: '72345622', fecha_nacimiento: limaDate('2014-05-19'), genero: 'Femenino', direccion: 'Calle Lima 890, Miraflores' },
    { nombres: 'ADRIAN RAFAEL', apellidos: 'SOLIS LOZANO', dni: '72345623', fecha_nacimiento: limaDate('2012-09-14'), genero: 'Masculino', direccion: 'Av. Universitaria 567, San Martín de Porres' },
    { nombres: 'DANIELA GRACE', apellidos: 'AYALA CONTRERAS', dni: '72345624', fecha_nacimiento: limaDate('2012-12-30'), genero: 'Femenino', direccion: 'Jr. Moquegua 234, Lima' },
    { nombres: 'MATIAS', apellidos: 'FIGUEROA DELGADO', dni: '72345625', fecha_nacimiento: limaDate('2012-03-06'), genero: 'Masculino', direccion: 'Av. Tacna 1890, Breña' },
    { nombres: 'ANTONELLA', apellidos: 'MIRANDA TEJADA', dni: '72345626', fecha_nacimiento: limaDate('2012-07-21'), genero: 'Femenino', direccion: 'Calle Puno 345, Pueblo Libre' },
    { nombres: 'LIAM ESTEBAN', apellidos: 'ZAPATA RUIZ', dni: '72345627', fecha_nacimiento: limaDate('2012-11-09'), genero: 'Masculino', direccion: 'Jr. Callao 678, San Luis' },
  ];

  for (const a of alumnosDocente1) {
    await prisma.tbl_alumnos.create({ data: { id_docente: 1, ...a, id_usuario_registro: 2 } });
  }
  for (const a of alumnosDocente2) {
    await prisma.tbl_alumnos.create({ data: { id_docente: 2, ...a, id_usuario_registro: 3 } });
  }
  console.log('✓ 27 alumnos creados');

  // =============================================
  // 10. ASIGNAR ALUMNOS A CURSOS
  // =============================================
  const alumnosD1 = await prisma.tbl_alumnos.findMany({ where: { id_docente: 1 }, orderBy: { id: 'asc' } });
  const alumnosD2 = await prisma.tbl_alumnos.findMany({ where: { id_docente: 2 }, orderBy: { id: 'asc' } });

  const acData = [];
  // Docente 1: primeros 10 → Curso 1 (Matemática 3°A) y Curso 2 (Razonamiento 3°A)
  for (let i = 0; i < 10; i++) {
    acData.push({ id_curso: 1, id_alumno: alumnosD1[i].id, id_usuario_registro: 2 });
    acData.push({ id_curso: 2, id_alumno: alumnosD1[i].id, id_usuario_registro: 2 });
  }
  // Docente 1: últimos 5 → Curso 3 (Matemática 4°B)
  for (let i = 10; i < 15; i++) {
    acData.push({ id_curso: 3, id_alumno: alumnosD1[i].id, id_usuario_registro: 2 });
  }
  // Docente 2: primeros 7 → Curso 4 (Comunicación 3°A)
  for (let i = 0; i < 7; i++) {
    acData.push({ id_curso: 4, id_alumno: alumnosD2[i].id, id_usuario_registro: 3 });
  }
  // Docente 2: últimos 5 → Curso 5 (Literatura 5°A)
  for (let i = 7; i < 12; i++) {
    acData.push({ id_curso: 5, id_alumno: alumnosD2[i].id, id_usuario_registro: 3 });
  }
  // Docente 2: todos → Curso 6 (Comunicación 4°A)
  for (const a of alumnosD2) {
    acData.push({ id_curso: 6, id_alumno: a.id, id_usuario_registro: 3 });
  }

  await prisma.tbl_alumnos_cursos.createMany({ data: acData, skipDuplicates: true });
  console.log('✓ Alumnos asignados a cursos');

  // =============================================
  // 11. CARNETS Y QR PARA TODOS LOS ALUMNOS
  // =============================================
  const todosAlumnos = await prisma.tbl_alumnos.findMany({ orderBy: { id: 'asc' } });
  for (const alumno of todosAlumnos) {
    const codigoCarnet = `CJ-${alumno.id.toString().padStart(6, '0')}`;
    const valorQr = uuidv4();
    await prisma.tbl_carnets_alumnos.create({
      data: { id_alumno: alumno.id, codigo_carnet: codigoCarnet, esta_activo: true, id_usuario_registro: 1 },
    });
    await prisma.tbl_qr_alumnos.create({
      data: { id_alumno: alumno.id, valor_qr: valorQr, esta_activo: true, id_usuario_registro: 1 },
    });
  }
  console.log('✓ Carnets y QR generados');

  // =============================================
  // 12. PADRES Y RELACIONES PADRES-ALUMNOS
  // =============================================
  // Docente 1 - padres
  const padresD1Data = [
    { nombres: 'ROBERTO CARLOS', apellidos: 'GARCIA HERRERA', telefono: '951234567', correo: 'roberto.garcia@gmail.com' },
    { nombres: 'ELENA PATRICIA', apellidos: 'MENDOZA DE GARCIA', telefono: '952345678', correo: 'elena.mendoza@gmail.com' },
    { nombres: 'MIGUEL ANGEL', apellidos: 'TORRES VARGAS', telefono: '953456789', correo: 'miguel.torres@hotmail.com' },
    { nombres: 'CARMEN ROSA', apellidos: 'QUISPE DE TORRES', telefono: '954567890', correo: 'carmen.quispe@gmail.com' },
    { nombres: 'LUIS FERNANDO', apellidos: 'FERNANDEZ ALVARADO', telefono: '955678901', correo: 'luis.fernandez@outlook.com' },
    { nombres: 'PATRICIA', apellidos: 'ROJAS DE FERNANDEZ', telefono: '956789012', correo: 'patricia.rojas@gmail.com' },
    { nombres: 'JORGE ALBERTO', apellidos: 'CASTILLO PAREDES', telefono: '957890123', correo: 'jorge.castillo@gmail.com' },
    { nombres: 'ROSA MARIA', apellidos: 'NUÑEZ DE CASTILLO', telefono: '958901234', correo: 'rosa.nunez@hotmail.com' },
    { nombres: 'OSCAR DANIEL', apellidos: 'VELASQUEZ CANO', telefono: '959012345', correo: 'oscar.velasquez@gmail.com' },
    { nombres: 'SILVIA', apellidos: 'SOTO DE VELASQUEZ', telefono: '960123456', correo: 'silvia.soto@gmail.com' },
    { nombres: 'RICARDO', apellidos: 'MORALES AQUINO', telefono: '961234567', correo: 'ricardo.morales@outlook.com' },
    { nombres: 'ANA CLAUDIA', apellidos: 'ESPINOZA DE MORALES', telefono: '962345678', correo: 'ana.espinoza@gmail.com' },
    { nombres: 'FRANCO ANTONIO', apellidos: 'NAVARRO PALACIOS', telefono: '963456789', correo: 'franco.navarro@gmail.com' },
    { nombres: 'JOSE MANUEL', apellidos: 'RODRIGUEZ VEGA', telefono: '964567890', correo: 'jose.rodriguez@hotmail.com' },
    { nombres: 'MARIA TERESA', apellidos: 'VALDEZ DE RODRIGUEZ', telefono: '965678901', correo: 'maria.valdez@gmail.com' },
    { nombres: 'DAVID ALFREDO', apellidos: 'LOPEZ AGUIRRE', telefono: '966789012', correo: 'david.lopez@gmail.com' },
    { nombres: 'CECILIA', apellidos: 'RAMIREZ DE CAMACHO', telefono: '967890123', correo: 'cecilia.ramirez@gmail.com' },
    { nombres: 'HECTOR RAUL', apellidos: 'HUAMAN CORDOVA', telefono: '968901234', correo: 'hector.huaman@outlook.com' },
    { nombres: 'GLADYS', apellidos: 'PAREDES DE HUAMAN', telefono: '969012345', correo: 'gladys.paredes@gmail.com' },
    { nombres: 'WALTER', apellidos: 'QUISPE MAMANI', telefono: '970123456', correo: 'walter.quispe@gmail.com' },
  ];

  for (const p of padresD1Data) {
    await prisma.tbl_padres.create({ data: { id_docente: 1, ...p, id_usuario_registro: 2 } });
  }

  // Docente 2 - padres
  const padresD2Data = [
    { nombres: 'ALFREDO', apellidos: 'GUTIERREZ MORA', telefono: '971234567', correo: 'alfredo.gutierrez@gmail.com' },
    { nombres: 'SUSANA', apellidos: 'LUNA DE GUTIERREZ', telefono: '972345678', correo: 'susana.luna@gmail.com' },
    { nombres: 'RAUL ENRIQUE', apellidos: 'CHAVEZ TAPIA', telefono: '973456789', correo: 'raul.chavez@hotmail.com' },
    { nombres: 'GISELA', apellidos: 'RAMOS DE CHAVEZ', telefono: '974567890', correo: 'gisela.ramos@gmail.com' },
    { nombres: 'JULIO CESAR', apellidos: 'MENDOZA BARRETO', telefono: '975678901', correo: 'julio.mendoza@gmail.com' },
    { nombres: 'EMILIANO PEDRO', apellidos: 'PONCE LARA', telefono: '976789012', correo: 'emiliano.ponce@outlook.com' },
    { nombres: 'DIANA CAROLINA', apellidos: 'SALCEDO DE PONCE', telefono: '977890123', correo: 'diana.salcedo@gmail.com' },
    { nombres: 'ANDRES FELIPE', apellidos: 'ORTEGA ARRIAGA', telefono: '978901234', correo: 'andres.ortega@gmail.com' },
    { nombres: 'LORENA', apellidos: 'MEDINA DE ORTEGA', telefono: '979012345', correo: 'lorena.medina@gmail.com' },
    { nombres: 'PAULO', apellidos: 'SALAZAR ROMERO', telefono: '980123456', correo: 'paulo.salazar@hotmail.com' },
    { nombres: 'VIVIANA', apellidos: 'REYES DE AGUILAR', telefono: '981234567', correo: 'viviana.reyes@gmail.com' },
    { nombres: 'MARCO ANTONIO', apellidos: 'SOLIS PEREZ', telefono: '982345678', correo: 'marco.solis@gmail.com' },
    { nombres: 'INGRID', apellidos: 'LOZANO DE SOLIS', telefono: '983456789', correo: 'ingrid.lozano@gmail.com' },
    { nombres: 'ROBERTO', apellidos: 'AYALA BENITES', telefono: '984567890', correo: 'roberto.ayala@outlook.com' },
    { nombres: 'CARLOS JAVIER', apellidos: 'FIGUEROA MONTES', telefono: '985678901', correo: 'carlos.figueroa@gmail.com' },
    { nombres: 'PILAR', apellidos: 'MIRANDA CALLE', telefono: '986789012', correo: 'pilar.miranda@gmail.com' },
    { nombres: 'IVAN', apellidos: 'ZAPATA CARRILLO', telefono: '987890123', correo: 'ivan.zapata@gmail.com' },
  ];

  for (const p of padresD2Data) {
    await prisma.tbl_padres.create({ data: { id_docente: 2, ...p, id_usuario_registro: 3 } });
  }
  console.log('✓ Padres creados');

  // Relaciones padres-alumnos
  const padresD1 = await prisma.tbl_padres.findMany({ where: { id_docente: 1 }, orderBy: { id: 'asc' } });
  const padresD2 = await prisma.tbl_padres.findMany({ where: { id_docente: 2 }, orderBy: { id: 'asc' } });

  const paData = [];
  // Docente 1: 2 padres por alumno (padre y madre) para los primeros 10, 1 padre para los últimos 5
  for (let i = 0; i < 10; i++) {
    paData.push({ id_alumno: alumnosD1[i].id, id_padre: padresD1[i * 2].id, parentesco: 'Padre', es_principal: true, id_usuario_registro: 2 });
    paData.push({ id_alumno: alumnosD1[i].id, id_padre: padresD1[i * 2 + 1].id, parentesco: 'Madre', es_principal: false, id_usuario_registro: 2 });
  }
  // Docente 2: 2 padres para primeros 5, luego 1 padre cada uno
  for (let i = 0; i < 5; i++) {
    paData.push({ id_alumno: alumnosD2[i].id, id_padre: padresD2[i * 2].id, parentesco: 'Padre', es_principal: true, id_usuario_registro: 3 });
    paData.push({ id_alumno: alumnosD2[i].id, id_padre: padresD2[i * 2 + 1].id, parentesco: 'Madre', es_principal: false, id_usuario_registro: 3 });
  }
  for (let i = 5; i < 12; i++) {
    paData.push({ id_alumno: alumnosD2[i].id, id_padre: padresD2[10 + (i - 5)].id, parentesco: i % 2 === 0 ? 'Padre' : 'Madre', es_principal: true, id_usuario_registro: 3 });
  }

  await prisma.tbl_padres_alumnos.createMany({ data: paData, skipDuplicates: true });
  console.log('✓ Relaciones padres-alumnos creadas');

  // =============================================
  // 13. SESIONES DE ASISTENCIA + REGISTROS
  // =============================================
  const fechasAsistencia = ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-16', '2026-03-17'];
  const estadosAsist = ['presente', 'presente', 'presente', 'presente', 'tardanza', 'ausente', 'presente', 'presente', 'presente', 'tardanza'];

  // Curso 1 (Matemática 3°A) - 7 días de asistencia
  for (let d = 0; d < fechasAsistencia.length; d++) {
    const sesion = await prisma.tbl_sesiones_asistencia.create({
      data: {
        id_curso: 1, id_docente: 1, id_periodo_escolar: 2,
        fecha_asistencia: limaDate(fechasAsistencia[d]),
        id_usuario_registro: 2,
      },
    });
    for (let i = 0; i < 10; i++) {
      const estado = d === 5 && i === 3 ? 'ausente' : d === 6 && i === 7 ? 'tardanza' : estadosAsist[(i + d) % estadosAsist.length];
      await prisma.tbl_registros_asistencia.create({
        data: {
          id_sesion_asistencia: sesion.id, id_alumno: alumnosD1[i].id,
          estado_asistencia: estado,
          modo_registro: i % 3 === 0 ? 'qr' : 'manual',
          id_usuario_registro: 2,
        },
      });
    }
  }

  // Curso 4 (Comunicación 3°A) - 5 días
  for (let d = 0; d < 5; d++) {
    const sesion = await prisma.tbl_sesiones_asistencia.create({
      data: {
        id_curso: 4, id_docente: 2, id_periodo_escolar: 2,
        fecha_asistencia: limaDate(fechasAsistencia[d]),
        id_usuario_registro: 3,
      },
    });
    for (let i = 0; i < 7; i++) {
      const estado = d === 2 && i === 4 ? 'ausente' : d === 4 && i === 1 ? 'tardanza' : 'presente';
      await prisma.tbl_registros_asistencia.create({
        data: {
          id_sesion_asistencia: sesion.id, id_alumno: alumnosD2[i].id,
          estado_asistencia: estado,
          modo_registro: 'manual',
          id_usuario_registro: 3,
        },
      });
    }
  }
  console.log('✓ Sesiones y registros de asistencia creados');

  // =============================================
  // 14. ESQUEMAS DE CALIFICACIÓN
  // =============================================
  // Curso 1 - Numérico con fórmula
  const esquema1 = await prisma.tbl_esquemas_calificacion.create({
    data: {
      id_docente: 1, id_curso: 1, id_periodo_escolar: 2,
      tipo_calificacion: 'numerico',
      formula: '(EP*0.20)+(EC*0.30)+(EF*0.50)',
      modo_nota_final: 'calculado',
      id_usuario_registro: 2,
    },
  });

  // Periodos de calificación para esquema 1 (bimestres)
  const pc1_1 = await prisma.tbl_periodos_calificacion.create({
    data: { id_esquema_calificacion: esquema1.id, nombre: 'Bimestre I', orden: 1, id_usuario_registro: 2 },
  });
  const pc1_2 = await prisma.tbl_periodos_calificacion.create({
    data: { id_esquema_calificacion: esquema1.id, nombre: 'Bimestre II', orden: 2, id_usuario_registro: 2 },
  });
  const pc1_3 = await prisma.tbl_periodos_calificacion.create({
    data: { id_esquema_calificacion: esquema1.id, nombre: 'Bimestre III', orden: 3, id_usuario_registro: 2 },
  });
  const pc1_4 = await prisma.tbl_periodos_calificacion.create({
    data: { id_esquema_calificacion: esquema1.id, nombre: 'Bimestre IV', orden: 4, id_usuario_registro: 2 },
  });

  // Componentes de nota para esquema 1
  const comp1_EP = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema1.id, nombre_componente: 'Examen Parcial', peso_porcentaje: 20.00, orden: 1, id_usuario_registro: 2 },
  });
  const comp1_EC = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema1.id, nombre_componente: 'Evaluación Continua', peso_porcentaje: 30.00, orden: 2, id_usuario_registro: 2 },
  });
  const comp1_EF = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema1.id, nombre_componente: 'Examen Final', peso_porcentaje: 50.00, orden: 3, id_usuario_registro: 2 },
  });

  // Curso 4 - Letras (manual)
  const esquema2 = await prisma.tbl_esquemas_calificacion.create({
    data: {
      id_docente: 2, id_curso: 4, id_periodo_escolar: 2,
      tipo_calificacion: 'letras',
      modo_nota_final: 'manual',
      id_usuario_registro: 3,
    },
  });

  const pc2_1 = await prisma.tbl_periodos_calificacion.create({
    data: { id_esquema_calificacion: esquema2.id, nombre: 'Bimestre I', orden: 1, id_usuario_registro: 3 },
  });
  const pc2_2 = await prisma.tbl_periodos_calificacion.create({
    data: { id_esquema_calificacion: esquema2.id, nombre: 'Bimestre II', orden: 2, id_usuario_registro: 3 },
  });

  const comp2_OC = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema2.id, nombre_componente: 'Comprensión Oral', peso_porcentaje: 25.00, orden: 1, id_usuario_registro: 3 },
  });
  const comp2_CE = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema2.id, nombre_componente: 'Comprensión Escrita', peso_porcentaje: 25.00, orden: 2, id_usuario_registro: 3 },
  });
  const comp2_PE = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema2.id, nombre_componente: 'Producción Escrita', peso_porcentaje: 25.00, orden: 3, id_usuario_registro: 3 },
  });
  const comp2_PO = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema2.id, nombre_componente: 'Producción Oral', peso_porcentaje: 25.00, orden: 4, id_usuario_registro: 3 },
  });

  // Curso 3 - Numérico (Matemática 4°B)
  const esquema3 = await prisma.tbl_esquemas_calificacion.create({
    data: {
      id_docente: 1, id_curso: 3, id_periodo_escolar: 2,
      tipo_calificacion: 'numerico',
      formula: '(T*0.30)+(PP*0.30)+(EF*0.40)',
      modo_nota_final: 'calculado',
      id_usuario_registro: 2,
    },
  });

  const pc3_1 = await prisma.tbl_periodos_calificacion.create({
    data: { id_esquema_calificacion: esquema3.id, nombre: 'Bimestre I', orden: 1, id_usuario_registro: 2 },
  });

  const comp3_T = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema3.id, nombre_componente: 'Tareas', peso_porcentaje: 30.00, orden: 1, id_usuario_registro: 2 },
  });
  const comp3_PP = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema3.id, nombre_componente: 'Prácticas', peso_porcentaje: 30.00, orden: 2, id_usuario_registro: 2 },
  });
  const comp3_EF = await prisma.tbl_componentes_nota.create({
    data: { id_esquema_calificacion: esquema3.id, nombre_componente: 'Examen Final', peso_porcentaje: 40.00, orden: 3, id_usuario_registro: 2 },
  });

  console.log('✓ Esquemas de calificación creados');

  // =============================================
  // 15. NOTAS - Curso 1 Bimestre I (numérico)
  // =============================================
  const notasB1 = [
    { ep: 16, ec: 18, ef: 17 },
    { ep: 14, ec: 15, ef: 16 },
    { ep: 12, ec: 13, ef: 14 },
    { ep: 19, ec: 20, ef: 18 },
    { ep: 11, ec: 10, ef: 12 },
    { ep: 17, ec: 16, ef: 15 },
    { ep: 13, ec: 14, ef: 16 },
    { ep: 15, ec: 17, ef: 14 },
    { ep: 18, ec: 19, ef: 20 },
    { ep: 10, ec: 11, ef: 13 },
  ];

  for (let i = 0; i < 10; i++) {
    const nota = notasB1[i];
    const notaFinal = (nota.ep * 0.20 + nota.ec * 0.30 + nota.ef * 0.50);
    const cab = await prisma.tbl_notas_cabecera.create({
      data: {
        id_alumno: alumnosD1[i].id, id_curso: 1, id_periodo_escolar: 2,
        id_periodo_calificacion: pc1_1.id, id_esquema_calificacion: esquema1.id,
        nota_final_numerica: parseFloat(notaFinal.toFixed(2)),
        id_usuario_registro: 2,
      },
    });
    await prisma.tbl_notas_detalle.createMany({
      data: [
        { id_nota_cabecera: cab.id, id_componente_nota: comp1_EP.id, valor_numerico: nota.ep, id_usuario_registro: 2 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp1_EC.id, valor_numerico: nota.ec, id_usuario_registro: 2 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp1_EF.id, valor_numerico: nota.ef, id_usuario_registro: 2 },
      ],
    });
  }

  // Notas Bimestre II - parcial (solo 7 alumnos)
  const notasB2 = [
    { ep: 15, ec: 17, ef: 16 },
    { ep: 16, ec: 14, ef: 15 },
    { ep: 13, ec: 15, ef: 14 },
    { ep: 20, ec: 19, ef: 19 },
    { ep: 12, ec: 11, ef: 10 },
    { ep: 18, ec: 17, ef: 16 },
    { ep: 14, ec: 15, ef: 17 },
  ];

  for (let i = 0; i < 7; i++) {
    const nota = notasB2[i];
    const notaFinal = (nota.ep * 0.20 + nota.ec * 0.30 + nota.ef * 0.50);
    const cab = await prisma.tbl_notas_cabecera.create({
      data: {
        id_alumno: alumnosD1[i].id, id_curso: 1, id_periodo_escolar: 2,
        id_periodo_calificacion: pc1_2.id, id_esquema_calificacion: esquema1.id,
        nota_final_numerica: parseFloat(notaFinal.toFixed(2)),
        id_usuario_registro: 2,
      },
    });
    await prisma.tbl_notas_detalle.createMany({
      data: [
        { id_nota_cabecera: cab.id, id_componente_nota: comp1_EP.id, valor_numerico: nota.ep, id_usuario_registro: 2 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp1_EC.id, valor_numerico: nota.ec, id_usuario_registro: 2 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp1_EF.id, valor_numerico: nota.ef, id_usuario_registro: 2 },
      ],
    });
  }

  // Notas Curso 4 - Letras Bimestre I
  const letrasOpciones = ['AD', 'A', 'B', 'C'];
  const notasLetrasB1 = [
    { oc: 'AD', ce: 'A', pe: 'A', po: 'AD', final: 'AD' },
    { oc: 'A', ce: 'A', pe: 'B', po: 'A', final: 'A' },
    { oc: 'B', ce: 'B', pe: 'A', po: 'B', final: 'B' },
    { oc: 'A', ce: 'AD', pe: 'AD', po: 'A', final: 'A' },
    { oc: 'C', ce: 'B', pe: 'C', po: 'B', final: 'C' },
    { oc: 'A', ce: 'A', pe: 'A', po: 'AD', final: 'A' },
    { oc: 'B', ce: 'A', pe: 'B', po: 'A', final: 'B' },
  ];

  for (let i = 0; i < 7; i++) {
    const nota = notasLetrasB1[i];
    const cab = await prisma.tbl_notas_cabecera.create({
      data: {
        id_alumno: alumnosD2[i].id, id_curso: 4, id_periodo_escolar: 2,
        id_periodo_calificacion: pc2_1.id, id_esquema_calificacion: esquema2.id,
        nota_final_letra: nota.final,
        nota_final_manual: true,
        id_usuario_registro: 3,
      },
    });
    await prisma.tbl_notas_detalle.createMany({
      data: [
        { id_nota_cabecera: cab.id, id_componente_nota: comp2_OC.id, valor_letra: nota.oc, id_usuario_registro: 3 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp2_CE.id, valor_letra: nota.ce, id_usuario_registro: 3 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp2_PE.id, valor_letra: nota.pe, id_usuario_registro: 3 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp2_PO.id, valor_letra: nota.po, id_usuario_registro: 3 },
      ],
    });
  }

  // Notas Curso 3 Bimestre I
  const notasC3 = [
    { t: 17, pp: 16, ef: 18 },
    { t: 14, pp: 13, ef: 15 },
    { t: 19, pp: 20, ef: 18 },
    { t: 11, pp: 12, ef: 10 },
    { t: 16, pp: 15, ef: 17 },
  ];

  for (let i = 0; i < 5; i++) {
    const nota = notasC3[i];
    const notaFinal = (nota.t * 0.30 + nota.pp * 0.30 + nota.ef * 0.40);
    const cab = await prisma.tbl_notas_cabecera.create({
      data: {
        id_alumno: alumnosD1[10 + i].id, id_curso: 3, id_periodo_escolar: 2,
        id_periodo_calificacion: pc3_1.id, id_esquema_calificacion: esquema3.id,
        nota_final_numerica: parseFloat(notaFinal.toFixed(2)),
        id_usuario_registro: 2,
      },
    });
    await prisma.tbl_notas_detalle.createMany({
      data: [
        { id_nota_cabecera: cab.id, id_componente_nota: comp3_T.id, valor_numerico: nota.t, id_usuario_registro: 2 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp3_PP.id, valor_numerico: nota.pp, id_usuario_registro: 2 },
        { id_nota_cabecera: cab.id, id_componente_nota: comp3_EF.id, valor_numerico: nota.ef, id_usuario_registro: 2 },
      ],
    });
  }

  console.log('✓ Notas creadas (numéricas y letras)');

  // =============================================
  // 16. ENVÍOS WHATSAPP
  // =============================================
  // Envío 1: exitoso (Curso 1)
  const envio1 = await prisma.tbl_envios_whatsapp.create({
    data: {
      id_curso: 1, id_periodo_escolar: 2,
      estado_envio: ESTADOS_ENVIO_WHATSAPP.ENVIADO,
      tipo_envio: TIPOS_REPORTE_WHATSAPP.REPORTE_GENERAL,
      id_usuario_registro: 2,
    },
  });
  for (let i = 0; i < 10; i++) {
    await prisma.tbl_envios_whatsapp_detalle.create({
      data: {
        id_envio_whatsapp: envio1.id,
        id_alumno: alumnosD1[i].id,
        id_padre: padresD1[i * 2].id,
        telefono: padresD1[i * 2].telefono,
        contenido_mensaje: `Estimado/a padre/madre de ${alumnosD1[i].nombres} ${alumnosD1[i].apellidos}: Le informamos que la nota del Bimestre I en Matemática 3°A es ${notasB1[i].ep * 0.20 + notasB1[i].ec * 0.30 + notasB1[i].ef * 0.50}. Atentamente, Prof. Carlos Ramírez.`,
        estado_envio: i === 4 ? ESTADOS_ENVIO_WHATSAPP.NO_ENVIADO : ESTADOS_ENVIO_WHATSAPP.ENVIADO,
        mensaje_error: i === 4 ? 'Número no registrado en WhatsApp' : null,
        id_usuario_registro: 2,
      },
    });
  }

  // Envío 2: parcial (Curso 4)
  const envio2 = await prisma.tbl_envios_whatsapp.create({
    data: {
      id_curso: 4, id_periodo_escolar: 2,
      estado_envio: ESTADOS_ENVIO_WHATSAPP.ENVIADO,
      tipo_envio: TIPOS_REPORTE_WHATSAPP.REPORTE_GENERAL,
      id_usuario_registro: 3,
    },
  });
  for (let i = 0; i < 7; i++) {
    const padreIdx = i < 5 ? i * 2 : 10 + (i - 5);
    await prisma.tbl_envios_whatsapp_detalle.create({
      data: {
        id_envio_whatsapp: envio2.id,
        id_alumno: alumnosD2[i].id,
        id_padre: padresD2[padreIdx].id,
        telefono: padresD2[padreIdx].telefono,
        contenido_mensaje: `Estimado/a apoderado/a de ${alumnosD2[i].nombres} ${alumnosD2[i].apellidos}: La nota del Bimestre I en Comunicación 3°A es ${notasLetrasB1[i].final}. Atentamente, Prof. María López.`,
        estado_envio: ESTADOS_ENVIO_WHATSAPP.ENVIADO,
        id_usuario_registro: 3,
      },
    });
  }
  console.log('✓ Envíos WhatsApp creados');

  // =============================================
  // 17. TRIVIA - TEMAS Y PREGUNTAS
  // =============================================
  // Tema 1: Docente 1 - Aritmética
  const tema1 = await prisma.tbl_trivia_temas.create({
    data: { id_docente: 1, nombre: 'Aritmética Básica', descripcion: 'Operaciones fundamentales con números naturales y enteros', id_usuario_registro: 2 },
  });

  const preguntasT1 = [
    { texto: '¿Cuánto es 25 × 4?', opciones: [{ t: '80', c: false }, { t: '100', c: true }, { t: '90', c: false }, { t: '120', c: false }] },
    { texto: '¿Cuál es el resultado de 144 ÷ 12?', opciones: [{ t: '11', c: false }, { t: '13', c: false }, { t: '12', c: true }, { t: '14', c: false }] },
    { texto: '¿Cuánto es 3² + 4²?', opciones: [{ t: '25', c: true }, { t: '24', c: false }, { t: '49', c: false }, { t: '7', c: false }] },
    { texto: '¿Cuál es el MCD de 12 y 18?', opciones: [{ t: '3', c: false }, { t: '6', c: true }, { t: '9', c: false }, { t: '12', c: false }] },
    { texto: '¿Cuánto es √81?', opciones: [{ t: '7', c: false }, { t: '8', c: false }, { t: '9', c: true }, { t: '10', c: false }] },
    { texto: '¿Cuál es el MCM de 4 y 6?', opciones: [{ t: '24', c: false }, { t: '12', c: true }, { t: '18', c: false }, { t: '6', c: false }] },
    { texto: 'Si x + 7 = 15, ¿cuánto vale x?', opciones: [{ t: '7', c: false }, { t: '22', c: false }, { t: '8', c: true }, { t: '9', c: false }] },
    { texto: '¿Cuántos minutos tiene una hora y media?', opciones: [{ t: '80', c: false }, { t: '90', c: true }, { t: '75', c: false }, { t: '100', c: false }] },
    { texto: '¿Cuál es el 30% de 200?', opciones: [{ t: '50', c: false }, { t: '60', c: true }, { t: '70', c: false }, { t: '40', c: false }] },
    { texto: '¿Cuánto es (-5) + (-8)?', opciones: [{ t: '-3', c: false }, { t: '13', c: false }, { t: '-13', c: true }, { t: '3', c: false }] },
    { texto: '¿Qué fracción es equivalente a 0.75?', opciones: [{ t: '1/2', c: false }, { t: '3/4', c: true }, { t: '2/3', c: false }, { t: '4/5', c: false }] },
    { texto: '¿Cuánto es 2³?', opciones: [{ t: '6', c: false }, { t: '8', c: true }, { t: '9', c: false }, { t: '16', c: false }] },
  ];

  for (const p of preguntasT1) {
    const preg = await prisma.tbl_trivia_preguntas.create({
      data: { id_tema: tema1.id, texto_pregunta: p.texto, id_usuario_registro: 2 },
    });
    await prisma.tbl_trivia_opciones.createMany({
      data: p.opciones.map((o, idx) => ({
        id_pregunta: preg.id, texto_opcion: o.t, es_correcta: o.c, orden: idx + 1, id_usuario_registro: 2,
      })),
    });
  }

  // Tema 2: Docente 1 - Geometría
  const tema2 = await prisma.tbl_trivia_temas.create({
    data: { id_docente: 1, nombre: 'Geometría Fundamental', descripcion: 'Figuras geométricas, áreas y perímetros', id_usuario_registro: 2 },
  });

  const preguntasT2 = [
    { texto: '¿Cuántos lados tiene un hexágono?', opciones: [{ t: '5', c: false }, { t: '6', c: true }, { t: '7', c: false }, { t: '8', c: false }] },
    { texto: '¿Cuál es el área de un cuadrado de lado 5 cm?', opciones: [{ t: '20 cm²', c: false }, { t: '25 cm²', c: true }, { t: '10 cm²', c: false }, { t: '15 cm²', c: false }] },
    { texto: '¿Cuánto suman los ángulos internos de un triángulo?', opciones: [{ t: '180°', c: true }, { t: '360°', c: false }, { t: '90°', c: false }, { t: '270°', c: false }] },
    { texto: '¿Cómo se llama un triángulo con todos los lados iguales?', opciones: [{ t: 'Isósceles', c: false }, { t: 'Escaleno', c: false }, { t: 'Equilátero', c: true }, { t: 'Rectángulo', c: false }] },
    { texto: '¿Cuál es el perímetro de un rectángulo de 8cm × 5cm?', opciones: [{ t: '26 cm', c: true }, { t: '40 cm', c: false }, { t: '13 cm', c: false }, { t: '30 cm', c: false }] },
    { texto: 'El diámetro de un círculo es 10 cm. ¿Cuál es su radio?', opciones: [{ t: '5 cm', c: true }, { t: '10 cm', c: false }, { t: '20 cm', c: false }, { t: '2.5 cm', c: false }] },
    { texto: '¿Cuántas caras tiene un cubo?', opciones: [{ t: '4', c: false }, { t: '8', c: false }, { t: '6', c: true }, { t: '12', c: false }] },
    { texto: '¿Cómo se llama un polígono de 4 lados?', opciones: [{ t: 'Pentágono', c: false }, { t: 'Cuadrilátero', c: true }, { t: 'Hexágono', c: false }, { t: 'Triángulo', c: false }] },
    { texto: '¿Cuál es el área de un triángulo con base 10 y altura 6?', opciones: [{ t: '60', c: false }, { t: '30', c: true }, { t: '16', c: false }, { t: '36', c: false }] },
    { texto: 'Un ángulo recto mide:', opciones: [{ t: '45°', c: false }, { t: '60°', c: false }, { t: '90°', c: true }, { t: '180°', c: false }] },
  ];

  for (const p of preguntasT2) {
    const preg = await prisma.tbl_trivia_preguntas.create({
      data: { id_tema: tema2.id, texto_pregunta: p.texto, id_usuario_registro: 2 },
    });
    await prisma.tbl_trivia_opciones.createMany({
      data: p.opciones.map((o, idx) => ({
        id_pregunta: preg.id, texto_opcion: o.t, es_correcta: o.c, orden: idx + 1, id_usuario_registro: 2,
      })),
    });
  }

  // Tema 3: Docente 2 - Comprensión Lectora
  const tema3 = await prisma.tbl_trivia_temas.create({
    data: { id_docente: 2, nombre: 'Comprensión Lectora', descripcion: 'Vocabulario, sinónimos, antónimos y comprensión de textos', id_usuario_registro: 3 },
  });

  const preguntasT3 = [
    { texto: '¿Cuál es el sinónimo de "efímero"?', opciones: [{ t: 'Eterno', c: false }, { t: 'Pasajero', c: true }, { t: 'Fuerte', c: false }, { t: 'Luminoso', c: false }] },
    { texto: '¿Cuál es el antónimo de "benévolo"?', opciones: [{ t: 'Generoso', c: false }, { t: 'Amable', c: false }, { t: 'Malévolo', c: true }, { t: 'Sincero', c: false }] },
    { texto: '¿Qué figura literaria es "sus ojos eran dos luceros"?', opciones: [{ t: 'Símil', c: false }, { t: 'Metáfora', c: true }, { t: 'Hipérbole', c: false }, { t: 'Anáfora', c: false }] },
    { texto: '¿Cuál es el sujeto en "Los niños juegan en el parque"?', opciones: [{ t: 'juegan', c: false }, { t: 'en el parque', c: false }, { t: 'Los niños', c: true }, { t: 'el parque', c: false }] },
    { texto: '¿Qué tipo de palabra es "rápidamente"?', opciones: [{ t: 'Adjetivo', c: false }, { t: 'Sustantivo', c: false }, { t: 'Adverbio', c: true }, { t: 'Verbo', c: false }] },
    { texto: '¿Cuántas sílabas tiene la palabra "murciélago"?', opciones: [{ t: '3', c: false }, { t: '4', c: false }, { t: '5', c: true }, { t: '6', c: false }] },
    { texto: '¿Qué signo se usa para indicar una pregunta?', opciones: [{ t: '¡!', c: false }, { t: '¿?', c: true }, { t: '"comillas"', c: false }, { t: '( )', c: false }] },
    { texto: '"Había una vez" es un inicio típico de:', opciones: [{ t: 'Noticia', c: false }, { t: 'Poema', c: false }, { t: 'Cuento', c: true }, { t: 'Carta', c: false }] },
    { texto: '¿Cuál es el plural de "lápiz"?', opciones: [{ t: 'Lápizes', c: false }, { t: 'Lápices', c: true }, { t: 'Lápizs', c: false }, { t: 'Lápis', c: false }] },
    { texto: '¿Qué tipo de texto da instrucciones paso a paso?', opciones: [{ t: 'Narrativo', c: false }, { t: 'Descriptivo', c: false }, { t: 'Instructivo', c: true }, { t: 'Argumentativo', c: false }] },
    { texto: '¿Cuál es el verbo en "María canta una canción"?', opciones: [{ t: 'María', c: false }, { t: 'canción', c: false }, { t: 'una', c: false }, { t: 'canta', c: true }] },
    { texto: '¿Qué es una onomatopeya?', opciones: [{ t: 'Una comparación', c: false }, { t: 'La imitación de un sonido', c: true }, { t: 'Una exageración', c: false }, { t: 'Un diálogo', c: false }] },
  ];

  for (const p of preguntasT3) {
    const preg = await prisma.tbl_trivia_preguntas.create({
      data: { id_tema: tema3.id, texto_pregunta: p.texto, id_usuario_registro: 3 },
    });
    await prisma.tbl_trivia_opciones.createMany({
      data: p.opciones.map((o, idx) => ({
        id_pregunta: preg.id, texto_opcion: o.t, es_correcta: o.c, orden: idx + 1, id_usuario_registro: 3,
      })),
    });
  }

  // Tema inactivo
  await prisma.tbl_trivia_temas.create({
    data: { id_docente: 1, nombre: 'Álgebra (descontinuado)', descripcion: 'Tema antiguo', id_usuario_registro: 2, estado: 0 },
  });

  console.log('✓ Temas y preguntas de trivia creados');

  // =============================================
  // 18. TRIVIA PARTIDAS EN TODOS LOS ESTADOS
  // =============================================
  const preguntasTema1 = await prisma.tbl_trivia_preguntas.findMany({
    where: { id_tema: tema1.id, estado: 1 },
    include: { tbl_trivia_opciones: true },
    orderBy: { id: 'asc' },
  });
  const preguntasTema2 = await prisma.tbl_trivia_preguntas.findMany({
    where: { id_tema: tema2.id, estado: 1 },
    include: { tbl_trivia_opciones: true },
    orderBy: { id: 'asc' },
  });
  const preguntasTema3 = await prisma.tbl_trivia_preguntas.findMany({
    where: { id_tema: tema3.id, estado: 1 },
    include: { tbl_trivia_opciones: true },
    orderBy: { id: 'asc' },
  });

  // --- PARTIDA 1: FINALIZADA, Individual, Docente 1, Curso 1 ---
  const partida1 = await prisma.tbl_trivia_partidas.create({
    data: {
      id_docente: 1, id_curso: 1, id_periodo_escolar: 2, id_tema: tema1.id,
      modalidad: 'individual', cantidad_preguntas: 5, tiempo_por_pregunta: 20,
      puntaje_correcto: 1.20, puntaje_incorrecto: -0.40,
      estado_partida: 'finalizada', modo_ganador: 'unico',
      fecha_hora_inicio: limaDateTime('2026-03-10', '14:00:00'),
      fecha_hora_fin: limaDateTime('2026-03-10', '14:12:00'),
      id_usuario_registro: 2,
    },
  });

  // 5 preguntas para partida 1
  const pp1 = [];
  for (let i = 0; i < 5; i++) {
    const pp = await prisma.tbl_trivia_partidas_preguntas.create({
      data: { id_partida: partida1.id, id_pregunta: preguntasTema1[i].id, orden: i + 1 },
    });
    pp1.push(pp);
  }

  // 10 participantes individuales
  const participantes1 = [];
  const puntajesPartida1 = [4.40, 3.20, 2.80, 6.00, 1.60, 4.80, 3.60, 2.00, 5.20, 2.40];
  for (let i = 0; i < 10; i++) {
    const part = await prisma.tbl_trivia_participantes.create({
      data: {
        id_partida: partida1.id,
        tipo_participante: 'alumno',
        id_alumno: alumnosD1[i].id,
        etiqueta_participante: `${alumnosD1[i].apellidos}, ${alumnosD1[i].nombres}`,
        puntaje_final: puntajesPartida1[i],
        es_ganador: i === 3, // DIEGO... con 6.00 es ganador
        id_usuario_registro: 2,
      },
    });
    participantes1.push(part);
  }

  // Respuestas para partida 1 (simuladas)
  const respuestasP1 = [
    // correctas por participante: [4,3,3,5,2,4,3,2,5,2]
    [true, true, false, true, true, false],
    [true, false, true, true, false, false],
    [true, true, false, true, false, false],
    [true, true, true, true, true, false],
    [false, true, false, true, false, false],
    [true, true, true, false, true, false],
    [true, false, true, true, false, false],
    [false, true, false, true, false, false],
    [true, true, true, true, true, false],
    [true, false, false, true, false, false],
  ];

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 5; j++) {
      const esCorrecta = respuestasP1[i][j];
      const opciones = preguntasTema1[j].tbl_trivia_opciones;
      const opcionSel = esCorrecta ? opciones.find(o => o.es_correcta) : opciones.find(o => !o.es_correcta);
      await prisma.tbl_trivia_respuestas.create({
        data: {
          id_partida_pregunta: pp1[j].id,
          id_participante: participantes1[i].id,
          id_opcion_seleccionada: opcionSel.id,
          es_correcta: esCorrecta,
          delta_puntaje: esCorrecta ? 1.20 : -0.40,
          fecha_hora_respuesta: limaDateTime('2026-03-10', `14:0${j + 1}:${(i * 2).toString().padStart(2, '0')}`),
        },
      });
    }
  }

  // --- PARTIDA 2: FINALIZADA, Parejas, Docente 1, Curso 1 ---
  const partida2 = await prisma.tbl_trivia_partidas.create({
    data: {
      id_docente: 1, id_curso: 1, id_periodo_escolar: 2, id_tema: tema2.id,
      modalidad: 'parejas', cantidad_preguntas: 5, tiempo_por_pregunta: 20,
      puntaje_correcto: 1.20, puntaje_incorrecto: -0.40,
      estado_partida: 'finalizada', modo_ganador: 'multiple',
      fecha_hora_inicio: limaDateTime('2026-03-12', '10:00:00'),
      fecha_hora_fin: limaDateTime('2026-03-12', '10:10:00'),
      id_usuario_registro: 2,
    },
  });

  const pp2 = [];
  for (let i = 0; i < 5; i++) {
    const pp = await prisma.tbl_trivia_partidas_preguntas.create({
      data: { id_partida: partida2.id, id_pregunta: preguntasTema2[i].id, orden: i + 1 },
    });
    pp2.push(pp);
  }

  // 5 parejas (10 alumnos → 2 por pareja)
  const puntajesParejas = [4.00, 4.00, 3.20, 3.20, 5.20, 5.20, 2.00, 2.00, 4.00, 4.00];
  const participantes2 = [];
  for (let i = 0; i < 10; i++) {
    const numEquipo = Math.floor(i / 2) + 1;
    const esGanador = numEquipo === 3; // Pareja 3 ganadora
    const part = await prisma.tbl_trivia_participantes.create({
      data: {
        id_partida: partida2.id,
        tipo_participante: 'alumno',
        id_alumno: alumnosD1[i].id,
        etiqueta_participante: `${alumnosD1[i].apellidos}, ${alumnosD1[i].nombres}`,
        numero_equipo: numEquipo,
        puntaje_final: puntajesParejas[i],
        es_ganador: esGanador,
        id_usuario_registro: 2,
      },
    });
    participantes2.push(part);
  }

  // Respuestas simplificadas para partida 2
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 5; j++) {
      const esCorrecta = (i + j) % 3 !== 0;
      const opciones = preguntasTema2[j].tbl_trivia_opciones;
      const opcionSel = esCorrecta ? opciones.find(o => o.es_correcta) : opciones.find(o => !o.es_correcta);
      await prisma.tbl_trivia_respuestas.create({
        data: {
          id_partida_pregunta: pp2[j].id,
          id_participante: participantes2[i].id,
          id_opcion_seleccionada: opcionSel.id,
          es_correcta: esCorrecta,
          delta_puntaje: esCorrecta ? 1.20 : -0.40,
          fecha_hora_respuesta: limaDateTime('2026-03-12', `10:0${j + 1}:${(i * 3).toString().padStart(2, '0')}`),
        },
      });
    }
  }

  // --- PARTIDA 3: EN_PROGRESO, Individual, Docente 1, Curso 2 ---
  const partida3 = await prisma.tbl_trivia_partidas.create({
    data: {
      id_docente: 1, id_curso: 2, id_periodo_escolar: 2, id_tema: tema1.id,
      modalidad: 'individual', cantidad_preguntas: 8, tiempo_por_pregunta: 20,
      puntaje_correcto: 1.20, puntaje_incorrecto: -0.40,
      estado_partida: 'en_progreso',
      fecha_hora_inicio: limaDateTime('2026-03-18', '09:00:00'),
      id_usuario_registro: 2,
    },
  });

  const pp3 = [];
  for (let i = 0; i < 8; i++) {
    const pp = await prisma.tbl_trivia_partidas_preguntas.create({
      data: { id_partida: partida3.id, id_pregunta: preguntasTema1[i].id, orden: i + 1 },
    });
    pp3.push(pp);
  }

  // 10 participantes, solo 3 preguntas respondidas
  for (let i = 0; i < 10; i++) {
    const part = await prisma.tbl_trivia_participantes.create({
      data: {
        id_partida: partida3.id,
        tipo_participante: 'alumno',
        id_alumno: alumnosD1[i].id,
        etiqueta_participante: `${alumnosD1[i].apellidos}, ${alumnosD1[i].nombres}`,
        puntaje_final: 0,
        id_usuario_registro: 2,
      },
    });

    // Solo 3 preguntas respondidas por cada uno
    for (let j = 0; j < 3; j++) {
      const esCorrecta = (i + j) % 2 === 0;
      const opciones = preguntasTema1[j].tbl_trivia_opciones;
      const opcionSel = esCorrecta ? opciones.find(o => o.es_correcta) : opciones.find(o => !o.es_correcta);
      await prisma.tbl_trivia_respuestas.create({
        data: {
          id_partida_pregunta: pp3[j].id,
          id_participante: part.id,
          id_opcion_seleccionada: opcionSel.id,
          es_correcta: esCorrecta,
          delta_puntaje: esCorrecta ? 1.20 : -0.40,
          fecha_hora_respuesta: limaDateTime('2026-03-18', `09:0${j + 1}:${(i * 2).toString().padStart(2, '0')}`),
        },
      });
    }
  }

  // --- PARTIDA 4: PREPARADA (sin iniciar), Docente 1, Curso 3 ---
  const partida4 = await prisma.tbl_trivia_partidas.create({
    data: {
      id_docente: 1, id_curso: 3, id_periodo_escolar: 2, id_tema: tema2.id,
      modalidad: 'grupos', cantidad_grupos: 3, cantidad_preguntas: 10, tiempo_por_pregunta: 20,
      puntaje_correcto: 1.20, puntaje_incorrecto: -0.40,
      estado_partida: 'preparada',
      id_usuario_registro: 2,
    },
  });

  // Preguntas asignadas pero sin participantes ni respuestas
  for (let i = 0; i < 10; i++) {
    await prisma.tbl_trivia_partidas_preguntas.create({
      data: { id_partida: partida4.id, id_pregunta: preguntasTema2[i].id, orden: i + 1 },
    });
  }

  // --- PARTIDA 5: CANCELADA, Docente 1 ---
  await prisma.tbl_trivia_partidas.create({
    data: {
      id_docente: 1, id_curso: 1, id_periodo_escolar: 2, id_tema: tema1.id,
      modalidad: 'individual', cantidad_preguntas: 5, tiempo_por_pregunta: 20,
      puntaje_correcto: 1.20, puntaje_incorrecto: -0.40,
      estado_partida: 'cancelada',
      fecha_hora_inicio: limaDateTime('2026-03-11', '15:00:00'),
      fecha_hora_fin: limaDateTime('2026-03-11', '15:02:00'),
      id_usuario_registro: 2,
    },
  });

  // --- PARTIDA 6: FINALIZADA, Docente 2, Curso 4, Individual ---
  const partida6 = await prisma.tbl_trivia_partidas.create({
    data: {
      id_docente: 2, id_curso: 4, id_periodo_escolar: 2, id_tema: tema3.id,
      modalidad: 'individual', cantidad_preguntas: 6, tiempo_por_pregunta: 20,
      puntaje_correcto: 1.20, puntaje_incorrecto: -0.40,
      estado_partida: 'finalizada', modo_ganador: 'unico',
      fecha_hora_inicio: limaDateTime('2026-03-13', '11:00:00'),
      fecha_hora_fin: limaDateTime('2026-03-13', '11:15:00'),
      id_usuario_registro: 3,
    },
  });

  const pp6 = [];
  for (let i = 0; i < 6; i++) {
    const pp = await prisma.tbl_trivia_partidas_preguntas.create({
      data: { id_partida: partida6.id, id_pregunta: preguntasTema3[i].id, orden: i + 1 },
    });
    pp6.push(pp);
  }

  const puntajesP6 = [5.20, 3.60, 4.80, 2.40, 6.00, 4.00, 3.20];
  for (let i = 0; i < 7; i++) {
    const part = await prisma.tbl_trivia_participantes.create({
      data: {
        id_partida: partida6.id,
        tipo_participante: 'alumno',
        id_alumno: alumnosD2[i].id,
        etiqueta_participante: `${alumnosD2[i].apellidos}, ${alumnosD2[i].nombres}`,
        puntaje_final: puntajesP6[i],
        es_ganador: i === 4,
        id_usuario_registro: 3,
      },
    });

    for (let j = 0; j < 6; j++) {
      const esCorrecta = (i * 3 + j) % 4 !== 0;
      const opciones = preguntasTema3[j].tbl_trivia_opciones;
      const opcionSel = esCorrecta ? opciones.find(o => o.es_correcta) : opciones.find(o => !o.es_correcta);
      await prisma.tbl_trivia_respuestas.create({
        data: {
          id_partida_pregunta: pp6[j].id,
          id_participante: part.id,
          id_opcion_seleccionada: opcionSel ? opcionSel.id : null,
          es_correcta: esCorrecta,
          delta_puntaje: esCorrecta ? 1.20 : -0.40,
          fecha_hora_respuesta: limaDateTime('2026-03-13', `11:0${j + 2}:${(i * 4).toString().padStart(2, '0')}`),
        },
      });
    }
  }

  // --- PARTIDA 7: FINALIZADA, Grupos, Docente 2, Curso 5 ---
  const partida7 = await prisma.tbl_trivia_partidas.create({
    data: {
      id_docente: 2, id_curso: 5, id_periodo_escolar: 2, id_tema: tema3.id,
      modalidad: 'grupos', cantidad_grupos: 2, cantidad_preguntas: 5, tiempo_por_pregunta: 20,
      puntaje_correcto: 1.20, puntaje_incorrecto: -0.40,
      estado_partida: 'finalizada', modo_ganador: 'unico',
      fecha_hora_inicio: limaDateTime('2026-03-16', '09:30:00'),
      fecha_hora_fin: limaDateTime('2026-03-16', '09:42:00'),
      id_usuario_registro: 3,
    },
  });

  const pp7 = [];
  for (let i = 0; i < 5; i++) {
    const pp = await prisma.tbl_trivia_partidas_preguntas.create({
      data: { id_partida: partida7.id, id_pregunta: preguntasTema3[i + 5].id, orden: i + 1 },
    });
    pp7.push(pp);
  }

  // alumnosD2[7..11] → 5 alumnos en 2 grupos
  const puntajesP7 = [3.60, 4.80, 3.60, 2.40, 4.80];
  for (let i = 0; i < 5; i++) {
    const numEquipo = i < 3 ? 1 : 2;
    const part = await prisma.tbl_trivia_participantes.create({
      data: {
        id_partida: partida7.id,
        tipo_participante: 'alumno',
        id_alumno: alumnosD2[7 + i].id,
        etiqueta_participante: `${alumnosD2[7 + i].apellidos}, ${alumnosD2[7 + i].nombres}`,
        numero_equipo: numEquipo,
        puntaje_final: puntajesP7[i],
        es_ganador: numEquipo === 1,
        id_usuario_registro: 3,
      },
    });

    for (let j = 0; j < 5; j++) {
      const esCorrecta = (i + j) % 2 === 0;
      const opciones = preguntasTema3[j + 5].tbl_trivia_opciones;
      const opcionSel = esCorrecta ? opciones.find(o => o.es_correcta) : opciones.find(o => !o.es_correcta);
      await prisma.tbl_trivia_respuestas.create({
        data: {
          id_partida_pregunta: pp7[j].id,
          id_participante: part.id,
          id_opcion_seleccionada: opcionSel ? opcionSel.id : null,
          es_correcta: esCorrecta,
          delta_puntaje: esCorrecta ? 1.20 : -0.40,
          fecha_hora_respuesta: limaDateTime('2026-03-16', `09:3${j + 2}:${(i * 5).toString().padStart(2, '0')}`),
        },
      });
    }
  }

  console.log('✓ Partidas de trivia creadas (todos los estados)');

  // =============================================
  // 19. AUDITORÍA
  // =============================================
  const auditoriaData = [
    { id_usuario: 1, nombre_entidad: 'tbl_usuarios', id_entidad: 1, tipo_accion: 'login', datos_nuevos: { correo: 'admin@colegiojose.edu.pe' } },
    { id_usuario: 2, nombre_entidad: 'tbl_usuarios', id_entidad: 2, tipo_accion: 'login', datos_nuevos: { correo: 'carlos.ramirez@colegiojose.edu.pe' } },
    { id_usuario: 3, nombre_entidad: 'tbl_usuarios', id_entidad: 3, tipo_accion: 'login', datos_nuevos: { correo: 'maria.lopez@colegiojose.edu.pe' } },
    { id_usuario: 2, nombre_entidad: 'tbl_cursos', id_entidad: 1, tipo_accion: 'crear', datos_nuevos: { nombre: 'Matemática', grado: '3°', seccion: 'A' } },
    { id_usuario: 2, nombre_entidad: 'tbl_cursos', id_entidad: 2, tipo_accion: 'crear', datos_nuevos: { nombre: 'Razonamiento Matemático', grado: '3°', seccion: 'A' } },
    { id_usuario: 2, nombre_entidad: 'tbl_alumnos', id_entidad: 1, tipo_accion: 'crear', datos_nuevos: { nombres: 'JUAN PABLO', apellidos: 'GARCIA MENDOZA' } },
    { id_usuario: 2, nombre_entidad: 'tbl_sesiones_asistencia', id_entidad: 1, tipo_accion: 'crear', datos_nuevos: { curso: 'Matemática 3°A', fecha: '2026-03-09' } },
    { id_usuario: 2, nombre_entidad: 'tbl_notas_cabecera', id_entidad: 1, tipo_accion: 'crear', datos_nuevos: { alumno: 'GARCIA MENDOZA, JUAN PABLO', nota_final: 17.10 } },
    { id_usuario: 2, nombre_entidad: 'tbl_trivia_temas', id_entidad: 1, tipo_accion: 'crear', datos_nuevos: { nombre: 'Aritmética Básica' } },
    { id_usuario: 2, nombre_entidad: 'tbl_trivia_partidas', id_entidad: 1, tipo_accion: 'crear', datos_nuevos: { tema: 'Aritmética Básica', modalidad: 'individual', curso: 'Matemática 3°A' } },
    { id_usuario: 2, nombre_entidad: 'tbl_trivia_partidas', id_entidad: 1, tipo_accion: 'actualizar', datos_anteriores: { estado_partida: 'preparada' }, datos_nuevos: { estado_partida: 'en_progreso' } },
    { id_usuario: 2, nombre_entidad: 'tbl_trivia_partidas', id_entidad: 1, tipo_accion: 'actualizar', datos_anteriores: { estado_partida: 'en_progreso' }, datos_nuevos: { estado_partida: 'finalizada' } },
    { id_usuario: 3, nombre_entidad: 'tbl_cursos', id_entidad: 4, tipo_accion: 'crear', datos_nuevos: { nombre: 'Comunicación', grado: '3°', seccion: 'A' } },
    { id_usuario: 3, nombre_entidad: 'tbl_trivia_partidas', id_entidad: 6, tipo_accion: 'crear', datos_nuevos: { tema: 'Comprensión Lectora', modalidad: 'individual' } },
    { id_usuario: 3, nombre_entidad: 'tbl_trivia_partidas', id_entidad: 6, tipo_accion: 'actualizar', datos_anteriores: { estado_partida: 'en_progreso' }, datos_nuevos: { estado_partida: 'finalizada' } },
    { id_usuario: 2, nombre_entidad: 'tbl_envios_whatsapp', id_entidad: 1, tipo_accion: 'enviar', datos_nuevos: { curso: 'Matemática 3°A', total_destinatarios: 10 } },
    { id_usuario: 3, nombre_entidad: 'tbl_envios_whatsapp', id_entidad: 2, tipo_accion: 'enviar', datos_nuevos: { curso: 'Comunicación 3°A', total_destinatarios: 7 } },
    { id_usuario: 1, nombre_entidad: 'tbl_configuracion_sistema', id_entidad: 1, tipo_accion: 'actualizar', datos_nuevos: { nombre_sistema: 'Colegio Jose' } },
    { id_usuario: 2, nombre_entidad: 'tbl_trivia_partidas', id_entidad: 5, tipo_accion: 'actualizar', datos_anteriores: { estado_partida: 'en_progreso' }, datos_nuevos: { estado_partida: 'cancelada' } },
    { id_usuario: 2, nombre_entidad: 'tbl_esquemas_calificacion', id_entidad: 1, tipo_accion: 'crear', datos_nuevos: { tipo: 'numerico', formula: '(EP*0.20)+(EC*0.30)+(EF*0.50)' } },
  ];

  await prisma.tbl_auditoria.createMany({ data: auditoriaData });
  console.log('✓ Registros de auditoría creados');

  // =============================================
  // BIBLIOTECA DIGITAL
  // =============================================
  await prisma.tbl_biblioteca_categorias.createMany({
    data: [
      { nombre: 'Material de Clase', descripcion: 'Documentos y recursos para las clases', icono: 'HiBookOpen', color: '#3B82F6', orden: 1, id_usuario_registro: 1 },
      { nombre: 'Reglamentos', descripcion: 'Reglamentos internos y normas del colegio', icono: 'HiDocumentText', color: '#EF4444', orden: 2, id_usuario_registro: 1 },
      { nombre: 'Guias de Estudio', descripcion: 'Guias y manuales de estudio', icono: 'HiAcademicCap', color: '#10B981', orden: 3, id_usuario_registro: 1 },
      { nombre: 'Comunicados', descripcion: 'Comunicados oficiales del colegio', icono: 'HiSpeakerphone', color: '#F59E0B', orden: 4, id_usuario_registro: 1 },
    ],
    skipDuplicates: true,
  });
  console.log('✓ Categorias de biblioteca creadas');

  // =============================================
  // RESUMEN
  // =============================================
  console.log('\n========================================');
  console.log('SEED COMPLETADO EXITOSAMENTE');
  console.log('========================================');
  console.log('Credenciales:');
  console.log('  Admin:   admin@colegiojose.edu.pe / admin123');
  console.log('  Docente: carlos.ramirez@colegiojose.edu.pe / docente123');
  console.log('  Docente: maria.lopez@colegiojose.edu.pe / docente123');
  console.log('========================================');
  console.log('Datos creados:');
  console.log('  - 2 roles, 29 permisos');
  console.log('  - 3 usuarios (1 admin + 2 docentes)');
  console.log('  - 7 cursos (3 docente 1 + 3 docente 2 + 1 inactivo)');
  console.log('  - 27 alumnos (15 + 12) con carnets y QR');
  console.log('  - 37 padres con relaciones familiares');
  console.log('  - 12 sesiones de asistencia con registros completos');
  console.log('  - 3 esquemas calificación (2 numéricos + 1 letras)');
  console.log('  - Notas completas en 3 cursos (Bimestres I y II)');
  console.log('  - 2 envíos WhatsApp con detalles');
  console.log('  - 4 temas trivia (34 preguntas con opciones)');
  console.log('  - 7 partidas trivia: 3 finalizadas, 1 en progreso, 1 preparada, 1 cancelada, 1 grupos');
  console.log('  - 20 registros de auditoría');
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
