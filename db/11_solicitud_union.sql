-- UNDC RSU: migración 11 — solicitudes de unión a PEP (HU-063..HU-069)
-- El estudiante solicita unirse a un PEP abierto; el responsable del PEP
-- acepta o rechaza. Idempotente: seguro re-ejecutar y en instalaciones frescas.

CREATE TABLE IF NOT EXISTS "RSU_Solicitud_Union" (
  "id_solicitud"     SERIAL PRIMARY KEY,
  "id_proyecto"      INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "id_estudiante"    INT NOT NULL REFERENCES "Estudiante"("id_estudiante"),
  "mensaje_solicitud" TEXT NULL,
  "estado"           VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK ("estado" IN ('PENDIENTE','ACEPTADA','RECHAZADA','CANCELADA')),
  "motivo_rapido"    VARCHAR(30) NULL
    CHECK ("motivo_rapido" IN ('CUPO_LLENO','CICLO_INSUFICIENTE','PERFIL_NO_AFIN','FUERA_DE_PLAZO','OTRO')),
  "motivo_rechazo"   TEXT NULL,
  "id_revisor"       INT NULL,
  "fecha_solicitud"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "fecha_resolucion" TIMESTAMPTZ NULL
);
-- Una sola solicitud pendiente por (proyecto, estudiante) — R36.
CREATE UNIQUE INDEX IF NOT EXISTS uq_solicitud_union_pendiente
  ON "RSU_Solicitud_Union"("id_proyecto", "id_estudiante")
  WHERE ("estado" = 'PENDIENTE');
CREATE INDEX IF NOT EXISTS idx_sol_union_proyecto ON "RSU_Solicitud_Union"("id_proyecto", "estado");
CREATE INDEX IF NOT EXISTS idx_sol_union_estudiante ON "RSU_Solicitud_Union"("id_estudiante", "estado");
