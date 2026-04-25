-- ============================================================
-- MIGRACIÓN INICIAL CONSOLIDADA - Colegio Jose
-- Homologada 100% con schema.prisma (38 modelos)
-- ============================================================

-- =============================================
-- CAPA 1: SEGURIDAD Y ADMINISTRACIÓN
-- =============================================

CREATE TABLE "tbl_roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_permisos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(50) NOT NULL,
    "recurso" VARCHAR(150),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_permisos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_roles_permisos" (
    "id" SERIAL NOT NULL,
    "id_rol" INTEGER,
    "id_permiso" INTEGER,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_roles_permisos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_usuarios" (
    "id" SERIAL NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100),
    "correo" VARCHAR(150) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "celular" VARCHAR(20),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_perfiles_docente" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "especialidad" VARCHAR(100),
    "telefono" VARCHAR(20),
    "foto_url" VARCHAR(500),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_perfiles_docente_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_configuracion_sistema" (
    "id" SERIAL NOT NULL,
    "nombre_sistema" VARCHAR(200) NOT NULL,
    "color_primario" VARCHAR(20) NOT NULL,
    "color_secundario" VARCHAR(20) NOT NULL,
    "color_acento" VARCHAR(20),
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_configuracion_sistema_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_activos_marca" (
    "id" SERIAL NOT NULL,
    "tipo_activo" VARCHAR(50) NOT NULL,
    "url_archivo" TEXT NOT NULL,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_activos_marca_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 2: ESTRUCTURA ACADÉMICA
-- =============================================

CREATE TABLE "tbl_periodos_escolares" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "anio" INTEGER,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_periodos_escolares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_cursos" (
    "id" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_periodo_escolar" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "grado" VARCHAR(20),
    "seccion" VARCHAR(20),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_cursos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_alumnos" (
    "id" SERIAL NOT NULL,
    "id_docente" INTEGER,
    "id_usuario" INTEGER,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "dni" VARCHAR(20),
    "fecha_nacimiento" DATE,
    "genero" VARCHAR(20),
    "direccion" TEXT,
    "foto_url" TEXT,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_alumnos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_alumnos_cursos" (
    "id" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "fecha_retiro" TIMESTAMPTZ(6),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_alumnos_cursos_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 3: CARNETS Y QR
-- =============================================

CREATE TABLE "tbl_carnets_alumnos" (
    "id" SERIAL NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "codigo_carnet" VARCHAR(100) NOT NULL,
    "url_archivo_carnet" TEXT,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_registro" INTEGER,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_carnets_alumnos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_qr_alumnos" (
    "id" SERIAL NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "valor_qr" VARCHAR(200) NOT NULL,
    "url_archivo_qr" TEXT,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_registro" INTEGER,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_qr_alumnos_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 3: RELACIÓN FAMILIAR/CONTACTO
-- =============================================

CREATE TABLE "tbl_padres" (
    "id" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(150),
    "es_contacto_principal" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_padres_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_padres_alumnos" (
    "id" SERIAL NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "id_padre" INTEGER NOT NULL,
    "parentesco" VARCHAR(50),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_padres_alumnos_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 4: ASISTENCIA
-- =============================================

CREATE TABLE "tbl_sesiones_asistencia" (
    "id" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_periodo_escolar" INTEGER NOT NULL,
    "fecha_asistencia" DATE NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_sesiones_asistencia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_registros_asistencia" (
    "id" SERIAL NOT NULL,
    "id_sesion_asistencia" INTEGER NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "estado_asistencia" VARCHAR(20) NOT NULL,
    "modo_registro" VARCHAR(20) NOT NULL,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_registro" INTEGER,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_registros_asistencia_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 5: CALIFICACIONES
-- =============================================

CREATE TABLE "tbl_esquemas_calificacion" (
    "id" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_periodo_escolar" INTEGER NOT NULL,
    "tipo_calificacion" VARCHAR(20) NOT NULL,
    "escala_letras" TEXT,
    "formula" TEXT,
    "modo_nota_final" VARCHAR(20) NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_esquemas_calificacion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_periodos_calificacion" (
    "id" SERIAL NOT NULL,
    "id_esquema_calificacion" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "orden" INTEGER NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_periodos_calificacion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_componentes_nota" (
    "id" SERIAL NOT NULL,
    "id_esquema_calificacion" INTEGER NOT NULL,
    "nombre_componente" VARCHAR(100) NOT NULL,
    "peso_porcentaje" DECIMAL(5,2),
    "orden" INTEGER NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_componentes_nota_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_notas_cabecera" (
    "id" SERIAL NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_periodo_escolar" INTEGER NOT NULL,
    "id_periodo_calificacion" INTEGER NOT NULL,
    "id_esquema_calificacion" INTEGER NOT NULL,
    "nota_final_numerica" DECIMAL(5,2),
    "nota_final_letra" VARCHAR(5),
    "nota_final_manual" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_notas_cabecera_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_notas_detalle" (
    "id" SERIAL NOT NULL,
    "id_nota_cabecera" INTEGER NOT NULL,
    "id_componente_nota" INTEGER NOT NULL,
    "valor_numerico" DECIMAL(5,2),
    "valor_letra" VARCHAR(5),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_notas_detalle_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 6: WHATSAPP
-- =============================================

CREATE TABLE "tbl_envios_whatsapp" (
    "id" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_periodo_escolar" INTEGER NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado_envio" VARCHAR(20) NOT NULL,
    "tipo_envio" VARCHAR(50) NOT NULL DEFAULT 'reporte_general',
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_envios_whatsapp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_envios_whatsapp_detalle" (
    "id" SERIAL NOT NULL,
    "id_envio_whatsapp" INTEGER NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "id_padre" INTEGER,
    "telefono" VARCHAR(20),
    "contenido_mensaje" TEXT NOT NULL,
    "estado_envio" VARCHAR(20) NOT NULL,
    "mensaje_error" TEXT,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_registro" INTEGER,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_envios_whatsapp_detalle_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 6: TRIVIA
-- =============================================

CREATE TABLE "tbl_trivia_temas" (
    "id" SERIAL NOT NULL,
    "id_docente" INTEGER,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_trivia_temas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_trivia_preguntas" (
    "id" SERIAL NOT NULL,
    "id_tema" INTEGER NOT NULL,
    "texto_pregunta" TEXT NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_trivia_preguntas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_trivia_opciones" (
    "id" SERIAL NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "texto_opcion" TEXT NOT NULL,
    "es_correcta" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_trivia_opciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_trivia_partidas" (
    "id" SERIAL NOT NULL,
    "id_docente" INTEGER,
    "id_curso" INTEGER NOT NULL,
    "id_periodo_escolar" INTEGER NOT NULL,
    "id_tema" INTEGER NOT NULL,
    "modalidad" VARCHAR(20) NOT NULL,
    "cantidad_grupos" INTEGER,
    "cantidad_preguntas" INTEGER NOT NULL,
    "tiempo_por_pregunta" INTEGER NOT NULL DEFAULT 20,
    "puntaje_correcto" DECIMAL(4,2) NOT NULL DEFAULT 1.2,
    "puntaje_incorrecto" DECIMAL(4,2) NOT NULL DEFAULT -0.4,
    "estado_partida" VARCHAR(20) NOT NULL,
    "modo_ganador" VARCHAR(20),
    "modalidad_acceso" VARCHAR(20) NOT NULL DEFAULT 'en_vivo',
    "codigo_acceso" VARCHAR(20),
    "max_intentos" INTEGER NOT NULL DEFAULT 1,
    "mostrar_puntaje" BOOLEAN NOT NULL DEFAULT true,
    "mostrar_resumen" BOOLEAN NOT NULL DEFAULT false,
    "mostrar_ranking" BOOLEAN NOT NULL DEFAULT false,
    "fecha_hora_inicio" TIMESTAMPTZ(6),
    "fecha_hora_fin" TIMESTAMPTZ(6),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_trivia_partidas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_trivia_participantes" (
    "id" SERIAL NOT NULL,
    "id_partida" INTEGER NOT NULL,
    "tipo_participante" VARCHAR(20) NOT NULL,
    "id_alumno" INTEGER,
    "etiqueta_participante" VARCHAR(100) NOT NULL,
    "numero_equipo" INTEGER,
    "puntaje_final" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "es_ganador" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_trivia_participantes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_trivia_partidas_preguntas" (
    "id" SERIAL NOT NULL,
    "id_partida" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_trivia_partidas_preguntas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_trivia_respuestas" (
    "id" SERIAL NOT NULL,
    "id_partida_pregunta" INTEGER NOT NULL,
    "id_participante" INTEGER NOT NULL,
    "id_opcion_seleccionada" INTEGER,
    "es_correcta" BOOLEAN NOT NULL DEFAULT false,
    "delta_puntaje" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "fecha_hora_respuesta" TIMESTAMPTZ(6),
    CONSTRAINT "tbl_trivia_respuestas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_trivia_sesiones" (
    "id" SERIAL NOT NULL,
    "id_partida" INTEGER NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "id_participante" INTEGER,
    "numero_intento" INTEGER NOT NULL,
    "pregunta_actual" INTEGER NOT NULL DEFAULT 0,
    "puntaje_acumulado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado_sesion" VARCHAR(20) NOT NULL DEFAULT 'en_progreso',
    "token_sesion" VARCHAR(500) NOT NULL,
    "fecha_hora_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_hora_fin" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_trivia_sesiones_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 7: TRAZABILIDAD
-- =============================================

CREATE TABLE "tbl_auditoria" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "nombre_entidad" VARCHAR(100) NOT NULL,
    "id_entidad" INTEGER,
    "tipo_accion" VARCHAR(50) NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_auditoria_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 8: PODCAST
-- =============================================

CREATE TABLE "tbl_podcast_config" (
    "id" SERIAL NOT NULL,
    "logo_url" VARCHAR(500),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_podcast_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_podcast_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_podcast_categorias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_podcasts" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "url" VARCHAR(500) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "id_categoria" INTEGER,
    "fecha_publicacion" DATE,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_podcasts_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- CAPA 9: BIBLIOTECA DIGITAL
-- =============================================

CREATE TABLE "tbl_biblioteca_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "icono" VARCHAR(50),
    "color" VARCHAR(20),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_biblioteca_categorias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tbl_biblioteca_materiales" (
    "id" SERIAL NOT NULL,
    "id_categoria" INTEGER,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "nombre_archivo_original" VARCHAR(500) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "tipo_mime" VARCHAR(100) NOT NULL,
    "extension" VARCHAR(20) NOT NULL,
    "tamano_bytes" BIGINT NOT NULL,
    "total_descargas" INTEGER NOT NULL DEFAULT 0,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_biblioteca_materiales_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- ÍNDICES UNIQUE
-- =============================================

CREATE UNIQUE INDEX "tbl_roles_nombre_key" ON "tbl_roles"("nombre");
CREATE UNIQUE INDEX "tbl_permisos_codigo_key" ON "tbl_permisos"("codigo");
CREATE UNIQUE INDEX "tbl_usuarios_correo_key" ON "tbl_usuarios"("correo");
CREATE UNIQUE INDEX "tbl_perfiles_docente_id_usuario_key" ON "tbl_perfiles_docente"("id_usuario");
CREATE UNIQUE INDEX "tbl_alumnos_id_usuario_key" ON "tbl_alumnos"("id_usuario");
CREATE UNIQUE INDEX "tbl_alumnos_dni_key" ON "tbl_alumnos"("dni");
CREATE UNIQUE INDEX "uq_alumno_curso" ON "tbl_alumnos_cursos"("id_curso", "id_alumno");
CREATE UNIQUE INDEX "uq_sesion_curso_fecha" ON "tbl_sesiones_asistencia"("id_curso", "fecha_asistencia");
CREATE UNIQUE INDEX "uq_asistencia_sesion_alumno" ON "tbl_registros_asistencia"("id_sesion_asistencia", "id_alumno");
CREATE UNIQUE INDEX "tbl_trivia_sesiones_token_sesion_key" ON "tbl_trivia_sesiones"("token_sesion");
CREATE UNIQUE INDEX "uq_sesion_partida_alumno_intento" ON "tbl_trivia_sesiones"("id_partida", "id_alumno", "numero_intento");

-- =============================================
-- FOREIGN KEYS
-- =============================================

ALTER TABLE "tbl_roles_permisos" ADD CONSTRAINT "tbl_roles_permisos_id_permiso_fkey" FOREIGN KEY ("id_permiso") REFERENCES "tbl_permisos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_roles_permisos" ADD CONSTRAINT "tbl_roles_permisos_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "tbl_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_usuarios" ADD CONSTRAINT "fk_usuarios_roles" FOREIGN KEY ("id_rol") REFERENCES "tbl_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_perfiles_docente" ADD CONSTRAINT "fk_perfil_docente_usuario" FOREIGN KEY ("id_usuario") REFERENCES "tbl_usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_cursos" ADD CONSTRAINT "fk_cursos_docente" FOREIGN KEY ("id_docente") REFERENCES "tbl_perfiles_docente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_cursos" ADD CONSTRAINT "fk_cursos_periodo" FOREIGN KEY ("id_periodo_escolar") REFERENCES "tbl_periodos_escolares"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_alumnos" ADD CONSTRAINT "fk_alumnos_docente" FOREIGN KEY ("id_docente") REFERENCES "tbl_perfiles_docente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_alumnos" ADD CONSTRAINT "fk_alumnos_usuario" FOREIGN KEY ("id_usuario") REFERENCES "tbl_usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_alumnos_cursos" ADD CONSTRAINT "fk_alumnos_cursos_curso" FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_alumnos_cursos" ADD CONSTRAINT "fk_alumnos_cursos_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_carnets_alumnos" ADD CONSTRAINT "fk_carnets_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_qr_alumnos" ADD CONSTRAINT "fk_qr_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_padres" ADD CONSTRAINT "fk_padres_docente" FOREIGN KEY ("id_docente") REFERENCES "tbl_perfiles_docente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_padres_alumnos" ADD CONSTRAINT "fk_padres_alumnos_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_padres_alumnos" ADD CONSTRAINT "fk_padres_alumnos_padre" FOREIGN KEY ("id_padre") REFERENCES "tbl_padres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_sesiones_asistencia" ADD CONSTRAINT "fk_sesiones_asistencia_curso" FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_sesiones_asistencia" ADD CONSTRAINT "fk_sesiones_asistencia_docente" FOREIGN KEY ("id_docente") REFERENCES "tbl_perfiles_docente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_sesiones_asistencia" ADD CONSTRAINT "fk_sesiones_asistencia_periodo" FOREIGN KEY ("id_periodo_escolar") REFERENCES "tbl_periodos_escolares"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_registros_asistencia" ADD CONSTRAINT "fk_registros_asistencia_sesion" FOREIGN KEY ("id_sesion_asistencia") REFERENCES "tbl_sesiones_asistencia"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_registros_asistencia" ADD CONSTRAINT "fk_registros_asistencia_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_esquemas_calificacion" ADD CONSTRAINT "fk_esquemas_calificacion_docente" FOREIGN KEY ("id_docente") REFERENCES "tbl_perfiles_docente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_esquemas_calificacion" ADD CONSTRAINT "fk_esquemas_calificacion_curso" FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_esquemas_calificacion" ADD CONSTRAINT "fk_esquemas_calificacion_periodo" FOREIGN KEY ("id_periodo_escolar") REFERENCES "tbl_periodos_escolares"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_periodos_calificacion" ADD CONSTRAINT "fk_periodos_calificacion_esquema" FOREIGN KEY ("id_esquema_calificacion") REFERENCES "tbl_esquemas_calificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_componentes_nota" ADD CONSTRAINT "fk_componentes_nota_esquema" FOREIGN KEY ("id_esquema_calificacion") REFERENCES "tbl_esquemas_calificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_notas_cabecera" ADD CONSTRAINT "fk_notas_cabecera_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_notas_cabecera" ADD CONSTRAINT "fk_notas_cabecera_curso" FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_notas_cabecera" ADD CONSTRAINT "fk_notas_cabecera_periodo_escolar" FOREIGN KEY ("id_periodo_escolar") REFERENCES "tbl_periodos_escolares"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_notas_cabecera" ADD CONSTRAINT "fk_notas_cabecera_periodo_calificacion" FOREIGN KEY ("id_periodo_calificacion") REFERENCES "tbl_periodos_calificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_notas_cabecera" ADD CONSTRAINT "fk_notas_cabecera_esquema" FOREIGN KEY ("id_esquema_calificacion") REFERENCES "tbl_esquemas_calificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_notas_detalle" ADD CONSTRAINT "fk_notas_detalle_cabecera" FOREIGN KEY ("id_nota_cabecera") REFERENCES "tbl_notas_cabecera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_notas_detalle" ADD CONSTRAINT "fk_notas_detalle_componente" FOREIGN KEY ("id_componente_nota") REFERENCES "tbl_componentes_nota"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_envios_whatsapp" ADD CONSTRAINT "fk_envios_whatsapp_curso" FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_envios_whatsapp" ADD CONSTRAINT "fk_envios_whatsapp_periodo" FOREIGN KEY ("id_periodo_escolar") REFERENCES "tbl_periodos_escolares"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_envios_whatsapp_detalle" ADD CONSTRAINT "fk_envios_whatsapp_detalle_envio" FOREIGN KEY ("id_envio_whatsapp") REFERENCES "tbl_envios_whatsapp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_envios_whatsapp_detalle" ADD CONSTRAINT "fk_envios_whatsapp_detalle_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_envios_whatsapp_detalle" ADD CONSTRAINT "fk_envios_whatsapp_detalle_padre" FOREIGN KEY ("id_padre") REFERENCES "tbl_padres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_temas" ADD CONSTRAINT "fk_trivia_temas_docente" FOREIGN KEY ("id_docente") REFERENCES "tbl_perfiles_docente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_preguntas" ADD CONSTRAINT "fk_trivia_preguntas_tema" FOREIGN KEY ("id_tema") REFERENCES "tbl_trivia_temas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_opciones" ADD CONSTRAINT "fk_trivia_opciones_pregunta" FOREIGN KEY ("id_pregunta") REFERENCES "tbl_trivia_preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_partidas" ADD CONSTRAINT "fk_trivia_partidas_docente" FOREIGN KEY ("id_docente") REFERENCES "tbl_perfiles_docente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_partidas" ADD CONSTRAINT "fk_trivia_partidas_curso" FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_partidas" ADD CONSTRAINT "fk_trivia_partidas_periodo" FOREIGN KEY ("id_periodo_escolar") REFERENCES "tbl_periodos_escolares"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_partidas" ADD CONSTRAINT "fk_trivia_partidas_tema" FOREIGN KEY ("id_tema") REFERENCES "tbl_trivia_temas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_participantes" ADD CONSTRAINT "fk_trivia_participantes_partida" FOREIGN KEY ("id_partida") REFERENCES "tbl_trivia_partidas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_participantes" ADD CONSTRAINT "fk_trivia_participantes_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_partidas_preguntas" ADD CONSTRAINT "fk_trivia_partidas_preguntas_partida" FOREIGN KEY ("id_partida") REFERENCES "tbl_trivia_partidas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_partidas_preguntas" ADD CONSTRAINT "fk_trivia_partidas_preguntas_pregunta" FOREIGN KEY ("id_pregunta") REFERENCES "tbl_trivia_preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_respuestas" ADD CONSTRAINT "fk_trivia_respuestas_partida_pregunta" FOREIGN KEY ("id_partida_pregunta") REFERENCES "tbl_trivia_partidas_preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_respuestas" ADD CONSTRAINT "fk_trivia_respuestas_participante" FOREIGN KEY ("id_participante") REFERENCES "tbl_trivia_participantes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_respuestas" ADD CONSTRAINT "fk_trivia_respuestas_opcion" FOREIGN KEY ("id_opcion_seleccionada") REFERENCES "tbl_trivia_opciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_sesiones" ADD CONSTRAINT "fk_trivia_sesiones_partida" FOREIGN KEY ("id_partida") REFERENCES "tbl_trivia_partidas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_trivia_sesiones" ADD CONSTRAINT "fk_trivia_sesiones_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_podcasts" ADD CONSTRAINT "fk_podcasts_categorias" FOREIGN KEY ("id_categoria") REFERENCES "tbl_podcast_categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_biblioteca_materiales" ADD CONSTRAINT "fk_biblioteca_materiales_categoria" FOREIGN KEY ("id_categoria") REFERENCES "tbl_biblioteca_categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
