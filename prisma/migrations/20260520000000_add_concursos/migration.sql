-- CreateTable: tbl_concursos
CREATE TABLE "tbl_concursos" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "id_curso" INTEGER,
    "area" VARCHAR(100),
    "nivel" VARCHAR(50),
    "tema_visual" VARCHAR(30) NOT NULL DEFAULT 'clasico',
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "multimedia_url" VARCHAR(500),
    "multimedia_tipo" VARCHAR(20),
    "tiempo_por_pregunta" INTEGER NOT NULL DEFAULT 20,
    "puntos_base" INTEGER NOT NULL DEFAULT 100,
    "penalizacion_incorrecta" INTEGER NOT NULL DEFAULT 0,
    "orden_preguntas" VARCHAR(20) NOT NULL DEFAULT 'fijo',
    "orden_opciones" VARCHAR(20) NOT NULL DEFAULT 'fijo',
    "permite_reintentos" BOOLEAN NOT NULL DEFAULT true,
    "max_intentos_por_usuario" INTEGER NOT NULL DEFAULT 0,
    "comodin_50_50_habilitado" BOOLEAN NOT NULL DEFAULT true,
    "comodin_tiempo_extra_habilitado" BOOLEAN NOT NULL DEFAULT true,
    "comodin_tiempo_extra_segundos" INTEGER NOT NULL DEFAULT 10,
    "comodin_doble_puntaje_habilitado" BOOLEAN NOT NULL DEFAULT true,
    "bonus_habilitado" BOOLEAN NOT NULL DEFAULT false,
    "bonus_cantidad_tarjetas" INTEGER NOT NULL DEFAULT 5,
    "bonus_premio_minimo" INTEGER NOT NULL DEFAULT 10,
    "bonus_premio_maximo" INTEGER NOT NULL DEFAULT 100,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_concursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_concurso_preguntas
CREATE TABLE "tbl_concurso_preguntas" (
    "id" SERIAL NOT NULL,
    "id_concurso" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "puntos" INTEGER,
    "tiempo_limite_segundos" INTEGER,
    "multimedia_url" VARCHAR(500),
    "multimedia_tipo" VARCHAR(20),
    "permite_multiple" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_concurso_preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_concurso_opciones
CREATE TABLE "tbl_concurso_opciones" (
    "id" SERIAL NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "texto" TEXT,
    "es_correcta" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "multimedia_url" VARCHAR(500),
    "multimedia_tipo" VARCHAR(20),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_concurso_opciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_concurso_intentos
CREATE TABLE "tbl_concurso_intentos" (
    "id" SERIAL NOT NULL,
    "id_concurso" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_alumno" INTEGER,
    "estado_intento" VARCHAR(20) NOT NULL DEFAULT 'en_progreso',
    "puntaje_preguntas" INTEGER NOT NULL DEFAULT 0,
    "puntaje_bonus" INTEGER NOT NULL DEFAULT 0,
    "puntaje_total" INTEGER NOT NULL DEFAULT 0,
    "respuestas_correctas" INTEGER NOT NULL DEFAULT 0,
    "respuestas_incorrectas" INTEGER NOT NULL DEFAULT 0,
    "preguntas_totales" INTEGER NOT NULL DEFAULT 0,
    "tiempo_total_segundos" INTEGER NOT NULL DEFAULT 0,
    "comodin_50_50_usado" BOOLEAN NOT NULL DEFAULT false,
    "comodin_tiempo_extra_usado" BOOLEAN NOT NULL DEFAULT false,
    "comodin_doble_puntaje_usado" BOOLEAN NOT NULL DEFAULT false,
    "token_intento" VARCHAR(500) NOT NULL,
    "fecha_hora_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_hora_fin" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_concurso_intentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_concurso_respuestas
CREATE TABLE "tbl_concurso_respuestas" (
    "id" SERIAL NOT NULL,
    "id_intento" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "id_opcion_seleccionada" INTEGER,
    "ids_opciones_seleccionadas" TEXT,
    "es_correcta" BOOLEAN NOT NULL DEFAULT false,
    "puntos_obtenidos" INTEGER NOT NULL DEFAULT 0,
    "tiempo_usado_segundos" INTEGER NOT NULL DEFAULT 0,
    "comodin_50_50_aplicado" BOOLEAN NOT NULL DEFAULT false,
    "comodin_tiempo_extra_aplicado" BOOLEAN NOT NULL DEFAULT false,
    "comodin_doble_puntaje_aplicado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_hora_respuesta" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_concurso_respuestas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_concurso_bonus_tarjetas
CREATE TABLE "tbl_concurso_bonus_tarjetas" (
    "id" SERIAL NOT NULL,
    "id_intento" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "puntos" INTEGER NOT NULL,
    "seleccionada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_hora_seleccion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tbl_concurso_bonus_tarjetas_pkey" PRIMARY KEY ("id")
);

-- Index unique token_intento
CREATE UNIQUE INDEX "tbl_concurso_intentos_token_intento_key" ON "tbl_concurso_intentos"("token_intento");

-- Index unique intento + pregunta (una respuesta por pregunta en un intento)
CREATE UNIQUE INDEX "uq_concurso_respuesta_intento_pregunta" ON "tbl_concurso_respuestas"("id_intento", "id_pregunta");

-- Foreign Keys
ALTER TABLE "tbl_concursos" ADD CONSTRAINT "fk_concursos_curso" FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_concursos" ADD CONSTRAINT "fk_concursos_usuario_registro" FOREIGN KEY ("id_usuario_registro") REFERENCES "tbl_usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_concurso_preguntas" ADD CONSTRAINT "fk_concurso_preguntas_concurso" FOREIGN KEY ("id_concurso") REFERENCES "tbl_concursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_concurso_opciones" ADD CONSTRAINT "fk_concurso_opciones_pregunta" FOREIGN KEY ("id_pregunta") REFERENCES "tbl_concurso_preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_concurso_intentos" ADD CONSTRAINT "fk_concurso_intentos_concurso" FOREIGN KEY ("id_concurso") REFERENCES "tbl_concursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_concurso_intentos" ADD CONSTRAINT "fk_concurso_intentos_usuario" FOREIGN KEY ("id_usuario") REFERENCES "tbl_usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_concurso_intentos" ADD CONSTRAINT "fk_concurso_intentos_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_concurso_respuestas" ADD CONSTRAINT "fk_concurso_respuestas_intento" FOREIGN KEY ("id_intento") REFERENCES "tbl_concurso_intentos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_concurso_respuestas" ADD CONSTRAINT "fk_concurso_respuestas_pregunta" FOREIGN KEY ("id_pregunta") REFERENCES "tbl_concurso_preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tbl_concurso_respuestas" ADD CONSTRAINT "fk_concurso_respuestas_opcion" FOREIGN KEY ("id_opcion_seleccionada") REFERENCES "tbl_concurso_opciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_concurso_bonus_tarjetas" ADD CONSTRAINT "fk_concurso_bonus_intento" FOREIGN KEY ("id_intento") REFERENCES "tbl_concurso_intentos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Indices auxiliares para consultas frecuentes
CREATE INDEX "idx_concursos_publicado" ON "tbl_concursos"("publicado", "estado");
CREATE INDEX "idx_concursos_curso" ON "tbl_concursos"("id_curso");
CREATE INDEX "idx_concurso_preguntas_concurso_orden" ON "tbl_concurso_preguntas"("id_concurso", "orden");
CREATE INDEX "idx_concurso_opciones_pregunta_orden" ON "tbl_concurso_opciones"("id_pregunta", "orden");
CREATE INDEX "idx_concurso_intentos_concurso_usuario" ON "tbl_concurso_intentos"("id_concurso", "id_usuario");
CREATE INDEX "idx_concurso_intentos_alumno" ON "tbl_concurso_intentos"("id_alumno");
CREATE INDEX "idx_concurso_intentos_estado" ON "tbl_concurso_intentos"("estado_intento", "estado");
CREATE INDEX "idx_concurso_respuestas_intento" ON "tbl_concurso_respuestas"("id_intento");
