-- ============================================================================
-- FASE 1 · CREACIÓN — HU-F1-Creacion.md
-- Mini-RSU · Facultad de Ingeniería · UNDC
--
-- Migración idempotente: se puede aplicar varias veces sin efecto duplicado.
-- Base: rules/fase de propuesta-aprobacion-cierre (3).txt §3.1, §5, §6
--
-- Decisión E1 del usuario: el proyecto NACE en BORRADOR (se conserva R23) y
-- el bucle del docente asesor ocurre al remitir la propuesta.
-- ============================================================================

-- ── HU-F1-01 CA-1.3 / CA-1.4: problemática y ODS en la propuesta inicial ──
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "problematica" TEXT;
ALTER TABLE "RSU_Proyecto" ADD COLUMN IF NOT EXISTS "ods" VARCHAR(4);

-- ── Estados de la Fase 1 ──────────────────────────────────────────────────
-- Se agregan 4 estados. Los 17 existentes NO se modifican ni se renombran.
INSERT INTO "RSU_Estado_Proyecto" ("codigo","nombre","orden_flujo","es_final","color_ui") VALUES
  ('ENVIADO_ASESOR','Enviado a Docente Asesor',1.5,false,'#5E35B1'),
  ('OBSERVADO_ASESOR','Observado por Docente Asesor',1.6,false,'#D81B60'),
  ('ACEPTADO_ASESOR','Aceptado por Docente Asesor',1.7,false,'#00897B'),
  ('ARCHIVADO_VENCIMIENTO','Archivado por Vencimiento',98,false,'#9E9E9E')
ON CONFLICT DO NOTHING;

-- ── Transiciones de la Fase 1 ─────────────────────────────────────────────
-- Regla: una transición solo es válida si existe la tupla
-- (estado_origen, estado_destino, id_rol_actor).

-- CA-3.5: el líder remite la propuesta → ENVIADO_ASESOR.
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='BORRADOR' AND ed."codigo"='ENVIADO_ASESOR' AND r."codigo"='ESTUDIANTE_PROP'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- CA-4.4: el asesor acepta → ACEPTADO_ASESOR.
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='ENVIADO_ASESOR' AND ed."codigo"='ACEPTADO_ASESOR' AND r."codigo"='DOCENTE_RESP'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- CA-4.10: el asesor rechaza → OBSERVADO_ASESOR (no exige PDF; sí motivo).
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", false
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='ENVIADO_ASESOR' AND ed."codigo"='OBSERVADO_ASESOR' AND r."codigo"='DOCENTE_RESP'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- CA-6.6: el líder reenvía al nuevo asesor (reintentos ilimitados).
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='OBSERVADO_ASESOR' AND ed."codigo"='ENVIADO_ASESOR' AND r."codigo"='ESTUDIANTE_PROP'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- CA-4.7: con el proyecto aceptado, el líder ya puede enviarlo a Escuela.
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='ACEPTADO_ASESOR' AND ed."codigo"='EN_REVISION_ESCUELA' AND r."codigo"='ESTUDIANTE_PROP'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- CA-7.1: vencimiento -> archivado.
-- El archivado lo ejecuta la Direccion/Comite de RS de la Facultad, que es
-- quien gestiona los tramites de cierre (rules V0.4 2.4). ADMIN no es un rol
-- actor BPMN en este esquema: RSU_Rol_Actor tiene 12 roles y no lo incluye.
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", false
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='ENVIADO_ASESOR' AND ed."codigo"='ARCHIVADO_VENCIMIENTO' AND r."codigo"='DIR_RS_FACULTAD'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", false
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='OBSERVADO_ASESOR' AND ed."codigo"='ARCHIVADO_VENCIMIENTO' AND r."codigo"='DIR_RS_FACULTAD'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- CA-7.5: reactivación → BORRADOR, solo si el asesor tiene cupo libre.
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento")
SELECT eo."id_estado", ed."id_estado", r."id_rol_actor", true
FROM "RSU_Estado_Proyecto" eo, "RSU_Estado_Proyecto" ed, "RSU_Rol_Actor" r
WHERE eo."codigo"='ARCHIVADO_VENCIMIENTO' AND ed."codigo"='BORRADOR' AND r."codigo"='ESTUDIANTE_PROP'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Transicion_Estado" t
                  WHERE t."estado_origen"=eo."id_estado" AND t."estado_destino"=ed."id_estado"
                    AND t."id_rol_actor"=r."id_rol_actor");

-- ── CA-7.8 / CA-8: configuración efectiva de la Fase 1 ────────────────────
-- minimo_horas_ssu ya existía pero era código muerto; ahora la lee el backend.
INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito")
SELECT 'minimo_horas_ssu','60','Horas mínimas del cronograma para enviar la propuesta','INT','GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Configuracion" WHERE "clave"='minimo_horas_ssu');

-- Plazo de respuesta del docente asesor (días hábiles) antes del archivado.
INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito")
SELECT 'plazo_respuesta_asesor','5','Días hábiles para que el asesor acepte o rechace antes del archivado','INT','GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Configuracion" WHERE "clave"='plazo_respuesta_asesor');

-- Umbral de advertencia de prórroga/extemporáneo (rules V0.4 §3.4).
INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito")
SELECT 'umbral_prorroga_horas','45','Horas entre las cuales el envío se permite con advertencia de prórroga','INT','GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Configuracion" WHERE "clave"='umbral_prorroga_horas');

-- ── Verificación ─────────────────────────────────────────────────────────
SELECT 'Fase 1 aplicada' AS resultado,
  (SELECT COUNT(*) FROM "RSU_Estado_Proyecto" WHERE "codigo" IN
     ('ENVIADO_ASESOR','OBSERVADO_ASESOR','ACEPTADO_ASESOR','ARCHIVADO_VENCIMIENTO')) AS estados_fase1,
  (SELECT COUNT(*) FROM "RSU_Transicion_Estado" t
     JOIN "RSU_Estado_Proyecto" eo ON eo."id_estado"=t."estado_origen"
    WHERE eo."codigo" IN ('BORRADOR','ENVIADO_ASESOR','OBSERVADO_ASESOR','ACEPTADO_ASESOR','ARCHIVADO_VENCIMIENTO')) AS transiciones_fase1;