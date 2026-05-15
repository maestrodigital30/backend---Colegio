-- CreateTable
CREATE TABLE "tbl_tipos_dato_antropometrico" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo_valor" VARCHAR(20) NOT NULL,
    "unidad" VARCHAR(20),
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_tipos_dato_antropometrico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_datos_antropometricos_alumno" (
    "id" SERIAL NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "id_tipo_dato_antropometrico" INTEGER NOT NULL,
    "valor_numerico" DECIMAL(10,2),
    "valor_texto" TEXT,
    "descripcion" TEXT,
    "id_usuario_registro" INTEGER,
    "fecha_hora_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_modificacion" INTEGER,
    "fecha_hora_modificacion" TIMESTAMPTZ(6),
    "estado" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tbl_datos_antropometricos_alumno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tipos_dato_antropometrico_nombre_key" ON "tbl_tipos_dato_antropometrico"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_dato_antropometrico_alumno_tipo" ON "tbl_datos_antropometricos_alumno"("id_alumno", "id_tipo_dato_antropometrico");

-- AddForeignKey
ALTER TABLE "tbl_datos_antropometricos_alumno" ADD CONSTRAINT "fk_datos_antropometricos_alumno" FOREIGN KEY ("id_alumno") REFERENCES "tbl_alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_datos_antropometricos_alumno" ADD CONSTRAINT "fk_datos_antropometricos_tipo" FOREIGN KEY ("id_tipo_dato_antropometrico") REFERENCES "tbl_tipos_dato_antropometrico"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
