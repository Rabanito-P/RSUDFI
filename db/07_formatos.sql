-- UNDC RSU: catálogo fijo de formatos y guías
--
-- El catálogo NO es configurable: son los 7 formatos oficiales que el sistema
-- usa siempre. El administrador solo reemplaza el archivo de ejemplo que se le
-- ofrece al estudiante; "ruta" vacía significa "usar el archivo de fábrica".
DROP TABLE IF EXISTS "RSU_Formato" CASCADE;

CREATE TABLE "RSU_Formato" (
  "id_formato"          SERIAL PRIMARY KEY,
  "codigo"              VARCHAR(40) NOT NULL UNIQUE,
  "nombre"              VARCHAR(200) NOT NULL,
  "descripcion"         TEXT DEFAULT '',
  "archivo_base"        VARCHAR(200) NOT NULL,
  "ruta"                VARCHAR(500) DEFAULT '',
  "nombre_archivo"      VARCHAR(200) DEFAULT '',
  "version"             VARCHAR(20) DEFAULT '1.0',
  "peso_bytes"          BIGINT DEFAULT 0,
  "orden"               INT DEFAULT 0,
  "fecha_actualizacion" TIMESTAMP DEFAULT now()
);

INSERT INTO "RSU_Formato" ("codigo","nombre","descripcion","archivo_base","orden") VALUES
 ('PROPUESTA','Formato 1 · Propuesta de proyecto','Documento de propuesta: problema, objetivos, fundamentación y beneficiarios.','01-propuesta-de-proyecto.docx',1),
 ('PLANIFICACION','Formato 2 · Planificación de actividades','Cronograma semanal de actividades (Excel). Se lee para crear las actividades del proyecto.','02-planificacion-de-actividades.xlsx',2),
 ('PRIMER_ENTREGABLE','Formato 3 · Primer entregable','Reporte del primer entregable de la ejecución.','03-primer-entregable.docx',3),
 ('SEGUNDO_ENTREGABLE','Formato 4 · Segundo entregable','Reporte del segundo entregable de la ejecución.','04-segundo-entregable.docx',4),
 ('TERCER_ENTREGABLE','Formato 5 · Tercer entregable','Reporte del tercer entregable de la ejecución.','05-tercer-entregable.docx',5),
 ('ENCUESTA','Formato 6 · Encuesta de satisfacción','Cuestionario Likert que se aplica a los beneficiarios del proyecto.','06-encuesta-satisfaccion.docx',6),
 ('INFORME_FINAL','Formato 7 · Informe final','Informe de cierre del proyecto con resultados e impacto alcanzado.','07-informe-final.docx',7)
ON CONFLICT ("codigo") DO NOTHING;
