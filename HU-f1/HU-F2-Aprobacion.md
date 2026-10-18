# HISTORIAS DE USUARIO — FASE 2: APROBACIÓN

**Sistema:** Mini-RSU — Gestión Interna de Responsabilidad Social Universitaria
**Universidad Nacional de Cañete — Facultad de Ingeniería**
**Base normativa:** `rules/fase de propuesta-aprobacion-cierre (3).txt` §3.1-3 a §3.1-6, §4-2 a §4-6, §5
**Ley de referencia:** Ley N.° 30220 Arts. 124, 125, 130 · Reglamento RSU UNDC (Res. CO N.° 299-2026-UNDC/CO)
**Versión del documento:** 1.0 — Octubre 2026
**Estado:** Pendiente de aprobación por el usuario

---

## 0. REGLAS DE PRECEDENCIA

1. **`rules/` manda** sobre cualquier regla en conflicto.
2. **Vacío en `rules/`** → se conserva la regla o HU del catálogo vigente (`HU_RSU.md`, reglas R01–R47).
3. **Choque** entre `rules/` y una HU vigente → la HU **no se ejecuta** hasta que el usuario resuelva. Se registra en §6.

La Fase 1 quedó implementada y verificada. Esta fase continúa el flujo desde
`EN_REVISION_ESCUELA`, donde hoy se detiene la aprobación.

---

## 1. RESUMEN DE HISTORIAS DE USUARIO

### 1.1 Aprobación (funcionalidad de la fase)

| ID | Título | Actor | Prioridad |
|---|---|---|---|
| `HU-F2-01-P1` | Filtro de pertinencia técnica del Director de Escuela | `DIR_ESCUELA` | P1 |
| `HU-F2-02-P2` | CAMINO 2 y CAMINO 3 — observación con plazo y vencimiento | Sistema | P2 |
| `HU-F2-03-P1` | Validación del Comité RSU y "Aprobar y Elevar" del Decano | Comité RSU / `DECANO` | P1 |
| `HU-F2-04-P1` | Generar el PDF del Oficio de Elevación | Sistema | P1 |
| `HU-F2-05-P2` | Filtro presupuestal del PEP | `DIR_RS_FACULTAD` | P2 |
| `HU-F2-06-P1` | Activar el proyecto con el documento de la DRSU (opción C) | `DIR_RS_FACULTAD` | P1 |
| `HU-F2-07-P3` | Registro del dictamen y de la resolución | `CONSEJO_FACULTAD` | P3 |

### 1.2 Habilitación (sin las cuales lo anterior no es verificable)

| ID | Título | Prioridad |
|---|---|---|
| `HU-F2-T1-P1` | Suite de pruebas de navegación con Playwright | P1 |
| `HU-F2-T2-P1` | Datos de ejemplo completos y cuentas de acceso | P1 |
| `HU-F2-T3-P1` | Librería de generación de PDF | P1 |

**Prioridades:** `P1` Alta (bloqueante) · `P2` Media (control y excepción) · `P3` Baja (soporte).

---

## 2. FLUJO DE LA FASE 2

```
EN_REVISION_ESCUELA
   │  HU-F2-01 · Director de Escuela: pertinencia técnica y no duplicidad
   │  observar → CAMINO 2 (10 d.h.)   aprobar → exige PDF firmado (R27)
   ▼
CON_VB_ESCUELA
   │  HU-F2-03 · Comité RSU valida · HU-F2-05 · filtro presupuestal (PEP)
   │  HU-F2-04 · el Decano genera el Oficio de Elevación (PDF con QR)
   ▼
EN_PRIORIZACION_FACULTAD  →  EN_DICTAMEN_CONSEJO
   │  HU-F2-07 · dictamen y resolución
   ▼
APROBADO_CON_RESOLUCION  →  EN_ASIGNACION_CARGA  →  REGISTRADO_OFICIAL
   │  HU-F2-06 · la Facultad registra el documento recibido de la DRSU y activa
   ▼
EN_EJECUCION  (empieza la Fase 3)
```

### 2.1 Cambio de rol aprobado por el usuario — opción C

| Transición | Rol actual | Rol nuevo | Motivo |
|---|---|---|---|
| `EN_ASIGNACION_CARGA → REGISTRADO_OFICIAL` | `DIR_CENTRAL_RS` | **`DIR_RS_FACULTAD`** | `rules` §3.1-6: *"La Ficha firmada regresa a Decanato… se deriva al Responsable de RS de Facultad. Este busca el proyecto en el sistema, presiona **Activar Proyecto** y adjunta el PDF."* La DRSU no opera el sistema |
| `EVALUACION_VALIDADA → REPORTADO_SUNEDU` | `DIR_CENTRAL_RS` | **sin cambio** | Es un acto institucional central; se conserva la separación |

Consecuencia: la cuenta `rsu.central@undc.edu.pe` deja de ser necesaria para la
activación. Se conserva **solo** para el reporte a SUNEDU, y su nota de prueba
en la pantalla de ingreso se actualiza.

### 2.2 Estados

No se agregan estados nuevos. Se usan los existentes: `EN_REVISION_ESCUELA`,
`CON_VB_ESCUELA`, `EN_PRIORIZACION_FACULTAD`, `EN_DICTAMEN_CONSEJO`,
`APROBADO_CON_RESOLUCION`, `EN_ASIGNACION_CARGA`, `REGISTRADO_OFICIAL`,
`EN_EJECUCION`, `RECHAZADO`, `ARCHIVADO_VENCIMIENTO` (de la Fase 1).

---

## 3. HISTORIAS DE USUARIO EN DETALLE

---

### `HU-F2-01-P1` — Filtro de pertinencia técnica del Director de Escuela

| Campo | Detalle |
|---|---|
| **Actor** | `DIR_ESCUELA` |
| **Origen normativo** | `rules`(3) §3.1-3 |
| **Estado de entrada** | `EN_REVISION_ESCUELA` |
| **Estado de salida** | `CON_VB_ESCUELA` o `RECHAZADO` |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-1.1 | El Director de Escuela ve en su bandeja los proyectos en `EN_REVISION_ESCUELA` |
| CA-1.2 | Antes de aprobar, el sistema muestra una **advertencia de duplicidad**: proyectos activos de la misma escuela con el mismo lugar de intervención o la misma población beneficiaria |
| CA-1.3 | Aprobar exige **adjuntar el PDF firmado** de la Ficha de Pertinencia Técnica `F-M03.01-RSU-005` (regla R27, ya vigente) |
| CA-1.4 | Observar exige **motivo escrito** (regla R26, ya vigente) y arranca el plazo de subsanación (HU-F2-02) |
| CA-1.5 | Rechazar exige motivo y devuelve el proyecto al emisor |
| CA-1.6 | Al aprobar se notifica al líder del proyecto y a la Dirección de RSU de Facultad |
| CA-1.7 | Toda la operación queda registrada en `RSU_Flujo_Aprobacion` con usuario y fecha |

**Restricciones**
- El rol y el usuario salen **siempre del token** (corrección P0 de la Fase 1).
- La transición solo procede si existe la tupla en `RSU_Transicion_Estado`.
- El PDF de sustento es obligatorio: es el respaldo de un acto académico.

**Alcance**
- ✅ Incluido: revisión, advertencia de duplicidad, V°B° con PDF, observación con plazo.
- ❌ Excluido: la evaluación curricular del PEP (HU-F2-03), el filtro presupuestal (HU-F2-05).

---

### `HU-F2-02-P2` — CAMINO 2 y CAMINO 3: observación con plazo y vencimiento

| Campo | Detalle |
|---|---|
| **Actor** | `SISTEMA` |
| **Origen normativo** | `rules`(3) §5 CAMINO 2 y CAMINO 3 · cierra el pendiente **E5** de la Fase 1 |
| **Estado de entrada** | `EN_REVISION_ESCUELA` (o `EN_PRIORIZACION_FACULTAD` para el ajuste presupuestal) |
| **Estado de salida** | `ARCHIVADO_VENCIMIENTO` |

**Criterios de aceptación — CAMINO 2 (observación con plazo)**

| # | Criterio |
|---|---|
| CA-2.1 | Al observar se registra `fecha_limite_subsanacion`: **10 días hábiles** para la Dirección de Escuela |
| CA-2.2 | El ajuste presupuestal del PEP tiene **5 días hábiles** |
| CA-2.3 | Durante el plazo, el emisor puede editar **solo los campos indicados** en el motivo; el resto queda bloqueado |
| CA-2.4 | El emisor ve el contador de días restantes en su panel |
| CA-2.5 | Los días hábiles no cuentan sábado, domingo ni feriados |

**Criterios de aceptación — CAMINO 3 (vencimiento)**

| # | Criterio |
|---|---|
| CA-2.6 | Vencido el plazo sin respuesta, el proyecto pasa a `ARCHIVADO_VENCIMIENTO` |
| CA-2.7 | Al archivarse **libera el cupo del asesor** y el proyecto queda bloqueado hasta que el asesor tenga cupo libre (regla ya implementada en la Fase 1) |
| CA-2.8 | El archivado notifica a las cuatro partes del proyecto |

**Restricciones**
- El cómputo de días hábiles requiere un calendario de feriados; si no existe,
  se usa el parámetro de configuración y se documenta la limitación.
- Requiere un proceso que evalúe los vencimientos. **Hoy el backend no tiene
  ninguno** (hallazgo de la auditoría inicial): hay que elegir entre tarea
  programada en el servidor o cálculo perezoso al leer el proyecto.

**Alcance**
- ✅ Incluido: plazos, desbloqueo parcial, vencimiento, archivado, notificación.
- ❌ Excluido: la prórroga/extemporáneo de 45–55 h, que pertenece a la Fase 3.

**Decisión tomada:** **cálculo perezoso** (ver E3 en §6).

---

### `HU-F2-03-P1` — Validación del Comité RSU y "Aprobar y Elevar" del Decano

| Campo | Detalle |
|---|---|
| **Actor** | Comité RSU de la Facultad y `DECANO` |
| **Origen normativo** | `rules`(3) §3.1-4 · matriz de roles §2 |
| **Estado de entrada** | `CON_VB_ESCUELA` |
| **Estado de salida** | `EN_PRIORIZACION_FACULTAD` → `EN_DICTAMEN_CONSEJO` |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-3.1 | El Comité RSU valida el expediente: ficha de pertinencia, cronograma, equipo y presupuesto |
| CA-3.2 | El Decano dispone de la acción **"Aprobar y Elevar"** |
| CA-3.3 | Esa acción **genera el PDF del Oficio de Elevación** (HU-F2-04) y lo adjunta al expediente |
| CA-3.4 | El proyecto queda **"elevado a la DRSU Central"**: se registra la fecha de elevación y el oficio generado |
| CA-3.5 | El trámite ante la DRSU es **externo** (Mesa de Partes): el sistema no espera respuesta, solo registra el oficio |
| CA-3.6 | El líder del proyecto recibe la notificación de que su expediente fue elevado |

**Restricciones**
- Solo la Facultad puede elevar; la DRSU no tiene cuenta para este paso.
- El PDF del oficio se archiva como documento del proyecto y no puede borrarse.

**Alcance**
- ✅ Incluido: validación del expediente, acción de elevar, registro del oficio.
- ❌ Excluido: la aprobación de la DRSU, que es externa.

> ✅ **Resuelto E1 — Decano vs Consejo de Facultad.** El tramo se reparte: el
> Comité RSU valida y el **Decano** eleva. Ver §6.

---

### `HU-F2-04-P1` — Generar el PDF del Oficio de Elevación

| Campo | Detalle |
|---|---|
| **Actor** | `SISTEMA`, a petición del Decano |
| **Origen normativo** | `rules`(3) §3.1-4: *"presiona un botón para generar y exportar el PDF prellenado del Oficio de Elevación"* |
| **Tecnología** | `github.com/gpdf-dev/gpdf` (HU-F2-T3) |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-4.1 | El PDF lleva membrete institucional: UNIVERSIDAD NACIONAL DE CAÑETE / FACULTAD DE INGENIERÍA |
| CA-4.2 | Va **prellenado**: código y título del proyecto, modalidad, escuela, líder, asesor, fechas, presupuesto y considerarse de motivos |
| CA-4.3 | Incluye un **código QR** con la referencia del expediente para verificación |
| CA-4.4 | Numeración de páginas y pie con la leyenda del trámite |
| CA-4.5 | El PDF se descarga y **queda registrado** en los documentos del proyecto |
| CA-4.6 | Solo `DECANO` y roles de gestión pueden generarlo |
| CA-4.7 | Los acentos y la Ñ se renderizan correctamente |

**Restricciones**
- Es un documento **prellenado**: lo firma y sella el Decano en físico; el
  sistema no firma digitalmente por sí solo en esta fase.
- Si el PDF se regenera, se versiona; nunca se pisa el anterior.

**Alcance**
- ✅ Incluido: generación, descarga, registro, versionado.
- ❌ Excluido: firma digital del oficio (ver HU-F2-T3 para el soporte disponible).

---

### `HU-F2-05-P2` — Filtro presupuestal del PEP

| Campo | Detalle |
|---|---|
| **Actor** | `DIR_RS_FACULTAD` |
| **Origen normativo** | `rules`(3) §4-3 |
| **Estado de entrada** | `CON_VB_ESCUELA` |
| **Estado de salida** | `EN_PRIORIZACION_FACULTAD` o `RECHAZADO` |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-5.1 | Aplica **solo a PEP financiado**: el SSU, el voluntariado y la publicación son autofinanciados |
| CA-5.2 | El sistema muestra el **disponible del 2%** de la Facultad frente al monto solicitado |
| CA-5.3 | Si el monto **excede** el disponible, aplica el **rebote presupuestal de 5 días hábiles** para ajustar |
| CA-5.4 | Aprobar registra el presupuesto aprobado en el proyecto |
| CA-5.5 | Los movimientos presupuestales se registran con usuario **del token**, nunca del cuerpo |

**Restricciones**
- El porcentaje del 2% es el mínimo legal (Ley N.° 30220 Art. 125) y hoy es un
  parámetro decorativo: esta HU lo vuelve efectivo.
- El PEP autofinanciado **no** consulta el fondo institucional.

**Alcance**
- ✅ Incluido: validación de disponibilidad, rebote, registro del aprobado.
- ❌ Excluido: la ejecución presupuestal y los vouchers, que son de la Fase 3.

---

### `HU-F2-06-P1` — Activar el proyecto con el documento de la DRSU (opción C)

| Campo | Detalle |
|---|---|
| **Actor** | `DIR_RS_FACULTAD` |
| **Origen normativo** | `rules`(3) §3.1-6 |
| **Estado de entrada** | `EN_ASIGNACION_CARGA` → `REGISTRADO_OFICIAL` → `EN_EJECUCION` |
| **Decisión** | Opción C aprobada por el usuario |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-6.1 | La transición `EN_ASIGNACION_CARGA → REGISTRADO_OFICIAL` pasa a ser del rol `DIR_RS_FACULTAD` |
| CA-6.2 | **Activar Proyecto** exige **adjuntar el PDF firmado** recibido de la DRSU o de la VPA (Ficha de Aprobación o Resolución VRA) |
| CA-6.3 | Verificar que el proyecto no tenga otro proyecto activo que ocupe al mismo asesor en el ciclo |
| CA-6.4 | Al activar, el proyecto pasa a `REGISTRADO_OFICIAL` y **de ahí a `EN_EJECUCION`** en el mismo acto |
| CA-6.5 | `EN_EJECUCION` desbloquea el registro de actividades, evidencias y horas (módulos de la Fase 3) |
| CA-6.6 | Se notifica al líder, al asesor y a la Escuela |

**Restricciones**
- La DRSU **no tiene cuenta** para este paso: quien registra el documento es la
  Facultad, porque el trámite ocurre fuera del sistema.
- El PDF recibido se archiva como documento del proyecto.

**Alcance**
- ✅ Incluido: cambio de rol, activación con PDF, desbloqueo de ejecución.
- ❌ Excluido: el contenido de la Fase 3.

---

### `HU-F2-07-P3` — Registro del dictamen y de la resolución

| Campo | Detalle |
|---|---|
| **Actor** | `CONSEJO_FACULTAD` |
| **Origen normativo** | Catálogo vigente R28: el Consejo es el único con validez legal para emitir resoluciones |
| **Estado de entrada** | `EN_DICTAMEN_CONSEJO` |
| **Estado de salida** | `APROBADO_CON_RESOLUCION` |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-7.1 | Número, fecha y tipo de resolución son obligatorios |
| CA-7.2 | El PDF firmado es obligatorio (regla R27, ya vigente) |
| CA-7.3 | Se guarda `id_resolucion_aprobacion` y `fecha_aprobacion` en el proyecto |
| CA-7.4 | Se notifica a la Dirección de Departamento y a la DRSU Central |

> ✅ **Resuelto E2 — VPA vs Consejo de Facultad.** La resolución es un
> **documento externo**: se **carga**, no se genera, y no se crea el rol `VPA`.
> Ver §6.

---

## 4. HISTORIAS DE HABILITACIÓN

### `HU-F2-T1-P1` — Suite de pruebas de navegación con Playwright

| Campo | Detalle |
|---|---|
| **Motivo** | Las regresiones más recientes (selectores vacíos, avisos ajenos, rutas abiertas) se detectaron **tarde y a mano**. Falta una red que navegue la aplicación como lo hace un usuario |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-T1.1 | Se añade `@playwright/test` a las dependencias de desarrollo, con configuración que apunte al servidor ya levantado (`http://localhost:5173`) |
| CA-T1.2 | **Acceso**: entrar por cada tarjeta de acceso rápido y comprobar que el panel corresponde al rol |
| CA-T1.3 | **Autorización**: el estudiante recibe la pantalla 404 en Reportes, Presupuesto, Estructura, Personas y Comité; la dirección sí los ve |
| CA-T1.4 | **Flujo del asesor**: crear proyecto → enviar al asesor → aceptar y rechazar, comprobando el estado en pantalla |
| CA-T1.5 | **Notificaciones**: los avisos del docente abren expedientes que puede ver |
| CA-T1.6 | **Errores visibles**: un fallo de carga muestra mensaje, no un control vacío |
| CA-T1.7 | Se ejecutan sobre la aplicación **construida**, no sobre el servidor de desarrollo |
| CA-T1.8 | El reporte deja constancia de qué se probó y qué falló |

**Restricciones**
- Chromium ya está en la caché del equipo: no debe descargarse nada nuevo.
- Las pruebas **no** pueden enviar correo ni usar Backblaze: siguen anulados.

**Alcance**
- ✅ Incluido: acceso, autorización, flujo del asesor, notificaciones, robustez.
- ❌ Excluido: pruebas de carga y de rendimiento.

---

### `HU-F2-T2-P1` — Datos de ejemplo completos y cuentas de acceso

| Campo | Detalle |
|---|---|
| **Motivo** | Los datos de demostración están incompletos: hay personas sin cuenta, proyectos sin equipo y proyectos sinASEDOR, así que imposible recorrer el flujo con criterio |

**Cuentas que faltan**

| Persona | Rol | Correo propuesto |
|---|---|---|
| Diego Vargas (estudiante 3) | `ESTUDIANTE_PROP` | `lider.voluntariado@undc.edu.pe` |
| Fiorella Gutiérrez (estudiante 4) | `ESTUDIANTE_PROP` | `publicacion@undc.edu.pe` |
| Rosa Mendoza (docente 5) | `DOCENTE_RESP` | `rosa.mendoza@undc.edu.pe` |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-T2.1 | Las tres cuentas existen, con clave `undc2026` y los **módulos de su rol** |
| CA-T2.2 | Cada una aparece como **tarjeta de acceso rápido** en la pantalla de ingreso, junto a las demás |
| CA-T2.3 | El proyecto SSU en ejecución tiene **al menos 3 integrantes** y **horas acumuladas** coherentes con su avance (45 h de 60) |
| CA-T2.4 | Los dos PEP tienen **equipo formado**, para que el módulo de estudiantes no se vea vacío |
| CA-T2.5 | El proyecto de voluntariado tiene **docente asesor asignado** (Rosa Mendoza), que hoy no tiene ningún proyecto |
| CA-T2.6 | Los cinco proyectos tienen **problemática y ODS** informados: hoy están vacíos porque el seed es anterior a la Fase 1 |
| CA-T2.7 | Las cuentas de `escuela@` y `rsfacultad@` quedan vinculadas a su ficha real de docente |

**Restricciones**
- Son datos **de demostración**: nunca deben parecer información real de
  terceros, y los correos usan el dominio institucional de prueba.
- Cambiar el seed implica **reconstruir el volumen** para que se aplique.

**Alcance**
- ✅ Incluido: cuentas, tarjetas, equipos, horas, problemática y ODS.
- ❌ Excluido: carga de datos reales de la Facultad.

---

### `HU-F2-T3-P1` — Librería de generación de PDF

| Campo | Detalle |
|---|---|
| **Decisión del usuario** | Añadir una librería **rápida, eficiente, segura y liviana** |

**Criterios de aceptación**

| # | Criterio |
|---|---|
| CA-T3.1 | Se usa **`github.com/gpdf-dev/gpdf`**: Go puro, **cero dependencias externas**, licencia MIT |
| CA-T3.2 | Soporta lo que necesita el Oficio: texto con acentos, tablas, encabezado y pie, números de página, **código QR** y **firmas digitales** |
| CA-T3.3 | Versión fijada en `go.mod` |
| CA-T3.4 | **Aislada detrás de una interfaz propia** del proyecto, para poder cambiarla sin tocar el resto del código |

**Justificación de la elección**

La línea `fpdf` (`jung-kurt/gofpdf`, luego `go-pdf/fpdf`) quedó **archivada** en
2025. Un repositorio archivado no recibe parches de seguridad, que es
justamente lo que se pidió evitar. `gpdf` es una reescritura en Go puro, sin
dependencias y con mantenimiento vigente.

**⚠️ Reserva honesta:** es una librería **joven** (v1.0.13, publicada en
septiembre de 2026, sin adoptantes conocidos) y sus benchmarks los publica el
propio proyecto. Por eso CA-T3.4 exige aislarla detrás de una interfaz: si en
el futuro apareciera un problema, se cambia la implementación sin reescribir
la fase.

**Alcance**
- ✅ Incluido: dependencia fijada, interfaz propia, primer uso en el Oficio.
- ❌ Excluido: firma digital aplicada a documentos oficiales (solo disponible).

---

## 5. HOMOLOGACIÓN CON EL CATÁLOGO VIGENTE

| Catálogo | Destino | Acción | Motivo |
|---|---|---|---|
| HU-005 Evaluar viabilidad técnica | `HU-F2-01` | **Modificada** | Se agrega la advertencia de duplicidad que piden las `rules` |
| HU-006 Consolidar banco de proyectos | `HU-F2-05` | **Homologada** | Se conserva; se le añade el filtro presupuestal |
| HU-007 Dictaminar y aprobar con Resolución | `HU-F2-07` | **Modificada** | Ver excepción E2 sobre quién emite |
| HU-008 Asignar carga no lectiva | — | **Fase 3** | Fuera de alcance |
| HU-009 Registrar en padrón oficial | `HU-F2-06` | **Modificada** | Cambia de rol por la opción C |

### Reglas que se conservan (vacío en `rules/`)

| Regla | Contenido |
|---|---|
| R03 | Transición BPMN solo si existe la tupla en `RSU_Transicion_Estado` |
| R26 | Observar o rechazar exige motivo |
| R27 | Aprobar exige PDF firmado |
| R28 | El Consejo de Facultad es el único con validez legal para resoluciones |
| R29 | Solo se registra en padrón lo que está `APROBADO_CON_RESOLUCION` |
| R31 / R32 | El rechazo rebota al emisor y el aprobado notifica al destino |

---

## 6. EXCEPCIONES RESUELTAS

Las tres excepciones fueron resueltas por el usuario antes de iniciar el
desarrollo. Se dejan registradas con la decisión tomada.

### ✅ E1 — Quién eleva: **opción C**, el Comité valida y el Decano eleva

Las `rules` atribuyen la elevación al **Decano** junto al Comité RSU, pero el
flujo construido llevaba ese tramo por el Consejo de Facultad. Se reparte el
tramo para que cada quien haga lo que le corresponde:

| Tramo | Rol | Acto |
|---|---|---|
| `CON_VB_ESCUELA → EN_PRIORIZACION_FACULTAD` | `DIR_RS_FACULTAD` | El Comité RSU valida el expediente |
| `EN_PRIORIZACION_FACULTAD → EN_DICTAMEN_CONSEJO` | **`DECANO`** | *"Aprobar y Elevar"*: genera el Oficio de Elevación |
| `EN_DICTAMEN_CONSEJO → APROBADO_CON_RESOLUCION` | `CONSEJO_FACULTAD` | Dictamen y resolución (documento externo, ver E2) |

El rol `DECANO` deja de ser nominal: pasa a tener una transición propia.

### ✅ E2 — La resolución es un **documento externo**, nunca generada

Decisión del usuario: *"se genera una resolución tú crea un archivo de prueba,
esa será tu resolución de prueba para cargar. Nuestro sistema **no crea eso**,
solo lo cargamos para empezar la fase de ejecución. Todo lo que tenga que ver
con un documento externo lo manejaremos así para pruebas; ellos no intervienen."*

Queda fijado:

- El sistema **no emite** resoluciones ni documentos de la DRSU o la VPA.
- El registro de la resolución es una **carga de PDF** por parte del rol
  competente, igual que el resto de documentos externos.
- Para poder probar el flujo se adjunta un **PDF de resolución de ejemplo**,
  que es un archivo de muestra created para ese propósito y **no** un documento
  oficial ni sustituye a ninguno.
- Se conserva la regla **R28** vigente: el Consejo de Facultad es quien registra
  la resolución dentro del Mini-RSU. Las `rules` atribuyen la Resolución VRA a
  la Vicerrectoría Académica, pero como el acto es externo y solo se **carga**,
  no se crea el rol `VPA`.

**Alcance de esta convención:** aplica a **todo** documento que provenga de la
DRSU Central, de la Vicepresidencia Académica o del Consejo Universitario
(Ficha de Aprobación, Resolución VRA, Informe Técnico, Constancia de Cumplimiento
del SSU). Todos entran por carga, ninguno se emite desde el sistema.

### ✅ E3 — Vencimiento por **cálculo perezoso**

Elegido el cálculo perezoso: al leer o listar un proyecto se evalúa si su plazo
de subsanación venció y, de ser así, se archiva en ese momento.

**Motivo:** no requiere tarea programada, no introduce un proceso en segundo
plano que hay que desplegar y supervise, y el efecto es inmediato en las
pruebas. El archivado sigue notificando y liberando el cupo del asesor, igual
que en la Fase 1.

**Reserva:** el cálculo perezoso actúa cuando alguien mira el proyecto. Para un
volumen alto, o si se necesita que el archivado ocurra sin tráfico, hará falta
una tarea programada más adelante; queda anotado para la Fase 3.

---

## 6.1 Documentos externos: tabla de referencia

| Documento | Quién lo emite (fuera del sistema) | Quién lo carga aquí | Dónde se usa |
|---|---|---|---|
| `F-M03.01-RSU-005` Ficha de Pertinencia | Dirección de Escuela | `DIR_ESCUELA` | HU-F2-01 (V°B°) |
| Oficio de Elevación | **Decano** (lo genera el sistema, prellenado) | `DECANO` | HU-F2-04 |
| Ficha de Aprobación SSU | DRSU Central | `DIR_RS_FACULTAD` | HU-F2-06 (activación) |
| Resolución VRA (aprobación PEP) | Vicepresidencia Académica | `CONSEJO_FACULTAD` | HU-F2-07 |
| Resolución VRA (cierre PEP) | Vicepresidencia Académica | `CONSEJO_FACULTAD` | Fase 4 |
| Constancia de Cumplimiento SSU | DRSU Central | `DIR_RS_FACULTAD` | Fase 4 |

El **único** documento que el sistema genera es el Oficio de Elevación, porque
las `rules` dicen literalmente que el Decano "presiona un botón para generar y
exportar el PDF prellenado". Todos los demás se cargan.

---

## 7. MATRIZ DE COBERTURA CONTRA `rules/`(3)

| Requisito | HU | Estado |
|---|---|---|
| §3.1-3 Pertinencia técnica del Director de Escuela, Ficha F-005 | `HU-F2-01` | Cubierto |
| §3.1-4 Comité RSU valida y Decano "Aprobar y Elevar" | `HU-F2-03` | Cubierto, pendiente E1 |
| §3.1-4 Exportar el PDF del Oficio de Elevación | `HU-F2-04` | Cubierto |
| §3.1-5 DRSU firma la Ficha de Aprobación | — | **Externo**: llega por Mesa de Partes |
| §3.1-6 Activar Proyecto adjuntando el PDF | `HU-F2-06` | Cubierto (opción C) |
| §4-3 Filtro presupuestal del PEP con rebote de 5 d.h. | `HU-F2-05` | Cubierto |
| §4-4 Aprobación central y Resolución VRA | `HU-F2-07` | Cubierto, pendiente E2 |
| §4-6 Recepción, carga y activación | `HU-F2-06` | Cubierto |
| §5 CAMINO 2 Observación con plazo y desbloqueo | `HU-F2-02` | Cubierto |
| §5 CAMINO 3 Vencimiento y archivado | `HU-F2-02` | Cubierto |
| §6 Documentos emitidos | `HU-F2-01`, `HU-F2-04` | Cubierto |

---

**Fin del documento — Fase 2: Aprobación**
**Pendiente:** aprobación del usuario antes de iniciar el desarrollo.