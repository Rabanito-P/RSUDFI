-- ============================================================================ 
-- UNDC RSU — PostgreSQL 18 init
-- Convertido de MySQL 8 (Ley 30220 Art 124-125) → Postgres 18
-- Motor: PostgreSQL 18 — TimeZone America/Lima
-- ============================================================================
SET client_encoding = 'UTF8';
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpieza idempotente (docker entrypoint)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
SET search_path = public;

-- ============================================================================
-- MÓDULO 1: Estructura Organizacional
-- ============================================================================
CREATE TABLE "Facultad" (
  "id_facultad" SERIAL PRIMARY KEY,
  "codigo" VARCHAR(10) UNIQUE NOT NULL,
  "nombre" VARCHAR(200) NOT NULL,
  "decano_id" INT NULL,
  "activo" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE "Escuela" (
  "id_escuela" SERIAL PRIMARY KEY,
  "id_facultad" INT NOT NULL REFERENCES "Facultad"("id_facultad"),
  "codigo" VARCHAR(10) UNIQUE NOT NULL,
  "nombre" VARCHAR(200) NOT NULL,
  "director_id" INT NULL,
  "activo" BOOLEAN DEFAULT TRUE
);
CREATE TABLE "Departamento_Academico" (
  "id_departamento" SERIAL PRIMARY KEY,
  "id_facultad" INT NOT NULL REFERENCES "Facultad"("id_facultad"),
  "nombre" VARCHAR(200) NOT NULL,
  "director_id" INT NULL
);
CREATE TABLE "Ciclo_Academico" (
  "id_ciclo" SERIAL PRIMARY KEY,
  "nombre" VARCHAR(20) UNIQUE NOT NULL,
  "fecha_inicio" DATE NOT NULL,
  "fecha_fin" DATE NOT NULL,
  "activo" BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- MÓDULO 2: Personas
-- ============================================================================
CREATE TABLE "Docente" (
  "id_docente" SERIAL PRIMARY KEY,
  "codigo_docente" VARCHAR(20) UNIQUE NOT NULL,
  "dni" VARCHAR(8) UNIQUE NOT NULL,
  "nombres" VARCHAR(150) NOT NULL,
  "apellidos" VARCHAR(150) NOT NULL,
  "correo_institucional" VARCHAR(150) UNIQUE NOT NULL,
  "id_escuela" INT NOT NULL REFERENCES "Escuela"("id_escuela"),
  "id_departamento" INT NULL REFERENCES "Departamento_Academico"("id_departamento"),
  "tipo_docente" VARCHAR(20) NOT NULL CHECK ("tipo_docente" IN ('ORDINARIO_TC','ORDINARIO_DE','CONTRATADO')),
  "categoria" VARCHAR(20) CHECK ("categoria" IN ('AUXILIAR','ASOCIADO','PRINCIPAL')),
  "carga_lectiva_max" NUMERIC(5,2) DEFAULT 0,
  "carga_no_lectiva_max" NUMERIC(5,2) DEFAULT 0,
  "activo" BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_docente_correo ON "Docente"("correo_institucional");
CREATE TABLE "Estudiante" (
  "id_estudiante" SERIAL PRIMARY KEY,
  "codigo_estudiante" VARCHAR(20) UNIQUE NOT NULL,
  "dni" VARCHAR(8) UNIQUE NOT NULL,
  "nombres" VARCHAR(150) NOT NULL,
  "apellidos" VARCHAR(150) NOT NULL,
  "correo_institucional" VARCHAR(150) UNIQUE NOT NULL,
  "id_escuela" INT NOT NULL REFERENCES "Escuela"("id_escuela"),
  "estado" VARCHAR(20) DEFAULT 'ACTIVO' CHECK ("estado" IN ('ACTIVO','EGRESADO','RETIRADO','SUSPENDIDO')),
  "fecha_ingreso" DATE
);
CREATE TABLE "Estudiante_Ciclo" (
  "id_estudiante" INT NOT NULL REFERENCES "Estudiante"("id_estudiante") ON DELETE CASCADE,
  "id_ciclo" INT NOT NULL REFERENCES "Ciclo_Academico"("id_ciclo"),
  "ciclo_numerico" INT NOT NULL,
  "estado" VARCHAR(20) DEFAULT 'MATRICULADO' CHECK ("estado" IN ('MATRICULADO','APROBADO','RETIRADO')),
  PRIMARY KEY ("id_estudiante","id_ciclo")
);
-- FKs diferidas Facultad/Escuela
ALTER TABLE "Facultad" ADD CONSTRAINT fk_facultad_decano FOREIGN KEY ("decano_id") REFERENCES "Docente"("id_docente");
ALTER TABLE "Escuela" ADD CONSTRAINT fk_escuela_director FOREIGN KEY ("director_id") REFERENCES "Docente"("id_docente");
ALTER TABLE "Departamento_Academico" ADD CONSTRAINT fk_departamento_director FOREIGN KEY ("director_id") REFERENCES "Docente"("id_docente");

-- ============================================================================
-- MÓDULO 3: Config RSU
-- ============================================================================
CREATE TABLE "RSU_Tipo_Proyecto" (
  "id_tipo" SERIAL PRIMARY KEY,
  "nombre" VARCHAR(100) NOT NULL,
  "descripcion" TEXT,
  "ciclo_minimo_estudiante" INT DEFAULT 1,
  "horas_docente_max" NUMERIC(5,2),
  "requiere_presupuesto" BOOLEAN DEFAULT TRUE,
  "activo" BOOLEAN DEFAULT TRUE
);
CREATE TABLE "RSU_Linea_Accion" (
  "id_linea" SERIAL PRIMARY KEY,
  "nombre" VARCHAR(200) NOT NULL,
  "descripcion" TEXT,
  "alineacion_ods" VARCHAR(200),
  "activo" BOOLEAN DEFAULT TRUE
);
CREATE TABLE "RSU_Rol_Proyecto" ("id_rol_proyecto" SERIAL PRIMARY KEY, "nombre" VARCHAR(50) NOT NULL, "aplica_a" VARCHAR(20) NOT NULL);
CREATE TABLE "RSU_Rol_Actor" ("id_rol_actor" SERIAL PRIMARY KEY, "codigo" VARCHAR(50) UNIQUE NOT NULL, "nombre" VARCHAR(150) NOT NULL, "tipo" VARCHAR(20) NOT NULL);
CREATE TABLE "RSU_Estado_Proyecto" ("id_estado" SERIAL PRIMARY KEY, "codigo" VARCHAR(30) UNIQUE NOT NULL, "nombre" VARCHAR(100) NOT NULL, "orden_flujo" INT NOT NULL, "es_final" BOOLEAN DEFAULT FALSE, "color_ui" VARCHAR(10));
CREATE TABLE "RSU_Tipo_Documento" ("id_tipo_doc" SERIAL PRIMARY KEY, "nombre" VARCHAR(150) NOT NULL, "etapa" VARCHAR(20) NOT NULL, "obligatorio" BOOLEAN DEFAULT TRUE, "activo" BOOLEAN DEFAULT TRUE);
CREATE TABLE "RSU_Transicion_Estado" (
  "id_transicion" SERIAL PRIMARY KEY,
  "estado_origen" INT NOT NULL REFERENCES "RSU_Estado_Proyecto"("id_estado"),
  "estado_destino" INT NOT NULL REFERENCES "RSU_Estado_Proyecto"("id_estado"),
  "id_rol_actor" INT NOT NULL REFERENCES "RSU_Rol_Actor"("id_rol_actor"),
  "requiere_documento" BOOLEAN DEFAULT TRUE
);

-- MÓDULO 4: Proyecto
CREATE TABLE "RSU_Proyecto" (
  "id_proyecto" SERIAL PRIMARY KEY,
  "codigo_proyecto" VARCHAR(30) UNIQUE NOT NULL,
  "titulo" VARCHAR(300) NOT NULL,
  "id_escuela" INT NOT NULL REFERENCES "Escuela"("id_escuela"),
  "id_tipo" INT NOT NULL REFERENCES "RSU_Tipo_Proyecto"("id_tipo"),
  "modalidad" VARCHAR(30) NOT NULL DEFAULT 'SSU' CHECK ("modalidad" IN ('SSU','PEP_FINANCIADO','PEP_AUTOFINANCIADO','VOLUNTARIADO','PUBLICACION_CIENTIFICA')),
  "id_linea_accion" INT NULL REFERENCES "RSU_Linea_Accion"("id_linea"),
  "id_estado_actual" INT NOT NULL REFERENCES "RSU_Estado_Proyecto"("id_estado"),
  "id_ciclo_creacion" INT NOT NULL REFERENCES "Ciclo_Academico"("id_ciclo"),
  "id_estudiante_lider" INT NULL REFERENCES "Estudiante"("id_estudiante"),
  "id_docente_asesor" INT NULL REFERENCES "Docente"("id_docente"),
  "descripcion" TEXT, "objetivo_general" TEXT, "objetivos_especificos" TEXT,
  "poblacion_beneficiaria" TEXT, "sector_beneficiario" VARCHAR(200),
  "numero_beneficiarios" INT DEFAULT 0, "lugar_intervencion" VARCHAR(200),
  "semestre" VARCHAR(20), "fecha_inicio_plan" DATE, "fecha_fin_plan" DATE,
  "presupuesto_solicitado" NUMERIC(12,2) DEFAULT 0, "presupuesto_aprobado" NUMERIC(12,2) DEFAULT 0,
  "monto_ejecutado" NUMERIC(12,2) DEFAULT 0, "porcentaje_avance" NUMERIC(5,2) DEFAULT 0,
  "archivo_proyecto_url" VARCHAR(500), "archivo_aprobacion_url" VARCHAR(500),
  "id_resolucion_aprobacion" INT NULL, "fecha_aprobacion" DATE,
  "id_resolucion_cierre" INT NULL, "fecha_cierre" DATE,
  "activo" BOOLEAN DEFAULT TRUE, "created_at" TIMESTAMPTZ DEFAULT NOW(), "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_proyecto_estado ON "RSU_Proyecto"("id_estado_actual");
CREATE INDEX idx_proyecto_modalidad ON "RSU_Proyecto"("modalidad");

-- MÓDULO 4B: Roles dinámicos por proyecto (V1.1 §1) — un usuario puede tener 1+ roles por proyecto
CREATE TABLE "RSU_Proyecto_Rol" (
  "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "id_usuario"  INT NOT NULL,
  "tipo_usuario" VARCHAR(20) NOT NULL CHECK ("tipo_usuario" IN ('DOCENTE','ESTUDIANTE','ADMINISTRATIVO')),
  "rol_actor"   VARCHAR(50) NOT NULL REFERENCES "RSU_Rol_Actor"("codigo"),
  "fecha_asignacion" TIMESTAMPTZ DEFAULT NOW(),
  "asignado_por" INT NULL,
  "activo" BOOLEAN DEFAULT TRUE,
  PRIMARY KEY ("id_proyecto","id_usuario","tipo_usuario","rol_actor")
);
CREATE INDEX idx_pr_origen ON "RSU_Proyecto_Rol"("rol_actor");
CREATE INDEX idx_pr_usuario ON "RSU_Proyecto_Rol"("id_usuario","tipo_usuario");

-- MÓDULO 4C: Comité RSU (M04) — docentes designados por el Decano, período 2 años ratificable (V1.1 §6 M04)
CREATE TABLE "RSU_Comite_RSU" (
  "id_comite" SERIAL PRIMARY KEY,
  "id_escuela" INT NOT NULL REFERENCES "Escuela"("id_escuela"),
  "id_docente" INT NOT NULL REFERENCES "Docente"("id_docente"),
  "es_presidente" BOOLEAN DEFAULT FALSE,
  "periodo_inicio" DATE NOT NULL,
  "periodo_fin" DATE NOT NULL,
  "id_resolucion_designacion" INT NULL,
  "estado" VARCHAR(20) DEFAULT 'ACTIVO' CHECK ("estado" IN ('ACTIVO','INACTIVO')),
  "fecha_designacion" TIMESTAMPTZ DEFAULT NOW(),
  "designado_por" INT NULL REFERENCES "Docente"("id_docente")
);
CREATE UNIQUE INDEX uk_comite_presidente_escuela ON "RSU_Comite_RSU"("id_escuela","periodo_inicio") WHERE ("es_presidente"=TRUE AND "estado"='ACTIVO');
CREATE INDEX idx_comite_escuela ON "RSU_Comite_RSU"("id_escuela","estado");

-- MÓDULO 11: Configuración (M11) — parámetros configurables (V1.1 §5.1)
CREATE TABLE "RSU_Configuracion" (
  "id_config" SERIAL PRIMARY KEY,
  "clave" VARCHAR(100) UNIQUE NOT NULL,
  "valor" TEXT NOT NULL,
  "descripcion" VARCHAR(500),
  "tipo" VARCHAR(20) DEFAULT 'STRING' CHECK ("tipo" IN ('STRING','INT','FLOAT','BOOL','LIST','JSON')),
  "ambito" VARCHAR(20) DEFAULT 'GLOBAL' CHECK ("ambito" IN ('GLOBAL','FACULTAD','ESCUELA')),
  "id_facultad" INT NULL REFERENCES "Facultad"("id_facultad"),
  "actualizado_por" INT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX uk_config_clave_ambito ON "RSU_Configuracion"("clave","ambito","id_facultad");
CREATE TABLE "RSU_Entregable" (
  "id_entregable" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "nombre" VARCHAR(100) NOT NULL, "orden" INT NOT NULL, "fecha_limite" DATE,
  "horas_asignadas" NUMERIC(5,2) DEFAULT 0, "estado" VARCHAR(20) DEFAULT 'POR_ENVIAR' CHECK ("estado" IN ('POR_ENVIAR','PENDIENTE','ENVIADO','SUBIDO','APROBADO','OBSERVADO','RECHAZADO','CORRECTO','REGISTRADO')),
  "id_verificador" INT NULL, "fecha_verificacion" TIMESTAMPTZ, "observaciones" TEXT, "id_documento" INT NULL
);

-- MÓDULO 5: Asignaciones
CREATE TABLE "RSU_Asignacion_Docente" (
  "id_asignacion" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "id_docente" INT NOT NULL REFERENCES "Docente"("id_docente"), "id_rol_proyecto" INT NOT NULL REFERENCES "RSU_Rol_Proyecto"("id_rol_proyecto"),
  "horas_asignadas" NUMERIC(5,2) NOT NULL, "tipo_hora" VARCHAR(20) DEFAULT 'NO_LECTIVA', "id_ciclo" INT NOT NULL REFERENCES "Ciclo_Academico"("id_ciclo"),
  "fecha_asignacion" DATE NOT NULL, "id_documento_carga" INT NULL,
  "estado_asignacion" VARCHAR(20) DEFAULT 'PENDIENTE' CHECK ("estado_asignacion" IN ('PENDIENTE','APROBADA','RECHAZADA')),
  "aprobado_por" INT NULL REFERENCES "Docente"("id_docente"), "fecha_aprobacion" DATE
);
CREATE TABLE "RSU_Participante_Estudiante" (
  "id_participante" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "id_estudiante" INT NOT NULL REFERENCES "Estudiante"("id_estudiante"), "id_rol_proyecto" INT NOT NULL REFERENCES "RSU_Rol_Proyecto"("id_rol_proyecto"),
  "horas_acumuladas" NUMERIC(5,2) DEFAULT 0,
  "fecha_inscripcion" DATE NOT NULL, "estado_participacion" VARCHAR(20) DEFAULT 'INSCRITO' CHECK ("estado_participacion" IN ('INSCRITO','ACTIVO','RETIRADO','FINALIZADO')),
  "validacion_ciclo" BOOLEAN DEFAULT FALSE
);

-- MÓDULO 6: Documentos
CREATE TABLE "RSU_Documento" (
  "id_documento" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "id_tipo_doc" INT NOT NULL REFERENCES "RSU_Tipo_Documento"("id_tipo_doc"),
  "nombre_archivo" VARCHAR(255) NOT NULL, "url_archivo" VARCHAR(500) NOT NULL,
  "hash_archivo" VARCHAR(64), "tamaño_bytes" INT, "version" INT DEFAULT 1,
  "id_usuario_subida" INT NOT NULL, "fecha_subida" TIMESTAMPTZ DEFAULT NOW(),
  "vigente" BOOLEAN DEFAULT TRUE, "observaciones" TEXT
);
CREATE TABLE "RSU_Resolucion" (
  "id_resolucion" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "tipo_resolucion" VARCHAR(50) NOT NULL, "numero_resolucion" VARCHAR(50) UNIQUE NOT NULL,
  "fecha_resolucion" DATE NOT NULL, "id_documento" INT NULL REFERENCES "RSU_Documento"("id_documento"),
  "id_organo" INT NOT NULL REFERENCES "RSU_Rol_Actor"("id_rol_actor"), "observaciones" TEXT
);
ALTER TABLE "RSU_Proyecto" ADD CONSTRAINT fk_resol_aprob FOREIGN KEY ("id_resolucion_aprobacion") REFERENCES "RSU_Resolucion"("id_resolucion");
ALTER TABLE "RSU_Proyecto" ADD CONSTRAINT fk_resol_cierre FOREIGN KEY ("id_resolucion_cierre") REFERENCES "RSU_Resolucion"("id_resolucion");
CREATE TABLE "RSU_Declaracion_Jurada" ("id_declaracion" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_estudiante" INT NOT NULL REFERENCES "Estudiante"("id_estudiante"), "id_documento" INT NULL REFERENCES "RSU_Documento"("id_documento"), "fecha_registro" TIMESTAMPTZ DEFAULT NOW(), "estado" VARCHAR(20) DEFAULT 'REGISTRADO', "id_verificador" INT NULL);

-- MÓDULO 7: Flujo
CREATE TABLE "RSU_Flujo_Aprobacion" (
  "id_flujo" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE,
  "id_estado_origen" INT NOT NULL REFERENCES "RSU_Estado_Proyecto"("id_estado"), "id_estado_destino" INT NOT NULL REFERENCES "RSU_Estado_Proyecto"("id_estado"),
  "id_rol_actor" INT NOT NULL REFERENCES "RSU_Rol_Actor"("id_rol_actor"), "id_usuario" INT NOT NULL,
  "id_documento_sustento" INT NULL REFERENCES "RSU_Documento"("id_documento"), "id_resolucion" INT NULL REFERENCES "RSU_Resolucion"("id_resolucion"),
  "fecha_transicion" TIMESTAMPTZ DEFAULT NOW(), "comentarios" TEXT, "resultado" VARCHAR(20) NOT NULL
);
CREATE TABLE "RSU_Verificacion" ("id_verificacion" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "tipo_verificacion" VARCHAR(50) NOT NULL, "id_flujo_aprobacion" INT NULL REFERENCES "RSU_Flujo_Aprobacion"("id_flujo"), "id_verificador" INT NOT NULL, "id_rol_verificador" INT NOT NULL, "fecha_verificacion" TIMESTAMPTZ DEFAULT NOW(), "resultado" VARCHAR(30) NOT NULL, "observaciones" TEXT, "id_documento" INT NULL REFERENCES "RSU_Documento"("id_documento"));
CREATE TABLE "RSU_Modificacion_Informe" ("id_modificacion" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "motivo" TEXT NOT NULL, "id_documento_solicitud" INT NULL REFERENCES "RSU_Documento"("id_documento"), "fecha_solicitud" DATE NOT NULL, "estado" VARCHAR(20) DEFAULT 'PENDIENTE', "id_verificador" INT NULL, "fecha_verificacion" TIMESTAMPTZ, "observaciones" TEXT);

-- MÓDULO 8: Ejecución
CREATE TABLE "RSU_Actividad_Campo" ("id_actividad" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_entregable" INT NULL REFERENCES "RSU_Entregable"("id_entregable"), "nombre" VARCHAR(200) NOT NULL, "descripcion" TEXT, "fecha_programada" DATE, "fecha_ejecucion" DATE, "hora_inicio" TIME, "hora_fin" TIME, "minutos" INT DEFAULT 0, "lugar" VARCHAR(200), "id_responsable" INT NULL, "id_usuario_registro" INT NULL, "estado" VARCHAR(20) DEFAULT 'PROGRAMADA', "nro_beneficiarios" INT DEFAULT 0);
CREATE TABLE "RSU_Actividad_Foto" ("id_foto" SERIAL PRIMARY KEY, "id_actividad" INT NOT NULL REFERENCES "RSU_Actividad_Campo"("id_actividad") ON DELETE CASCADE, "url_foto" VARCHAR(500) NOT NULL, "descripcion" VARCHAR(255), "fecha_subida" TIMESTAMPTZ DEFAULT NOW(), "etapa" VARCHAR(30) NULL, "minutos_transcurridos" INT NOT NULL DEFAULT 0);
CREATE TABLE "RSU_Justificacion_Falta" ("id_justificacion" SERIAL PRIMARY KEY, "id_actividad" INT NOT NULL REFERENCES "RSU_Actividad_Campo"("id_actividad") ON DELETE CASCADE, "id_estudiante" INT NOT NULL REFERENCES "Estudiante"("id_estudiante"), "fecha_ausencia" DATE NOT NULL, "hora_inicio_actividad" TIME, "hora_fin_actividad" TIME, "motivo" TEXT NOT NULL, "id_documento_evidencia" INT NULL REFERENCES "RSU_Documento"("id_documento"), "estado" VARCHAR(20) DEFAULT 'PENDIENTE', "id_verificador" INT NULL, "fecha_verificacion" TIMESTAMPTZ, "observaciones" TEXT);
CREATE TABLE "RSU_Monitoreo" ("id_monitoreo" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "fecha_monitoreo" DATE NOT NULL, "id_monitor" INT NOT NULL REFERENCES "Docente"("id_docente"), "porcentaje_avance" NUMERIC(5,2), "hitos_cumplidos" TEXT, "observaciones" TEXT, "resultado" VARCHAR(30) NOT NULL, "id_documento" INT NULL REFERENCES "RSU_Documento"("id_documento"));

-- MÓDULO 8B: Beneficiarios
CREATE TABLE "RSU_Beneficiario" ("id_beneficiario" SERIAL PRIMARY KEY, "tipo_beneficiario" VARCHAR(20) NOT NULL DEFAULT 'PERSONA_NATURAL', "dni" VARCHAR(8) UNIQUE, "nombres" VARCHAR(150), "apellidos" VARCHAR(150), "fecha_nacimiento" DATE, "sexo" VARCHAR(10), "ruc" VARCHAR(11), "razon_social" VARCHAR(200), "representante_legal" VARCHAR(200), "celular" VARCHAR(15), "telefono_fijo" VARCHAR(15), "correo_electronico" VARCHAR(150), "direccion" VARCHAR(255), "distrito" VARCHAR(100), "provincia" VARCHAR(100) DEFAULT 'Cañete', "departamento" VARCHAR(100) DEFAULT 'Lima', "ocupacion" VARCHAR(150), "nivel_educativo" VARCHAR(20), "condicion_vulnerabilidad" VARCHAR(200), "activo" BOOLEAN DEFAULT TRUE, "fecha_registro" TIMESTAMPTZ DEFAULT NOW(), "id_usuario_registro" INT NULL);
CREATE TABLE "RSU_Proyecto_Beneficiario" ("id_vinculacion" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_beneficiario" INT NOT NULL REFERENCES "RSU_Beneficiario"("id_beneficiario"), "fecha_incorporacion" DATE NOT NULL, "rol_en_proyecto" VARCHAR(100), "observaciones" TEXT, "activo" BOOLEAN DEFAULT TRUE, UNIQUE ("id_proyecto","id_beneficiario"));
CREATE TABLE "RSU_Asistencia_Beneficiario" ("id_asistencia" SERIAL PRIMARY KEY, "id_actividad" INT NOT NULL REFERENCES "RSU_Actividad_Campo"("id_actividad") ON DELETE CASCADE, "id_beneficiario" INT NOT NULL REFERENCES "RSU_Beneficiario"("id_beneficiario"), "firma_url" VARCHAR(500), "observaciones" VARCHAR(255));

-- MÓDULO 9: Presupuesto
CREATE TABLE "RSU_Presupuesto_Movimiento" ("id_movimiento" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_facultad" INT NOT NULL REFERENCES "Facultad"("id_facultad"), "tipo" VARCHAR(20) NOT NULL, "monto" NUMERIC(12,2) NOT NULL, "fecha" DATE NOT NULL, "id_documento_sustento" INT NULL REFERENCES "RSU_Documento"("id_documento"), "id_usuario_registro" INT NOT NULL, "observaciones" TEXT);
CREATE TABLE "RSU_Pago_Voucher" ("id_pago" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_beneficiario_pago" INT NOT NULL, "id_facultad" INT NOT NULL REFERENCES "Facultad"("id_facultad"), "numero_operacion" VARCHAR(50), "banco" VARCHAR(100), "monto" NUMERIC(10,2) NOT NULL, "fecha_pago" DATE NOT NULL, "id_documento_voucher" INT NULL REFERENCES "RSU_Documento"("id_documento"), "estado" VARCHAR(30) DEFAULT 'REGISTRADO', "id_verificador" INT NULL, "fecha_verificacion" TIMESTAMPTZ);

-- MÓDULO 10: Evaluación
CREATE TABLE "RSU_Instrumento_Impacto" ("id_instrumento" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "tipo" VARCHAR(20) NOT NULL, "nombre" VARCHAR(200) NOT NULL, "fecha_aplicacion" DATE, "nro_aplicados" INT DEFAULT 0, "id_documento" INT NULL REFERENCES "RSU_Documento"("id_documento"));
CREATE TABLE "RSU_Encuesta_Satisfaccion" ("id_encuesta" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_docente_asesor" INT NOT NULL REFERENCES "Docente"("id_docente"), "id_estudiante" INT NOT NULL REFERENCES "Estudiante"("id_estudiante"), "fecha_registro" TIMESTAMPTZ DEFAULT NOW(), "estado" VARCHAR(20) DEFAULT 'REGISTRADO', "id_documento" INT NULL REFERENCES "RSU_Documento"("id_documento"), "promedio_general" NUMERIC(3,2) NULL, "comentario" TEXT NULL);
CREATE TABLE "RSU_Pregunta_Encuesta" ("id_pregunta" SERIAL PRIMARY KEY, "codigo" VARCHAR(20) UNIQUE NOT NULL, "texto_pregunta" VARCHAR(500) NOT NULL, "dimension" VARCHAR(20) NOT NULL, "orden" INT NOT NULL, "activa" BOOLEAN DEFAULT TRUE);
CREATE TABLE "RSU_Encuesta_Beneficiario" ("id_encuesta_benef" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_beneficiario" INT NOT NULL REFERENCES "RSU_Beneficiario"("id_beneficiario"), "fecha_aplicacion" DATE NOT NULL, "id_aplicador" INT NULL, "modalidad" VARCHAR(20) DEFAULT 'PRESENCIAL', "promedio_general" NUMERIC(3,2), "calificacion_cualitativa" VARCHAR(20), "comentario_abierto" TEXT, "sugerencia_mejora" TEXT, "id_documento_firmado" INT NULL REFERENCES "RSU_Documento"("id_documento"), "estado" VARCHAR(20) DEFAULT 'REGISTRADA', "id_validador" INT NULL, "fecha_validacion" TIMESTAMPTZ, "created_at" TIMESTAMPTZ DEFAULT NOW(), UNIQUE ("id_proyecto","id_beneficiario"));
CREATE TABLE "RSU_Respuesta_Encuesta" ("id_respuesta" SERIAL PRIMARY KEY, "id_encuesta_benef" INT NOT NULL REFERENCES "RSU_Encuesta_Beneficiario"("id_encuesta_benef") ON DELETE CASCADE, "id_pregunta" INT NOT NULL REFERENCES "RSU_Pregunta_Encuesta"("id_pregunta"), "valor_numerico" SMALLINT NOT NULL CHECK ("valor_numerico" BETWEEN 1 AND 5), "valor_cualitativo" VARCHAR(20) NOT NULL, UNIQUE ("id_encuesta_benef","id_pregunta"));
CREATE TABLE "RSU_Respuesta_Encuesta_Simple" ("id_respuesta_simple" SERIAL PRIMARY KEY, "id_encuesta_benef" INT NOT NULL REFERENCES "RSU_Encuesta_Beneficiario"("id_encuesta_benef") ON DELETE CASCADE, "id_pregunta" INT NOT NULL REFERENCES "RSU_Pregunta_Encuesta"("id_pregunta"), "valor_simple" SMALLINT NOT NULL CHECK ("valor_simple" BETWEEN 1 AND 3), "valor_texto" VARCHAR(20) NOT NULL);
CREATE TABLE "RSU_Indicador_Impacto" ("id_indicador" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "nombre_indicador" VARCHAR(200) NOT NULL, "linea_base" NUMERIC(12,2), "meta_planificada" NUMERIC(12,2), "valor_alcanzado" NUMERIC(12,2), "unidad_medida" VARCHAR(50), "porcentaje_logro" NUMERIC(5,2), "fuente_verificacion" VARCHAR(200));
CREATE TABLE "RSU_Leccion_Aprendida" ("id_leccion" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "descripcion" TEXT NOT NULL, "recomendacion_curricular" TEXT, "fecha_registro" DATE, "id_responsable" INT NULL);
CREATE TABLE "RSU_Reporte_Anual" ("id_reporte" SERIAL PRIMARY KEY, "anio" INT NOT NULL, "id_facultad" INT NULL REFERENCES "Facultad"("id_facultad"), "total_proyectos" INT DEFAULT 0, "total_docentes" INT DEFAULT 0, "total_estudiantes" INT DEFAULT 0, "total_beneficiarios" INT DEFAULT 0, "monto_invertido" NUMERIC(12,2) DEFAULT 0, "porcentaje_presupuesto" NUMERIC(5,2) DEFAULT 0, "id_documento_memoria" INT NULL REFERENCES "RSU_Documento"("id_documento"), "fecha_generacion" TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE "RSU_Solicitud_Constancia" ("id_solicitud" SERIAL PRIMARY KEY, "id_proyecto" INT NOT NULL REFERENCES "RSU_Proyecto"("id_proyecto") ON DELETE CASCADE, "id_estudiante" INT NOT NULL REFERENCES "Estudiante"("id_estudiante"), "tipo_constancia" VARCHAR(20) NOT NULL, "fecha_solicitud" TIMESTAMPTZ DEFAULT NOW(), "estado" VARCHAR(20) DEFAULT 'PENDIENTE', "id_documento_emitido" INT NULL REFERENCES "RSU_Documento"("id_documento"), "id_aprobador" INT NULL, "fecha_emision" DATE);
-- Usuarios del sistema (login con bcrypt, rol actor BPMN V3)
CREATE TABLE "RSU_Usuario" (
  "id_usuario" SERIAL PRIMARY KEY,
  "correo" VARCHAR(150) UNIQUE NOT NULL,
  "nombre" VARCHAR(150),
  "password_hash" VARCHAR(255) NOT NULL,
  "rol" VARCHAR(30) NOT NULL,
  "tipo_usuario" VARCHAR(20) NOT NULL CHECK ("tipo_usuario" IN ('DOCENTE','ESTUDIANTE','ADMINISTRATIVO')),
  "id_persona" INT NULL,
  "activo" BOOLEAN DEFAULT TRUE,
  "ultimo_login" TIMESTAMPTZ NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_usuario_correo ON "RSU_Usuario"("correo");
CREATE TABLE "RSU_Auditoria_Log" ("id_log" SERIAL PRIMARY KEY, "id_usuario" INT NOT NULL, "id_proyecto" INT NULL, "accion" VARCHAR(100) NOT NULL, "tabla_afectada" VARCHAR(100), "id_registro_afectado" INT, "valor_anterior" JSONB, "valor_nuevo" JSONB, "ip_origen" VARCHAR(45), "fecha_hora" TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX idx_audit_proyecto ON "RSU_Auditoria_Log"("id_proyecto");

-- MÓDULO 11: Notificaciones por rol (12 lanes) — campana Header + Bandeja
CREATE TABLE "RSU_Notificacion" (
  "id_notificacion" SERIAL PRIMARY KEY,
  "id_usuario" INT NULL,
  "rol_destino" VARCHAR(50) NOT NULL REFERENCES "RSU_Rol_Actor"("codigo"),
  "tipo" VARCHAR(30) NOT NULL,
  "titulo" VARCHAR(200) NOT NULL,
  "mensaje" TEXT,
  "id_proyecto" INT NULL REFERENCES "RSU_Proyecto"("id_proyecto"),
  "leido" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_rol ON "RSU_Notificacion"("rol_destino");
CREATE INDEX idx_notif_leido ON "RSU_Notificacion"("leido");
CREATE INDEX idx_notif_created ON "RSU_Notificacion"("created_at");

-- VISTAS (PostgreSQL 18 — 4 vistas SUNEDU/SINEACE)
CREATE OR REPLACE VIEW vw_rsu_proyectos_resumen AS
SELECT p."id_proyecto", p."codigo_proyecto", p."titulo", f."nombre" AS facultad, e."nombre" AS escuela, tp."nombre" AS tipo_proyecto, ep."nombre" AS estado_actual, p."semestre", p."fecha_inicio_plan", p."fecha_fin_plan", p."presupuesto_aprobado", p."monto_ejecutado", p."porcentaje_avance", CONCAT(est."apellidos", ', ', est."nombres") AS estudiante_lider, CONCAT(doc."apellidos", ', ', doc."nombres") AS docente_asesor, (SELECT COUNT(*) FROM "RSU_Proyecto_Beneficiario" pb WHERE pb."id_proyecto"=p."id_proyecto" AND pb."activo"=TRUE) AS total_beneficiarios, (SELECT AVG(eb."promedio_general") FROM "RSU_Encuesta_Beneficiario" eb WHERE eb."id_proyecto"=p."id_proyecto") AS promedio_satisfaccion FROM "RSU_Proyecto" p JOIN "Escuela" e ON p."id_escuela"=e."id_escuela" JOIN "Facultad" f ON e."id_facultad"=f."id_facultad" JOIN "RSU_Tipo_Proyecto" tp ON p."id_tipo"=tp."id_tipo" JOIN "RSU_Estado_Proyecto" ep ON p."id_estado_actual"=ep."id_estado" LEFT JOIN "Estudiante" est ON p."id_estudiante_lider"=est."id_estudiante" LEFT JOIN "Docente" doc ON p."id_docente_asesor"=doc."id_docente";

CREATE OR REPLACE VIEW vw_rsu_trazabilidad_aprobacion AS
SELECT fa."id_flujo", p."codigo_proyecto", p."titulo", eo."nombre" AS estado_origen, ed."nombre" AS estado_destino, ra."nombre" AS rol_actor, fa."id_usuario" AS id_usuario_ejecutor, fa."fecha_transicion", fa."resultado", fa."comentarios", d."nombre_archivo" AS documento_sustento, r."numero_resolucion" FROM "RSU_Flujo_Aprobacion" fa JOIN "RSU_Proyecto" p ON fa."id_proyecto"=p."id_proyecto" JOIN "RSU_Estado_Proyecto" eo ON fa."id_estado_origen"=eo."id_estado" JOIN "RSU_Estado_Proyecto" ed ON fa."id_estado_destino"=ed."id_estado" JOIN "RSU_Rol_Actor" ra ON fa."id_rol_actor"=ra."id_rol_actor" LEFT JOIN "RSU_Documento" d ON fa."id_documento_sustento"=d."id_documento" LEFT JOIN "RSU_Resolucion" r ON fa."id_resolucion"=r."id_resolucion";

CREATE OR REPLACE VIEW vw_rsu_satisfaccion_dimension AS
SELECT p."id_proyecto", p."codigo_proyecto", p."titulo", pe."dimension" AS dimension, AVG(re."valor_numerico") AS promedio_dimension, COUNT(*) AS total_respuestas
FROM "RSU_Proyecto" p
JOIN "RSU_Encuesta_Beneficiario" eb ON p."id_proyecto" = eb."id_proyecto"
JOIN "RSU_Respuesta_Encuesta" re ON eb."id_encuesta_benef" = re."id_encuesta_benef"
JOIN "RSU_Pregunta_Encuesta" pe ON re."id_pregunta" = pe."id_pregunta"
GROUP BY p."id_proyecto", p."codigo_proyecto", p."titulo", pe."dimension";

CREATE OR REPLACE VIEW vw_rsu_cobertura_anual AS
SELECT EXTRACT(YEAR FROM p."fecha_inicio_plan")::INT AS anio,
       COUNT(DISTINCT b."id_beneficiario") AS beneficiarios_unicos,
       COUNT(DISTINCT CASE WHEN b."tipo_beneficiario" = 'PERSONA_NATURAL' THEN b."id_beneficiario" END) AS personas,
       COUNT(DISTINCT CASE WHEN b."tipo_beneficiario" = 'INSTITUCION' THEN b."id_beneficiario" END) AS instituciones,
       COUNT(DISTINCT b."distrito") AS distritos_atendidos
FROM "RSU_Beneficiario" b
JOIN "RSU_Proyecto_Beneficiario" pb ON b."id_beneficiario" = pb."id_beneficiario"
JOIN "RSU_Proyecto" p ON pb."id_proyecto" = p."id_proyecto"
GROUP BY EXTRACT(YEAR FROM p."fecha_inicio_plan");

-- ── MÓDULO ADMIN: permisos por usuario (activación de funciones/módulos) ──
-- El administrador decide a qué módulos entra cada usuario.
CREATE TABLE IF NOT EXISTS "RSU_Usuario_Permiso" (
    id_permiso  SERIAL PRIMARY KEY,
    id_usuario  INTEGER NOT NULL REFERENCES "RSU_Usuario"(id_usuario) ON DELETE CASCADE,
    modulo      VARCHAR(50) NOT NULL,
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_usuario_permiso UNIQUE (id_usuario, modulo)
);
CREATE INDEX IF NOT EXISTS idx_usuario_permiso_usuario ON "RSU_Usuario_Permiso"(id_usuario);

-- ── FORMATOS Y GUÍAS OFICIALES ──
-- El catálogo es FIJO: son los 7 formatos que el sistema usa siempre.
-- El administrador no crea ni elimina formatos, solo reemplaza el archivo que
-- se le ofrece al usuario. "ruta" vacía = usar el archivo de fábrica
-- que viene en documentos/plantillas/.
CREATE TABLE IF NOT EXISTS "RSU_Formato" (
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
CREATE INDEX IF NOT EXISTS idx_formato_codigo ON "RSU_Formato"("codigo");

-- SEED — 16 estados BPMN V3 (alineados a frontend utils/permissions.ts)
-- Flujo: BORRADOR → EN_REVISION_ESCUELA → CON_VB_ESCUELA → EN_PRIORIZACION_FACULTAD →
--        EN_DICTAMEN_CONSEJO → APROBADO_CON_RESOLUCION → EN_ASIGNACION_CARGA →
--        REGISTRADO_OFICIAL → EN_EJECUCION → EN_MONITOREO → INFORME_FINAL_PRESENTADO →
--        CON_CONFORMIDAD_ESCUELA → CERRADO → EN_EVALUACION_IMPACTO → EVALUACION_VALIDADA →
--        REPORTADO_SUNEDU
INSERT INTO "RSU_Estado_Proyecto" ("codigo","nombre","orden_flujo","es_final","color_ui") VALUES
('BORRADOR','Informe Inicial (Borrador)',1,false,'#1b5e20'),
('EN_REVISION_ESCUELA','En revisión por Director de Escuela',2,false,'#FFC107'),
('CON_VB_ESCUELA','Con V°B° de Escuela',3,false,'#4CAF50'),
('EN_PRIORIZACION_FACULTAD','En priorización Facultad',4,false,'#FF9800'),
('EN_DICTAMEN_CONSEJO','En dictamen de Consejo de Facultad',5,false,'#8BC34A'),
('APROBADO_CON_RESOLUCION','Aprobado con Resolución',6,false,'#3F51B5'),
('EN_ASIGNACION_CARGA','En asignación de carga no lectiva',7,false,'#2196F3'),
('REGISTRADO_OFICIAL','Registrado oficialmente',8,false,'#00BCD4'),
('EN_EJECUCION','En ejecución',9,false,'#FF5722'),
('EN_MONITOREO','En monitoreo',10,false,'#FFC107'),
('INFORME_FINAL_PRESENTADO','Informe final presentado',11,false,'#CDDC39'),
('CON_CONFORMIDAD_ESCUELA','Con conformidad de Escuela',12,false,'#009688'),
('CERRADO','Cerrado',13,true,'#212121'),
('EN_EVALUACION_IMPACTO','En evaluación de impacto',14,false,'#9C27B0'),
('EVALUACION_VALIDADA','Evaluación validada',15,false,'#673AB7'),
('REPORTADO_SUNEDU','Reportado a SUNEDU',16,true,'#607D8B'),
('RECHAZADO','Rechazado (rebota al emisor)',99,false,'#F44336');
-- SEED — 12 roles actor BPMN V3 (alineados a frontend utils/permissions.ts)
INSERT INTO "RSU_Rol_Actor" ("codigo","nombre","tipo") VALUES
('DOCENTE_RESP','Docente Responsable','DOCENTE'),
('DOCENTE_COLAB','Docente Colaborador','DOCENTE'),
('ESTUDIANTE_PROP','Estudiante Proponente','ESTUDIANTE'),
('ESTUDIANTE_EJEC','Estudiante Ejecutor','ESTUDIANTE'),
('DIR_ESCUELA','Director de Escuela Profesional','AUTORIDAD'),
('COMITE_PS','Comité Proyección Social','COMITE'),
('DIR_RS_FACULTAD','Director RS Facultad','AUTORIDAD'),
('CONSEJO_FACULTAD','Consejo de Facultad','AUTORIDAD'),
('DIR_DEPTO','Director de Departamento Académico','AUTORIDAD'),
('DIR_CENTRAL_RS','Director Central RS / VRA','AUTORIDAD'),
('UNIDAD_ABAST','Unidad de Abastecimiento','ADMINISTRATIVO'),
('COMITE_CALIDAD','Comité de Calidad','COMITE'),
('ADMIN','Administrador','ADMINISTRATIVO');

-- Tipos de proyecto = 5 modalidades (V1.1 §7). `modalidad` en RSU_Proyecto es la clasificación autoritativa.
INSERT INTO "RSU_Tipo_Proyecto" ("nombre","descripcion","ciclo_minimo_estudiante","horas_docente_max","requiere_presupuesto") VALUES
('SSU','Servicio Social Universitario (Estudiante propone, V–X ciclo, mín. 60h, 2–5 estudiantes)',5,8.0,false),
('PEP_FINANCIADO','Proyecto de Extensión y Proyección Financiado (Presidente Comité RSU, 15 días antes, accede al 2% presupuesto RSU)',3,8.0,true),
('PEP_AUTOFINANCIADO','Proyecto de Extensión y Proyección Autofinanciado (Docente Responsable, sin financiamiento institucional)',3,8.0,false),
('VOLUNTARIADO','Voluntariado Yanapay (comunidad universitaria, 2 convocatorias/año, mín. 60h para constancia)',1,4.0,false),
('PUBLICACION_CIENTIFICA','Publicación Científica (estudiante/egresado, revista indexada, afiliación UNDC, tema Cañete, ODS)',7,4.0,false);

INSERT INTO "RSU_Rol_Proyecto" ("nombre","aplica_a") VALUES
('Responsable','DOCENTE'),('Colaborador','DOCENTE'),('Asesor','DOCENTE'),
('Ejecutor','ESTUDIANTE'),('Apoyo','ESTUDIANTE'),('Beneficiario','AMBOS');
INSERT INTO "RSU_Pregunta_Encuesta" ("codigo","texto_pregunta","dimension","orden") VALUES ('P01','¿Cómo califica la utilidad del proyecto para resolver su necesidad?','UTILIDAD',1),('P02','¿Cómo califica la calidad de las actividades realizadas?','CALIDAD',2),('P03','¿Cómo califica el trato recibido por los docentes y estudiantes?','TRATO',3),('P04','¿El proyecto respondió a lo que usted realmente necesitaba?','PERTINENCIA',4),('P05','¿Recomendaría este proyecto a otras personas de su comunidad?','IMPACTO',5),('P06','¿Cómo califica el impacto del proyecto en su vida diaria?','IMPACTO',6);
INSERT INTO "RSU_Linea_Accion" ("nombre","descripcion","alineacion_ods") VALUES ('Salud y Bienestar Comunitario','Campañas de salud, prevención','ODS 3'),('Educación y Cultura','Reforzamiento, alfabetización','ODS 4'),('Desarrollo Económico Local','Emprendimiento, formalización','ODS 8'),('Gestión Ambiental','Reciclaje, conservación','ODS 13'),('Gobernanza y Ciudadanía','Fortalecimiento institucional','ODS 16'),('Tecnología e Innovación Social','Soluciones digitales comunitarias','ODS 9');
INSERT INTO "RSU_Tipo_Documento" ("nombre","etapa","obligatorio") VALUES ('Informe Inicial','FORMULACION',true),('Informe Técnico de Viabilidad','FORMULACION',true),('Resolución de Aprobación','FORMULACION',true),('Plan de Carga Horaria','FORMULACION',true),('Acta de Compromiso','EJECUCION',true),('Pecosa / Rendición','EJECUCION',true),('Ficha de Asistencia','EJECUCION',true),('Informe de Monitoreo Intermedio','EJECUCION',true),('Informe Final de Ejecución','EJECUCION',true),('Resolución de Cierre','EJECUCION',true),('Encuesta de Satisfacción','EVALUACION',true),('Matriz de Indicadores','EVALUACION',true),('Informe de Evaluación de Impacto','EVALUACION',true),('Memoria Anual RSU','EVALUACION',true),('Voucher de Pago','TRANSVERSAL',true),('Justificación de Falta','TRANSVERSAL',false);
-- Datos demo estructura
-- Alcance: Facultad de Ingeniería y Arquitectura (las demás facultades de la
-- universidad quedan fuera del alcance del sistema).
INSERT INTO "Facultad" ("codigo","nombre") VALUES ('FIA','Facultad de Ingeniería y Arquitectura');
INSERT INTO "Escuela" ("id_facultad","codigo","nombre") VALUES (1,'EPIS','Ing. de Sistemas'),(1,'EPIC','Ing. Civil');
INSERT INTO "Ciclo_Academico" ("nombre","fecha_inicio","fecha_fin","activo") VALUES ('2026-I','2026-03-01','2026-07-31',true),('2026-II','2026-08-01','2026-12-15',false);
-- Docente/Estudiante demo para login (IDs alineados con demoUsers: 1=Laura/Anas, 2=Pedro/Carlos)
-- Personas, proyectos y datos de demostración → db/seed_demo.sql
-- Notificaciones seed por rol (bandeja + campana) — 12 roles V3
INSERT INTO "RSU_Notificacion" ("rol_destino","tipo","titulo","mensaje","leido") VALUES
('DIR_ESCUELA','TRANSICION','Nuevo proyecto en revisión','Un proyecto requiere tu V°B° como Director de Escuela',false),
('CONSEJO_FACULTAD','TRANSICION','Aprobación pendiente','Proyecto aprobado por Director de Escuela, pendiente tu dictamen',false),
('DIR_RS_FACULTAD','TRANSICION','Priorización pendiente','Proyecto en priorización de banco de Facultad',false),
('DOCENTE_RESP','ASIGNACION','Horas asignadas','Se te asignaron horas NO_LECTIVA',false),
('ESTUDIANTE_PROP','PROYECTO_CREADO','Proyecto creado','Tu proyecto quedó en BORRADOR. El equipo ya puede subir documentos',false),
('ESTUDIANTE_EJEC','INVITACION','Invitación a equipo','Has sido invitado como Ejecutor en un proyecto',false),
('ADMIN','CONFIG','Mantenimiento','Configuración del sistema actualizada por el Administrador',false);

-- Catálogo fijo de formatos y guías oficiales. El orden es el orden en que se
-- usan en el ciclo del proyecto. El backend los asegura al arrancar, pero aquí
-- quedan sembrados para que existan desde el primer arranque del volumen.
INSERT INTO "RSU_Formato" ("codigo","nombre","descripcion","archivo_base","orden") VALUES
 ('PROPUESTA','Formato 1 · Propuesta de proyecto','Documento de propuesta: problema, objetivos, fundamentación y beneficiarios.','01-propuesta-de-proyecto.docx',1),
 ('PLANIFICACION','Formato 2 · Planificación de actividades','Cronograma semanal de actividades (Excel). Se lee para crear las actividades del proyecto.','02-planificacion-de-actividades.xlsx',2),
 ('PRIMER_ENTREGABLE','Formato 3 · Primer entregable','Reporte del primer entregable de la ejecución.','03-primer-entregable.docx',3),
 ('SEGUNDO_ENTREGABLE','Formato 4 · Segundo entregable','Reporte del segundo entregable de la ejecución.','04-segundo-entregable.docx',4),
 ('TERCER_ENTREGABLE','Formato 5 · Tercer entregable','Reporte del tercer entregable de la ejecución.','05-tercer-entregable.docx',5),
 ('ENCUESTA','Formato 6 · Encuesta de satisfacción','Cuestionario Likert que se aplica a los beneficiarios del proyecto.','06-encuesta-satisfaccion.docx',6),
 ('INFORME_FINAL','Formato 7 · Informe final','Informe de cierre del proyecto con resultados e impacto alcanzado.','07-informe-final.docx',7);

-- ============================================================================
-- SEED: Transiciones BPMN por modalidad (V1.1 §10) — solo entre los 10 roles
-- Nota: estado_origen/destino e id_rol_actor se resuelven por código (subconsulta).
-- ============================================================================

-- ── Flujo V3 completo: 16 estados × 12 roles (una transición solo es válida si existe la tupla) ──
INSERT INTO "RSU_Transicion_Estado" ("estado_origen","estado_destino","id_rol_actor","requiere_documento") VALUES
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='BORRADOR'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_REVISION_ESCUELA'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='ESTUDIANTE_PROP'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='BORRADOR'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_REVISION_ESCUELA'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DOCENTE_RESP'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_REVISION_ESCUELA'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='CON_VB_ESCUELA'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_ESCUELA'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_REVISION_ESCUELA'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='RECHAZADO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_ESCUELA'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='CON_VB_ESCUELA'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_PRIORIZACION_FACULTAD'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_RS_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='CON_VB_ESCUELA'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='RECHAZADO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_RS_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_PRIORIZACION_FACULTAD'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_DICTAMEN_CONSEJO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_RS_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_PRIORIZACION_FACULTAD'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='RECHAZADO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_RS_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_DICTAMEN_CONSEJO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='APROBADO_CON_RESOLUCION'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='CONSEJO_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_DICTAMEN_CONSEJO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='RECHAZADO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='CONSEJO_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='APROBADO_CON_RESOLUCION'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_ASIGNACION_CARGA'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_DEPTO'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_ASIGNACION_CARGA'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='REGISTRADO_OFICIAL'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_CENTRAL_RS'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='REGISTRADO_OFICIAL'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_EJECUCION'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_RS_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_EJECUCION'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_MONITOREO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DOCENTE_RESP'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_MONITOREO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='INFORME_FINAL_PRESENTADO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='ESTUDIANTE_EJEC'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='INFORME_FINAL_PRESENTADO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='CON_CONFORMIDAD_ESCUELA'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_ESCUELA'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='CON_CONFORMIDAD_ESCUELA'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='CERRADO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='CONSEJO_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='CERRADO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_EVALUACION_IMPACTO'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='COMITE_CALIDAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EN_EVALUACION_IMPACTO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EVALUACION_VALIDADA'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='CONSEJO_FACULTAD'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='EVALUACION_VALIDADA'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='REPORTADO_SUNEDU'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DIR_CENTRAL_RS'),true),
-- Rechazo rebota al emisor (R31/R32): RECHAZADO → BORRADOR para reenviar
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='RECHAZADO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='BORRADOR'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='ESTUDIANTE_PROP'),true),
((SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='RECHAZADO'),(SELECT "id_estado" FROM "RSU_Estado_Proyecto" WHERE "codigo"='BORRADOR'),(SELECT "id_rol_actor" FROM "RSU_Rol_Actor" WHERE "codigo"='DOCENTE_RESP'),true);

-- ============================================================================
-- SEED: Configuración (M11) — 16 parámetros por defecto (V1.1 §5.1)
-- ============================================================================
INSERT INTO "RSU_Configuracion" ("clave","valor","descripcion","tipo","ambito") VALUES
('plazo_revision_director_escuela','5','Días hábiles para revisión del Director de Escuela','INT','GLOBAL'),
('plazo_revision_decano','5','Días hábiles para revisión del Decano','INT','GLOBAL'),
('plazo_subsanacion','10','Días hábiles para subsanar observaciones','INT','GLOBAL'),
('minimo_estudiantes_ssu','2','Mínimo de estudiantes por proyecto SSU','INT','GLOBAL'),
('maximo_estudiantes_ssu','5','Máximo de estudiantes por proyecto SSU','INT','GLOBAL'),
('minimo_horas_ssu','60','Mínimo de horas para SSU','INT','GLOBAL'),
('maximo_proyectos_ssu_docente','2','Máximo de proyectos SSU por docente por semestre','INT','GLOBAL'),
('maximo_estudiantes_publicacion','2','Máximo de estudiantes por publicación científica','INT','GLOBAL'),
('lineas_accion','Línea 01,Línea 02,Línea 03,Línea 04,Línea 05','Líneas de acción RSU','LIST','GLOBAL'),
('ods','1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17','Objetivos de Desarrollo Sostenible','LIST','GLOBAL'),
('revistas_indexadas','Latindex,SciELO,Scopus,Web of Science','Bases de datos de revistas indexadas','LIST','GLOBAL'),
('porcentaje_presupuesto_rsu','2','Porcentaje del presupuesto institucional para RSU (Art.125)','FLOAT','GLOBAL'),
('convocatorias_voluntariado_anio','2','Número de convocatorias de voluntariado por año','INT','GLOBAL'),
('correo_notificaciones','responsabilidadsocialu@undc.edu.pe','Correo de notificaciones','STRING','GLOBAL'),
('url_plataforma','https://drsu.undc.edu.pe','URL de la plataforma','STRING','GLOBAL'),
('modo_mantenimiento','false','Modo mantenimiento (true/false)','BOOL','GLOBAL');

-- ============================================================================
-- INDICES ADICIONALES (optimizacion de consultas frecuentes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_proyecto_escuela ON "RSU_Proyecto"("id_escuela");
CREATE INDEX IF NOT EXISTS idx_proyecto_tipo ON "RSU_Proyecto"("id_tipo");
CREATE INDEX IF NOT EXISTS idx_proyecto_ciclo ON "RSU_Proyecto"("id_ciclo_creacion");
CREATE INDEX IF NOT EXISTS idx_proyecto_lider ON "RSU_Proyecto"("id_estudiante_lider");
CREATE INDEX IF NOT EXISTS idx_proyecto_asesor ON "RSU_Proyecto"("id_docente_asesor");
CREATE INDEX IF NOT EXISTS idx_proyecto_fecha_inicio ON "RSU_Proyecto"("fecha_inicio_plan");
CREATE INDEX IF NOT EXISTS idx_proyecto_created ON "RSU_Proyecto"("created_at");
CREATE INDEX IF NOT EXISTS idx_flujo_proyecto ON "RSU_Flujo_Aprobacion"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_flujo_estados ON "RSU_Flujo_Aprobacion"("id_estado_origen","id_estado_destino");
CREATE INDEX IF NOT EXISTS idx_flujo_rol ON "RSU_Flujo_Aprobacion"("id_rol_actor");
CREATE INDEX IF NOT EXISTS idx_flujo_fecha ON "RSU_Flujo_Aprobacion"("fecha_transicion");
CREATE INDEX IF NOT EXISTS idx_documento_proyecto ON "RSU_Documento"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_documento_tipo ON "RSU_Documento"("id_tipo_doc");
CREATE INDEX IF NOT EXISTS idx_documento_vigente ON "RSU_Documento"("vigente");
CREATE INDEX IF NOT EXISTS idx_documento_fecha ON "RSU_Documento"("fecha_subida");
CREATE INDEX IF NOT EXISTS idx_asignacion_docente ON "RSU_Asignacion_Docente"("id_docente");
CREATE INDEX IF NOT EXISTS idx_asignacion_proyecto ON "RSU_Asignacion_Docente"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_asignacion_ciclo ON "RSU_Asignacion_Docente"("id_ciclo");
CREATE INDEX IF NOT EXISTS idx_asignacion_estado ON "RSU_Asignacion_Docente"("estado_asignacion");
CREATE INDEX IF NOT EXISTS idx_participante_estudiante ON "RSU_Participante_Estudiante"("id_estudiante");
CREATE INDEX IF NOT EXISTS idx_participante_proyecto ON "RSU_Participante_Estudiante"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_participante_estado ON "RSU_Participante_Estudiante"("estado_participacion");
CREATE INDEX IF NOT EXISTS idx_entregable_proyecto ON "RSU_Entregable"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_entregable_estado ON "RSU_Entregable"("estado");
CREATE INDEX IF NOT EXISTS idx_actividad_proyecto ON "RSU_Actividad_Campo"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_actividad_estado ON "RSU_Actividad_Campo"("estado");
CREATE INDEX IF NOT EXISTS idx_actividad_fecha ON "RSU_Actividad_Campo"("fecha_programada");
CREATE INDEX IF NOT EXISTS idx_foto_actividad ON "RSU_Actividad_Foto"("id_actividad");
CREATE INDEX IF NOT EXISTS idx_beneficiario_dni ON "RSU_Beneficiario"("dni");
CREATE INDEX IF NOT EXISTS idx_beneficiario_distrito ON "RSU_Beneficiario"("distrito");
CREATE INDEX IF NOT EXISTS idx_beneficiario_tipo ON "RSU_Beneficiario"("tipo_beneficiario");
CREATE INDEX IF NOT EXISTS idx_proy_benef_proyecto ON "RSU_Proyecto_Beneficiario"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_proy_benef_beneficiario ON "RSU_Proyecto_Beneficiario"("id_beneficiario");
CREATE INDEX IF NOT EXISTS idx_encuesta_benef_proyecto ON "RSU_Encuesta_Beneficiario"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_encuesta_sat_proyecto ON "RSU_Encuesta_Satisfaccion"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_respuesta_encuesta ON "RSU_Respuesta_Encuesta"("id_encuesta_benef");
CREATE INDEX IF NOT EXISTS idx_respuesta_pregunta ON "RSU_Respuesta_Encuesta"("id_pregunta");
CREATE INDEX IF NOT EXISTS idx_presupuesto_proyecto ON "RSU_Presupuesto_Movimiento"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_presupuesto_tipo ON "RSU_Presupuesto_Movimiento"("tipo");
CREATE INDEX IF NOT EXISTS idx_pago_proyecto ON "RSU_Pago_Voucher"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_pago_estado ON "RSU_Pago_Voucher"("estado");
CREATE INDEX IF NOT EXISTS idx_monitoreo_proyecto ON "RSU_Monitoreo"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_monitoreo_fecha ON "RSU_Monitoreo"("fecha_monitoreo");
CREATE INDEX IF NOT EXISTS idx_indicador_proyecto ON "RSU_Indicador_Impacto"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_leccion_proyecto ON "RSU_Leccion_Aprendida"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_constancia_proyecto ON "RSU_Solicitud_Constancia"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_constancia_estudiante ON "RSU_Solicitud_Constancia"("id_estudiante");
CREATE INDEX IF NOT EXISTS idx_declaracion_proyecto ON "RSU_Declaracion_Jurada"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_modificacion_proyecto ON "RSU_Modificacion_Informe"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_justificacion_actividad ON "RSU_Justificacion_Falta"("id_actividad");
CREATE INDEX IF NOT EXISTS idx_asistencia_actividad ON "RSU_Asistencia_Beneficiario"("id_actividad");
CREATE INDEX IF NOT EXISTS idx_verificacion_proyecto ON "RSU_Verificacion"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_resolucion_proyecto ON "RSU_Resolucion"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON "RSU_Auditoria_Log"("id_usuario");
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON "RSU_Auditoria_Log"("fecha_hora");
CREATE INDEX IF NOT EXISTS idx_notif_proyecto ON "RSU_Notificacion"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_transicion_origen ON "RSU_Transicion_Estado"("estado_origen");
CREATE INDEX IF NOT EXISTS idx_transicion_destino ON "RSU_Transicion_Estado"("estado_destino");
CREATE INDEX IF NOT EXISTS idx_transicion_rol ON "RSU_Transicion_Estado"("id_rol_actor");
CREATE INDEX IF NOT EXISTS idx_estudiante_escuela ON "Estudiante"("id_escuela");
CREATE INDEX IF NOT EXISTS idx_estudiante_estado ON "Estudiante"("estado");
CREATE INDEX IF NOT EXISTS idx_docente_escuela ON "Docente"("id_escuela");
CREATE INDEX IF NOT EXISTS idx_docente_tipo ON "Docente"("tipo_docente");
CREATE INDEX IF NOT EXISTS idx_escuela_facultad ON "Escuela"("id_facultad");
CREATE INDEX IF NOT EXISTS idx_ciclo_activo ON "Ciclo_Academico"("activo");
CREATE INDEX IF NOT EXISTS idx_rol_tipo ON "RSU_Rol_Actor"("tipo");
CREATE INDEX IF NOT EXISTS idx_estado_orden ON "RSU_Estado_Proyecto"("orden_flujo");
CREATE INDEX IF NOT EXISTS idx_est_ciclo_estudiante ON "Estudiante_Ciclo"("id_estudiante");
CREATE INDEX IF NOT EXISTS idx_est_ciclo_ciclo ON "Estudiante_Ciclo"("id_ciclo");
CREATE INDEX IF NOT EXISTS idx_comite_escuela ON "RSU_Comite_RSU"("id_escuela");
CREATE INDEX IF NOT EXISTS idx_instrumento_proyecto ON "RSU_Instrumento_Impacto"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_pr_proyecto ON "RSU_Proyecto_Rol"("id_proyecto");
CREATE INDEX IF NOT EXISTS idx_pr_usuario ON "RSU_Proyecto_Rol"("id_usuario");

-- ============================================================================
-- MÓDULO: Solicitudes de unión a PEP (HU-063..HU-069)
-- El estudiante solicita unirse a un PEP abierto; el responsable del PEP
-- acepta o rechaza.
-- ============================================================================
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

-- ── Migraciones idempotentes (post-deploy) ─────────────────────
-- Columnas agregadas después del schema inicial. IF NOT EXISTS mantiene el
-- archivo re-ejecutable (Docker lo corre solo en volumen nuevo, pero los
-- entornos ya inicializados reciben estos ALTER en el arranque del backend).
ALTER TABLE "Estudiante" ADD COLUMN IF NOT EXISTS "celular" VARCHAR(15);
