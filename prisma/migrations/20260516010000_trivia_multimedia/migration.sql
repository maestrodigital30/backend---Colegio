-- Migración: trivia_multimedia
-- Añade tablas de multimedia y personalización visual para trivia.
-- Extiende tbl_trivia_partidas (id_musica_fondo) y tbl_trivia_participantes (avatares/colores públicos).

-- =============================================
-- 1. NUEVAS TABLAS
-- =============================================

-- CreateTable: tbl_trivia_imagenes
CREATE TABLE "tbl_trivia_imagenes" (
    "id" SERIAL NOT NULL,
    "id_partida" INTEGER NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_archivo_original" VARCHAR(255),
    "tipo_mime" VARCHAR(50),
    "tamano_bytes" BIGINT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_trivia_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_sistema_sonidos
CREATE TABLE "tbl_sistema_sonidos" (
    "id" SERIAL NOT NULL,
    "tipo_evento" VARCHAR(30) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_archivo_original" VARCHAR(255),
    "tipo_mime" VARCHAR(50),
    "tamano_bytes" BIGINT,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_sistema_sonidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_musica_fondo_catalogo
CREATE TABLE "tbl_musica_fondo_catalogo" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "estilo" VARCHAR(30) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_archivo_original" VARCHAR(255),
    "tipo_mime" VARCHAR(50),
    "tamano_bytes" BIGINT,
    "duracion_segundos" INTEGER,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_musica_fondo_catalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_avatares_catalogo
CREATE TABLE "tbl_avatares_catalogo" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_archivo_original" VARCHAR(255),
    "tipo_mime" VARCHAR(50),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "es_default" BOOLEAN NOT NULL DEFAULT false,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_avatares_catalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_temas_visuales
CREATE TABLE "tbl_temas_visuales" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "config_json" JSONB NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esta_activo" BOOLEAN NOT NULL DEFAULT true,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_temas_visuales_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tbl_alumno_identidad_visual
CREATE TABLE "tbl_alumno_identidad_visual" (
    "id_alumno" INTEGER NOT NULL,
    "id_avatar" INTEGER,
    "id_personaje" INTEGER,
    "id_marco" INTEGER,
    "color_personal" VARCHAR(7),
    "id_tema_visual" INTEGER,
    "musica_habilitada" BOOLEAN NOT NULL DEFAULT true,
    "sonidos_habilitados" BOOLEAN NOT NULL DEFAULT true,
    "fecha_hora_actualizacion" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_alumno_identidad_visual_pkey" PRIMARY KEY ("id_alumno")
);

-- =============================================
-- 2. ÍNDICES Y ÚNICOS
-- =============================================

-- CreateIndex
CREATE INDEX "idx_trivia_imagenes_partida" ON "tbl_trivia_imagenes"("id_partida");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_sistema_sonidos_tipo_evento_key" ON "tbl_sistema_sonidos"("tipo_evento");

-- CreateIndex
CREATE INDEX "idx_musica_estilo" ON "tbl_musica_fondo_catalogo"("estilo");

-- CreateIndex
CREATE INDEX "idx_avatares_tipo_activo" ON "tbl_avatares_catalogo"("tipo", "esta_activo");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_temas_visuales_codigo_key" ON "tbl_temas_visuales"("codigo");

-- =============================================
-- 3. EXTENDER tbl_trivia_partidas: id_musica_fondo
-- =============================================

ALTER TABLE "tbl_trivia_partidas" ADD COLUMN "id_musica_fondo" INTEGER;

-- =============================================
-- 4. EXTENDER tbl_trivia_participantes: avatares/color públicos
-- =============================================

ALTER TABLE "tbl_trivia_participantes" ADD COLUMN "id_avatar_publico" INTEGER;
ALTER TABLE "tbl_trivia_participantes" ADD COLUMN "id_personaje_publico" INTEGER;
ALTER TABLE "tbl_trivia_participantes" ADD COLUMN "id_marco_publico" INTEGER;
ALTER TABLE "tbl_trivia_participantes" ADD COLUMN "color_publico" VARCHAR(7);

-- =============================================
-- 5. FOREIGN KEYS
-- =============================================

-- AddForeignKey: tbl_trivia_imagenes -> tbl_trivia_partidas
ALTER TABLE "tbl_trivia_imagenes" ADD CONSTRAINT "fk_trivia_imagenes_partida"
    FOREIGN KEY ("id_partida") REFERENCES "tbl_trivia_partidas"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: tbl_trivia_partidas -> tbl_musica_fondo_catalogo
ALTER TABLE "tbl_trivia_partidas" ADD CONSTRAINT "fk_trivia_partidas_musica"
    FOREIGN KEY ("id_musica_fondo") REFERENCES "tbl_musica_fondo_catalogo"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: tbl_trivia_participantes -> tbl_avatares_catalogo (avatar / personaje / marco)
ALTER TABLE "tbl_trivia_participantes" ADD CONSTRAINT "fk_participante_avatar"
    FOREIGN KEY ("id_avatar_publico") REFERENCES "tbl_avatares_catalogo"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_participantes" ADD CONSTRAINT "fk_participante_personaje"
    FOREIGN KEY ("id_personaje_publico") REFERENCES "tbl_avatares_catalogo"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_trivia_participantes" ADD CONSTRAINT "fk_participante_marco"
    FOREIGN KEY ("id_marco_publico") REFERENCES "tbl_avatares_catalogo"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: tbl_alumno_identidad_visual -> tbl_alumnos / tbl_avatares_catalogo / tbl_temas_visuales
ALTER TABLE "tbl_alumno_identidad_visual" ADD CONSTRAINT "fk_identidad_alumno"
    FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "tbl_alumno_identidad_visual" ADD CONSTRAINT "fk_identidad_avatar"
    FOREIGN KEY ("id_avatar") REFERENCES "tbl_avatares_catalogo"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_alumno_identidad_visual" ADD CONSTRAINT "fk_identidad_personaje"
    FOREIGN KEY ("id_personaje") REFERENCES "tbl_avatares_catalogo"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_alumno_identidad_visual" ADD CONSTRAINT "fk_identidad_marco"
    FOREIGN KEY ("id_marco") REFERENCES "tbl_avatares_catalogo"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "tbl_alumno_identidad_visual" ADD CONSTRAINT "fk_identidad_tema"
    FOREIGN KEY ("id_tema_visual") REFERENCES "tbl_temas_visuales"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;
