-- ============================================================================
-- FASE 2 · DATOS DE DEMOSTRACIÓN — HU-F2-T2
-- Mini-RSU · Facultad de Ingeniería · UNDC
--
-- Migración idempotente: se puede aplicar varias veces sin efecto duplicado.
--
-- Completa el seed demo para poder recorrer el flujo de aprobación con criterio:
--   · las cuentas que faltaban (Diego, Fiorella y Rosa) y sus módulos;
--   · equipos formados en el SSU y en los dos PEP;
--   · horas acumuladas coherentes con el avance del SSU;
--   · problemática y ODS en los cinco proyectos;
--   · la asesora del proyecto de voluntariado (Rosa Mendoza).
-- ============================================================================

SET client_min_messages = warning;
BEGIN;

-- ── 1. Estudiantes adicionales para equipos completos ──────────────────────
INSERT INTO public."Estudiante"
  ("id_estudiante","codigo_estudiante","dni","nombres","apellidos","correo_institucional","id_escuela","estado","fecha_ingreso")
VALUES
  (5,'EST005','20000005','María Fernanda','López','mfernanda.lopez@undc.edu.pe',1,'ACTIVO','2025-03-01'),
  (6,'EST006','20000006','Javier','Soto','javier.soto@undc.edu.pe',1,'ACTIVO','2024-08-01'),
  (7,'EST007','20000007','Lucía','Hernández','lucia.hernandez@undc.edu.pe',1,'ACTIVO','2024-08-01')
ON CONFLICT DO NOTHING;

INSERT INTO public."Estudiante_Ciclo" ("id_estudiante","id_ciclo","ciclo_numerico","estado")
VALUES (5,1,5,'MATRICULADO'),(6,1,6,'MATRICULADO'),(7,1,7,'MATRICULADO')
ON CONFLICT DO NOTHING;

-- ── 2. Cuentas que faltaban (clave undc2026) ───────────────────────────────
-- Diego (estudiante 3) y Fiorella (estudiante 4) ya existían como personas pero
-- no tenían usuario; Rosa Mendoza (docente 5) tampoco. Sin cuenta no se puede
-- entrar a revisar el flujo.
INSERT INTO public."RSU_Usuario"
  ("id_usuario","correo","nombre","password_hash","rol","tipo_usuario","id_persona","activo")
VALUES
  (16,'lider.voluntariado@undc.edu.pe','Diego Vargas',
   '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG','ESTUDIANTE_PROP','ESTUDIANTE',3,true),
  (17,'publicacion@undc.edu.pe','Fiorella Gutiérrez',
   '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG','ESTUDIANTE_PROP','ESTUDIANTE',4,true),
  (18,'rosa.mendoza@undc.edu.pe','Rosa Mendoza',
   '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG','DOCENTE_RESP','DOCENTE',5,true)
ON CONFLICT DO NOTHING;

-- ── 3. Módulos (capa 1 · VER) de las cuentas nuevas ────────────────────────
-- Estudiantes: solo lo del proyecto y sus trámites.
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('evidencias'),('entregables'),('encuestas'),
    ('documentos'),('catalogos')
) AS m(clave)
WHERE u.correo IN ('lider.voluntariado@undc.edu.pe','publicacion@undc.edu.pe')
  AND NOT EXISTS (SELECT 1 FROM "RSU_Usuario_Permiso" p WHERE p.id_usuario = u.id_usuario AND p.modulo = m.clave);

-- Docente: asesoría, verificación de entregables, monitoreos y su carga.
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('bandeja'),('entregables'),('evidencias'),('beneficiarios'),
    ('encuestas'),('monitoreo'),('catalogos'),('documentos')
) AS m(clave)
WHERE u.correo = 'rosa.mendoza@undc.edu.pe'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Usuario_Permiso" p WHERE p.id_usuario = u.id_usuario AND p.modulo = m.clave);

-- ── 4. Equipos formados ────────────────────────────────────────────────────
-- SSU en ejecución: Ana (líder) + Carlos + María Fernanda = 3 integrantes.
INSERT INTO public."RSU_Participante_Estudiante"
  ("id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo")
SELECT 1,5,4,45.00,'2026-04-02','ACTIVO',true
WHERE NOT EXISTS (SELECT 1 FROM public."RSU_Participante_Estudiante" WHERE "id_proyecto" = 1 AND "id_estudiante" = 5);

-- PEP financiado (en revisión de Escuela): equipo de estudiantes.
INSERT INTO public."RSU_Participante_Estudiante"
  ("id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo")
SELECT * FROM (VALUES
  (2,6,4,12.00,'2026-04-10'::date,'INSCRITO',true),
  (2,7,4,10.00,'2026-04-10'::date,'INSCRITO',true)
) AS v("id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo")
WHERE NOT EXISTS (SELECT 1 FROM public."RSU_Participante_Estudiante" pe
                  WHERE pe."id_proyecto" = v."id_proyecto" AND pe."id_estudiante" = v."id_estudiante");

-- PEP autofinanciado (cerrado): su equipo queda como FINALIZADO.
INSERT INTO public."RSU_Participante_Estudiante"
  ("id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo")
SELECT * FROM (VALUES
  (5,6,4,30.00,'2026-03-15'::date,'FINALIZADO',true),
  (5,7,4,28.00,'2026-03-15'::date,'FINALIZADO',true)
) AS v("id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo")
WHERE NOT EXISTS (SELECT 1 FROM public."RSU_Participante_Estudiante" pe
                  WHERE pe."id_proyecto" = v."id_proyecto" AND pe."id_estudiante" = v."id_estudiante");

-- ── 5. Horas coherentes con el avance del SSU (45 h de 60) ────────────────
UPDATE public."RSU_Participante_Estudiante" SET "horas_acumuladas" = 45.00
 WHERE "id_proyecto" = 1 AND "id_estudiante" = 2;

-- ── 6. Problemática y ODS en los cinco proyectos ────────────────────────────
UPDATE public."RSU_Proyecto" SET "problematica" =
  'Alta prevalencia de anemia en escolares de primaria de San Vicente de Cañete, que afecta su rendimiento escolar y desarrollo cognitivo.',
  "ods" = '3' WHERE "id_proyecto" = 1;

UPDATE public."RSU_Proyecto" SET "problematica" =
  'Escasa gestión de residuos sólidos en Quilmaná: no hay puntos limpios ni cultura de separación en origen, lo que contamina el entorno y la salud vecinal.',
  "ods" = '11' WHERE "id_proyecto" = 2;

UPDATE public."RSU_Proyecto" SET "problematica" =
  'Deserción y bajo rendimiento en matemática de escolares de secundaria de Imperial, que limita su acceso a estudios superiores.',
  "ods" = '4' WHERE "id_proyecto" = 3;

UPDATE public."RSU_Proyecto" SET "problematica" =
  'La economía local de Cañete depende de actividades informales; se desconoce el aporte real del reciclaje comunitario al ingreso de los hogares.',
  "ods" = '8' WHERE "id_proyecto" = 4;

UPDATE public."RSU_Proyecto" SET "problematica" =
  'Comerciantes de San Vicente operan en la informalidad, sin herramientas de gestión empresarial ni acceso a formalización.',
  "ods" = '8' WHERE "id_proyecto" = 5;

-- ── 7. Asesora del proyecto de voluntariado ────────────────────────────────
-- Rosa Mendoza (docente 5) no tenía ningún proyecto: queda como asesora del
-- voluntariado, que antes no tenía asesor asignado.
UPDATE public."RSU_Proyecto" SET "id_docente_asesor" = 5 WHERE "id_proyecto" = 3;

-- ── 8. Secuencias ──────────────────────────────────────────────────────────
SELECT setval(pg_get_serial_sequence('"Estudiante"','id_estudiante'),
              COALESCE((SELECT MAX("id_estudiante") FROM "Estudiante"),1));
SELECT setval(pg_get_serial_sequence('"RSU_Usuario"','id_usuario'),
              COALESCE((SELECT MAX("id_usuario") FROM "RSU_Usuario"),1));
SELECT setval(pg_get_serial_sequence('"RSU_Participante_Estudiante"','id_participante'),
              COALESCE((SELECT MAX("id_participante") FROM "RSU_Participante_Estudiante"),1));

-- ── Verificación ──────────────────────────────────────────────────────────
SELECT 'Fase 2 datos aplicados' AS resultado,
  (SELECT COUNT(*) FROM "RSU_Usuario" WHERE correo IN
     ('lider.voluntariado@undc.edu.pe','publicacion@undc.edu.pe','rosa.mendoza@undc.edu.pe')) AS cuentas_nuevas,
  (SELECT COUNT(*) FROM "RSU_Proyecto" WHERE "problematica" IS NOT NULL AND "ods" IS NOT NULL) AS proyectos_con_contexto,
  (SELECT "id_docente_asesor" FROM "RSU_Proyecto" WHERE "id_proyecto" = 3) AS asesor_voluntariado,
  (SELECT COUNT(*) FROM "RSU_Participante_Estudiante" WHERE "id_proyecto" = 1) AS integrantes_ssu;

COMMIT;