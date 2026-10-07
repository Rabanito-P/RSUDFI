-- ============================================================================
-- SISTEMA DE GESTIÓN DE RESPONSABILIDAD SOCIAL UNIVERSITARIA (RSU)
-- Universidad Nacional de Cañete (UNDC)
-- Base Legal: Ley Universitaria N° 30220 (Art. 35, 36, 40, 79, 86, 124, 125)
-- Estándares: SUNEDU (Indicador 29) y SINEACE (Estándar 25)
-- Motor: MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET time_zone = '-05:00';

DROP DATABASE IF EXISTS undc_rsu;
CREATE DATABASE undc_rsu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE undc_rsu;

-- ============================================================================
-- MÓDULO 1: ESTRUCTURA ORGANIZACIONAL
-- Base legal: Art. 32, 33 y 36 Ley 30220
-- ============================================================================

CREATE TABLE Facultad (
    id_facultad       INT PRIMARY KEY AUTO_INCREMENT,
    codigo            VARCHAR(10) UNIQUE NOT NULL,
    nombre            VARCHAR(200) NOT NULL,
    decano_id         INT NULL,
    activo            BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Escuela (
    id_escuela        INT PRIMARY KEY AUTO_INCREMENT,
    id_facultad       INT NOT NULL,
    codigo            VARCHAR(10) UNIQUE NOT NULL,
    nombre            VARCHAR(200) NOT NULL,
    director_id       INT NULL,
    activo            BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_facultad) REFERENCES Facultad(id_facultad)
) ENGINE=InnoDB;

CREATE TABLE Departamento_Academico (
    id_departamento   INT PRIMARY KEY AUTO_INCREMENT,
    id_facultad       INT NOT NULL,
    nombre            VARCHAR(200) NOT NULL,
    director_id       INT NULL,
    FOREIGN KEY (id_facultad) REFERENCES Facultad(id_facultad)
) ENGINE=InnoDB;

CREATE TABLE Ciclo_Academico (
    id_ciclo          INT PRIMARY KEY AUTO_INCREMENT,
    nombre            VARCHAR(20) UNIQUE NOT NULL,
    fecha_inicio      DATE NOT NULL,
    fecha_fin         DATE NOT NULL,
    activo            BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 2: PERSONAS (integradas con sistema académico)
-- Base legal: Art. 40, 79, 86 Ley 30220
-- ============================================================================

CREATE TABLE Docente (
    id_docente               INT PRIMARY KEY AUTO_INCREMENT,
    codigo_docente           VARCHAR(20) UNIQUE NOT NULL,
    dni                      VARCHAR(8) UNIQUE NOT NULL,
    nombres                  VARCHAR(150) NOT NULL,
    apellidos                VARCHAR(150) NOT NULL,
    correo_institucional     VARCHAR(150) UNIQUE NOT NULL,
    id_escuela               INT NOT NULL,
    id_departamento          INT NULL,
    tipo_docente             ENUM('ORDINARIO_TC','ORDINARIO_DE','CONTRATADO') NOT NULL,
    categoria                ENUM('AUXILIAR','ASOCIADO','PRINCIPAL') NULL,
    carga_lectiva_max        DECIMAL(5,2) DEFAULT 0,
    carga_no_lectiva_max     DECIMAL(5,2) DEFAULT 0,
    activo                   BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_escuela) REFERENCES Escuela(id_escuela),
    FOREIGN KEY (id_departamento) REFERENCES Departamento_Academico(id_departamento),
    INDEX idx_docente_correo (correo_institucional),
    INDEX idx_docente_dni (dni)
) ENGINE=InnoDB;

CREATE TABLE Estudiante (
    id_estudiante            INT PRIMARY KEY AUTO_INCREMENT,
    codigo_estudiante        VARCHAR(20) UNIQUE NOT NULL,
    dni                      VARCHAR(8) UNIQUE NOT NULL,
    nombres                  VARCHAR(150) NOT NULL,
    apellidos                VARCHAR(150) NOT NULL,
    correo_institucional     VARCHAR(150) UNIQUE NOT NULL,
    id_escuela               INT NOT NULL,
    estado                   ENUM('ACTIVO','EGRESADO','RETIRADO','SUSPENDIDO') DEFAULT 'ACTIVO',
    fecha_ingreso            DATE NULL,
    FOREIGN KEY (id_escuela) REFERENCES Escuela(id_escuela),
    INDEX idx_estudiante_correo (correo_institucional),
    INDEX idx_estudiante_dni (dni)
) ENGINE=InnoDB;

CREATE TABLE Estudiante_Ciclo (
    id_estudiante            INT NOT NULL,
    id_ciclo                 INT NOT NULL,
    ciclo_numerico           INT NOT NULL,
    creditos_matriculados    INT DEFAULT 0,
    estado                   ENUM('MATRICULADO','APROBADO','RETIRADO') DEFAULT 'MATRICULADO',
    PRIMARY KEY (id_estudiante, id_ciclo),
    FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante) ON DELETE CASCADE,
    FOREIGN KEY (id_ciclo) REFERENCES Ciclo_Academico(id_ciclo)
) ENGINE=InnoDB;

-- FKs diferidas de Facultad y Escuela
ALTER TABLE Facultad
    ADD CONSTRAINT fk_facultad_decano FOREIGN KEY (decano_id) REFERENCES Docente(id_docente);
ALTER TABLE Escuela
    ADD CONSTRAINT fk_escuela_director FOREIGN KEY (director_id) REFERENCES Docente(id_docente);
ALTER TABLE Departamento_Academico
    ADD CONSTRAINT fk_departamento_director FOREIGN KEY (director_id) REFERENCES Docente(id_docente);

-- ============================================================================
-- MÓDULO 3: CONFIGURACIÓN RSU
-- Base legal: Art. 124, 125 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Tipo_Proyecto (
    id_tipo                  INT PRIMARY KEY AUTO_INCREMENT,
    nombre                   VARCHAR(100) NOT NULL,
    descripcion              TEXT,
    ciclo_minimo_estudiante  INT DEFAULT 1,
    horas_docente_max        DECIMAL(5,2),
    requiere_presupuesto     BOOLEAN DEFAULT TRUE,
    activo                   BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE RSU_Linea_Accion (
    id_linea                 INT PRIMARY KEY AUTO_INCREMENT,
    nombre                   VARCHAR(200) NOT NULL,
    descripcion              TEXT,
    alineacion_ods           VARCHAR(200),
    activo                   BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE RSU_Rol_Proyecto (
    id_rol_proyecto          INT PRIMARY KEY AUTO_INCREMENT,
    nombre                   VARCHAR(50) NOT NULL,
    aplica_a                 ENUM('DOCENTE','ESTUDIANTE','AMBOS') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE RSU_Rol_Actor (
    id_rol_actor             INT PRIMARY KEY AUTO_INCREMENT,
    codigo                   VARCHAR(50) UNIQUE NOT NULL,
    nombre                   VARCHAR(150) NOT NULL,
    tipo                     ENUM('DOCENTE','ESTUDIANTE','AUTORIDAD','COMITE','ADMINISTRATIVO') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE RSU_Estado_Proyecto (
    id_estado                INT PRIMARY KEY AUTO_INCREMENT,
    codigo                   VARCHAR(30) UNIQUE NOT NULL,
    nombre                   VARCHAR(100) NOT NULL,
    orden_flujo              INT NOT NULL,
    es_final                 BOOLEAN DEFAULT FALSE,
    color_ui                 VARCHAR(10)
) ENGINE=InnoDB;

CREATE TABLE RSU_Tipo_Documento (
    id_tipo_doc              INT PRIMARY KEY AUTO_INCREMENT,
    nombre                   VARCHAR(150) NOT NULL,
    etapa                    ENUM('FORMULACION','EJECUCION','EVALUACION','TRANSVERSAL') NOT NULL,
    obligatorio              BOOLEAN DEFAULT TRUE,
    activo                   BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE RSU_Transicion_Estado (
    id_transicion            INT PRIMARY KEY AUTO_INCREMENT,
    estado_origen            INT NOT NULL,
    estado_destino           INT NOT NULL,
    id_rol_actor             INT NOT NULL,
    requiere_documento       BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (estado_origen) REFERENCES RSU_Estado_Proyecto(id_estado),
    FOREIGN KEY (estado_destino) REFERENCES RSU_Estado_Proyecto(id_estado),
    FOREIGN KEY (id_rol_actor) REFERENCES RSU_Rol_Actor(id_rol_actor)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 4: PROYECTO DE RSU (NÚCLEO)
-- Base legal: Art. 124, 125 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Proyecto (
    id_proyecto              INT PRIMARY KEY AUTO_INCREMENT,
    codigo_proyecto          VARCHAR(30) UNIQUE NOT NULL,
    titulo                   VARCHAR(300) NOT NULL,
    id_escuela               INT NOT NULL,
    id_tipo                  INT NOT NULL,
    id_linea_accion          INT NULL,
    id_estado_actual         INT NOT NULL,
    id_ciclo_creacion        INT NOT NULL,
    id_estudiante_lider      INT NULL,
    id_docente_asesor        INT NULL,
    descripcion              TEXT,
    objetivo_general         TEXT,
    objetivos_especificos    TEXT,
    poblacion_beneficiaria   TEXT,
    sector_beneficiario      VARCHAR(200),
    numero_beneficiarios     INT DEFAULT 0,
    lugar_intervencion       VARCHAR(200),
    semestre                 VARCHAR(20),
    fecha_inicio_plan        DATE,
    fecha_fin_plan           DATE,
    presupuesto_solicitado   DECIMAL(12,2) DEFAULT 0,
    presupuesto_aprobado     DECIMAL(12,2) DEFAULT 0,
    monto_ejecutado          DECIMAL(12,2) DEFAULT 0,
    porcentaje_avance        DECIMAL(5,2) DEFAULT 0,
    archivo_proyecto_url     VARCHAR(500),
    archivo_aprobacion_url   VARCHAR(500),
    id_resolucion_aprobacion INT NULL,
    fecha_aprobacion         DATE NULL,
    id_resolucion_cierre     INT NULL,
    fecha_cierre             DATE NULL,
    activo                   BOOLEAN DEFAULT TRUE,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_escuela) REFERENCES Escuela(id_escuela),
    FOREIGN KEY (id_tipo) REFERENCES RSU_Tipo_Proyecto(id_tipo),
    FOREIGN KEY (id_linea_accion) REFERENCES RSU_Linea_Accion(id_linea),
    FOREIGN KEY (id_estado_actual) REFERENCES RSU_Estado_Proyecto(id_estado),
    FOREIGN KEY (id_ciclo_creacion) REFERENCES Ciclo_Academico(id_ciclo),
    FOREIGN KEY (id_estudiante_lider) REFERENCES Estudiante(id_estudiante),
    FOREIGN KEY (id_docente_asesor) REFERENCES Docente(id_docente),
    INDEX idx_proyecto_estado (id_estado_actual),
    INDEX idx_proyecto_escuela (id_escuela),
    INDEX idx_proyecto_ciclo (id_ciclo_creacion)
) ENGINE=InnoDB;

CREATE TABLE RSU_Entregable (
    id_entregable            INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    nombre                   VARCHAR(100) NOT NULL,
    orden                    INT NOT NULL,
    fecha_limite             DATE,
    horas_asignadas          DECIMAL(5,2) DEFAULT 0,
    id_documento_guia        INT NULL,
    id_documento_subido      INT NULL,
    estado                   ENUM('PENDIENTE','SUBIDO','APROBADO','RECHAZADO','OBSERVADO') DEFAULT 'PENDIENTE',
    id_verificador           INT NULL,
    fecha_verificacion       TIMESTAMP NULL,
    observaciones            TEXT,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    INDEX idx_entregable_proyecto (id_proyecto)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 5: ASIGNACIÓN DE RECURSOS HUMANOS
-- Base legal: Art. 40, 79, 86 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Asignacion_Docente (
    id_asignacion            INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_docente               INT NOT NULL,
    id_rol_proyecto          INT NOT NULL,
    horas_asignadas          DECIMAL(5,2) NOT NULL,
    tipo_hora                ENUM('LECTIVA','NO_LECTIVA') DEFAULT 'NO_LECTIVA',
    id_ciclo                 INT NOT NULL,
    fecha_asignacion         DATE NOT NULL,
    id_documento_carga       INT NULL,
    estado_asignacion        ENUM('PENDIENTE','APROBADA','RECHAZADA') DEFAULT 'PENDIENTE',
    aprobado_por             INT NULL,
    fecha_aprobacion         DATE NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_docente) REFERENCES Docente(id_docente),
    FOREIGN KEY (id_rol_proyecto) REFERENCES RSU_Rol_Proyecto(id_rol_proyecto),
    FOREIGN KEY (id_ciclo) REFERENCES Ciclo_Academico(id_ciclo),
    FOREIGN KEY (aprobado_por) REFERENCES Docente(id_docente),
    INDEX idx_asig_docente (id_docente)
) ENGINE=InnoDB;

CREATE TABLE RSU_Participante_Estudiante (
    id_participante          INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_estudiante            INT NOT NULL,
    id_rol_proyecto          INT NOT NULL,
    horas_acumuladas         DECIMAL(5,2) DEFAULT 0,
    creditos_otorgados       DECIMAL(4,2) DEFAULT 0,
    fecha_inscripcion        DATE NOT NULL,
    estado_participacion     ENUM('INSCRITO','ACTIVO','RETIRADO','FINALIZADO') DEFAULT 'INSCRITO',
    validacion_ciclo         BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante),
    FOREIGN KEY (id_rol_proyecto) REFERENCES RSU_Rol_Proyecto(id_rol_proyecto),
    INDEX idx_part_estudiante (id_estudiante)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 6: DOCUMENTOS Y EVIDENCIAS
-- Base legal: Art. 35, 124, 125 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Documento (
    id_documento             INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_tipo_doc              INT NOT NULL,
    nombre_archivo           VARCHAR(255) NOT NULL,
    url_archivo              VARCHAR(500) NOT NULL,
    hash_archivo             VARCHAR(64),
    tamaño_bytes             INT,
    version                  INT DEFAULT 1,
    id_usuario_subida        INT NOT NULL,
    fecha_subida             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vigente                  BOOLEAN DEFAULT TRUE,
    observaciones            TEXT,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_doc) REFERENCES RSU_Tipo_Documento(id_tipo_doc),
    INDEX idx_doc_proyecto (id_proyecto)
) ENGINE=InnoDB;

CREATE TABLE RSU_Resolucion (
    id_resolucion            INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    tipo_resolucion          ENUM('APROBACION','CIERRE','CONFORMIDAD_EVALUACION','OTRO') NOT NULL,
    numero_resolucion        VARCHAR(50) UNIQUE NOT NULL,
    fecha_resolucion         DATE NOT NULL,
    id_documento             INT NULL,
    id_organo                INT NOT NULL,
    observaciones            TEXT,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_documento) REFERENCES RSU_Documento(id_documento),
    FOREIGN KEY (id_organo) REFERENCES RSU_Rol_Actor(id_rol_actor)
) ENGINE=InnoDB;

ALTER TABLE RSU_Proyecto
    ADD CONSTRAINT fk_proyecto_resol_aprob FOREIGN KEY (id_resolucion_aprobacion) REFERENCES RSU_Resolucion(id_resolucion),
    ADD CONSTRAINT fk_proyecto_resol_cierre FOREIGN KEY (id_resolucion_cierre) REFERENCES RSU_Resolucion(id_resolucion);

CREATE TABLE RSU_Declaracion_Jurada (
    id_declaracion           INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_estudiante            INT NOT NULL,
    id_documento             INT NULL,
    fecha_registro           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado                   ENUM('REGISTRADO','VALIDADO','RECHAZADO') DEFAULT 'REGISTRADO',
    id_verificador           INT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante),
    FOREIGN KEY (id_documento) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 7: FLUJO DE APROBACIÓN Y VERIFICACIÓN
-- Base legal: Art. 35, 36, 124 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Flujo_Aprobacion (
    id_flujo                 INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_estado_origen         INT NOT NULL,
    id_estado_destino        INT NOT NULL,
    id_rol_actor             INT NOT NULL,
    id_usuario               INT NOT NULL,
    id_documento_sustento    INT NULL,
    id_resolucion            INT NULL,
    fecha_transicion         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comentarios              TEXT,
    resultado                ENUM('APROBADO','OBSERVADO','RECHAZADO','DEVUELTO') NOT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_estado_origen) REFERENCES RSU_Estado_Proyecto(id_estado),
    FOREIGN KEY (id_estado_destino) REFERENCES RSU_Estado_Proyecto(id_estado),
    FOREIGN KEY (id_rol_actor) REFERENCES RSU_Rol_Actor(id_rol_actor),
    FOREIGN KEY (id_documento_sustento) REFERENCES RSU_Documento(id_documento),
    FOREIGN KEY (id_resolucion) REFERENCES RSU_Resolucion(id_resolucion),
    INDEX idx_flujo_proyecto (id_proyecto)
) ENGINE=InnoDB;

CREATE TABLE RSU_Verificacion (
    id_verificacion          INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    tipo_verificacion        ENUM('VIABILIDAD_TECNICA','NO_DUPLICIDAD','PRESUPUESTAL',
                                  'MONITOREO_CAMPO','CONFORMIDAD_INFORME',
                                  'EVALUACION_IMPACTO','CONSISTENCIA_EVALUACION') NOT NULL,
    id_flujo_aprobacion      INT NULL,
    id_verificador           INT NOT NULL,
    id_rol_verificador       INT NOT NULL,
    fecha_verificacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado                ENUM('CONFORME','CON_OBSERVACIONES','NO_CONFORME') NOT NULL,
    observaciones            TEXT,
    id_documento             INT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_flujo_aprobacion) REFERENCES RSU_Flujo_Aprobacion(id_flujo),
    FOREIGN KEY (id_documento) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

CREATE TABLE RSU_Modificacion_Informe (
    id_modificacion          INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    motivo                   TEXT NOT NULL,
    id_documento_solicitud   INT NULL,
    fecha_solicitud          DATE NOT NULL,
    estado                   ENUM('PENDIENTE','REVISADO','APROBADO','RECHAZADO','OBSERVADO') DEFAULT 'PENDIENTE',
    id_verificador           INT NULL,
    fecha_verificacion       TIMESTAMP NULL,
    observaciones            TEXT,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_documento_solicitud) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 8: EJECUCIÓN, MONITOREO Y ASISTENCIA
-- Base legal: Art. 7.3, 79, 124 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Actividad_Campo (
    id_actividad             INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_entregable            INT NULL,
    nombre                   VARCHAR(200) NOT NULL,
    descripcion              TEXT,
    fecha_programada         DATE,
    fecha_ejecucion          DATE,
    hora_inicio              TIME,
    hora_fin                 TIME,
    minutos                  INT DEFAULT 0,
    lugar                    VARCHAR(200),
    id_responsable           INT NULL,
    id_usuario_registro      INT NULL,
    estado                   ENUM('PROGRAMADA','EN_EJECUCION','EJECUTADA','CANCELADA') DEFAULT 'PROGRAMADA',
    nro_beneficiarios        INT DEFAULT 0,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_entregable) REFERENCES RSU_Entregable(id_entregable)
) ENGINE=InnoDB;

CREATE TABLE RSU_Actividad_Foto (
    id_foto                  INT PRIMARY KEY AUTO_INCREMENT,
    id_actividad             INT NOT NULL,
    url_foto                 VARCHAR(500) NOT NULL,
    descripcion              VARCHAR(255),
    fecha_subida             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_actividad) REFERENCES RSU_Actividad_Campo(id_actividad) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE RSU_Justificacion_Falta (
    id_justificacion         INT PRIMARY KEY AUTO_INCREMENT,
    id_actividad             INT NOT NULL,
    id_estudiante            INT NOT NULL,
    fecha_ausencia           DATE NOT NULL,
    hora_inicio_actividad    TIME,
    hora_fin_actividad       TIME,
    motivo                   TEXT NOT NULL,
    id_documento_evidencia   INT NULL,
    estado                   ENUM('PENDIENTE','REVISADO','APROBADO','RECHAZADO') DEFAULT 'PENDIENTE',
    id_verificador           INT NULL,
    fecha_verificacion       TIMESTAMP NULL,
    observaciones            TEXT,
    FOREIGN KEY (id_actividad) REFERENCES RSU_Actividad_Campo(id_actividad) ON DELETE CASCADE,
    FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante),
    FOREIGN KEY (id_documento_evidencia) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

CREATE TABLE RSU_Monitoreo (
    id_monitoreo             INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    fecha_monitoreo          DATE NOT NULL,
    id_monitor               INT NOT NULL,
    porcentaje_avance        DECIMAL(5,2),
    hitos_cumplidos          TEXT,
    observaciones            TEXT,
    resultado                ENUM('CONFORME','CON_OBSERVACIONES','NO_CONFORME') NOT NULL,
    id_documento             INT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_monitor) REFERENCES Docente(id_docente),
    FOREIGN KEY (id_documento) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 8B: BENEFICIARIOS
-- Base legal: Art. 124 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Beneficiario (
    id_beneficiario          INT PRIMARY KEY AUTO_INCREMENT,
    tipo_beneficiario        ENUM('PERSONA_NATURAL','INSTITUCION','COMUNIDAD') NOT NULL DEFAULT 'PERSONA_NATURAL',
    dni                      VARCHAR(8) UNIQUE NULL,
    nombres                  VARCHAR(150),
    apellidos                VARCHAR(150),
    fecha_nacimiento         DATE,
    sexo                     ENUM('M','F','OTRO'),
    ruc                      VARCHAR(11) NULL,
    razon_social             VARCHAR(200),
    representante_legal      VARCHAR(200),
    celular                  VARCHAR(15),
    telefono_fijo            VARCHAR(15),
    correo_electronico       VARCHAR(150),
    direccion                VARCHAR(255),
    distrito                 VARCHAR(100),
    provincia                VARCHAR(100) DEFAULT 'Cañete',
    departamento             VARCHAR(100) DEFAULT 'Lima',
    ocupacion                VARCHAR(150),
    nivel_educativo          ENUM('SIN_INSTRUCCION','PRIMARIA','SECUNDARIA','TECNICA','UNIVERSITARIA','POSGRADO'),
    condicion_vulnerabilidad VARCHAR(200),
    activo                   BOOLEAN DEFAULT TRUE,
    fecha_registro           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registro      INT NULL,
    INDEX idx_benef_dni (dni),
    INDEX idx_benef_apellidos (apellidos),
    INDEX idx_benef_distrito (distrito)
) ENGINE=InnoDB;

CREATE TABLE RSU_Proyecto_Beneficiario (
    id_vinculacion           INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_beneficiario          INT NOT NULL,
    fecha_incorporacion      DATE NOT NULL,
    rol_en_proyecto          VARCHAR(100),
    observaciones            TEXT,
    activo                   BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_beneficiario) REFERENCES RSU_Beneficiario(id_beneficiario),
    UNIQUE KEY uk_proyecto_beneficiario (id_proyecto, id_beneficiario)
) ENGINE=InnoDB;

CREATE TABLE RSU_Asistencia_Beneficiario (
    id_asistencia            INT PRIMARY KEY AUTO_INCREMENT,
    id_actividad             INT NOT NULL,
    id_beneficiario          INT NOT NULL,
    firma_url                VARCHAR(500),
    observaciones            VARCHAR(255),
    FOREIGN KEY (id_actividad) REFERENCES RSU_Actividad_Campo(id_actividad) ON DELETE CASCADE,
    FOREIGN KEY (id_beneficiario) REFERENCES RSU_Beneficiario(id_beneficiario)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 9: PRESUPUESTO Y PAGOS
-- Base legal: Art. 125 Ley 30220 (mínimo 2% del presupuesto)
-- ============================================================================

CREATE TABLE RSU_Presupuesto_Movimiento (
    id_movimiento            INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_facultad              INT NOT NULL,
    tipo                     ENUM('ASIGNACION','EJECUCION','TRANSFERENCIA','DEVOLUCION') NOT NULL,
    monto                    DECIMAL(12,2) NOT NULL,
    fecha                    DATE NOT NULL,
    id_documento_sustento    INT NULL,
    id_usuario_registro      INT NOT NULL,
    observaciones            TEXT,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_facultad) REFERENCES Facultad(id_facultad),
    FOREIGN KEY (id_documento_sustento) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

CREATE TABLE RSU_Pago_Voucher (
    id_pago                  INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_beneficiario_pago     INT NOT NULL,
    id_facultad              INT NOT NULL,
    numero_operacion         VARCHAR(50),
    banco                    VARCHAR(100),
    monto                    DECIMAL(10,2) NOT NULL,
    fecha_pago               DATE NOT NULL,
    id_documento_voucher     INT NULL,
    estado                   ENUM('REGISTRADO','VERIFICADO_FACULTAD','OBSERVADO','PAGADO') DEFAULT 'REGISTRADO',
    id_verificador           INT NULL,
    fecha_verificacion       TIMESTAMP NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_facultad) REFERENCES Facultad(id_facultad),
    FOREIGN KEY (id_documento_voucher) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 10: EVALUACIÓN DE IMPACTO
-- Base legal: Art. 124, 125 Ley 30220 / SUNEDU Indicador 29 / SINEACE Estándar 25
-- ============================================================================

CREATE TABLE RSU_Instrumento_Impacto (
    id_instrumento           INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    tipo                     ENUM('ENCUESTA','FOCUS_GROUP','FICHA_IMPACTO','ENTREVISTA') NOT NULL,
    nombre                   VARCHAR(200) NOT NULL,
    fecha_aplicacion         DATE,
    nro_aplicados            INT DEFAULT 0,
    id_documento             INT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_documento) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

CREATE TABLE RSU_Encuesta_Satisfaccion (
    id_encuesta              INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_docente_asesor        INT NOT NULL,
    id_estudiante            INT NOT NULL,
    fecha_registro           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado                   ENUM('REGISTRADO','PROCESADO','VALIDADO') DEFAULT 'REGISTRADO',
    id_documento             INT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_docente_asesor) REFERENCES Docente(id_docente),
    FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante),
    FOREIGN KEY (id_documento) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

-- Catálogo de preguntas de la encuesta al beneficiario
CREATE TABLE RSU_Pregunta_Encuesta (
    id_pregunta              INT PRIMARY KEY AUTO_INCREMENT,
    codigo                   VARCHAR(20) UNIQUE NOT NULL,
    texto_pregunta           VARCHAR(500) NOT NULL,
    dimension                ENUM('UTILIDAD','CALIDAD','TRATO','PERTINENCIA','IMPACTO','OTRO') NOT NULL,
    orden                    INT NOT NULL,
    activa                   BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Encuesta aplicada a cada beneficiario
CREATE TABLE RSU_Encuesta_Beneficiario (
    id_encuesta_benef        INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_beneficiario          INT NOT NULL,
    fecha_aplicacion         DATE NOT NULL,
    id_aplicador             INT NULL,
    modalidad                ENUM('PRESENCIAL','TELEFONICA','VIRTUAL','WHATSAPP') DEFAULT 'PRESENCIAL',
    promedio_general         DECIMAL(3,2),
    calificacion_cualitativa ENUM('MUY_MALO','MALO','REGULAR','BUENO','MUY_BUENO'),
    comentario_abierto       TEXT,
    sugerencia_mejora        TEXT,
    id_documento_firmado     INT NULL,
    estado                   ENUM('REGISTRADA','VALIDADA','OBSERVADA') DEFAULT 'REGISTRADA',
    id_validador             INT NULL,
    fecha_validacion         TIMESTAMP NULL,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_beneficiario) REFERENCES RSU_Beneficiario(id_beneficiario),
    FOREIGN KEY (id_documento_firmado) REFERENCES RSU_Documento(id_documento),
    UNIQUE KEY uk_encuesta_proyecto_benef (id_proyecto, id_beneficiario)
) ENGINE=InnoDB;

-- Respuestas detalladas (escala Likert 1-5)
CREATE TABLE RSU_Respuesta_Encuesta (
    id_respuesta             INT PRIMARY KEY AUTO_INCREMENT,
    id_encuesta_benef        INT NOT NULL,
    id_pregunta              INT NOT NULL,
    valor_numerico           TINYINT NOT NULL CHECK (valor_numerico BETWEEN 1 AND 5),
    valor_cualitativo        ENUM('MUY_MALO','MALO','REGULAR','BUENO','MUY_BUENO') NOT NULL,
    FOREIGN KEY (id_encuesta_benef) REFERENCES RSU_Encuesta_Beneficiario(id_encuesta_benef) ON DELETE CASCADE,
    FOREIGN KEY (id_pregunta) REFERENCES RSU_Pregunta_Encuesta(id_pregunta),
    UNIQUE KEY uk_encuesta_pregunta (id_encuesta_benef, id_pregunta)
) ENGINE=InnoDB;

-- Respaldo para escala simplificada de 3 niveles (Malo/Regular/Bueno)
CREATE TABLE RSU_Respuesta_Encuesta_Simple (
    id_respuesta_simple      INT PRIMARY KEY AUTO_INCREMENT,
    id_encuesta_benef        INT NOT NULL,
    id_pregunta              INT NOT NULL,
    valor_simple             TINYINT NOT NULL CHECK (valor_simple BETWEEN 1 AND 3),
    valor_texto              ENUM('MALO','REGULAR','BUENO') NOT NULL,
    FOREIGN KEY (id_encuesta_benef) REFERENCES RSU_Encuesta_Beneficiario(id_encuesta_benef) ON DELETE CASCADE,
    FOREIGN KEY (id_pregunta) REFERENCES RSU_Pregunta_Encuesta(id_pregunta)
) ENGINE=InnoDB;

CREATE TABLE RSU_Indicador_Impacto (
    id_indicador             INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    nombre_indicador         VARCHAR(200) NOT NULL,
    linea_base               DECIMAL(12,2),
    meta_planificada         DECIMAL(12,2),
    valor_alcanzado          DECIMAL(12,2),
    unidad_medida            VARCHAR(50),
    porcentaje_logro         DECIMAL(5,2),
    fuente_verificacion      VARCHAR(200),
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE RSU_Leccion_Aprendida (
    id_leccion               INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    descripcion              TEXT NOT NULL,
    recomendacion_curricular TEXT,
    fecha_registro           DATE,
    id_responsable           INT NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MÓDULO 11: REPORTES, CONSTANCIAS Y AUDITORÍA
-- Base legal: Art. 125 Ley 30220
-- ============================================================================

CREATE TABLE RSU_Reporte_Anual (
    id_reporte               INT PRIMARY KEY AUTO_INCREMENT,
    anio                     INT NOT NULL,
    id_facultad              INT NULL,
    total_proyectos          INT DEFAULT 0,
    total_docentes           INT DEFAULT 0,
    total_estudiantes        INT DEFAULT 0,
    total_beneficiarios      INT DEFAULT 0,
    monto_invertido          DECIMAL(12,2) DEFAULT 0,
    porcentaje_presupuesto   DECIMAL(5,2) DEFAULT 0,
    id_documento_memoria     INT NULL,
    fecha_generacion         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_facultad) REFERENCES Facultad(id_facultad),
    FOREIGN KEY (id_documento_memoria) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

CREATE TABLE RSU_Solicitud_Constancia (
    id_solicitud             INT PRIMARY KEY AUTO_INCREMENT,
    id_proyecto              INT NOT NULL,
    id_estudiante            INT NOT NULL,
    tipo_constancia          ENUM('PARTICIPACION','HORAS','CULMINACION') NOT NULL,
    fecha_solicitud          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado                   ENUM('PENDIENTE','EMITIDA','RECHAZADA') DEFAULT 'PENDIENTE',
    id_documento_emitido     INT NULL,
    id_aprobador             INT NULL,
    fecha_emision            DATE NULL,
    FOREIGN KEY (id_proyecto) REFERENCES RSU_Proyecto(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante),
    FOREIGN KEY (id_documento_emitido) REFERENCES RSU_Documento(id_documento)
) ENGINE=InnoDB;

CREATE TABLE RSU_Auditoria_Log (
    id_log                   INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario               INT NOT NULL,
    id_proyecto              INT NULL,
    accion                   VARCHAR(100) NOT NULL,
    tabla_afectada           VARCHAR(100),
    id_registro_afectado     INT,
    valor_anterior           JSON,
    valor_nuevo              JSON,
    ip_origen                VARCHAR(45),
    fecha_hora               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_proyecto (id_proyecto),
    INDEX idx_audit_fecha (fecha_hora)
) ENGINE=InnoDB;

-- ============================================================================
-- DATOS INICIALES (SEED DATA)
-- ============================================================================

-- Estados del proyecto (mapea el ciclo de vida BPMN completo)
INSERT INTO RSU_Estado_Proyecto (codigo, nombre, orden_flujo, es_final, color_ui) VALUES
('BORRADOR',                 'Borrador',                        1,  FALSE, '#9E9E9E'),
('EN_REVISION_ESCUELA',      'En revisión Escuela',             2,  FALSE, '#FFC107'),
('CON_VB_ESCUELA',           'Con V°B° Escuela',                3,  FALSE, '#FF9800'),
('EN_PRIORIZACION_FACULTAD', 'En priorización Facultad',        4,  FALSE, '#FF5722'),
('EN_DICTAMEN_CONSEJO',      'En dictamen Consejo',             5,  FALSE, '#3F51B5'),
('APROBADO_CON_RESOLUCION',  'Aprobado con Resolución',         6,  FALSE, '#4CAF50'),
('EN_ASIGNACION_CARGA',      'En asignación de carga',          7,  FALSE, '#009688'),
('REGISTRADO_OFICIAL',       'Registrado oficialmente',         8,  FALSE, '#00BCD4'),
('EN_EJECUCION',             'En ejecución',                    9,  FALSE, '#2196F3'),
('EN_MONITOREO',             'En monitoreo',                   10,  FALSE, '#03A9F4'),
('INFORME_FINAL_PRESENTADO', 'Informe final presentado',       11,  FALSE, '#8BC34A'),
('CON_CONFORMIDAD_ESCUELA',  'Con conformidad Escuela',        12,  FALSE, '#CDDC39'),
('CERRADO',                  'Cerrado',                        13,  FALSE, '#607D8B'),
('EN_EVALUACION_IMPACTO',    'En evaluación de impacto',       14,  FALSE, '#9C27B0'),
('EVALUACION_VALIDADA',      'Evaluación validada',            15,  FALSE, '#673AB7'),
('REPORTADO_SUNEDU',         'Reportado a SUNEDU',             16,  TRUE,  '#212121');

-- Roles de actor (mapea los Lanes BPMN)
INSERT INTO RSU_Rol_Actor (codigo, nombre, tipo) VALUES
('DOCENTE_RESP',        'Docente Responsable',              'DOCENTE'),
('DOCENTE_COLAB',       'Docente Colaborador',              'DOCENTE'),
('ESTUDIANTE_PROP',     'Estudiante Proponente',            'ESTUDIANTE'),
('ESTUDIANTE_EJEC',     'Estudiante Ejecutor',              'ESTUDIANTE'),
('DIR_ESCUELA',         'Director de Escuela Profesional',  'AUTORIDAD'),
('COMITE_PS',           'Comité de Proyección Social',      'COMITE'),
('DIR_RS_FACULTAD',     'Director de RS de la Facultad',    'AUTORIDAD'),
('CONSEJO_FACULTAD',    'Consejo de Facultad',              'AUTORIDAD'),
('DIR_DEPTO',           'Director de Departamento Académico','AUTORIDAD'),
('DIR_CENTRAL_RS',      'Director Central de RS / VRA',     'AUTORIDAD'),
('UNIDAD_ABAST',        'Unidad de Abastecimiento',         'ADMINISTRATIVO'),
('COMITE_CALIDAD',      'Comité de Calidad',                'COMITE');

-- Tipos de proyecto
INSERT INTO RSU_Tipo_Proyecto (nombre, descripcion, ciclo_minimo_estudiante, horas_docente_max, requiere_presupuesto) VALUES
('Proyección Social', 'Intervención directa en la comunidad',       5, 8.0,  TRUE),
('Extensión Universitaria', 'Servicios y capacitaciones',           3, 6.0,  TRUE),
('Voluntariado', 'Participación voluntaria de estudiantes',          1, 4.0,  FALSE),
('Investigación Aplicada', 'Investigación con impacto social',       7, 8.0,  TRUE);

-- Roles de proyecto
INSERT INTO RSU_Rol_Proyecto (nombre, aplica_a) VALUES
('Responsable',   'DOCENTE'),
('Colaborador',   'DOCENTE'),
('Asesor',        'DOCENTE'),
('Ejecutor',      'ESTUDIANTE'),
('Apoyo',         'ESTUDIANTE'),
('Beneficiario',  'AMBOS');

-- Tipos de documento
INSERT INTO RSU_Tipo_Documento (nombre, etapa, obligatorio) VALUES
('Perfil de Proyecto',                    'FORMULACION', TRUE),
('Informe Técnico de Viabilidad',         'FORMULACION', TRUE),
('Resolución de Aprobación',              'FORMULACION', TRUE),
('Plan de Carga Horaria',                 'FORMULACION', TRUE),
('Acta de Compromiso',                    'EJECUCION',   TRUE),
('Pecosa / Rendición',                    'EJECUCION',   TRUE),
('Ficha de Asistencia',                   'EJECUCION',   TRUE),
('Informe de Monitoreo Intermedio',       'EJECUCION',   TRUE),
('Informe Final de Ejecución',            'EJECUCION',   TRUE),
('Resolución de Cierre',                  'EJECUCION',   TRUE),
('Encuesta de Satisfacción',              'EVALUACION',  TRUE),
('Matriz de Indicadores',                 'EVALUACION',  TRUE),
('Informe de Evaluación de Impacto',      'EVALUACION',  TRUE),
('Resolución de Conformidad Evaluación',  'EVALUACION',  TRUE),
('Memoria Anual RSU',                     'EVALUACION',  TRUE),
('Declaración Jurada de Uso de Imagen',   'TRANSVERSAL', TRUE),
('Voucher de Pago',                       'TRANSVERSAL', TRUE),
('Justificación de Falta',                'TRANSVERSAL', FALSE);

-- Preguntas de encuesta al beneficiario (escala Likert 1-5)
INSERT INTO RSU_Pregunta_Encuesta (codigo, texto_pregunta, dimension, orden) VALUES
('P01', '¿Cómo califica la utilidad del proyecto para resolver su necesidad?',    'UTILIDAD',    1),
('P02', '¿Cómo califica la calidad de las actividades realizadas?',               'CALIDAD',     2),
('P03', '¿Cómo califica el trato recibido por los docentes y estudiantes?',       'TRATO',       3),
('P04', '¿El proyecto respondió a lo que usted realmente necesitaba?',            'PERTINENCIA', 4),
('P05', '¿Recomendaría este proyecto a otras personas de su comunidad?',          'IMPACTO',     5),
('P06', '¿Cómo califica el impacto del proyecto en su vida diaria?',              'IMPACTO',     6);

-- Líneas de acción RSU
INSERT INTO RSU_Linea_Accion (nombre, descripcion, alineacion_ods) VALUES
('Salud y Bienestar Comunitario',       'Campañas de salud, prevención',       'ODS 3'),
('Educación y Cultura',                 'Reforzamiento, alfabetización',       'ODS 4'),
('Desarrollo Económico Local',          'Emprendimiento, formalización',       'ODS 8'),
('Gestión Ambiental',                   'Reciclaje, conservación',             'ODS 13'),
('Gobernanza y Ciudadanía',             'Fortalecimiento institucional',       'ODS 16'),
('Tecnología e Innovación Social',      'Soluciones digitales comunitarias',   'ODS 9');

-- ============================================================================
-- VISTAS PARA REPORTES
-- ============================================================================

-- Vista: Resumen de proyectos con escuela, facultad y estado
CREATE OR REPLACE VIEW vw_rsu_proyectos_resumen AS
SELECT 
    p.id_proyecto,
    p.codigo_proyecto,
    p.titulo,
    f.nombre AS facultad,
    e.nombre AS escuela,
    tp.nombre AS tipo_proyecto,
    ep.nombre AS estado_actual,
    p.semestre,
    p.fecha_inicio_plan,
    p.fecha_fin_plan,
    p.presupuesto_aprobado,
    p.monto_ejecutado,
    p.porcentaje_avance,
    CONCAT(est.apellidos, ', ', est.nombres) AS estudiante_lider,
    CONCAT(doc.apellidos, ', ', doc.nombres) AS docente_asesor,
    (SELECT COUNT(*) FROM RSU_Proyecto_Beneficiario pb WHERE pb.id_proyecto = p.id_proyecto AND pb.activo = TRUE) AS total_beneficiarios,
    (SELECT AVG(eb.promedio_general) FROM RSU_Encuesta_Beneficiario eb WHERE eb.id_proyecto = p.id_proyecto) AS promedio_satisfaccion
FROM RSU_Proyecto p
JOIN Escuela e ON p.id_escuela = e.id_escuela
JOIN Facultad f ON e.id_facultad = f.id_facultad
JOIN RSU_Tipo_Proyecto tp ON p.id_tipo = tp.id_tipo
JOIN RSU_Estado_Proyecto ep ON p.id_estado_actual = ep.id_estado
LEFT JOIN Estudiante est ON p.id_estudiante_lider = est.id_estudiante
LEFT JOIN Docente doc ON p.id_docente_asesor = doc.id_docente;

-- Vista: Satisfacción promedio por proyecto y dimensión
CREATE OR REPLACE VIEW vw_rsu_satisfaccion_dimension AS
SELECT 
    p.id_proyecto,
    p.codigo_proyecto,
    p.titulo,
    pe.dimension,
    AVG(re.valor_numerico) AS promedio_dimension,
    COUNT(*) AS total_respuestas
FROM RSU_Proyecto p
JOIN RSU_Encuesta_Beneficiario eb ON p.id_proyecto = eb.id_proyecto
JOIN RSU_Respuesta_Encuesta re ON eb.id_encuesta_benef = re.id_encuesta_benef
JOIN RSU_Pregunta_Encuesta pe ON re.id_pregunta = pe.id_pregunta
GROUP BY p.id_proyecto, pe.dimension;

-- Vista: Cobertura de beneficiarios únicos por año
CREATE OR REPLACE VIEW vw_rsu_cobertura_anual AS
SELECT 
    YEAR(p.fecha_inicio_plan) AS anio,
    COUNT(DISTINCT b.id_beneficiario) AS beneficiarios_unicos,
    COUNT(DISTINCT CASE WHEN b.tipo_beneficiario = 'PERSONA_NATURAL' THEN b.id_beneficiario END) AS personas,
    COUNT(DISTINCT CASE WHEN b.tipo_beneficiario = 'INSTITUCION' THEN b.id_beneficiario END) AS instituciones,
    COUNT(DISTINCT b.distrito) AS distritos_atendidos
FROM RSU_Beneficiario b
JOIN RSU_Proyecto_Beneficiario pb ON b.id_beneficiario = pb.id_beneficiario
JOIN RSU_Proyecto p ON pb.id_proyecto = p.id_proyecto
GROUP BY YEAR(p.fecha_inicio_plan);

-- Vista: Historial de aprobación (trazabilidad legal completa)
CREATE OR REPLACE VIEW vw_rsu_trazabilidad_aprobacion AS
SELECT 
    fa.id_flujo,
    p.codigo_proyecto,
    p.titulo,
    eo.nombre AS estado_origen,
    ed.nombre AS estado_destino,
    ra.nombre AS rol_actor,
    fa.id_usuario AS id_usuario_ejecutor,
    fa.fecha_transicion,
    fa.resultado,
    fa.comentarios,
    d.nombre_archivo AS documento_sustento,
    r.numero_resolucion
FROM RSU_Flujo_Aprobacion fa
JOIN RSU_Proyecto p ON fa.id_proyecto = p.id_proyecto
JOIN RSU_Estado_Proyecto eo ON fa.id_estado_origen = eo.id_estado
JOIN RSU_Estado_Proyecto ed ON fa.id_estado_destino = ed.id_estado
JOIN RSU_Rol_Actor ra ON fa.id_rol_actor = ra.id_rol_actor
LEFT JOIN RSU_Documento d ON fa.id_documento_sustento = d.id_documento
LEFT JOIN RSU_Resolucion r ON fa.id_resolucion = r.id_resolucion;

-- ============================================================================
-- CONSULTAS DE VALIDACIÓN (Triggers lógicos documentados)
-- ============================================================================

-- NOTA: Estas consultas deben ejecutarse desde la capa de aplicación antes
-- de insertar/actualizar registros. Se documentan aquí como referencia.

-- [VALIDACIÓN 1] Verificar ciclo mínimo del estudiante antes de inscribirlo
-- SELECT e.id_estudiante, ec.ciclo_numerico, tp.ciclo_minimo_estudiante
-- FROM Estudiante e
-- JOIN Estudiante_Ciclo ec ON e.id_estudiante = ec.id_estudiante
-- JOIN RSU_Tipo_Proyecto tp ON tp.id_tipo = ?
-- WHERE e.id_estudiante = ?
--   AND ec.id_ciclo = (SELECT id_ciclo FROM Ciclo_Academico WHERE activo = TRUE)
--   AND ec.ciclo_numerico >= tp.ciclo_minimo_estudiante;

-- [VALIDACIÓN 2] Verificar que docente no exceda su carga no lectiva máxima
-- SELECT d.id_docente, d.carga_no_lectiva_max,
--        COALESCE(SUM(ad.horas_asignadas), 0) AS horas_rsu_asignadas
-- FROM Docente d
-- LEFT JOIN RSU_Asignacion_Docente ad ON d.id_docente = ad.id_docente
--   AND ad.id_ciclo = ? AND ad.estado_asignacion = 'APROBADA'
-- WHERE d.id_docente = ?
-- GROUP BY d.id_docente
-- HAVING horas_rsu_asignadas + ? <= d.carga_no_lectiva_max;

-- [VALIDACIÓN 3] Promedio de encuesta por proyecto
-- SELECT 
--     p.codigo_proyecto,
--     p.titulo,
--     COUNT(eb.id_encuesta_benef) AS total_encuestas,
--     AVG(eb.promedio_general) AS promedio_satisfaccion,
--     SUM(CASE WHEN eb.calificacion_cualitativa IN ('BUENO','MUY_BUENO') THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS porcentaje_satisfechos
-- FROM RSU_Proyecto p
-- JOIN RSU_Encuesta_Beneficiario eb ON p.id_proyecto = eb.id_proyecto
-- GROUP BY p.id_proyecto;

-- [VALIDACIÓN 4] Padrón de beneficiarios por proyecto
-- SELECT 
--     b.dni, b.apellidos, b.nombres, b.celular, b.distrito,
--     pb.rol_en_proyecto, pb.fecha_incorporacion
-- FROM RSU_Beneficiario b
-- JOIN RSU_Proyecto_Beneficiario pb ON b.id_beneficiario = pb.id_beneficiario
-- WHERE pb.id_proyecto = ? AND pb.activo = TRUE
-- ORDER BY b.apellidos, b.nombres;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;