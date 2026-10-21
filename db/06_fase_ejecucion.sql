-- 06_fase_ejecucion.sql — Fase de Ejecución: asistencia real + expulsión (HU-070)
-- Aplica sobre init.sql (tablas creadas). Idempotente por_IF_EXISTS/DO.
--
-- 1) HU-013: un beneficiario cuenta una vez por actividad (checkbox + reintento).
-- 2) HU-070: el estado de expulsión queda en el CHECK de participación;
--    no se crea tabla nueva: el retiro disciplinario vía RSU_Participante_Estudiante.

-- ── 1. Dedup de asistencia ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_asistencia_actividad_beneficiario'
  ) THEN
    ALTER TABLE "RSU_Asistencia_Beneficiario"
      ADD CONSTRAINT uq_asistencia_actividad_beneficiario
      UNIQUE ("id_actividad", "id_beneficiario");
  END IF;
END $$;

-- ── 2. EXPULSADO pasa a ser un estado válido de participación ─────────
-- La CHECK original (init.sql) solo admitía INSCRITO/ACTIVO/RETIRADO/FINALIZADO
-- y llevaba nombre autogenerado por Postgres. Se elimina si existe y se recrea
-- con el nuevo dominio.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_participante_estado_participacion'
  ) THEN
    -- Nombre autogenerado típico del init.sql; ignorar 42704 si difiere.
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = '"RSU_Participante_Estudiante"'::regclass
        AND conname LIKE '%estado_participacion%'
    ) THEN
      EXECUTE 'ALTER TABLE "RSU_Participante_Estudiante" DROP CONSTRAINT '
              || (SELECT conname FROM pg_constraint
                  WHERE conrelid = '"RSU_Participante_Estudiante"'::regclass
                    AND contype = 'c'
                    AND pg_get_constraintdef(oid) LIKE '%estado_participacion%'
                  LIMIT 1);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_participante_estado_participacion'
  ) THEN
    ALTER TABLE "RSU_Participante_Estudiante"
      ADD CONSTRAINT ck_participante_estado_participacion
      CHECK ("estado_participacion" IN
        ('INSCRITO','ACTIVO','RETIRADO','FINALIZADO','EXPULSADO'));
  END IF;
END $$;
