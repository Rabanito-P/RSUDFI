-- ============================================================
-- UNDC RSU - Seed demo (datos de demostracion)
-- Estados y roles referenciados por codigo (modelo BPMN V3)
SET client_min_messages = warning;
BEGIN;

-- --- Docente ---
INSERT INTO public."Docente" VALUES (1, 'DOC001', '10000001', 'Laura', 'Torres', 'docente@undc.edu.pe', 1, NULL, 'ORDINARIO_TC', 'PRINCIPAL', 0.00, 8.00, true);
INSERT INTO public."Docente" VALUES (2, 'DOC002', '10000002', 'Pedro', 'Flores', 'colaborador@undc.edu.pe', 1, NULL, 'CONTRATADO', 'AUXILIAR', 0.00, 6.00, true);
INSERT INTO public."Docente" VALUES (3, 'DOC003', '10000003', 'Elena', 'Prado', 'decano.fia@undc.edu.pe', 1, NULL, 'ORDINARIO_TC', 'PRINCIPAL', 12.00, 10.00, true);
INSERT INTO public."Docente" VALUES (4, 'DOC004', '10000004', 'Jorge', 'Salazar', 'director.epis@undc.edu.pe', 1, NULL, 'ORDINARIO_DE', 'ASOCIADO', 8.00, 8.00, true);
INSERT INTO public."Docente" VALUES (5, 'DOC005', '10000005', 'Rosa', 'Mendoza', 'rosa.mendoza@undc.edu.pe', 1, NULL, 'CONTRATADO', 'AUXILIAR', 10.00, 6.00, true);

-- --- Estudiante ---
INSERT INTO public."Estudiante" VALUES (1, 'EST001', '20000001', 'Ana', 'Quispe', 'estudiante@undc.edu.pe', 1, 'ACTIVO', NULL);
INSERT INTO public."Estudiante" VALUES (2, 'EST002', '20000002', 'Carlos', 'Ramos', 'ejecutor@undc.edu.pe', 1, 'ACTIVO', NULL);
INSERT INTO public."Estudiante" VALUES (3, 'EST003', '20000003', 'Diego', 'Vargas', 'lider.voluntariado@undc.edu.pe', 1, 'ACTIVO', '2025-03-01');
INSERT INTO public."Estudiante" VALUES (4, 'EST004', '20000004', 'Fiorella', 'Gutiérrez', 'publicacion@undc.edu.pe', 1, 'ACTIVO', '2024-08-01');

-- --- Estudiante_Ciclo ---
INSERT INTO public."Estudiante_Ciclo" ("id_estudiante","id_ciclo","ciclo_numerico","estado") VALUES (1, 1, 5, 'MATRICULADO');
INSERT INTO public."Estudiante_Ciclo" ("id_estudiante","id_ciclo","ciclo_numerico","estado") VALUES (2, 1, 5, 'MATRICULADO');
INSERT INTO public."Estudiante_Ciclo" ("id_estudiante","id_ciclo","ciclo_numerico","estado") VALUES (3, 1, 3, 'MATRICULADO');
INSERT INTO public."Estudiante_Ciclo" ("id_estudiante","id_ciclo","ciclo_numerico","estado") VALUES (4, 1, 7, 'MATRICULADO');

-- --- RSU_Proyecto ---
INSERT INTO public."RSU_Proyecto" ("id_proyecto", "codigo_proyecto", "titulo", "id_escuela", "id_tipo", "modalidad", "id_linea_accion", "id_estado_actual", "id_ciclo_creacion", "id_estudiante_lider", "id_docente_asesor", "descripcion", "objetivo_general", "objetivos_especificos", "poblacion_beneficiaria", "sector_beneficiario", "numero_beneficiarios", "lugar_intervencion", "semestre", "fecha_inicio_plan", "fecha_fin_plan", "presupuesto_solicitado", "presupuesto_aprobado", "monto_ejecutado", "porcentaje_avance", "archivo_proyecto_url", "archivo_aprobacion_url", "id_resolucion_aprobacion", "fecha_aprobacion", "id_resolucion_cierre", "fecha_cierre", "activo", "created_at", "updated_at") VALUES (1, 'UNDC-RSU-2026-011', 'Campaña de prevención de anemia en San Vicente de Cañete', 1, 1, 'SSU', 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EJECUCION'), 1, 1, 1, 'Tamizaje de hemoglobina y charlas nutricionales en 3 colegios de San Vicente.', 'Reducir la prevalencia de anemia en escolares de primaria de San Vicente de Cañete.', '1. Tamizar 300 escolares. 2. Dictar 12 charlas nutricionales. 3. Entregar 200 kits de hierro.', 'Escolares de primaria', 'Salud', 120, 'San Vicente de Cañete', '2026-I', '2026-04-01', '2026-07-15', 1500.00, 1500.00, 675.00, 45.00, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-10-09 10:28:00.978079-05', '2026-10-09 10:28:00.978079-05');
INSERT INTO public."RSU_Proyecto" ("id_proyecto", "codigo_proyecto", "titulo", "id_escuela", "id_tipo", "modalidad", "id_linea_accion", "id_estado_actual", "id_ciclo_creacion", "id_estudiante_lider", "id_docente_asesor", "descripcion", "objetivo_general", "objetivos_especificos", "poblacion_beneficiaria", "sector_beneficiario", "numero_beneficiarios", "lugar_intervencion", "semestre", "fecha_inicio_plan", "fecha_fin_plan", "presupuesto_solicitado", "presupuesto_aprobado", "monto_ejecutado", "porcentaje_avance", "archivo_proyecto_url", "archivo_aprobacion_url", "id_resolucion_aprobacion", "fecha_aprobacion", "id_resolucion_cierre", "fecha_cierre", "activo", "created_at", "updated_at") VALUES (2, 'UNDC-RSU-2026-012', 'Plataforma de reciclaje comunitario en Quilmaná', 1, 2, 'PEP_FINANCIADO', 4, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_REVISION_ESCUELA'), 1, NULL, 2, 'Puntos limpios + app de reporte ciudadano para reciclaje en Quilmaná.', 'Implementar 4 puntos limpios y capacitar 200 vecinos en gestión de residuos.', '1. Instalar 4 puntos limpios. 2. Desarrollar app de reporte. 3. Capacitar 200 vecinos.', 'Vecinos de Quilmaná', 'Gestión Ambiental', 200, 'Quilmaná', '2026-I', '2026-05-01', '2026-11-30', 12000.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-10-09 10:28:01.016976-05', '2026-10-09 10:28:01.016976-05');
INSERT INTO public."RSU_Proyecto" ("id_proyecto", "codigo_proyecto", "titulo", "id_escuela", "id_tipo", "modalidad", "id_linea_accion", "id_estado_actual", "id_ciclo_creacion", "id_estudiante_lider", "id_docente_asesor", "descripcion", "objetivo_general", "objetivos_especificos", "poblacion_beneficiaria", "sector_beneficiario", "numero_beneficiarios", "lugar_intervencion", "semestre", "fecha_inicio_plan", "fecha_fin_plan", "presupuesto_solicitado", "presupuesto_aprobado", "monto_ejecutado", "porcentaje_avance", "archivo_proyecto_url", "archivo_aprobacion_url", "id_resolucion_aprobacion", "fecha_aprobacion", "id_resolucion_cierre", "fecha_cierre", "activo", "created_at", "updated_at") VALUES (3, 'UNDC-RSU-2026-013', 'Yanapay: reforzamiento matemático en Imperial', 1, 4, 'VOLUNTARIADO', 2, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='BORRADOR'), 1, 3, NULL, 'Clases sabatinas de matemática para escolares de secundaria de Imperial.', 'Nivelar a 60 escolares en matemática básica.', NULL, 'Escolares de secundaria', NULL, 60, 'Imperial', '2026-I', '2026-09-01', '2026-12-10', 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-10-09 10:28:01.024277-05', '2026-10-09 10:28:01.024277-05');
INSERT INTO public."RSU_Proyecto" ("id_proyecto", "codigo_proyecto", "titulo", "id_escuela", "id_tipo", "modalidad", "id_linea_accion", "id_estado_actual", "id_ciclo_creacion", "id_estudiante_lider", "id_docente_asesor", "descripcion", "objetivo_general", "objetivos_especificos", "poblacion_beneficiaria", "sector_beneficiario", "numero_beneficiarios", "lugar_intervencion", "semestre", "fecha_inicio_plan", "fecha_fin_plan", "presupuesto_solicitado", "presupuesto_aprobado", "monto_ejecutado", "porcentaje_avance", "archivo_proyecto_url", "archivo_aprobacion_url", "id_resolucion_aprobacion", "fecha_aprobacion", "id_resolucion_cierre", "fecha_cierre", "activo", "created_at", "updated_at") VALUES (4, 'UNDC-RSU-2026-014', 'Impacto del reciclaje comunitario en la economía local de Cañete', 1, 5, 'PUBLICACION_CIENTIFICA', 3, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EVALUACION_IMPACTO'), 1, 4, 1, 'Estudio del impacto del reciclaje comunitario en la economía local de Cañete, Lima.', 'Analizar la relación entre reciclaje comunitario y desarrollo económico local en Cañete.', NULL, 'Comunidad de Cañete', 'Desarrollo Económico', 500, 'Cañete', '2026-I', '2026-02-01', '2026-12-31', 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, true, '2026-10-09 10:28:01.041689-05', '2026-10-09 10:28:01.041689-05');
INSERT INTO public."RSU_Proyecto" ("id_proyecto", "codigo_proyecto", "titulo", "id_escuela", "id_tipo", "modalidad", "id_linea_accion", "id_estado_actual", "id_ciclo_creacion", "id_estudiante_lider", "id_docente_asesor", "descripcion", "objetivo_general", "objetivos_especificos", "poblacion_beneficiaria", "sector_beneficiario", "numero_beneficiarios", "lugar_intervencion", "semestre", "fecha_inicio_plan", "fecha_fin_plan", "presupuesto_solicitado", "presupuesto_aprobado", "monto_ejecutado", "porcentaje_avance", "archivo_proyecto_url", "archivo_aprobacion_url", "id_resolucion_aprobacion", "fecha_aprobacion", "id_resolucion_cierre", "fecha_cierre", "activo", "created_at", "updated_at") VALUES (5, 'UNDC-RSU-2026-015', 'Taller de emprendimiento para comerciantes de San Vicente', 1, 3, 'PEP_AUTOFINANCIADO', 3, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='CERRADO'), 1, NULL, 2, 'Taller de emprendimiento y formalización para comerciantes de San Vicente.', 'Capacitar 80 comerciantes en gestión empresarial y formalización.', NULL, 'Comerciantes de San Vicente', 'Desarrollo Económico', 80, 'San Vicente de Cañete', '2026-I', '2026-03-15', '2026-06-30', 0.00, 0.00, 0.00, 100.00, NULL, NULL, NULL, '2026-03-20', NULL, '2026-07-01', true, '2026-10-09 10:28:01.080975-05', '2026-10-09 10:28:01.080975-05');

-- --- RSU_Proyecto_Rol ---
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (1, 1, 'ESTUDIANTE', 'ESTUDIANTE_PROP', '2026-10-09 10:28:01.888817-05', 3, true);
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (1, 2, 'ESTUDIANTE', 'ESTUDIANTE_PROP', '2026-10-09 10:28:01.888817-05', 3, true);
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (1, 1, 'DOCENTE', 'DOCENTE_RESP', '2026-10-09 10:28:01.888817-05', 3, true);
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (2, 2, 'DOCENTE', 'DOCENTE_RESP', '2026-10-09 10:28:01.888817-05', 3, true);
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (2, 1, 'DOCENTE', 'DOCENTE_RESP', '2026-10-09 10:28:01.888817-05', 3, true);
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (3, 3, 'ESTUDIANTE', 'ESTUDIANTE_PROP', '2026-10-09 10:28:01.888817-05', 3, true);
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (4, 4, 'ESTUDIANTE', 'ESTUDIANTE_PROP', '2026-10-09 10:28:01.888817-05', 3, true);
INSERT INTO public."RSU_Proyecto_Rol" ("id_proyecto", "id_usuario", "tipo_usuario", "rol_actor", "fecha_asignacion", "asignado_por", "activo") VALUES (5, 2, 'DOCENTE', 'DOCENTE_RESP', '2026-10-09 10:28:01.888817-05', 3, true);

-- --- RSU_Participante_Estudiante ---
INSERT INTO public."RSU_Participante_Estudiante" ("id_participante","id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo") VALUES (1, 1, 2, 4, 0.00, '2026-04-02', 'ACTIVO', true);
INSERT INTO public."RSU_Participante_Estudiante" ("id_participante","id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo") VALUES (2, 3, 3, 4, 0.00, '2026-08-15', 'INSCRITO', true);
INSERT INTO public."RSU_Participante_Estudiante" ("id_participante","id_proyecto","id_estudiante","id_rol_proyecto","horas_acumuladas","fecha_inscripcion","estado_participacion","validacion_ciclo") VALUES (3, 4, 4, 4, 0.00, '2026-02-10', 'ACTIVO', true);

-- --- RSU_Asignacion_Docente ---
INSERT INTO public."RSU_Asignacion_Docente" VALUES (1, 1, 1, 3, 4.00, 'NO_LECTIVA', 1, '2026-04-02', NULL, 'APROBADA', NULL, NULL);
INSERT INTO public."RSU_Asignacion_Docente" VALUES (2, 2, 2, 1, 6.00, 'NO_LECTIVA', 1, '2026-04-10', NULL, 'APROBADA', NULL, NULL);
INSERT INTO public."RSU_Asignacion_Docente" VALUES (3, 2, 1, 2, 2.00, 'NO_LECTIVA', 1, '2026-04-10', NULL, 'APROBADA', NULL, NULL);
INSERT INTO public."RSU_Asignacion_Docente" VALUES (4, 3, 1, 3, 3.00, 'NO_LECTIVA', 1, '2026-08-15', NULL, 'PENDIENTE', NULL, NULL);
INSERT INTO public."RSU_Asignacion_Docente" VALUES (5, 4, 1, 3, 2.00, 'NO_LECTIVA', 1, '2026-02-10', NULL, 'APROBADA', NULL, NULL);
INSERT INTO public."RSU_Asignacion_Docente" VALUES (6, 5, 2, 1, 4.00, 'NO_LECTIVA', 1, '2026-03-15', NULL, 'APROBADA', NULL, NULL);

-- --- RSU_Beneficiario ---
INSERT INTO public."RSU_Beneficiario" VALUES (1, 'PERSONA_NATURAL', '30000001', 'María', 'Huamán', '1985-03-15', 'F', NULL, NULL, NULL, '999000001', NULL, 'maria.human@email.com', 'Av. Central 101', 'San Vicente', 'Cañete', 'Lima', 'Ama de casa', 'Secundaria', 'Pobreza', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (2, 'PERSONA_NATURAL', '30000002', 'José', 'Rojas', '1978-07-22', 'M', NULL, NULL, NULL, '999000002', NULL, 'jose.rojas@email.com', 'Jr. Lima 205', 'San Vicente', 'Cañete', 'Lima', 'Comerciante', 'Secundaria', 'Pobreza', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (3, 'PERSONA_NATURAL', '30000003', 'Rosa', 'Paredes', '1990-11-08', 'F', NULL, NULL, NULL, '999000003', NULL, 'rosa.paredes@email.com', 'Calle Real 310', 'Imperial', 'Cañete', 'Lima', 'Estudiante', 'Universidad', 'Vulnerabilidad social', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (4, 'PERSONA_NATURAL', '30000004', 'Luis', 'Quispe', '1982-05-30', 'M', NULL, NULL, NULL, '999000004', NULL, 'luis.quispe@email.com', 'Av. Benavides 45', 'San Vicente', 'Cañete', 'Lima', 'Agricultor', 'Primaria', 'Pobreza extrema', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (5, 'PERSONA_NATURAL', '30000005', 'Carmen', 'Sánchez', '1995-09-12', 'F', NULL, NULL, NULL, '999000005', NULL, 'carmen.sanchez@email.com', 'Jr. Comercio 88', 'Quilmaná', 'Cañete', 'Lima', 'Comerciante', 'Secundaria', 'Pobreza', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (6, 'PERSONA_NATURAL', '30000006', 'Miguel', 'Torres', '1988-01-25', 'M', NULL, NULL, NULL, '999000006', NULL, 'miguel.torres@email.com', 'Av. Principal 12', 'Imperial', 'Cañete', 'Lima', 'Chofer', 'Secundaria', 'Vulnerabilidad social', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (7, 'PERSONA_NATURAL', '30000007', 'Ana', 'Mendoza', '1992-04-18', 'F', NULL, NULL, NULL, '999000007', NULL, 'ana.mendoza@email.com', 'Calle 5 de Mayo 34', 'San Vicente', 'Cañete', 'Lima', 'Estudiante', 'Universidad', 'Pobreza', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (8, 'PERSONA_NATURAL', '30000008', 'Pedro', 'Gutiérrez', '1975-12-03', 'M', NULL, NULL, NULL, '999000008', NULL, 'pedro.gutierrez@email.com', 'Jr. Ayacucho 67', 'Quilmaná', 'Cañete', 'Lima', 'Pescador', 'Primaria', 'Pobreza extrema', true, '2026-10-09 10:28:01.335353-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (9, 'INSTITUCION', NULL, NULL, NULL, NULL, NULL, '20000000001', 'I.E. San Vicente de Cañete', 'Dir. Elena Prado', '999100001', NULL, 'ie.sanvicente@educacion.pe', 'Av. Central s/n', 'San Vicente', 'Cañete', 'Lima', 'Educación', 'Secundaria', NULL, true, '2026-10-09 10:28:01.348165-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (10, 'INSTITUCION', NULL, NULL, NULL, NULL, NULL, '20000000002', 'Municipalidad Distrital de Quilmaná', 'Alcalde Juan Pérez', '999100002', NULL, 'municipalidad@quilmana.gob.pe', 'Plaza de Armas s/n', 'Quilmaná', 'Cañete', 'Lima', 'Gobierno local', 'N/A', NULL, true, '2026-10-09 10:28:01.348165-05', NULL);
INSERT INTO public."RSU_Beneficiario" VALUES (11, 'INSTITUCION', NULL, NULL, NULL, NULL, NULL, '20000000003', 'Comité de Desarrollo de Imperial', 'Presidenta Rosa Díaz', '999100003', NULL, 'cdi@imperial.org.pe', 'Av. Imperial 200', 'Imperial', 'Cañete', 'Lima', 'Organización social', 'N/A', NULL, true, '2026-10-09 10:28:01.348165-05', NULL);

-- --- RSU_Proyecto_Beneficiario ---
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (1, 1, 1, '2026-04-05', 'PARTICIPANTE', 'Beneficiario de campaña anemia', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (2, 1, 2, '2026-04-05', 'PARTICIPANTE', 'Beneficiario de campaña anemia', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (3, 1, 3, '2026-04-05', 'PARTICIPANTE', 'Beneficiario de campaña anemia', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (4, 1, 4, '2026-04-05', 'PARTICIPANTE', 'Beneficiario de campaña anemia', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (5, 1, 9, '2026-04-05', 'PARTICIPANTE', 'Beneficiario de campaña anemia', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (6, 2, 5, '2026-04-12', 'PARTICIPANTE', 'Vecino de Quilmaná', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (7, 2, 6, '2026-04-12', 'PARTICIPANTE', 'Vecino de Quilmaná', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (8, 2, 10, '2026-04-12', 'PARTICIPANTE', 'Vecino de Quilmaná', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (9, 5, 2, '2026-03-18', 'PARTICIPANTE', 'Comerciante capacitado', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (10, 5, 5, '2026-03-18', 'PARTICIPANTE', 'Comerciante capacitado', true);
INSERT INTO public."RSU_Proyecto_Beneficiario" VALUES (11, 5, 7, '2026-03-18', 'PARTICIPANTE', 'Comerciante capacitado', true);

-- --- RSU_Actividad_Campo ---
INSERT INTO public."RSU_Actividad_Campo" VALUES (1, 1, NULL, 'Tamizaje hemoglobina — I.E. San Vicente', 'Jornada de tamizaje + charla nutricional', '2026-05-10', '2026-05-10', '09:00:00', '13:00:00', 240, 'I.E. San Vicente', 1, NULL, 'EJECUTADA', 80);
INSERT INTO public."RSU_Actividad_Campo" VALUES (2, 1, NULL, 'Charla nutricional — Colegio Secundario', 'Charla sobre alimentación rica en hierro', '2026-05-15', '2026-05-15', '10:00:00', '12:00:00', 120, 'Colegio Secundario San Vicente', 1, NULL, 'EJECUTADA', 60);
INSERT INTO public."RSU_Actividad_Campo" VALUES (3, 2, NULL, 'Instalación punto limpio — Quilmaná', 'Instalación de primer punto limpio', '2026-06-01', '2026-06-01', '08:00:00', '12:00:00', 240, 'Plaza de Quilmaná', 2, NULL, 'PROGRAMADA', 0);
INSERT INTO public."RSU_Actividad_Campo" VALUES (4, 5, NULL, 'Taller emprendimiento — Módulo 1', 'Gestión empresarial básica', '2026-04-05', '2026-04-05', '09:00:00', '13:00:00', 240, 'Centro Cultural San Vicente', 2, NULL, 'EJECUTADA', 40);
INSERT INTO public."RSU_Actividad_Campo" VALUES (5, 5, NULL, 'Taller emprendimiento — Módulo 2', 'Formalización y trámites', '2026-04-12', '2026-04-12', '09:00:00', '13:00:00', 240, 'Centro Cultural San Vicente', 2, NULL, 'EJECUTADA', 35);

-- --- RSU_Asistencia_Beneficiario ---
INSERT INTO public."RSU_Asistencia_Beneficiario" VALUES (1, 1, 1, NULL, 'Asistió');
INSERT INTO public."RSU_Asistencia_Beneficiario" VALUES (2, 1, 2, NULL, 'Asistió');
INSERT INTO public."RSU_Asistencia_Beneficiario" VALUES (3, 4, 2, NULL, 'Asistió');
INSERT INTO public."RSU_Asistencia_Beneficiario" VALUES (4, 4, 5, NULL, 'Asistió');

-- --- RSU_Monitoreo ---
INSERT INTO public."RSU_Monitoreo" VALUES (1, 1, '2026-05-15', 1, 45.00, 'Tamizaje 180/300, 8/12 charlas', 'Avance según lo planificado', 'SATISFACTORIO', NULL);
INSERT INTO public."RSU_Monitoreo" VALUES (2, 1, '2026-06-15', 1, 60.00, 'Tamizaje 240/300, 10/12 charlas', 'Se requiere acelerar ritmo', 'SATISFACTORIO', NULL);

-- --- RSU_Encuesta_Beneficiario ---
INSERT INTO public."RSU_Encuesta_Beneficiario" VALUES (1, 1, 1, '2026-06-01', NULL, 'PRESENCIAL', 4.50, 'MUY_BUENO', 'Excelente campaña, muy útil para mi hijo', NULL, NULL, 'REGISTRADA', NULL, NULL, '2026-10-09 10:28:01.48471-05');
INSERT INTO public."RSU_Encuesta_Beneficiario" VALUES (2, 1, 2, '2026-06-02', NULL, 'PRESENCIAL', 3.50, 'BUENO', 'Buena campaña, aunque podría mejorar la logística', NULL, NULL, 'REGISTRADA', NULL, NULL, '2026-10-09 10:28:01.670724-05');
INSERT INTO public."RSU_Encuesta_Beneficiario" VALUES (3, 5, 2, '2026-06-15', NULL, 'PRESENCIAL', 4.67, 'MUY_BUENO', 'El taller me ayudó a formalizar mi negocio', NULL, NULL, 'REGISTRADA', NULL, NULL, '2026-10-09 10:28:01.759747-05');

-- --- RSU_Respuesta_Encuesta ---
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (1, 1, 1, 4, 'BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (2, 1, 2, 5, 'MUY_BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (3, 1, 3, 4, 'BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (4, 1, 4, 5, 'MUY_BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (5, 1, 5, 4, 'BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (6, 1, 6, 5, 'MUY_BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (7, 2, 1, 3, 'REGULAR');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (8, 2, 2, 4, 'BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (9, 2, 3, 3, 'REGULAR');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (10, 2, 4, 4, 'BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (11, 2, 5, 3, 'REGULAR');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (12, 2, 6, 4, 'BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (13, 3, 1, 5, 'MUY_BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (14, 3, 2, 5, 'MUY_BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (15, 3, 3, 4, 'BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (16, 3, 4, 5, 'MUY_BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (17, 3, 5, 5, 'MUY_BUENO');
INSERT INTO public."RSU_Respuesta_Encuesta" VALUES (18, 3, 6, 4, 'BUENO');

-- --- RSU_Presupuesto_Movimiento ---
INSERT INTO public."RSU_Presupuesto_Movimiento" VALUES (1, 2, 1, 'ASIGNACION', 12000.00, '2026-04-15', NULL, 1, 'Asignación inicial PEP financiado (2% Art.125)');
INSERT INTO public."RSU_Presupuesto_Movimiento" VALUES (2, 2, 1, 'GASTO', 3500.00, '2026-05-20', NULL, 1, 'Materiales puntos limpios');
INSERT INTO public."RSU_Presupuesto_Movimiento" VALUES (3, 2, 1, 'GASTO', 1200.00, '2026-06-05', NULL, 1, 'Capacitación vecinos');
INSERT INTO public."RSU_Presupuesto_Movimiento" VALUES (4, 1, 1, 'ASIGNACION', 1500.00, '2026-04-01', NULL, 1, 'Asignación SSU anemia');
INSERT INTO public."RSU_Presupuesto_Movimiento" VALUES (5, 1, 1, 'GASTO', 675.00, '2026-05-10', NULL, 1, 'Kits de hierro + logística');

-- --- RSU_Flujo_Aprobacion ---
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (1, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='BORRADOR'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_REVISION_ESCUELA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='ESTUDIANTE_PROP'), 1, NULL, NULL, '2026-04-01 09:00:00-05', 'Envío a revisión de Escuela', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (2, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_REVISION_ESCUELA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='CON_VB_ESCUELA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DIR_ESCUELA'), 4, NULL, NULL, '2026-04-03 14:30:00-05', 'V°B° Escuela: viable técnicamente', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (3, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='CON_VB_ESCUELA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_PRIORIZACION_FACULTAD'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DIR_ESCUELA'), 4, NULL, NULL, '2026-04-03 15:00:00-05', 'Elevado a Decanato', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (4, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_PRIORIZACION_FACULTAD'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_DICTAMEN_CONSEJO'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-04-05 10:00:00-05', 'Aprobado por Decanato', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (5, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_DICTAMEN_CONSEJO'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_ASIGNACION_CARGA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-04-06 11:00:00-05', 'Documentos listos para descarga', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (6, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_ASIGNACION_CARGA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='REGISTRADO_OFICIAL'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-04-07 09:00:00-05', 'Transferido a Universidad', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (7, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='REGISTRADO_OFICIAL'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EVALUACION_IMPACTO'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-04-08 10:00:00-05', 'En evaluación DRSU', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (8, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EVALUACION_IMPACTO'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EVALUACION_VALIDADA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-04-10 12:00:00-05', 'Aprobado por DRSU', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (9, 1, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EVALUACION_VALIDADA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EJECUCION'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DOCENTE_RESP'), 2, NULL, NULL, '2026-04-11 08:00:00-05', 'Inicio de ejecución', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (10, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='BORRADOR'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_REVISION_ESCUELA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DOCENTE_RESP'), 2, NULL, NULL, '2026-03-15 09:00:00-05', 'Envío a revisión', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (11, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_REVISION_ESCUELA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='CON_VB_ESCUELA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DIR_ESCUELA'), 4, NULL, NULL, '2026-03-17 10:00:00-05', 'V°B° Escuela', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (12, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='CON_VB_ESCUELA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_PRIORIZACION_FACULTAD'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DIR_ESCUELA'), 4, NULL, NULL, '2026-03-17 11:00:00-05', 'Elevado a Decanato', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (13, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_PRIORIZACION_FACULTAD'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_DICTAMEN_CONSEJO'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-03-18 09:00:00-05', 'Aprobado por Decanato', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (14, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_DICTAMEN_CONSEJO'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_ASIGNACION_CARGA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-03-19 10:00:00-05', 'Documentos listos', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (15, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_ASIGNACION_CARGA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='REGISTRADO_OFICIAL'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-03-20 09:00:00-05', 'Transferido', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (16, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='REGISTRADO_OFICIAL'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EVALUACION_IMPACTO'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-03-21 10:00:00-05', 'En evaluación DRSU', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (17, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EVALUACION_IMPACTO'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EVALUACION_VALIDADA'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='CONSEJO_FACULTAD'), 3, NULL, NULL, '2026-03-22 12:00:00-05', 'Aprobado por DRSU', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (18, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EVALUACION_VALIDADA'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EJECUCION'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DOCENTE_RESP'), 2, NULL, NULL, '2026-03-23 08:00:00-05', 'Inicio de ejecución', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (19, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_EJECUCION'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_MONITOREO'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DOCENTE_RESP'), 1, NULL, NULL, '2026-05-01 09:00:00-05', 'En monitoreo', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (20, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='EN_MONITOREO'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='INFORME_FINAL_PRESENTADO'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='ESTUDIANTE_PROP'), 1, NULL, NULL, '2026-06-15 10:00:00-05', 'Informe final presentado', 'APROBADO');
INSERT INTO public."RSU_Flujo_Aprobacion" ("id_flujo", "id_proyecto", "id_estado_origen", "id_estado_destino", "id_rol_actor", "id_usuario", "id_documento_sustento", "id_resolucion", "fecha_transicion", "comentarios", "resultado") VALUES (21, 5, (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='INFORME_FINAL_PRESENTADO'), (SELECT id_estado FROM "RSU_Estado_Proyecto" WHERE codigo='CERRADO'), (SELECT id_rol_actor FROM "RSU_Rol_Actor" WHERE codigo='DIR_ESCUELA'), 4, NULL, NULL, '2026-07-01 09:00:00-05', 'Proyecto cerrado', 'APROBADO');

-- --- RSU_Entregable ---
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (1, 1, 'PRIMER ENTREGABLE', 1, '2026-07-04', 10.00, 'POR_ENVIAR', NULL, NULL, NULL, NULL);
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (2, 1, 'SEGUNDO ENTREGABLE', 2, '2026-08-01', 10.00, 'POR_ENVIAR', NULL, NULL, NULL, NULL);
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (3, 1, 'TERCER ENTREGABLE', 3, '2026-09-05', 10.00, 'POR_ENVIAR', NULL, NULL, NULL, NULL);
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (4, 1, 'ENCUESTA', 4, NULL, 5.00, 'POR_ENVIAR', NULL, NULL, NULL, NULL);
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (5, 1, 'INFORME FINAL', 5, NULL, 20.00, 'POR_ENVIAR', NULL, NULL, NULL, NULL);
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (6, 5, 'INFORME EJECUCION', 1, '2026-05-15', 15.00, 'APROBADO', NULL, NULL, NULL, NULL);
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (7, 5, 'ENCUESTA', 2, '2026-06-01', 5.00, 'APROBADO', NULL, NULL, NULL, NULL);
INSERT INTO public."RSU_Entregable" ("id_entregable", "id_proyecto", "nombre", "orden", "fecha_limite", "horas_asignadas", "estado", "id_verificador", "fecha_verificacion", "observaciones", "id_documento") VALUES (8, 5, 'INFORME FINAL', 3, '2026-06-30', 20.00, 'APROBADO', NULL, NULL, NULL, NULL);

-- --- RSU_Comite_RSU ---
INSERT INTO public."RSU_Comite_RSU" VALUES (1, 1, 1, true, '2026-01-01', '2027-12-31', NULL, 'ACTIVO', '2026-10-09 10:28:01.875328-05', 3);
INSERT INTO public."RSU_Comite_RSU" VALUES (2, 1, 2, false, '2026-01-01', '2027-12-31', NULL, 'ACTIVO', '2026-10-09 10:28:01.875328-05', 3);
INSERT INTO public."RSU_Comite_RSU" VALUES (3, 1, 4, false, '2026-01-01', '2027-12-31', NULL, 'ACTIVO', '2026-10-09 10:28:01.875328-05', 3);

-- --- RSU_Indicador_Impacto ---
INSERT INTO public."RSU_Indicador_Impacto" VALUES (1, 1, 'Escolares tamizados', 0.00, 300.00, 180.00, 'escolares', 60.00, 'Registro de tamizaje');
INSERT INTO public."RSU_Indicador_Impacto" VALUES (2, 1, 'Charlas nutricionales realizadas', 0.00, 12.00, 8.00, 'charlas', 66.67, 'Actas de charla');
INSERT INTO public."RSU_Indicador_Impacto" VALUES (3, 1, 'Kits de hierro entregados', 0.00, 200.00, 120.00, 'kits', 60.00, 'Pecosa de entrega');
INSERT INTO public."RSU_Indicador_Impacto" VALUES (4, 5, 'Comerciantes capacitados', 0.00, 80.00, 80.00, 'personas', 100.00, 'Lista de asistencia');
INSERT INTO public."RSU_Indicador_Impacto" VALUES (5, 5, 'Negocios formalizados', 0.00, 30.00, 12.00, 'negocios', 40.00, 'Registro de formalización');

-- --- RSU_Leccion_Aprendida ---
INSERT INTO public."RSU_Leccion_Aprendida" VALUES (1, 5, 'La participación de comerciantes aumenta cuando los talleres se realizan en horarios nocturnos.', 'Incluir módulo de emprendimiento en cursos de Administración.', '2026-06-20', 2);
INSERT INTO public."RSU_Leccion_Aprendida" VALUES (2, 5, 'La formalización requiere acompañamiento continuo, no solo capacitación.', 'Crear programa de seguimiento post-taller.', '2026-06-25', 2);

-- --- RSU_Solicitud_Constancia ---
INSERT INTO public."RSU_Solicitud_Constancia" VALUES (1, 1, 1, 'PARTICIPACION', '2026-10-09 10:28:02.004703-05', 'PENDIENTE', NULL, NULL, NULL);
INSERT INTO public."RSU_Solicitud_Constancia" VALUES (2, 1, 2, 'PARTICIPACION', '2026-10-09 10:28:02.004703-05', 'APROBADA', NULL, 4, '2026-06-20');

-- --- RSU_Usuario ---
INSERT INTO public."RSU_Usuario" VALUES (2, 'ejecutor@undc.edu.pe', 'Carlos Ramos', '$2a$10$oOe54jpmjjJFBaZ.8g1TbeCITumNj5IXK7Dibyv22swXKqNdm5rW2', 'ESTUDIANTE_EJEC', 'ESTUDIANTE', 2, true, NULL, '2026-10-09 10:28:02.024151-05');
INSERT INTO public."RSU_Usuario" VALUES (3, 'docente@undc.edu.pe', 'Laura Torres', '$2a$10$otJZxtbhTGxCv1BgWoFaO.y05CvQ.XpzqZ4vCkyZ.hvNYUty9WVTK', 'DOCENTE_RESP', 'DOCENTE', 1, true, NULL, '2026-10-09 10:28:02.024151-05');
INSERT INTO public."RSU_Usuario" VALUES (5, 'escuela@undc.edu.pe', 'Elena Prado', '$2a$10$6f0B26Sc7N1A9ntIewRyuOe1Mzt4leUEbRP2gCdwQyTtJdEx8yvti', 'DIR_ESCUELA', 'ADMINISTRATIVO', NULL, true, NULL, '2026-10-09 10:28:02.024151-05');
INSERT INTO public."RSU_Usuario" VALUES (7, 'rsfacultad@undc.edu.pe', 'Jorge Salazar', '$2a$10$4Clgj0MLcu8BFYckfMGnL.a213nCWUn2kuX0fppVr7PqleL0.r1G6', 'DIR_RS_FACULTAD', 'ADMINISTRATIVO', NULL, true, NULL, '2026-10-09 10:28:02.024151-05');
INSERT INTO public."RSU_Usuario" VALUES (8, 'consejo@undc.edu.pe', 'Andrés Cáceres', '$2a$10$pG4W14LXCRj7NF49lEC7cumDU4MqYi2PYxi1B8Y9M/HBN9Zis.WOe', 'CONSEJO_FACULTAD', 'ADMINISTRATIVO', NULL, true, NULL, '2026-10-09 10:28:02.024151-05');
INSERT INTO public."RSU_Usuario" VALUES (12, 'admin@undc.edu.pe', 'Administrador RSU', '', 'ADMIN', 'ADMINISTRATIVO', NULL, true, NULL, '2026-10-09 10:28:02.024151-05');
INSERT INTO public."RSU_Usuario" VALUES (1, 'estudiante@undc.edu.pe', 'Ana Quispe', '', 'ESTUDIANTE_PROP', 'ESTUDIANTE', 1, true, '2026-10-09 10:29:04.335586-05', '2026-10-09 10:28:02.024151-05');

-- ── Rol Decano (rules fase de propuesta-aprobacion-cierre §2) ──
-- El Decano representa a la Facultad: valida el expediente en el Comité RSU y
-- presiona "Aprobar y Elevar" (exporta el Oficio de Elevación a DRSU Central).
-- Es una autoridad de la Facultad, no de la DRSU.
INSERT INTO public."Docente" VALUES (6, 'DOC006', '10000006', 'Carlos', 'Almidon', 'decano@undc.edu.pe', 1, NULL, 'ORDINARIO_TC', 'PRINCIPAL', 0.00, 10.00, true);
INSERT INTO public."RSU_Usuario" VALUES (14, 'decano@undc.edu.pe', 'Carlos Alcides Almidon Carrion', '', 'DECANO', 'DOCENTE', 6, true, NULL, '2026-10-09 10:28:02.024151-05');
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG' WHERE correo = 'decano@undc.edu.pe';
-- El Decano queda registrado como titular de la facultad.
UPDATE public."Facultad" SET decano_id = 6 WHERE codigo = 'FIA';

-- ── Usuario oculto de prueba: RSU Central / VRA ──
-- NO aparece como acceso rápido en la pantalla de ingreso. Según las rules,
-- la DRSU Central y la Vicepresidencia Académica no operan el sistema:
-- expiden sus documentos fuera de la plataforma (Mesa de Partes) y quien los
-- sube y registra es el encargado, la Dirección de RSU de la Facultad.
-- Esta cuenta existe solo para testear ese paso: el rol DIR_CENTRAL_RS es el
-- que registra lo emitido por la DRSU/VPA y activa el proyecto.
INSERT INTO public."RSU_Usuario" VALUES (15, 'rsu.central@undc.edu.pe', 'RSU Central / VRA (prueba)', '', 'DIR_CENTRAL_RS', 'ADMINISTRATIVO', NULL, true, NULL, '2026-10-09 10:28:02.024151-05');
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG' WHERE correo = 'rsu.central@undc.edu.pe';

-- --- RSU_Notificacion ---
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'DIR_ESCUELA', 'TRANSICION', 'Nuevo proyecto en revisión', 'RSU-2026-011 Campaña anemia requiere tu V°B° como Director de Escuela', NULL, false, '2026-10-09 10:27:58.543515-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'CONSEJO_FACULTAD', 'TRANSICION', 'Aprobación pendiente', 'RSU-2026-014 Reciclaje Quilmaná aprobado por Director de Escuela, pendiente tu revisión', NULL, false, '2026-10-09 10:27:58.543515-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'DOCENTE_RESP', 'ASIGNACION', 'Horas asignadas', 'Se te asignaron 4h NO_LECTIVA en RSU-2026-007 (Taller emprendimiento)', NULL, false, '2026-10-09 10:27:58.543515-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (1, 'ESTUDIANTE_PROP', 'PROYECTO_CREADO', 'Proyecto creado', 'Tu proyecto RSU-2026-011 quedó en BORRADOR. Equipo ya puede subir docs', NULL, false, '2026-10-09 10:27:58.543515-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'DOCENTE_RESP', 'INVITACION', 'Invitación a equipo', 'Has sido invitado como Asesor en RSU-2026-007 por Ana Quispe', NULL, false, '2026-10-09 10:27:58.543515-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'ADMIN', 'CONFIG', 'Mantenimiento', 'Configuración del sistema actualizada por el Administrador', NULL, false, '2026-10-09 10:27:58.543515-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'DIR_ESCUELA', 'TRANSICION', 'Nuevo proyecto en revisión', 'RSU-2026-012 Plataforma de reciclaje comunitario requiere tu V°B° como Director de Escuela', 2, false, '2026-10-09 10:28:01.911963-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'CONSEJO_FACULTAD', 'TRANSICION', 'Aprobación pendiente', 'RSU-2026-011 Campaña anemia aprobado por Director de Escuela, pendiente tu revisión', 1, false, '2026-10-09 10:28:01.911963-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'DOCENTE_RESP', 'ASIGNACION', 'Horas asignadas', 'Se te asignaron 6h NO_LECTIVA en RSU-2026-012 (Plataforma reciclaje)', 2, false, '2026-10-09 10:28:01.911963-05');
-- Diego (estudiante 3) no tiene cuenta de acceso: su notificación personal no
-- se siembra — una bandera de rol haría que TODOS los estudiantes la vean.
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'DOCENTE_RESP', 'INVITACION', 'Invitación a equipo', 'Has sido invitado como Asesor en RSU-2026-012 por Pedro Flores', 2, false, '2026-10-09 10:28:01.911963-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'ADMIN', 'CONFIG', 'Mantenimiento', 'Configuración del sistema actualizada por el Administrador', NULL, false, '2026-10-09 10:28:01.911963-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (1, 'ESTUDIANTE_PROP', 'TRANSICION', 'Proyecto en ejecución', 'RSU-2026-011 Campaña anemia ha sido aprobada y está en ejecución', 1, true, '2026-10-09 10:28:01.911963-05');
INSERT INTO public."RSU_Notificacion" ("id_usuario", "rol_destino", "tipo", "titulo", "mensaje", "id_proyecto", "leido", "created_at") VALUES (NULL, 'DOCENTE_RESP', 'MONITOREO', 'Monitoreo programado', 'RSU-2026-011 requiere monitoreo mensual a partir de mayo', 1, true, '2026-10-09 10:28:01.911963-05');

-- === SINCRONIZAR SECUENCIAS ===
SELECT setval('"Docente_id_docente_seq"', COALESCE((SELECT MAX("id_docente") FROM "Docente"),1));
SELECT setval('"Estudiante_id_estudiante_seq"', COALESCE((SELECT MAX("id_estudiante") FROM "Estudiante"),1));
SELECT setval('"RSU_Proyecto_id_proyecto_seq"', COALESCE((SELECT MAX("id_proyecto") FROM "RSU_Proyecto"),1));
SELECT setval('"RSU_Beneficiario_id_beneficiario_seq"', COALESCE((SELECT MAX("id_beneficiario") FROM "RSU_Beneficiario"),1));
SELECT setval('"RSU_Actividad_Campo_id_actividad_seq"', COALESCE((SELECT MAX("id_actividad") FROM "RSU_Actividad_Campo"),1));
SELECT setval('"RSU_Flujo_Aprobacion_id_flujo_seq"', COALESCE((SELECT MAX("id_flujo") FROM "RSU_Flujo_Aprobacion"),1));
SELECT setval('"RSU_Encuesta_Beneficiario_id_encuesta_benef_seq"', COALESCE((SELECT MAX("id_encuesta_benef") FROM "RSU_Encuesta_Beneficiario"),1));
SELECT setval('"RSU_Entregable_id_entregable_seq"', COALESCE((SELECT MAX("id_entregable") FROM "RSU_Entregable"),1));
SELECT setval('"RSU_Notificacion_id_notificacion_seq"', COALESCE((SELECT MAX("id_notificacion") FROM "RSU_Notificacion"),1));
SELECT setval('"RSU_Indicador_Impacto_id_indicador_seq"', COALESCE((SELECT MAX("id_indicador") FROM "RSU_Indicador_Impacto"),1));
SELECT setval('"RSU_Leccion_Aprendida_id_leccion_seq"', COALESCE((SELECT MAX("id_leccion") FROM "RSU_Leccion_Aprendida"),1));
SELECT setval('"RSU_Monitoreo_id_monitoreo_seq"', COALESCE((SELECT MAX("id_monitoreo") FROM "RSU_Monitoreo"),1));
SELECT setval('"RSU_Solicitud_Constancia_id_solicitud_seq"', COALESCE((SELECT MAX("id_solicitud") FROM "RSU_Solicitud_Constancia"),1));
SELECT setval('"RSU_Usuario_id_usuario_seq"', COALESCE((SELECT MAX("id_usuario") FROM "RSU_Usuario"),1));
-- El seed inserta ids explícitos en estas tablas: sin sincronizar su secuencia,
-- la API fallaría al crear el primer registro (duplicate key en la PK).
SELECT setval('"RSU_Participante_Estudiante_id_participante_seq"', COALESCE((SELECT MAX("id_participante") FROM "RSU_Participante_Estudiante"),1));
SELECT setval('"RSU_Asignacion_Docente_id_asignacion_seq"', COALESCE((SELECT MAX("id_asignacion") FROM "RSU_Asignacion_Docente"),1));
SELECT setval('"RSU_Proyecto_Beneficiario_id_vinculacion_seq"', COALESCE((SELECT MAX("id_vinculacion") FROM "RSU_Proyecto_Beneficiario"),1));
SELECT setval('"RSU_Asistencia_Beneficiario_id_asistencia_seq"', COALESCE((SELECT MAX("id_asistencia") FROM "RSU_Asistencia_Beneficiario"),1));
SELECT setval('"RSU_Respuesta_Encuesta_id_respuesta_seq"', COALESCE((SELECT MAX("id_respuesta") FROM "RSU_Respuesta_Encuesta"),1));
SELECT setval('"RSU_Presupuesto_Movimiento_id_movimiento_seq"', COALESCE((SELECT MAX("id_movimiento") FROM "RSU_Presupuesto_Movimiento"),1));
SELECT setval('"RSU_Comite_RSU_id_comite_seq"', COALESCE((SELECT MAX("id_comite") FROM "RSU_Comite_RSU"),1));

-- Hashes bcrypt únicos para los usuarios que el seed dejó sin contraseña.
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG' WHERE id_usuario = 12;
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$jAVPSdIt0rp5nhuQpr8.WOtrOoasov4oRUkaYDBBbeqwTY0tsfbqK' WHERE id_usuario = 10;
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$UB8M2YVUs72FcI.Bzik7SuOBRmzJcmjys9pKIfKf3VvOBygwJfhE6' WHERE id_usuario = 11;
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$UQNtAX8Oab9F7CBYLAQ09ufWwx0Pv7POEbpPOuzDhYac/oMyS614O' WHERE id_usuario = 1;
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$uEBf9azxH9gRlmfZ2VJKzOYoKBsmZ0XVJfZq5WcY7e2AsuXqM1NrS' WHERE id_usuario = 13;
UPDATE public."RSU_Usuario" SET password_hash = '$2a$10$Szf6Ekq3VGex0Ryzq55zYeuZX5EZLxYYEJNtaqZklV2ndcvIi.ZEa' WHERE id_usuario = 9;

-- ── MÓDULO: cuenta de Pedro Flores (Docente 2) ──
-- Responsable (asesor) de los PEP 2 y 5: sin usuario no puede entrar ni
-- resolver solicitudes de unión. Hash = clave inicial undc2026.
-- Sus módulos se conceden arriba, junto al resto de docentes.
INSERT INTO "RSU_Usuario" (correo, nombre, password_hash, rol, tipo_usuario, id_persona, activo)
VALUES ('colaborador@undc.edu.pe', 'Pedro Flores',
        '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG',
        'DOCENTE_RESP', 'DOCENTE', 2, true)
ON CONFLICT (correo) DO NOTHING;

-- ── MÓDULO ADMIN: permisos por usuario (módulos que puede VER) ──
--
-- Autorización en dos capas (decisión del usuario):
--   Capa 1 · VER          → este permiso (RSU_Usuario_Permiso). Sin el módulo
--                            activo la ruta responde 404.
--   Capa 2 · INTERACTUAR  → el rol actor del token (RSU_Transicion_Estado).
--                            Un estudiante al que se le habilite un módulo
--                            entra y lo LEE, pero ninguna escritura le es
--                            permitida por su rol.
--
-- Antes esta tabla daba los 14 módulos a todos los usuarios: por eso un
-- estudiante podía entrar a Reportes. Ahora cada rol arranca solo con lo
-- que le corresponde y el Administrador puede ampliarlo desde /administracion.
--
--   proyectos    → sus proyectos, el expediente, el equipo y el cronograma
--   evidencias   → registro de actividades y fotos de campo
--   entregables  → los cinco entregables del proyecto
--   encuestas    → encuestas a beneficiarios y consolidated de impacto
--   documentos   → documentos y plantillas (incluye el catálogo DRSU)
--   catalogos    → tipos de proyecto, líneas de acción, ODS, estados y roles
--   bandeja      → cola de revisión/aprobación del rol
--   monitoreo    → registro y seguimiento de monitoreos
--   beneficiarios→ padrón de beneficiarios
--   presupuesto  → movimientos y ejecución presupuestal
--   reportes     → KPIs SUNEDU/SINEACE y memoria anual
--   estructura   → facultad, escuelas, ciclos, comité RSU
--   personas     → docentes y estudiantes
--   configuracion→ parámetros del sistema (solo lectura para dirección)
--   auditoria    → registro de auditoría (solo ADMIN)

-- Direcciones y órganos de gobierno: ven todo salvo auditoría y usuarios.
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('bandeja'),('entregables'),('evidencias'),('beneficiarios'),
    ('presupuesto'),('encuestas'),('monitoreo'),('reportes'),('personas'),
    ('estructura'),('catalogos'),('documentos'),('configuracion')
) AS m(clave)
WHERE u.rol IN ('DIR_ESCUELA','DIR_RS_FACULTAD','CONSEJO_FACULTAD','DIR_DEPTO',
                'DIR_CENTRAL_RS','COMITE_PS','COMITE_CALIDAD','UNIDAD_ABAST','DECANO')
  AND NOT EXISTS (SELECT 1 FROM "RSU_Usuario_Permiso" p WHERE p.id_usuario = u.id_usuario);

-- Docentes: asesoría, verificación de entregables, monitoreos y su carga.
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('bandeja'),('entregables'),('evidencias'),('beneficiarios'),
    ('encuestas'),('monitoreo'),('catalogos'),('documentos')
) AS m(clave)
WHERE u.rol IN ('DOCENTE_RESP','DOCENTE_COLAB')
  AND NOT EXISTS (SELECT 1 FROM "RSU_Usuario_Permiso" p WHERE p.id_usuario = u.id_usuario);

-- Estudiantes: solo lo del proyecto y sus trámites.
-- SIN reportes, presupuesto, monitoreo, beneficiarios, estructura, personas,
-- bandeja, configuracion ni auditoria: esos son de otros roles.
-- Conserva 'catalogos' porque el formulario de creación necesita el selector
-- de ODS, el tipo de proyecto y la línea de acción.
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('evidencias'),('entregables'),('encuestas'),
    ('documentos'),('catalogos')
) AS m(clave)
WHERE u.tipo_usuario = 'ESTUDIANTE'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Usuario_Permiso" p WHERE p.id_usuario = u.id_usuario);

-- Administrador: control total, incluida la auditoría.
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('bandeja'),('entregables'),('evidencias'),('beneficiarios'),
    ('presupuesto'),('encuestas'),('monitoreo'),('reportes'),('personas'),
    ('estructura'),('catalogos'),('documentos'),('auditoria'),('configuracion')
) AS m(clave)
WHERE u.rol = 'ADMIN'
  AND NOT EXISTS (SELECT 1 FROM "RSU_Usuario_Permiso" p WHERE p.id_usuario = u.id_usuario);


SELECT setval(pg_get_serial_sequence('"RSU_Usuario"', 'id_usuario'),
              (SELECT COALESCE(MAX(id_usuario), 0) + 1 FROM "RSU_Usuario"), false);
COMMIT;
