-- Permitir lotes de envío sin curso fijo (envío masivo por grado)
ALTER TABLE "tbl_envios_whatsapp" ALTER COLUMN "id_curso" DROP NOT NULL;

-- Metadata del alcance cuando el envío es masivo
ALTER TABLE "tbl_envios_whatsapp" ADD COLUMN "grado" VARCHAR(20);
ALTER TABLE "tbl_envios_whatsapp" ADD COLUMN "secciones" VARCHAR(200);

-- Curso de origen de cada mensaje individual (necesario en envíos masivos donde el lote cubre N cursos)
ALTER TABLE "tbl_envios_whatsapp_detalle" ADD COLUMN "id_curso" INTEGER;

ALTER TABLE "tbl_envios_whatsapp_detalle"
  ADD CONSTRAINT "fk_envios_whatsapp_detalle_curso"
  FOREIGN KEY ("id_curso") REFERENCES "tbl_cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
