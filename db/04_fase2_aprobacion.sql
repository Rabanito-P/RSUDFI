-- ============================================================================
-- FASE 2 · APROBACIÓN — HU-F2-Aprobacion.md
-- Mini-RSU · Facultad de Ingeniería · UNDC
--
-- Migración idempotente: se puede aplicar varias veces sin efecto duplicado.
-- Base: rules/fase de propuesta-aprobacion-cierre (3).txt §3.1-3 a §3.1-6, §4-3, §5
--
-- Decisiones del usuario registradas en §6 del documento de HU:
--   E1 → opción C: el Comité RSU valida (DIR_RS_FACULTAD) y el DECANO eleva.
--   E2 → la resolución es documento EXTERNO: se CARGA, no se genera. No se crea
--        el rol VPA. Se conserva R28 (CONSEJO_FACULTAD registra la resolución).
--   E3 → el vencimiento se calcula de forma PEREZOSA al leer el proyecto.
-- ============================================================================

-- ── HU-F2-02: plazo de subsanación y vencimiento perezoso (E3) ─────────────
-- Guardamos el plazo en el propio proyecto: el cálculo perezoso lo evalúa al
-- leerlo, sin necesidad de tarea programada en el servidor.
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "fecha_limite_subsanacion" TIMESTAMPTZ;
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "motivo_observacion" TEXT;
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "campos_bloqueados" TEXT;

-- ── HU-F2-04 / HU-F2-06: datos del Oficio de Elevación y de la activación ───
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "numero_oficio" VARCHAR(50);
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "fecha_elevacion" DATE;
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "presupuesto_fondo_rsu" NUMERIC(12,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_proyecto_subsanacion
  ON "RSU_Proyecto"("fecha_limite_subsanacion") WHERE "fecha_limite_subsanacion" IS NOT NULL;

-- ============================================================================
-- E1 · QUIÉN ELEVA — opción C
-- El Comité RSU valida el expediente y el DECANO presiona "Aprobar y Elevar".
-- Antes este tramo era de DIR_RS_FACULTAD; ahora pertenece al DECANO.
-- ============================================================================
DELETE FROM "RSU_Transicion_Estado" t
USING "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
  AND t."id_rol_actor"=r."id_rol_actor"
  AND eo."codigo"='EN_PRIORIZACION_FACULTAD' AND ed."codigo"='EN_DICTAMEN_CONSEJO'
  AND r."codigo"='DIR_RS_FACULTAD';

INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='EN_PRIORIZACION_FACULTAD' AND ed."codigo"='EN_DICTAMEN_CONSEJO' AND r."codigo"='DECANO'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- El rechazo en el tramo del Decano también lo hace el Decano.
DELETE FROM "RSU_Transicion_Estado" t
USING "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
  AND t."id_rol_actor"=r."id_rol_actor"
  AND eo."codigo"='EN_PRIORIZACION_FACULTAD' AND ed."codigo"='RECHAZADO'
  AND r."codigo"='DIR_RS_FACULTAD';

INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", false
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='EN_PRIORIZACION_FACULTAD' AND ed."codigo"='RECHAZADO' AND r."codigo"='DECANO'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- ============================================================================
-- HU-F2-06 · OPCIÓN C — la activación pasa a la Facultad
-- rules §3.1-6: la Ficha firmada regresa al Responsable de RS de Facultad,
-- que busca el proyecto y presiona "Activar Proyecto". La DRSU no opera el
-- sistema, así que DIR_CENTRAL_RS no debe custodiar este paso.
-- El reporte a SUNEDU (EVALUACION_VALIDADA → REPORTADO_SUNEDU) NO cambia:
-- sigue siendo un acto institucional central.
-- ============================================================================
DELETE FROM "RSU_Transicion_Estado" t
USING "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
  AND t."id_rol_actor"=r."id_rol_actor"
  AND eo."codigo"='EN_ASIGNACION_CARGA' AND ed."codigo"='REGISTRADO_OFICIAL'
  AND r."codigo"='DIR_CENTRAL_RS';

INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='EN_ASIGNACION_CARGA' AND ed."codigo"='REGISTRADO_OFICIAL' AND r."codigo"='DIR_RS_FACULTAD'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- ============================================================================
-- HU-F2-02 · Vencimiento perezoso (E3)
-- Los estados en observación también expiran. El plazo se fija al observar y
-- el archivado lo dispara el cálculo perezoso al leer el proyecto.
-- ============================================================================
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", false
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='OBSERVADO_ASESOR' AND ed."codigo"='ARCHIVADO_VENCIMIENTO' AND r."codigo"='DIR_RS_FACULTAD'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", false
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='EN_REVISION_ESCUELA' AND ed."codigo"='ARCHIVADO_VENCIMIENTO' AND r."codigo"='DIR_RS_FACULTAD'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- El emisor subsana: vuelve al estado previo para reenviar tras el vencimiento.
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='ARCHIVADO_VENCIMIENTO' AND ed."codigo"='EN_REVISION_ESCUELA' AND r."codigo"='ESTUDIANTE_PROP'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- ============================================================================
-- HU-F2-05 · Filtro presupuestal del PEP (rules §4-3)
-- ============================================================================
INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito")
SELECT 'porcentaje_fondo_rsu','2','Porcentaje del fondo institucional destinado a proyectos RSU (Ley 30220 Art. 125)','INT','GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Configuracion" WHERE "clave"='porcentaje_fondo_rsu');

INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito")
SELECT 'presupuesto_facultad','50000','Presupuesto anual de la Facultad que sustenta el fondo RSU','INT','GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Configuracion" WHERE "clave"='presupuesto_facultad');

-- ── HU-F2-02 · Plazos en días hábiles ───────────────────────────────────────
INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito")
SELECT 'plazo_observacion_escuela','10','Días hábiles para subsanar la observación de la Dirección de Escuela (CAMINO 2)','INT','GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Configuracion" WHERE "clave"='plazo_observacion_escuela');

INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito")
SELECT 'plazo_ajuste_presupuestal','5','Días hábiles para ajustar el presupuesto tras el rebote del filtro del PEP','INT','GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Configuracion" WHERE "clave"='plazo_ajuste_presupuestal');

-- ============================================================================
-- Verificación
-- ============================================================================
SELECT 'Fase 2 aplicada' AS resultado,
  (SELECT COUNT(*) FROM "RSU_Configuracion"
     WHERE "clave" IN ('porcentaje_fondo_rsu','presupuesto_facultad','plazo_observacion_escuela','plazo_ajuste_presupuestal')) AS configuraciones,
  -- El tramo de elevación debe pertenecer al DECANO y no a DIR_RS_FACULTAD.
  (SELECT COUNT(*) FROM "RSU_Transicion_Estado" t
     JOIN "RSU_Estado_Proyecto" eo ON eo."id_estado"=t."estado_origen"
     JOIN "RSU_Estado_Proyecto" ed ON ed."id_estado"=t."estado_destino"
     JOIN "RSU_Rol_Actor" r ON r."id_rol_actor"=t."id_rol_actor"
   WHERE eo."codigo"='EN_PRIORIZACION_FACULTAD' AND ed."codigo"='EN_DICTAMEN_CONSEJO' AND r."codigo"='DECANO') AS elevacion_es_decano,
  -- La activación debe pertenecer a DIR_RS_FACULTAD y no a DIR_CENTRAL_RS.
  (SELECT COUNT(*) FROM "RSU_Transicion_Estado" t
     JOIN "RSU_Estado_Proyecto" eo ON eo."id_estado"=t."estado_origen"
     JOIN "RSU_Estado_Proyecto" ed ON ed."id_estado"=t."estado_destino"
     JOIN "RSU_Rol_Actor" r ON r."id_rol_actor"=t."id_rol_actor"
   WHERE eo."codigo"='EN_ASIGNACION_CARGA' AND ed."codigo"='REGISTRADO_OFICIAL' AND r."codigo"='DIR_RS_FACULTAD') AS activacion_es_facultad,
  -- El reporte a SUNEDU debe seguir siendo central (no se toca).
  (SELECT COUNT(*) FROM "RSU_Transicion_Estado" t
     JOIN "RSU_Estado_Proyecto" eo ON eo."id_estado"=t."estado_origen"
     JOIN "RSU_Estado_Proyecto" ed ON ed."id_estado"=t."estado_destino"
     JOIN "RSU_Rol_Actor" r ON r."id_rol_actor"=t."id_rol_actor"
   WHERE eo."codigo"='EVALUACION_VALIDADA' AND ed."codigo"='REPORTADO_SUNEDU' AND r."codigo"='DIR_CENTRAL_RS') AS sunedu_sigue_central;