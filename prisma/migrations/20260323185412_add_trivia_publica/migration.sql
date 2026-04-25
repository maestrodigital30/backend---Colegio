-- AlterTable
ALTER TABLE "tbl_trivia_partidas" ADD COLUMN     "codigo_acceso" VARCHAR(20),
ADD COLUMN     "max_intentos" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "modalidad_acceso" VARCHAR(20) NOT NULL DEFAULT 'en_vivo',
ADD COLUMN     "mostrar_puntaje" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mostrar_ranking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mostrar_resumen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "tbl_trivia_sesiones_token_sesion_key" ON "tbl_trivia_sesiones"("token_sesion");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sesion_partida_alumno_intento" ON "tbl_trivia_sesiones"("id_partida", "id_alumno", "numero_intento");

-- AddForeignKey
ALTER TABLE "tbl_trivia_sesiones" ADD CONSTRAINT "fk_trivia_sesiones_partida" FOREIGN KEY ("id_partida") REFERENCES "tbl_trivia_partidas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_trivia_sesiones" ADD CONSTRAINT "fk_trivia_sesiones_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
