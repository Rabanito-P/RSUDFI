-- UNDC RSU: eliminación de conceptos de créditos
-- El sistema no trabaja créditos; solo horas acumuladas en actividades de campo.

ALTER TABLE "RSU_Participante_Estudiante" DROP COLUMN IF EXISTS creditos_otorgados;
ALTER TABLE "Estudiante_Ciclo" DROP COLUMN IF EXISTS creditos_matriculados;
